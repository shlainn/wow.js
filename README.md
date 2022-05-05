wow.js
======

This is an experiment. The aim of that experiment it to see how much of an MMORPG Client can be implemented in pure HTML5/JavaScript/WebGL. For more info see http://getmangos.com/bb/post/4493/#p4493

System Requirements
======
node.js 0.8 or later<br>
node-ws@0.4.22 (<b>https://github.com/einaros/ws.git</b> or <b>npm install ws</b>)<br>
A Web Server with PHP (I use Apache)<br><br>

Google Chrome (tested on Version 20.0.1132.47 Ubuntu 12.04 (144678)) <br>
or Mozilla Firefox (tested on Firefox 16.0.2 for Ubuntu)<br><br>

apple two (https://github.com/mangos-one/)

Setup
======
0) clone the git, put everything in a directory on your webserver. <br>
1) Edit node/ws2tcp.js Line 4: set gameserver to the IP or URL of the server running MaNGOS. "localhost" means ws2tcp and mangos are on the same machine<br>
1a)Edit node/ws2tcp.js Line 6: set the "host" parameter to the to the IP or URL of the server ws2tcp is running on (same as step 2!)<br>
2) Edit index.php Line 4: set the "host" parameter to the IP or URL of the server ws2tcp is running on. "localhost" in this case means the pc in front of you.<br>
3) Start mangos and ws2tcp<br>
4) open your browser of choice and navigate to the location of index.php<br>
5) Watch things exploding, fix them, send pull requests and patches.<br>