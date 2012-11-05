// Extending DataView for more convenience

DataView.prototype.setString = function (offset,string,zero_terminated)
{
  if(zero_terminated == undefined)
    zero_terminated = true;
  for(var i = 0; i < string.length;i++)
    this.setUint8(offset+i,string.charCodeAt(i));
  if(zero_terminated)
    this.setUint8(offset+string.length,0);
}

DataView.prototype.getString = function (offset,length)
{
  string="";
  if(length == undefined)
  {
    read=true;
    i=0;
    while(read)
    {
      ccode=this.getUint8(offset+i);
      if(ccode==0)
        read=false;
      else
        string+=String.fromCharCode(ccode);
      i++;
    }
  }
  else
  {
    for(var i = 0; i <length;i++)
      string+=String.fromCharCode(this.getUint8(offset+i));
  }
  return string;
}

DataView.prototype.getUint64 = function (offset,littleEndian)
{
  if(littleEndian)
  {
    l = this.getUint32(offset,littleEndian);
    h = this.getUint32(offset+4,littleEndian);
  }
  else
  {
    h = this.getUint32(offset,littleEndian);
    l = this.getUint32(offset+4,littleEndian);
  }
  return new uint64(l,h);
}
DataView.prototype.setUint64 = function (offset,value,littleEndian)
{
  if(littleEndian)
  {
    this.setUint32(offset,value.low,littleEndian);
    this.setUint32(offset+4,value.high,littleEndian);
  }
  else
  {
    this.setUint32(offset,value.high,littleEndian);
    this.setUint32(offset+4,value.low,littleEndian);
  }

}


//convert a hex string to a normal string.
function hex2str(hex)
{
  str="";

  //must be even numbered.
  if(hex.length % 2 != 0)
    hex = "0"+hex;
  for(var i = 0; i< hex.length/2; i++)
  {
    cc = parseInt(hex.substring(i*2,i*2+2),16);
    str += String.fromCharCode(cc);
  }
  return str;
}

// string --> hex string
function str2hex(str)
{
  hex="";
  for(var i = 0; i < str.length;i++)
  {
    temp_hex=str.charCodeAt(i).toString(16);
    hex += (temp_hex.length==1?"0":"")+temp_hex;
  }
  return hex;
}

//reverse an hex string 0xABCD --> 0xCDAB
function hexreverse(hex)
{
  hex_r="";
  if(hex.length % 2 != 0)
    hex = "0"+hex;
  for(var i = 0; i < hex.length /2; i++)
    hex_r = hex.substring(i*2,i*2+2)+hex_r;
  return hex_r;
}

//object to handle 64bit guids
function uint64(low, high)
{
  this.low = low;
  this.high = high;

  this.equal = function(otherU64) { return this.low == otherU64.low && this.high == otherU64.high; }
  this.toString = function() { lowstring = low.toString(16); highstring = high.toString(16); return "00000000".substr(0,8-highstring.length)+highstring+"00000000".substr(0,8-lowstring.length)+lowstring; }

}

//Generic WebSocket Initialization
function InitSocket(address, datahandler)
{
  var connection = new WebSocket(address);
  connection.binaryType="arraybuffer";
  // When the connection is open, send some data to the server
  connection.onopen = function () {
  };

  connection.onclose = function () {
    console.log("WebSocket Closed");
  };

  // Log errors
  connection.onerror = function (error) {
    console.log("WebSocket Error " , error);
  };

  // Log messages from the server
  connection.onmessage = function (e) {
    if(e.data instanceof ArrayBuffer)
    {
      d = e.data;
      datahandler(d);
    }
    else
    {
      //actually this should never happen...
    }
  };

  connection.setPort = function(port)
  {
    if(connection.readyState === connection.OPEN)
    {
      connection.send("{\"port\":\""+port+"\"}");
      console.log("Set port "+port);
    }
    else
    {
      console.log("Connection not ready, waiting");
      window.setTimeout(function(){connection.setPort(port);},200);
    }
  }

  return connection;
}



