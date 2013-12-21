var fs = require('fs');

var search_json = "./../search.json";

exports.engines = (function() {
    try {
      return require(search_json);
    } catch(err) {
      return {};
    }
  })();

exports.output = console.log;

exports.pre =  function(i) { return i };

exports.get = function(s) {
    return this.engines[s];
};

exports.set = function(s, qs) {
    this.engines[s] = qs;
    fs.writeFile(search_json, JSON.stringify(this.engines));
};

exports.args = function(s) {
    var engine = this.get(s);
    if(engine) {
      var m = engine.match(/%s/g);
      if(!m) return 0;
      return m.length;
    } else {
      this.output("Engine '" + s + "' is not defined.");
      return null;
    }
  };

exports.exec = function(s) {
    var engine = this.get(s);
    var arg_length = this.args(s);
    if(!engine) {
      return null;
    }

    if(arg_length === 0)
      return engine;

    if(arg_length !== (arguments.length - 1)) {
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
  };

exports.qparse = function(query) {
    var all = query.split(/\s+/);
    var engine = all[0];
    var rest = all.splice(1);
    rest = rest.join(' ').replace(/^\s+/, '').replace(/\s+$/, '').split(/\s*,+\s*/);
    if(rest.length > 0 && !(rest.length == 1 && '' === rest[0]))
      return [engine].concat(rest);
    else
      return [engine];
  };

exports.q = function(query) {
    return this.exec.apply(this, this.qparse(query));
};

