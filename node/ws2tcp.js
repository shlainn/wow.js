var WebSocketServer = require('ws').Server, 
    net = require("net");

var gameserver="localhost";

var wss = new WebSocketServer({port: 8080});

wss.on('connection', function(ws) {
  var targetport = undefined;
  var gsconnection = new net.Socket({type:"tcp4"});
  console.log("WS Client connected");
  ws.on('message', function(message,flags) {
    if(flags.binary==undefined)//text message
    {
      message = JSON.parse(message);
      if(message.port && targetport==undefined)
      {
        targetport=parseInt(message.port);
        gsconnection.connect(targetport,gameserver,function(){console.log("Gameclient connected on port",targetport);});
        gsconnection.on("error",function(err){console.log(err);});
        gsconnection.on("data",function(data){ws.send(data,{binary:true})});
        gsconnection.on("end",function(){console.log("Gameclient End Connection");});
        gsconnection.on("close",function(){console.log("Gameclient Connection Closed");ws.close();});
      }
    }
    else 
    {
      if(gsconnection)
        gsconnection.write(message);
    }
  });

  ws.on("close", function(code, message){
    gsconnection.destroy();
    console.log("WS Close!",code,message)
  });
});