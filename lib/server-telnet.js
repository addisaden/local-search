var net = require('net'),
    repl = require('repl');

var search = {};

var telnet_server = net.createServer(function(socket) {
  var telnetrepl = repl.start({
    prompt: "local search engine >> ",
    input: socket,
    output: socket
  }).on('exit', function() {
    socket.end();
  });
  telnetrepl.context.search = search;
}).listen(7778, "127.0.0.1");

exports.listen = function(search_obj, port, ip) {
  search = search_obj;
  telnet_server.listen(port, ip);
  console.log("Telnet-Server listen to " + ip + ":" + port);
}

