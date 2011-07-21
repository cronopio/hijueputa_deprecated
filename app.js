
/**
 * Module dependencies.
 */

var express = require('express');
var io = require('socket.io');

var app = module.exports = express.createServer();
io = io.listen(app);

// Configuration

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true })); 
});

app.configure('production', function(){
  app.use(express.errorHandler()); 
});

// Routes

app.get('/', function(req, res){
  res.render('index', {
    title: 'Express'
  });
});

io.sockets.on('connection', function(s){
  s.emit('news', {hello:'world'});
  s.on('otroEvent', function(data){
    console.log(data);
  });
});

app.listen(3000);
console.log("Express server listening on port %d", app.address().port);
