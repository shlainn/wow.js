// IndexedDB stuff
// In the following line, you should include the prefixes of implementations you want to test.
window.indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
// DON'T use "var indexedDB = ..." if you're not in a function.
// Moreover, you may need references to some window.IDB* objects:
window.IDBTransaction = window.IDBTransaction || window.webkitIDBTransaction || window.msIDBTransaction;
window.IDBKeyRange = window.IDBKeyRange || window.webkitIDBKeyRange || window.msIDBKeyRange
// (Mozilla has never prefixed these objects, so we don't need window.mozIDB*)

// Update this whenever some new features are required
var compatibility_version = 1;


function TestBrowserCompatibility()
{
  localStorage.compatibility_tested = true;
  $("body").append("<div id=\"fade\" style=\"z-index:9000;position:absolute;left:0%;top:0%;width:100%;height:100%;background:rgba(0,0,0,0.8);\"></div>");
  $("body").append("<div id=\"compatibilitytest\" style=\"z-index:10000;position:absolute;left:50%;top:50%;margin-left:-250px;width:500px;height:300px;margin-top:-150px;border:5px black solid; background:white;padding:20px;\"></div>");

  var features = {};
  features.WebSockets = ("WebSocket" in window && window.WebSocket != undefined);
  features.indexedDB = ("indexedDB" in window && window.indexedDB != undefined);
  features.localStorage = ("localStorage" in window && window.localStorage != undefined);
  failed = false;
  for( i in features)
  {
    $("#compatibilitytest").append("<div style=\"width:100%;padding-bottom:10px;\">"+i+" <span style=\"float:right;color:"+(features[i]?"#0d0":"#d00")+"\">"+(features[i]?"supported":"not supported")+"</span></div>");
    if(!features[i])
      failed = true;
  }
  if(!failed)
  {
    $("#compatibilitytest").append("<div style=\"width:100%;text-align:center\">Your Browser seems to meet the requirements for wow.js</div>");
    localStorage.compatibility_success = true;
    localStorage.compatibility_version = compatibility_version;
  }
  else
    $("#compatibilitytest").append("<div style=\"width:100%;text-align:center;color:red\">Your Browser does not mee the requirements for wow.js. Please consider using a recent version of Chrome or Firefox...</div>");
  $("#compatibilitytest").append("<button id=\"close_compatibility\" style=\"float:right;margin-top:10px;\">Close</button>");
  $("#close_compatibility").click(function(){$("#compatibilitytest").remove();$("#fade").remove();});

}