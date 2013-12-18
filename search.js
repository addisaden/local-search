var http = require('http'),
    fs = require('fs'),
    querystring = require('querystring'),
    url = require('url');

var search = {
  engines: (function() {
    try {
      return require('./search.json');
    } catch(err) {
      return {};
    }
  })(),
  output: console.log,
  pre: function(i) { return i },
  get: function(s) {
    return this.engines[s];
  },
  set: function(s, qs) {
    this.engines[s] = qs;
    fs.writeFile('./search.json', JSON.stringify(this.engines));
  },
  args: function(s) {
    var engine = this.get(s);
    if(engine) {
      var m = engine.match(/%s/g);
      if(m === null) return 0;
      return m.length;
    } else {
      this.output("Engine '" + s + "' is not defined.");
      return null;
    }
  },
  exec: function(s) {
    var engine = this.get(s);
    var arg_length = this.args(s);
    if(!engine) {
      this.output("Engine '" + s + "' is not defined.");
      return null;
    }

    if(arg_length === 0)
      return engine;

    if((arg_length + 1) !== arguments.length) {
      this.output("There have to be " + arg_length + " arguments for '" + s + "' engine.");
      return null;
    }
    var result = '';
    for(i = 0, q = engine.split("%s"); i < arg_length; i++) {
      result = result.concat(q[i], this.pre(arguments[i + 1]));
      if((i + 1) === arg_length)
        result = result.concat(q[i + 1]);
    }
    return result;
  },
  q: function(query) {
    var all = query.split(/\s+/);
    var engine = all[0];
    var rest = all.splice(1);
    rest = rest.join(' ').split(/\s*,+\s*/);
    return this.exec.apply(this, [engine].concat(rest));
  }
};

// run search.pre = querystring.escape for urls
search.pre = querystring.escape;

var server = http.createServer(function(req, res) {
  var parsed = url.parse(req.url, true);
  var q = parsed.query;

  var pipe_html = function(filename) {
    var index = fs.createReadStream(filename);
    res.writeHead(200, {'Content-Type':'text/html'});
    index.pipe(res);
  }

  var replace_html = function(filename, replaces) {
    var index = fs.createReadStream(filename);

    var manipulate_chunk = function(chunk) {
      if(chunk) {
        var chunk_result = chunk;
        for(var i in replaces)
          chunk_result = chunk_result.toString().replace(i, replaces[i]);
        return chunk_result;
      }
      else
        return '';   
    }

    res.writeHead(200, {'Content-Type':'text/html'});
    index.on("data", function(chunk) {
      res.write(manipulate_chunk(chunk));
    });
    index.on("end", function(chunk) {
      res.end(manipulate_chunk(chunk));
    });
  }

  var redirect_to = function(redirection) {
    res.writeHead(302, {'Location': redirection});
    res.end();
  }

  if(q.search) {
    var location_redirect = search.q(q.search);
    if(location_redirect) {
      redirect_to(location_redirect);
    } else {
      pipe_html('./define.html');
    }
  }

  else if(q.define) {
    var args = q.define.split(/\s+/);
    if(args.length !== 2)
      replace_html("error.html", {"MSG":"Your definition is wrong! Should have 2 Arguments",
                                  "COLOR":"red"});
    else {
      search.set(args[0], args[1]);
      redirect_to('/');
    }
  }

  else if(parsed.href === "/list") {
    var keys = [];
    for(var key in search.engines)
      keys.push(key);
    replace_html("error.html", {"MSG":("Keys: " + keys.join(", ")),
                                "COLOR":"#333"});
  }

  else if(parsed.href === "/define")
    pipe_html('./define.html');

  else if(parsed.href === "/search.xml")
    pipe_html('./search.xml');

  else {
    pipe_html('./search.html');
  }
});

server.listen(7777);

console.log("Server listen to http://localhost:7777/");
