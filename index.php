<script type=text/javascript>
// config: set the address of the server hosting the ws2tcp proxy here
var config = {};
config.host="localhost";
config.port="8080";
config.realmname = "";
</script>


<style>
  * { margin: 0; padding: 0}

  #msgDiv {position:absolute;bottom:10px;left:10px;height:150px;width:600px;border:1px #444 solid;background-color:#eee;opacity:0.4;overflow:auto}
  #debugDiv {position:absolute;bottom:10px;right:10px;height:150px;width:600px;border:1px #444 solid;background-color:#eee;opacity:0.4;overflow:auto}
  #debugDiv:hover, #msgDiv:hover {opacity:0.9}
  #debugDiv p, #msgDiv p { font-size:10px;}
  #list_div, #realm_login{position:absolute;top:50%;left:50%;height:200px;width:400px;border:2px #444 solid;background-color:#eee;margin-left:-200px;margin-top:-200px;padding:20px}
  #realm_login input{margin:10px;}

  #explain {position:absolute;top:10px;left:10px;height:60px;width:100px;border:1px #444 solid;background-color:#eee;opacity:0.4;overflow:auto}

  #playfield {position:absolute;top:0px; left:0px; width:100%; height:100%;border:0px black solid; background-color:#dfd;}
  #playfield div {position:absolute;}

</style>

<script type=text/javascript src=js/jquery-1.8.2.min.js></script>

<script type=text/javascript src=js/biginteger.js ></script>
<script type=text/javascript src=js/schemeNumber.js></script>

<script type=text/javascript src=js/js-inflate.js></script>

<script type=text/javascript src=js/sha.js></script>

<script type=text/javascript src=js/utilities.js ></script>

<script type=text/javascript src=js/enums.js></script>
<script type=text/javascript src=js/realm.js></script>
<script type=text/javascript src=js/world.js></script>

<script type=text/javascript>


// Objects. Full inheritance tree:
//  WorldObject
//    Item
//      Container
//    Unit
//      Player
//    GameObject

function WorldObject()
{
}
WorldObject.prototype.guid=0;
WorldObject.prototype.type=0;
WorldObject.prototype.updatefields={};
WorldObject.prototype.movementdata={};

function Item(guid)
{
  this.guid = guid;
  this.type = OBJECTTYPEID.ITEM;
}
Item.prototype = new WorldObject();

function Container(guid)
{
  this.guid = guid;
  this.type = OBJECTTYPEID.CONTAINER;
}
Container.prototype = new Item();

function Unit(guid)
{
  this.guid = guid;
  this.type = OBJECTTYPEID.UNIT;
}
Unit.prototype = new WorldObject();

function Player(guid)
{
  this.guid = guid;
  this.type = OBJECTTYPEID.PLAYER;
}
Player.prototype = new Unit();

function GameObject(guid)
{
  this.guid = guid;
  this.type = OBJECTTYPEID.GAMEOBJECT;
}
GameObject.prototype = new WorldObject();


function MyCharacter( guid )
{
  _player_guid = guid
}


function GameClient()
{
  this.accountname = "";
  this.password = "";

  this.realmsession = new RealmSession(this, "ws://"+config.host+":"+config.port);
  this.realmsession.init();

  this.worldsession = new WorldSession(this, "ws://"+config.host+":"+config.port);

  this.tick_count = $.now();

  var self = this;

  var player;
  var draw_interval;//TEMP

  var world_center = {"x":1,"y":2,"z":3};
  units = {};

  var zoom = 300; //total screen width = 100 world coordinate units

  this.setWorldCenter = function(x,y,z)
  {
    world_center = {"x":x,"y":y,"z":z};
  }

  function DrawUnits()
  {
    $("#playfield").empty();

    var step = -window.innerWidth/zoom;
    var offset_left = (window.innerWidth / 2) / step; //half screen width / step
    var offset_top = (window.innerHeight / 2) / step;
    for(var i in units)
    {
      var u = units[i];
      if(!u.type || u.type < OBJECTTYPEID.UNIT)
        continue;

      if(!u.movementdata)
        continue;
      if(u.movementdata.flags & UPDATEFLAG.LIVING)
      {
        l = Math.round((u.movementdata.mi.y - world_center.y + offset_left)*step);
        t = Math.round((u.movementdata.mi.x - world_center.x + offset_top)*step);
        symbol = u.type == OBJECTTYPEID.PLAYER?"@":"X";
        $("#playfield").append("<div style=\"top:"+t+"px;left:"+l+"px\">"+symbol+"</div>");
      }
      else if(u.movementdata.flags & UPDATEFLAG.HAS_POSITION)
      {
        l = Math.round((u.movementdata.has_pos.y - world_center.y + offset_left)*step);
        t = Math.round((u.movementdata.has_pos.x - world_center.x + offset_top)*step);
        $("#playfield").append("<div style=\"top:"+t+"px;left:"+l+"px\">O</div>");
      }
    }
  }


  this.AddWorldObject = function(guid, type, movedata, values)
  {
    var obj;
    switch(type)
    {
      case OBJECTTYPEID.ITEM         :
        obj = new Item(guid);
      break;
      case OBJECTTYPEID.CONTAINER    :
        obj = new Container(guid);
      break;
      case OBJECTTYPEID.UNIT         :
        obj = new Unit(guid);
      break;
      case OBJECTTYPEID.PLAYER       :
        obj = new Player(guid);
      break;
      case OBJECTTYPEID.GAMEOBJECT   :
        obj = new GameObject(guid);
      break;
      case OBJECTTYPEID.OBJECT       :
      case OBJECTTYPEID.DYNAMICOBJECT:
      case OBJECTTYPEID.CORPSE       :
      case OBJECTTYPEID.AIGROUP      :
      case OBJECTTYPEID.AREATRIGGER  :
      default:
        console.log("Unknown Object",type,guid);
        return;
      break;
    }
    obj.movementdata = movedata;
    obj.updatefields = values;
    units[guid.toString()]=obj;

  }

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
      player = new MyCharacter(this.worldsession.charlist[char].guid);
      draw_interval = window.setInterval(function(){DrawUnits();},2000);//TEMP
      $("#list_div").empty();
      $("#list_div").css({"display":"none"});
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
      if (this.realmsession.realmlist[i].name == config.realmname)
      {
        this.world_login(i);
        return;
      }
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

<div id="playfield"></div>
<div id="explain">X = Creature<br>O = Object<br>@ = Player</div>
<div id ="list_div" style="display:none"></div>
<div id="realm_login">
  <h1>Welcome to the glorious WoW.js</h1>

  Username: <input id=input_username><br>
  Password: <input id=input_password type=password><br>
  <button onClick=client.realm_login()>Log In</button>
</div>
<div id="debugDiv"></div>
<div id="msgDiv"></div>
