<?php
// config: set the address of the server hosting the ws2tcp proxy here

$host="localhost";
$port="8080";
?>


<style>
  * { margin: 0; padding: 0}

  #msgDiv {position:absolute;bottom:10px;left:10px;height:150px;width:600px;border:1px #444 solid;background-color:#eee;opacity:0.4;overflow:auto}
  #debugDiv {position:absolute;bottom:10px;right:10px;height:150px;width:600px;border:1px #444 solid;background-color:#eee;opacity:0.4;overflow:auto}
  #debugDiv:hover, #msgDiv:hover {opacity:0.9}
  #debugDiv p, #msgDiv p { font-size:10px;}
  #list_div, #realm_login{position:absolute;top:50%;left:50%;height:200px;width:400px;border:2px #444 solid;background-color:#eee;margin-left:-200px;margin-top:-200px;padding:20px}
  #realm_login input{margin:10px;}

</style>

<script type=text/javascript src=js/jquery-1.8.2.min.js></script>

<script type=text/javascript src=js/biginteger.js ></script>
<script type=text/javascript src=js/schemeNumber.js></script>

<script type=text/javascript src=js/js-inflate.js></script>

<script type=text/javascript src=js/sha.js></script>

<script type=text/javascript src=js/utilities.js ></script>

<script type=text/javascript src=js/opcodes.js></script>
<script type=text/javascript src=js/realm.js></script>
<script type=text/javascript src=js/world.js></script>

<script>

function GameClient()
{
  this.accountname = "";
  this.password = "";
  
  this.realmsession = new RealmSession(this, 'ws://<?php echo $host.":".$port;?>');//
  this.realmsession.init();

  this.worldsession = new WorldSession(this, 'ws://<?php echo $host.":".$port;?>');

  this.tick_count = $.now();

  var self = this;

  this.realm_login = function()
  {
    this.accountname = $("#input_username").val();
    this.password = $("#input_password").val();
    this.realmsession.start_auth();
  }
  this.enter_world = function(char)
  {
      if(char > this.worldsession.charlist.length)
        return;
      this.worldsession.enter_world(char); 
      $("#list_div").empty();
      $("#list_div").append("You have now entered the world. Welcome to the bleeding edge of wow.js. Nothing to see here. Move along.");
  }
  this.world_login = function(realm)
  {
      if(realm > this.realmsession.realmlist.length)
        return;
      this.worldsession.init(this.realmsession.realmlist[realm].addr_port.split(":")[1]); //maybe make a getPort() function for a Realm object??
      $("#list_div").hide();
  }
  this.char_list = function()
  {
    $("#list_div").css({"display":"block"});
    $("#list_div").empty();
    $("#list_div").append("<h1>Character List</h1>");
    if(this.worldsession.charlist.length==0)
      $("#list_div").append("No characters found - and you cannot create one yet :p");
    else
    {
      for(var i=0;i<this.worldsession.charlist.length;i++)
      {
        $("#list_div").append("<p>"+this.worldsession.charlist[i].name+" <a href=# onClick=client.enter_world("+i+")>enter world with this char</a></p>");
      }
    }
  }

  this.realm_list = function()
  {
    $("#realm_login").css({"display":"none"});
    $("#list_div").css({"display":"block"});

    $("#list_div").empty();
    $("#list_div").append("<h1>Realm List</h1>");
    for(var i=0;i<this.realmsession.realmlist.length;i++)
    {
      $("#list_div").append("<p>"+this.realmsession.realmlist[i].name+" <a href=# onClick=client.world_login("+i+")>connect to this realm</a></p>");
    }
  }
};






var client;

$(document).ready(function() {
  // comment this to disable logging to the onscreen div. it is only a temporary thing anyway

  if (typeof console  != undefined)
    if (typeof console.log != undefined)
        console.olog = console.log;
    else
        console.olog = function() {};

  console.log = function(message)
  {
      console.olog(arguments);
      for(var i = 1; i < arguments.length; i++)
        message += " " + arguments[i];
      $('#debugDiv').prepend('<p>' + (new Date().toLocaleTimeString())+": "+message + '</p>');
  };

  console.message = function(message) //This is a hack
  {
      $('#msgDiv').prepend('<p>' + message + '</p>');
      console.log("MSG: ",message);
  };

  client  = new GameClient();

});
</script>


<div id ="list_div" style="display:none"></div>
<div id="realm_login">
  <h1>Welcome to the glorious WoW.js</h1>

  Username: <input id=input_username><br>
  Password: <input id=input_password type=password><br>
  <button onClick=client.realm_login()>Log In</button>
</div>
<div id="debugDiv"></div>
<div id="msgDiv"></div>
