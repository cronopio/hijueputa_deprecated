
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

var jugadores = Array();

function tirarDado(){
  return Math.floor(Math.random()*6)+1;
}

// Routes

app.get('/', function(req, res){
  res.render('index', {
    title: 'Hijueputa',
    jugadores: jugadores
  });
});

io.sockets.on('connection', function(s){
  s.emit('news', {hello:'world'});
  s.on('sentarse', function(data){
    jugadores[data.puesto] = {nick:data.nick,puntos:0,puesto:data.puesto};
    s.broadcast.emit('sentado', {jugadores:jugadores, nuevo:jugadores[data.puesto]});
    s.emit('sentado', {jugadores:jugadores, nuevo:jugadores[data.puesto]});
  });
  s.on('iniciar', function(data){
    s.broadcast.emit('juegaotro', {turno:data.puesto});
    s.emit('turno', {jugador:jugadores[data.puesto]});
  });
  s.on('valorDado', function(data){
    if (data.valor == 1){
      s.broadcast.emit('perdio', {nick:jugadores[data.puesto].nick});
      s.emit('perdio', {nick:jugadores[data.puesto].nick});
    } else {
      if ((jugadores[data.puesto].puntos+data.acumulado) >= 31){
        s.emit('gano', {nick:jugadores[data.puesto].nick});
        s.broadcast.emit('gano', {nick:jugadores[data.puesto].nick});
      } else {
        s.emit('nuevoAcumulado', {acumulado:data.acumulado});
        s.broadcast.emit('nuevoAcumulado', {acumulado:data.acumulado});
      }
    }
    s.broadcast.emit('nuevoValorDado', data);
  });
});



app.listen(3000);
console.log("Express server listening on port %d", app.address().port);
