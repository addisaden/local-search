var fs = require('fs');

var search_json = "./../search.json";
var logfile = __dirname + "/../log/complete.log";
var logfile_change = __dirname + "/../log/change.log";
var logfile_exec = __dirname + "/../log/exec.log";

var log_write = function(filename, verb, argumentlist) {
  var all_args = [];
  for(var a in argumentlist) {
    all_args.push(argumentlist[a]);
  }
  var f = fs.createWriteStream(filename, { flags: 'a' });
  if(all_args.length === 0)
    f.end("" + verb + "();\r\n");
  else
    f.end("" + verb + "(\"" + all_args.join("\", \"") + "\");\r\n");
}

var log_msg = function(verb, args) {
  log_write(logfile, verb, args);
}

var log_exec = function(verb, args) {
  log_msg(verb, args);
  log_write(logfile_exec, verb, args);
}

var log_change = function(verb, args) {
  log_msg(verb, args);
  log_write(logfile_change, verb, args);
}

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
  log_msg("get", arguments);
  return this.engines[s];
};

exports.set = function(s, qs) {
  log_change("set", arguments);
  this.engines[s] = qs;
  fs.writeFile(search_json, JSON.stringify(this.engines));
};

exports.args = function(s) {
  log_msg("args", arguments);
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

exports.keys = function() {
  log_msg("keys", arguments);
  var k = [];
  for(var key in this.engines) {
    k.push(key);
  }
  return k;
}

exports.exec = function(s) {
  log_exec("exec", arguments);
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
  log_msg("qparse", arguments);
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
  log_msg("q", arguments);
  return this.exec.apply(this, this.qparse(query));
};

