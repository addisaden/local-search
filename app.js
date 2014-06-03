var querystring = require('querystring'),
    search = require('./lib/search.js'),
    telnet_server = require('./lib/server-telnet.js'),
    http_server = require('./lib/server-http.js')
    repl = require('repl');

// run search.pre = querystring.escape for urls
search.pre = querystring.escape;

http_server.listen(search, 7777, "localhost");
telnet_server.listen(search, 7778, "localhost");
repl.start(">> ").context.search = search;
