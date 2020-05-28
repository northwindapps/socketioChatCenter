const mongo = require("mongodb").MongoClient;
const express = require('express');
let app = require('express')();
const path = require('path');
let http = require('http').Server(app);
let io = require('socket.io')(http);
let port = process.env.PORT || 3001;

mongo.connect("mongodb://localhost:27017/customercalls", {useNewUrlParser: true, useUnifiedTopology: true},(error,client)=>{
    if (error) {
        throw error;
    }

    console.log("mongdb connected..");
    let caseListStr= "";
    let db = client.db('customercalls');
    let list = db.collection('unhandledcases');
    list.countDocuments().then((res)=>{
      let itemCounter = res;
        if(itemCounter == 0)
        {
            //writing document. initialization
            list.insertOne({_id:1, case: ','});
        }
    }); 

    list.find().forEach(function(doc, err){
        if (doc) {
          console.log("first item",doc.case);
          caseListStr = doc.case;
        }  
    });




app.use(express.static(path.join(__dirname,'public')));

io.on('connection', function(socket){

  io.sockets.emit('to operator', 'readyToJoin');  

  socket.on('customer joined', function(msg){
    caseListStr = caseListStr + ',' + msg;
    console.log("list updated",caseListStr);
    list.countDocuments().then((res)=>{
      let itemCounter = res;
      if(itemCounter > 0){
          list.updateOne(
              {_id:1},
              {
                  $set:{
                      case: caseListStr
                  }
              }
          )
        }
      }); 
    io.sockets.emit('update customer list');
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
    let caselist = caseListStr.split(',');
    caselist = caselist.filter(e => e !== msg);
    caselist = caselist.filter(function(str) {
      return /\S/.test(str);
    });
    caseListStr = caselist.join(',');
    list.countDocuments().then((res)=>{
      let itemCounter = res;
      if(itemCounter > 0){
        console.log("list updated",caseListStr);
        
          list.updateOne(
              {_id:1},
              {
                  $set:{
                      case: caseListStr
                  }
              }
          )
        }
      }); 
    io.sockets.emit('update customer list');
  });
});

app.get('/op', function(req, res){
  res.sendFile(__dirname + '/public/operator.html');
});

app.get('/hq', function(req, res){
  res.sendFile(__dirname + '/public/hq.html');
});

app.get('/caselist', function(req, res){
  list.find().forEach(function(doc, err){
    if (doc) {
      caseListStr = doc.case;
    }  
  });
  res.send({msg:caseListStr});
});

http.listen(port, function(){
  console.log('listening on *:' + port);
});

});