function RealmSession(game, server)
{
  var _game = game;
  var _server = server;
  
  var realm_connection;

  this.realmlist;
  
  var self = this;
  
  this.start_auth = function()
  {
    if(_game.accountname.length >0 && _game.password.length >0)
      SendAuthLogonChallenge();
    else
    {
      //Report Error here!
    }
  }
  
  function SendAuthLogonChallenge()
  {
    packet = new ArrayBuffer(1+1+1+1+4+3+2+4+4+4+4+4+1+_game.accountname.length);
    packet_data = new DataView(packet);
    packet_data.setUint8(0,0);
    packet_data.setUint8(1,6);
    packet_data.setUint8(2,4+3+2+4+4+4+4+4+1+_game.accountname.length);
    packet_data.setString(4,"WoW");
    packet_data.setUint8(8,2);
    packet_data.setUint8(9,4);
    packet_data.setUint8(10,3);
    packet_data.setUint16(11,8606,true);
    packet_data.setString(13,"68x");
    packet_data.setString(17,"niW");
    packet_data.setString(21,"SUne",false);
    packet_data.setUint32(25,0x3c,true);
    packet_data.setUint8(29,127);
    packet_data.setUint8(30,0);
    packet_data.setUint8(31,0);
    packet_data.setUint8(32,1);
    packet_data.setUint8(33,_game.accountname.length);
    packet_data.setString(34,_game.accountname.toUpperCase(),false)

    realm_connection.send(packet);
  
  }

  function HandleAuthLogonChallenge(recvPacket)
  {
    error = recvPacket.getUint8(2);
    switch(error)
    {
      case 0:
        console.log("No Error");
        offset=3;
        var bi_k = BigInteger(3);
        var B="";
        for(var i = 0;i<32;i++)
        {
          temp_B=(recvPacket.getUint8(offset)).toString(16);
          B = (temp_B.length==1?"0":"")+temp_B+B
          offset++;
        }
        B = "0x"+B
  //       B = "0x4A91B0F33F8DC608F7B2628BE795DA8D91439C6C09D85ADD576F9D2E814D99D2";
        var g_len = recvPacket.getUint8(offset);
        offset++;
        var g = recvPacket.getUint8(offset).toString(16);
  //       var g = 7;
        offset++;
        var n_len = recvPacket.getUint8(offset);
        offset++;
        var N="";
        for(var i = 0;i<n_len;i++)
        {
          temp_n=(recvPacket.getUint8(offset)).toString(16);
          N = (temp_n.length==1?"0":"")+temp_n+N
          offset++;
        }
        N = "0x"+N
  //       N = "0x894B645E89E1535BBDAD5B8B290650530801B18EBFBF5E8FAB3C82872A3E9BB7"
        var salt="";
        for(var i = 0;i<32;i++)
        {
          temp_salt=(recvPacket.getUint8(offset)).toString(16);
          salt = (temp_salt.length==1?"0":"")+temp_salt+salt
          offset++;
        }
        salt = "0x"+salt;
  //       salt = "0x9C57C74CEB4A26A1B16C762B054BDD58F4363C9C19A82948798C770386AD6DF3";
        bi_B=BigInteger(B)
        bi_N=BigInteger(N);
        bi_g=BigInteger(g);
        bi_salt = BigInteger(salt);
        console.log("SERVER BIGNUMS:");
        console.log("B",bi_B.toString(16));
        console.log("N",bi_N.toString(16));
        console.log("g",bi_g.toString(16));
        console.log("salt",bi_salt.toString(16));
        a = "";
        for(var i = 0; i<19;i++)
        {
          temp_a= Math.floor(Math.random()*255).toString(16);
          a = (temp_a.length==1?"0":"")+temp_a+a
        }
        a = "0x"+a
  //       a = "0xAD56ABC85A3F028D85021A91226E539F6A56F9"
        
        bi_a=BigInteger(a);
        console.log("a",bi_a.toString(16));
        to_hash = (_game.accountname+":"+_game.password).toUpperCase();

        sha_user = new jsSHA(to_hash,"TEXT").getHash("SHA-1","HEX");
        //for hashes, bi_values need to be hexreversed - BigInteger has wrong endianness ??
        sha_x = new jsSHA(hex2str(hexreverse(bi_salt.abs().toString(16))+sha_user),"TEXT").getHash("SHA-1","HEX");
        sha_x_reverse = hexreverse(sha_x);
        
        bi_x=BigInteger("0x"+sha_x_reverse);
        console.log("x",bi_x.toString(16));
        bi_v = bi_g.modPow(bi_x,bi_N);
        console.log("v",bi_v.toString(16));
        bi_A = bi_g.modPow(bi_a,bi_N);
        console.log("A",bi_A.toString(16));
        sha_u = new jsSHA(hex2str(hexreverse(bi_A.abs().toString(16)))+hex2str(hexreverse(bi_B.abs().toString(16))),"TEXT").getHash("SHA-1","HEX");
        bi_u = BigInteger("0x"+hexreverse(sha_u));
        console.log("u",bi_u.toString(16));
        bi_S = (bi_B.subtract(bi_k.multiply(bi_v))).modPow((bi_a.add(bi_u.multiply(bi_x))),bi_N)
        console.log("S",bi_S.toString(16));
        s1="";
        s2="";
        str_S = hex2str(hexreverse(bi_S.abs().toString(16)));
        for(var i = 0; i< 16;i++)
        {
          s1 += str_S.charAt(i*2);
          s2 += str_S.charAt(i*2+1);
        }
        sha_s1 = hex2str(new jsSHA(s1,"TEXT").getHash("SHA-1","HEX"));
        sha_s2 = hex2str(new jsSHA(s2,"TEXT").getHash("SHA-1","HEX"));
        S = ""
        for(var i = 0; i< 20;i++)
        {
          S += sha_s1.charAt(i);
          S += sha_s2.charAt(i);
        }
        console.log("SessionKey",hexreverse(str2hex(S)));
        _game.worldsession.session_key=S;
  //             char Ng_hash[20];
  //             Sha1Hash userhash2,Nhash,ghash;
  //             userhash2.UpdateData((const uint8*)user.c_str(),user.length());
  //             userhash2.Finalize();
        sha_userhash2=new jsSHA(_game.accountname.toUpperCase(),"TEXT").getHash("SHA-1","HEX");
  //             //printchex((char*)userhash2.GetDigest(),userhash2.GetLength(),true);
  //             Nhash.UpdateBigNumbers(&N,NULL);
  //             Nhash.Finalize();
        sha_Nhash = new jsSHA(hex2str(hexreverse(bi_N.toString(16))),"TEXT").getHash("SHA-1","HEX");
        sha_Nhash_str = hex2str(sha_Nhash);
  //             ghash.UpdateBigNumbers(&g,NULL);
  //             ghash.Finalize();
        sha_ghash = new jsSHA(hex2str(hexreverse(bi_g.toString(16))),"TEXT").getHash("SHA-1","HEX");
        sha_ghash_str = hex2str(sha_ghash);
        Ng_hash = "";
        for(var i=0; i < 20; i++)
          Ng_hash += String.fromCharCode(sha_Nhash_str.charCodeAt(i)^sha_ghash_str.charCodeAt(i))

  //             for(i=0;i<20;i++)Ng_hash[i] = Nhash.GetDigest()[i]^ghash.GetDigest()[i];
  //             //printchex(Ng_hash,20,true);
  // 
  //             BigNumber t_acc,t_Ng_hash;
  //             t_acc.SetBinary((const uint8*)userhash2.GetDigest(),userhash2.GetLength());
  //             t_Ng_hash.SetBinary((const uint8*)Ng_hash,20);
        bi_acc=BigInteger("0x"+hexreverse(sha_userhash2))
        bi_Ng_hash=BigInteger("0x"+hexreverse(str2hex(Ng_hash)))
        console.log("acc",bi_acc.toString(16));
        console.log("ng",bi_Ng_hash.toString(16));
  // 
  // 
  //             Sha1Hash M1hash,M2hash;
  // 
  //             M1hash.UpdateBigNumbers(&t_Ng_hash,&t_acc,&salt,&A,&B,NULL);
  //             M1hash.UpdateData((const uint8*)S_hash,40);
  //             M1hash.Finalize();
        f=hexreverse(bi_Ng_hash.abs().toString(16))+hexreverse(bi_acc.abs().toString(16))+hexreverse(bi_salt.abs().toString(16))+hexreverse(bi_A.abs().toString(16))+hexreverse(bi_B.abs().toString(16));
        sha_M1=new jsSHA(hex2str(f)+S,"TEXT").getHash("SHA-1","HEX");
  // 
  //             M2hash.UpdateBigNumbers(&A,NULL);
  //             M2hash.UpdateData((const uint8*)M1hash.GetDigest(),M1hash.GetLength());
  //             M2hash.UpdateData((const uint8*)S_hash,40);
  //             M2hash.Finalize();
        sha_M2=new jsSHA(hex2str(hexreverse(bi_A.toString(16)))+hex2str(sha_M1)+S,"TEXT").getHash("SHA-1","HEX");
        console.log("M1",sha_M1);
        console.log("M2",sha_M2);

        packet = new ArrayBuffer(1+32+20+22);
        packet_data = new DataView(packet);     
        packet_data.setUint8(0,1);//AUTH_LOGON_PROOF
        packet_data.setString(1,hex2str(hexreverse(bi_A.abs().toString(16))),false)
        packet_data.setString(33,hex2str(sha_M1),false)
        realm_connection.send(packet);
        
  // struct sAuthLogonChallenge_S
  // {
  //     uint8   cmd;
  //     uint8   unk2;
  //     uint8   error;
  //     uint8   B[32];
  //     uint8   g_len;
  //     uint8   g[1];
  //     uint8   N_len;
  //     uint8   N[32];
  //     uint8   salt[32];
  //     uint8   unk3[16];
  // };      
        break;
      default://HANDLE ME!!
        console.error("Auth Error:",error.toString(16))
        break;
    }
  }

  function HandleLogonProof(recvPacket)
  {
  //TODO: actually handle the data...
      error = recvPacket.getUint8(1);
      switch(error)
      {
        case 0:
          packet = new ArrayBuffer(1+4);
          packet_data = new DataView(packet);     
          packet_data.setUint8(0,0x10);//AUTH_Realmlist
          packet_data.setUint32(1,0)
          realm_connection.send(packet);
          break;
        default:
          console.error("Logon Proof error! ErrNo:",error);
        //TODO: HANDLE ME
          break;
      }
  }

  function HandleRealmList(recvPacket)
  {
      numrealm = recvPacket.getUint16(7,true);
      console.log("Receiving ",numrealm, "realms");
  //     uint8   icon;           // icon near realm
  //     uint8   locked;         // added in 2.0.x
  //     uint8   color;          // color of record
  //     std::string name;           // Text zero terminated name of Realm
  //     std::string addr_port;      // Text zero terminated address of Realm ("ip:port")
  //     float   population;     // 1.6 -> population value. lower == lower population and vice versa
  //     uint8   chars_here;     // number of characters on this server
  //     uint8   timezone;       // timezone
  //     uint8   unknown;        // 
      var realmlist = Array();
      offset = 9; //u8cmd, u16length, u32unk, u16numrealm
      for( var i = 0; i < numrealm; i++)
      {
          icon = recvPacket.getUint8(offset); offset++;
          locked = recvPacket.getUint8(offset); offset++;
          color = recvPacket.getUint8(offset); offset++;
          name = recvPacket.getString(offset); offset += name.length+1;
          addr_port = recvPacket.getString(offset); offset += addr_port.length+1;
          population = recvPacket.getFloat32(offset,true); offset += 4;
          chars_here = recvPacket.getUint8(offset); offset++;
          tz = recvPacket.getUint8(offset); offset++;
          unk = recvPacket.getUint8(offset); offset++;
          realm = {"icon":icon,"locked":locked,"color":color,"name":name,"addr_port":addr_port,"population":population,"chars_here":chars_here,"tz":tz};
          realmlist.push(realm);
      }
      self.realmlist = realmlist;
      console.log("Realmlist read, ",realmlist.length,"realms");
      _game.realm_list();

  }

  function RealmHandler(d)
  {
      d = new DataView(d);
      cmd=d.getUint8(0);
      switch(cmd)
      {
        case 0x00://AUTH_LOGON_CHALLENGE
          console.log("Got Auth Logon Challenge")
          HandleAuthLogonChallenge(d);
          
          break;
        case 0x01://AUTH_LOGON_PROOF
          console.log("Got Auth Logon Proof")
          HandleLogonProof(d);
          break;
        case 0x10://AUTH_Realmlist
          console.log("Got Realmlist")
          HandleRealmList(d);
          break;
        default:
          console.log("Got unknown Auth command:",cmd.toString(16))
          break;
      }

  }

  this.init = function()
  {
    realm_connection = InitSocket(_server, RealmHandler);
    realm_connection.setPort(3724);
  }
  this.close = function()
  {
    console.log("Closing Realm connection");
    realm_connection.close();
  }
};
