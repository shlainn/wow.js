function WorldSession(game, server)
{
  var _game = game;
  var _server = server;

  this.session_key="";
  this.charlist = Array();

  var self = this;
  var crypt_initialized = false;
  var selectedchar = -1;

  var world_connection;

  var leftover_packet;

  //Create Empty WorldPacket
  function WorldPacket(opcode, payload_size)
  {
    var p = new DataView(new ArrayBuffer(6+payload_size));
    p.setUint16(0,4+payload_size,false);//size
    p.setUint32(2,opcode,true);//opcode
    return p;
  }

  this.init = function(port)
  {
    if(port==undefined)
      return;
    world_connection = InitSocket(_server, WorldHandler);
    world_connection.setPort(port);
  }

  this.enter_world = function(char)
  {
    if(char == undefined || char == -1)
      return
    selectedchar = char;
    SendPlayerLogin();
  }

function HandleAuthChallenge(recvPacket)
{
  serverseed = recvPacket.getUint32(4,true);
//   serverseed=0x820DF0F8;
//     Sha1Hash digest;
//     digest.UpdateData(acc);
//     uint32 unk=0;
//     uint64 unk64=0;
//     digest.UpdateData((uint8*)&unk,sizeof(uint32));
//     BigNumber clientseed;
//     clientseed.SetRand(8*4);
//     uint32 clientseed_uint32=clientseed.AsDword();
//     digest.UpdateData((uint8*)&clientseed_uint32,sizeof(uint32));
//     digest.UpdateData((uint8*)&serverseed,sizeof(uint32));
//     digest.UpdateBigNumbers(GetInstance()->GetSessionKey(),NULL);
//     digest.Finalize();
  serverseed_string=serverseed.toString(16);
  while (serverseed_string.length != 8)
    serverseed_string = "0"+serverseed_string;//pad to 8 bytes

  clientseed = "";
  for(var i = 0; i<8; i++)
    clientseed += Math.floor(Math.random()*16).toString(16)
  console.log("Serverseed: 0x"+serverseed_string,"Clientseed: 0x"+clientseed);
  digest_string = _game.accountname.toUpperCase()+hex2str("00000000")+hex2str(hexreverse(clientseed))+hex2str(hexreverse(serverseed_string))+self.session_key;
//   console.log(str2hex(digest_string))
  sha_digest = new jsSHA(digest_string,"TEXT").getHash("SHA-1","HEX");

//   console.log(sha_digest,digest_string);
  packet = new ArrayBuffer(6+4+4+_game.accountname.length+1+4+20+4);
//         auth<<(uint32)(GetInstance()->GetConf()->clientbuild)<<unk<<acc<<clientseed_uint32;
  packet_data = new DataView(packet);
  packet_data.setUint16(0,4+4+4+_game.accountname.length+1+4+20+4,false);//size
  packet_data.setUint32(2,OpCodes.CMSG_AUTH_SESSION,true);//opcode
  packet_data.setUint32(6,8606,true);//clientbuild
  packet_data.setUint32(10,0,true);//unk
  packet_data.setString(14,_game.accountname.toUpperCase(),true);
//   console.log(new Uint8Array(packet));
  packet_data.setString(14+_game.accountname.length+1,hex2str(hexreverse(clientseed)),false);//clientseed
  packet_data.setString(14+_game.accountname.length+1+4,hex2str(sha_digest),false);//digest
  world_connection.send(packet);
  init_crypt();
}

function HandleAuthResponse(recvPacket)
{
  error = recvPacket.getUint8(4);
  if(error == 0x0c)
  {
    packet = new ArrayBuffer(6);
    packet_data = new DataView(packet);
    packet_data.setUint16(0,4,false);//size
    packet_data.setUint32(2,OpCodes.CMSG_CHAR_ENUM,true);//opcode
    encrypt(packet_data);
    world_connection.send(packet);
  }
  else
  {
    console.log("AuthResponse Error!!");
    console.log(new Uint8Array(recvPacket.buffer));
  }
}

function HandleMOTD(recvPacket)
{
  lines = recvPacket.getUint32(4,true);
  offset = 8;

  for(var i = 0; i < lines; i++)
  {
    motdline = recvPacket.getString(offset);
    offset += motdline.length+1;
    console.message("MOTD: "+motdline);
  }
//     uint32 lines;
//     std::string line;
//     recvPacket >> lines;
//     for(uint32 i = 0; i < lines; i++)
//     {
//         recvPacket >> line;
//         logcustom(0,YELLOW,"MOTD: %s",line.c_str());
//     }

}

function HandleCompressedUpdate(recvPacket)
{
  realsize = recvPacket.getUint32(4,true);
  uncompressed = JSInflate.inflateTo(new DataView(recvPacket.buffer.slice(8+2)),realsize);
//   console.log(str2hex(recvPacket.getString(8,recvPacket.byteLength-8)));
  console.log("Decompressing:",realsize, uncompressed.byteLength);
}

function HandleUpdate(recvPacket)
{

}

function HandleTimeSyncRequest(recvPacket)
{
  seqnum = recvPacket.getUint32(4,true);
  packet_data = new WorldPacket(OpCodes.CMSG_TIME_SYNC_RESP,4+4);
  packet_data.setUint32(6,seqnum,true);


  packet_data.setUint32(10,Math.floor(($.now()-_game.start_time)/1000),true);

  encrypt(packet_data);
  world_connection.send(packet_data.buffer);

}
function HandleVerifyWorld(recvPacket)
{
  map = recvPacket.getUint32(4,true);
  x = recvPacket.getFloat32(8,true);
  y = recvPacket.getFloat32(12,true);
  z = recvPacket.getFloat32(16,true);
  o = recvPacket.getFloat32(20,true);

  //ToDo: Give this to a Player Object in the Game Object
}

function HandleCharEnum(recvPacket)
{
  char_num = recvPacket.getUint8(4);
  offset = 5;
  var chars = Array();
  for(var i = 0; i < char_num; i++)
  {
    var char = {};
    char.guid = recvPacket.getUint64(offset,true); offset+=8;
    char.name = recvPacket.getString(offset); offset += char.name.length+1;
    char.race = recvPacket.getUint8(offset); offset++;
    char.class = recvPacket.getUint8(offset); offset++;
    char.gender = recvPacket.getUint8(offset); offset++;
    char.bytes1 = recvPacket.getUint8(offset); offset++;
    char.bytes2 = recvPacket.getUint8(offset); offset++;
    char.bytes3 = recvPacket.getUint8(offset); offset++;
    char.bytes4 = recvPacket.getUint8(offset); offset++;
    char.bytes5 = recvPacket.getUint8(offset); offset++;
    char.level = recvPacket.getUint8(offset); offset++;
    char.zoneId = recvPacket.getUint32(offset,true); offset+=4;
    char.mapId = recvPacket.getUint32(offset,true); offset+=4;
    char.x = recvPacket.getFloat32(offset,true); offset+=4;
    char.y = recvPacket.getFloat32(offset,true); offset+=4;
    char.z = recvPacket.getFloat32(offset,true); offset+=4;
    char.guildid = recvPacket.getUint32(offset,true); offset+=4;
    char.flags = recvPacket.getUint32(offset,true); offset+=4;
    char.firstlogin = recvPacket.getUint8(offset); offset++;
    char.petInfoId = recvPacket.getUint32(offset,true); offset+=4;
    char.petLevel = recvPacket.getUint32(offset,true); offset+=4;
    char.petFamily = recvPacket.getUint32(offset,true); offset+=4;
    char.items = Array();
    for(var j = 0; j < 20; j++)
    {
      var item = {};
      item.displayId = recvPacket.getUint32(offset,true); offset+=4;
      item.inventorytype = recvPacket.getUint8(offset); offset++;
      item.enchantId = recvPacket.getUint32(offset,true); offset+=4;
      char.items.push(item);
    }
    chars.push(char);
  }
  self.charlist = chars;
  _game.char_list();



//             recvPacket >> plr[i]._guid;
//             recvPacket >> plr[i]._name;
//             recvPacket >> plr[i]._race;
//             recvPacket >> plr[i]._class;
//             recvPacket >> plr[i]._gender;
//             recvPacket >> plr[i]._bytes1;//skin
//             recvPacket >> plr[i]._bytes2;//face
//             recvPacket >> plr[i]._bytes3;//hair style
//             recvPacket >> plr[i]._bytes4;//hair color
//             recvPacket >> plr[i]._bytesx;//facial hair
//             recvPacket >> plr[i]._level;
//             recvPacket >> plr[i]._zoneId;
//             recvPacket >> plr[i]._mapId;
//             recvPacket >> plr[i]._x;
//             recvPacket >> plr[i]._y;
//             recvPacket >> plr[i]._z;
//             recvPacket >> plr[i]._guildId;
//             recvPacket >> plr[i]._flags;
//             if(GetInstance()->GetConf()->client > CLIENT_TBC)
//             {
//               recvPacket >> dummy32; // at_login_customize
//             }
//             recvPacket >> dummy8;
//             recvPacket >> plr[i]._petInfoId;
//             recvPacket >> plr[i]._petLevel;
//             recvPacket >> plr[i]._petFamilyId;
//             for(unsigned int inv=0;inv<20;inv++)
//             {
//                 recvPacket >> plr[i]._items[inv].displayId >> plr[i]._items[inv].inventorytype ;
//                 if(GetInstance()->GetConf()->client > CLIENT_CLASSIC_WOW)
//                 {
//                   recvPacket >> dummy32; //enchant aura id
//                 }
//             }
//             plrNameCache.Add(plr[i]._guid, plr[i]._name); // TODO: set after loadingscreen, after loading cache
//   class PlayerEnum {
//   public:
//       uint64 _guid;
//       std::string _name;
//       uint8 _race;
//       uint8 _class;
//       uint8 _gender;
//       uint8 _bytes1;
//       uint8 _bytes2;
//       uint8 _bytes3;
//       uint8 _bytes4;
//       uint8 _bytesx;
//       uint8 _level;
//       uint32 _zoneId;
//       uint32 _mapId;
//       float _x;
//       float _y;
//       float _z;
//       uint32 _guildId;
//       uint32 _flags;
//       uint32 _petInfoId;
//       uint32 _petLevel;
//       uint32 _petFamilyId;
//       PlayerEnumItem _items[20];
//
//   private:
//
//
//   };


}
function SendPlayerLogin()
{
    packet = new ArrayBuffer(6+8);
    packet_data = new DataView(packet);
    packet_data.setUint16(0,4+8,false);//size
    packet_data.setUint32(2,OpCodes.CMSG_PLAYER_LOGIN,true);//opcode
    packet_data.setUint64(6,self.charlist[selectedchar].guid,true);
    encrypt(packet_data);
    world_connection.send(packet);
    _game.realmsession.close();
}
var _send_i, _send_j, _recv_i, _recv_j, crypt_key;

function init_crypt()
{
  crypt_key = new jsSHA(self.session_key,"TEXT").getHMAC(hex2str("38A78315F8922530719867B18C04E2AA"),"TEXT","SHA-1","HEX");
  crypt_key = hex2str(crypt_key);

  _send_i = _send_j = _recv_i = _recv_j = 0;
  crypt_initialized = true;
}


function decrypt(encrypted)
{
  if(!crypt_initialized)
    return;

  for( var t = 0; t < 4; t ++)
  {
    _recv_i %= crypt_key.length;
    x = ((256+encrypted.getUint8(t) - _recv_j)%256) ^ crypt_key.charCodeAt(_recv_i);
//     console.log("decrypt",encrypted.getUint8(t),x,_recv_j,crypt_key.charCodeAt(_recv_i));
    _recv_i++;
    _recv_j = encrypted.getUint8(t);
    encrypted.setUint8(t,x);
  }
//     for (size_t t = 0; t < CRYPTED_RECV_LEN_6005; t++)
//     {
//         _recv_i %= _key.size();
//         uint8 x = (data[t] - _recv_j) ^ _key[_recv_i];
//         ++_recv_i;
//         _recv_j = data[t];
//         data[t] = x;
//
//
//     }

}
function encrypt(clear)
{
  if(!crypt_initialized)
    return;
  for( var t = 0; t < 6; t ++)
  {
    _send_i %= crypt_key.length;
    x = ((clear.getUint8(t) ^ crypt_key.charCodeAt(_send_i))+_send_j) %256;
//     console.log("encrypt",clear.getUint8(t),x,_send_j,crypt_key.charCodeAt(_send_i));
    _send_i++;
    _send_j = x;
    clear.setUint8(t,x);
  }
//     for (size_t t = 0; t < CRYPTED_SEND_LEN_6005; t++)
//     {
//         _send_i %= _key.size();
//         uint8 x = (data[t] ^ _key[_send_i]) + _send_j;
//         ++_send_i;
//         data[t] = _send_j = x;
//     }
}

function WorldHandler(d)
{
    var carryover = false;
    if(leftover_packet != undefined && leftover_packet.byteLength)
    {
      temp_d = new Uint8Array(leftover_packet.byteLength + d.byteLength);
      temp_d.set(new Uint8Array(leftover_packet),0);
      temp_d.set(new Uint8Array(d),leftover_packet.byteLength);
      d = temp_d.buffer;
      leftover_packet = 0;
      carryover = true;
    }

    var packet_offset=0;
    while(packet_offset < d.byteLength)
    {
      packet = d.slice(packet_offset);
      header = new DataView(packet);

      if(!carryover)//header is already decrypted
      {
        decrypt(header);
      }
      else
      {
        carryover = false;
      }

      var packet_size=header.getUint16(0,false);
      var packet_cmd=header.getUint16(2,true);

      //Debug output
      for(i in OpCodes)
        if(OpCodes[i]==packet_cmd)
          console.log("Got World command:",i,packet_cmd.toString(16),"Leftover data length:", packet.byteLength, "Packet size:",packet_size+2)


      if (packet_cmd > MAX_OPCODE_ID)
      {
        console.log("Invalid OPCODE!!!",packet_cmd.toString(16));
        world_connection.close();
        return;
      }

      if (packet_size+2 > packet.byteLength)
      {
        console.log("Incomplete packet, carrying over...");
        leftover_packet = packet;
        return;
      }

      var server_packet = new DataView(packet.slice(0,packet_size+2));

      switch(packet_cmd)
      {
        case OpCodes.SMSG_COMPRESSED_UPDATE_OBJECT:
          HandleCompressedUpdate(server_packet);
          break;
        case OpCodes.SMSG_UPDATE_OBJECT:
          HandleUpdate(server_packet);
          break;
        case OpCodes.SMSG_AUTH_CHALLENGE:
          HandleAuthChallenge(server_packet);
          break;
        case OpCodes.SMSG_LOGIN_VERIFY_WORLD:
          HandleVerifyWorld(server_packet);
          break;
        case OpCodes.SMSG_AUTH_RESPONSE:
          HandleAuthResponse(server_packet);
          break;
        case OpCodes.SMSG_CHAR_ENUM:
          HandleCharEnum(server_packet);
          break;
        case OpCodes.SMSG_MOTD:
          HandleMOTD(server_packet);
          break;
        case OpCodes.SMSG_TIME_SYNC_REQ:
          HandleTimeSyncRequest(server_packet);
          break;
        case OpCodes.SMSG_ACCOUNT_DATA_TIMES:
        case OpCodes.SMSG_FEATURE_SYSTEM_STATUS:
          //Ignore certain opcodes silently
          break;
        default:
          for(i in OpCodes)
            if(OpCodes[i]==packet_cmd)
              console.error("Unhandled World command:",i,packet_cmd.toString(16))
            console.error(new Uint8Array(server_packet.buffer));
          break;
      }
      packet_offset += packet_size+2;
    }

}

};
