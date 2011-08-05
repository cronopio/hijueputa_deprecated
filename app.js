
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

var jugadores = {};

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
  var nextId = function(todos,actual){
    var list = [];
    var t;
    for (t in todos){
      list.push(t);
    }
    var i = list.indexOf(actual);
    ++i;
    if (i >= list.length){
      i = 0;
    }
    return list[i];
  };
  s.on('sentarse', function(data){
    var player = {nick:data.nick,puntos:0,puesto:data.puesto};
    jugadores[s.id] = player;
    s.broadcast.emit('sentado', {jugadores:jugadores, nuevo:player});
    s.emit('sentado', {jugadores:jugadores, nuevo:player});
  });
  s.on('iniciar', function(data){
    s.broadcast.emit('juegaotro', {turno:data.puesto,anterior:false});
    s.emit('turno', {jugador:jugadores[s.id]});
  });
  s.on('valorDado', function(data){
    if (data.valor == 1){
      s.broadcast.emit('perdio', {nick:jugadores[s.id].nick});
      s.emit('perdio', {nick:jugadores[s.id].nick});
      var siguiente = nextId(jugadores,s.id);
      console.log('Turno de '+siguiente);
      //io.sockets.socket(< session id>).send('my message')
      io.sockets.socket(siguiente).emit('turno',{jugador:jugadores[siguiente]});
      io.sockets.socket(siguiente).broadcast.emit('juegaotro',{
        turno:jugadores[siguiente].puesto,anterior:jugadores[s.id].puesto
      });
    } else {
      if ((jugadores[s.id].puntos+data.acumulado) >= 31){
        s.emit('gano', {nick:jugadores[s.id].nick});
        s.broadcast.emit('gano', {nick:jugadores[s.id].nick});
      } else {
        s.emit('nuevoAcumulado', {acumulado:data.acumulado});
        s.broadcast.emit('nuevoAcumulado', {acumulado:data.acumulado});
      }
    }
    s.broadcast.emit('nuevoValorDado', data);
  });
  
  s.on('plantar', function(data){
    console.log(data);
    jugadores[s.id].puntos += data.puntos;
    var siguiente = nextId(jugadores,s.id);
    console.log('Plantaron, ahora le toca a '+siguiente);
    io.sockets.socket(siguiente).emit('turno',{jugador:jugadores[siguiente]});
    io.sockets.socket(siguiente).broadcast.emit('juegaotro',{
      turno:jugadores[siguiente].puesto,anterior:jugadores[s.id].puesto
    });
    s.broadcast.emit('nuevosPuntos',{jugador:jugadores[s.id]});
  });
});



app.listen(3000);
console.log("Express server listening on port %d", app.address().port);
