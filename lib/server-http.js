var http = require('http'),
    fs = require('fs'),
    url = require('url');

var search = {};

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
      var qp = search.qparse(q.search);
      if(search.get(qp[0]))
        replace_html("error.html", {"MSG":("Should have " + search.args(qp[0]) + " instead of " +
                                           (qp.length - 1) + " arguments for the '" + qp[0] + "' engine."),
                                    "STYLE":"color:red"});
      else
        pipe_html('./define.html');
    }
  }

  else if(q.define) {
    var args = q.define.split(/\s+/);
    if(args.length !== 2)
      replace_html("error.html", {"MSG":"Your definition is wrong! Should have 2 Arguments",
                                  "STYLE":"color:red"});
    else {
      search.set(args[0], args[1]);
      redirect_to('/');
    }
  }

  else if(parsed.href === "/list") {
    var keys = [];
    var all_keys = search.keys()
    for(var key in all_keys) {
      var current = all_keys[key];
      keys.push("" + current + "(" + (search.args(current) ? search.args(current) : 0) + ")");
    }
    keys = keys.sort();
    var create_string = "";
    var last_char = null;
    for(var key in keys) {
      if(last_char !== null) {
        if(last_char === keys[key][0]) {
          create_string += ", ";
        } else {
          last_char = keys[key][0];
          create_string += "<br />";
        }
      } else {
        last_char = keys[key][0];
      }
      create_string += keys[key];
    }
    replace_html("error.html", {"MSG":("Keys:<br /><br />" + create_string),
                                "STYLE":""});
  }

  else if(parsed.href === "/export") {
    res.writeHead(200, {'Content-Type':'text/html'});
    res.end(JSON.stringify(search.engines));
  }

  else if(parsed.href === "/define")
    pipe_html('./define.html');

  else if(parsed.href === "/search.xml")
    pipe_html('./search.xml');

  else if(parsed.href === "/search.css")
    pipe_html('./search.css');

  else {
    pipe_html('./search.html');
  }
});

exports.listen = function(search_object, port, ip) {
  search = search_object;
  server.listen(port, ip);
  console.log("Http-Server listen to http://" + ip + ":" + port + "/");
}
