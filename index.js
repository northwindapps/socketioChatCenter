const express = require('express');
let app = require('express')();
const path = require('path');
let http = require('http').Server(app);
let io = require('socket.io')(http);
let port = process.env.PORT || 3001;

app.use(express.static(path.join(__dirname,'public')));

io.on('connection', function(socket){

  io.sockets.emit('to operator', 'readyToJoin');  

  socket.on('customer joined', function(msg){
    
    io.sockets.emit('update customer list',msg);
    
  });

  socket.on('chat message', function(data){
    io.sockets.in(data.room).emit('chat message', data.message);  
  });

  socket.on('join', function(msg) {
    socket.join(msg);
    console.log("All rooms",io.sockets.adapter.rooms);
  });

  socket.on('leave', function(msg) {
    socket.leave(msg);
  });

  
});

app.get('/op', function(req, res){
  res.sendFile(__dirname + '/public/operator.html');
});

app.get('/hq', function(req, res){
  res.sendFile(__dirname + '/public/hq.html');
});

http.listen(port, function(){
  console.log('listening on *:' + port);
});
