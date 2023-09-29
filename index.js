// IMPORTS
const {exec} = require("child_process");
const fs = require("fs");
const zl = require("zip-lib");
const express = require('express');
const app = express();
const http = require("http");
const server = http.createServer(app);
const {Server} = require("socket.io");


// INITIALIZATION
//[-] {Project}.
const _ProjectName = "Online File Manager Server";
const io = new Server(server, {maxHttpBufferSize: 1e7});
const port = 3000;

//[-] {Console}.
console.clear();
console.log(`[#####] ${_ProjectName} [#####]`);

//[-] {Express}.
app.use("/dl/:filename", (req, res, next) => {
  let fileName = req.params["filename"];
  let filePath = `${__dirname}/public/dl/${fileName}`;

  // LA SOLUTION
  req.on("end", () => {
    console.log(fileName + " downloaded !")
  })
  // FIN DE LA SOLUTION
  next();
});
app.use("/", express.static("./public"));

//[-] {Client account}.
let connectedUsers = {};
let dataDir = `${__dirname}/data/`;
let usersFile = "user.json" 
let regexEmail = /.+@.+\..+/g;
let usernameFromSocket = [];

//[-] {File manager}.
let tempPath = `${__dirname}/Temp/`;
tempPath = tempPath.replace(/\\/g, "/");
let storagePath = `${__dirname}/Files/`;
storagePath = storagePath.replace(/\\/g, "/");
let files = {};

//[-] Clear ZIP folder.
fs.readdir(`${__dirname}/public/dl/`, (err, files) => {
  if (err) {throw err};

  for (let file of files) {
    fs.unlink(`${__dirname}/public/dl/${file}`, err => {
      if (err) {throw err};
    });
  }
});


// ON TESTE ICI !
// Rien RIP :'(


// FUNCTIONS
//[-] General.
let randomBase16 = function(pNumber = 1) {
  let base16 = "0123456789ABCDEF";
  let output = "";
  for (let i = 1; i <= pNumber; i++) {
    output += base16[(Math.round(Math.random() * (base16.length - 1)))];
  }
  return output;
}

let patternToBase16 = function(pPattern, pSearch) {
  let result = "";
  for (let i = 0; i < pPattern.length; i++) {
    if (pPattern[i] === pSearch) {
      result += randomBase16();
    } else {
      result += pPattern[i];
    }
  }
  return result;
}

let txtToSHA256 = function r(t){function n(r,t){return r>>>t|r<<32-t}for(var o,e,f=Math.pow,h=f(2,32),a="",l=[],g=8*t.length,c=r.h=r.h||[],i=r.k=r.k||[],u=i.length,v={},s=2;u<64;s++)if(!v[s]){for(o=0;o<313;o+=s)v[o]=s;c[u]=f(s,.5)*h|0,i[u++]=f(s,1/3)*h|0}for(t+="";t.length%64-56;)t+="\0";for(o=0;o<t.length;o++){if((e=t.charCodeAt(o))>>8)return;l[o>>2]|=e<<(3-o)%4*8}for(l[l.length]=g/h|0,l[l.length]=g,e=0;e<l.length;){var k=l.slice(e,e+=16),d=c;for(c=c.slice(0,8),o=0;o<64;o++){var p=k[o-15],w=k[o-2],A=c[0],C=c[4],M=c[7]+(n(C,6)^n(C,11)^n(C,25))+(C&c[5]^~C&c[6])+i[o]+(k[o]=o<16?k[o]:k[o-16]+(n(p,7)^n(p,18)^p>>>3)+k[o-7]+(n(w,17)^n(w,19)^w>>>10)|0);(c=[M+((n(A,2)^n(A,13)^n(A,22))+(A&c[1]^A&c[2]^c[1]&c[2]))|0].concat(c))[4]=c[4]+M|0}for(o=0;o<8;o++)c[o]=c[o]+d[o]|0}for(o=0;o<8;o++)for(e=3;e+1;e--){var S=c[o]>>8*e&255;a+=(S<16?0:"")+S.toString(16)}return a};

function convert2Digits(pString){
  return ("0" + pString).slice(-2);
}

//[-] {File manager}.
function listDirFiles(pDir = "") {
  let list = fs.readdirSync(storagePath + pDir);

  // Remove "desktop.ini" file if exist.
  if (list.includes("desktop.ini")) {list.splice(list.indexOf("desktop.ini"), 1)};
  
  return list;
}

function deleteFile(pFile) {
  let filePath = storagePath + pFile;
  if (fs.existsSync(filePath)) {
    try {
      fs.unlinkSync(filePath);
      //file removed
    } catch(err) {
      console.error(err);
    }
  }
}

function downloadFile(pSocket, pDir, pFile) {
  let fileName = `${pFile}_${randomBase16(8)}.zip`;
  zl.archiveFile(`${storagePath}/${pDir}/${pFile}`, `${__dirname}/public/dl/${fileName}`).then(() => {
    pSocket.emit("downloadFile", fileName)
  }, function (err) {
    console.log(err);
  });
}

//[-] {Client account}.
function createUser(pUserData) {
  let newDate = new Date();
  let formatedDate = `${newDate.getFullYear()}-${convert2Digits(newDate.getMonth() + 1)}-${convert2Digits(newDate.getDate())}_${convert2Digits(newDate.getHours())}:${convert2Digits(newDate.getMinutes())}:${convert2Digits(newDate.getSeconds())}`;
  let newUser = {
    registrationDate: formatedDate,
    username: pUserData.username,
    email: pUserData.email,
    password: pUserData.password
  }

  let rawJSON = fs.readFileSync(dataDir + usersFile);
  let usersData = JSON.parse(rawJSON);

  usersData[newUser.username] = newUser;
  fs.writeFileSync(dataDir + usersFile, JSON.stringify(usersData));

  // Create client storage directory.
  fs.mkdirSync(`${storagePath}${newUser.username}`, {recursive: true});
}

function userExist(pUsername) {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, {recursive: true});
  }
  if (fs.existsSync(dataDir + usersFile)) {
    let rawJSON = fs.readFileSync(dataDir + usersFile);
    let usersData = JSON.parse(rawJSON);
    
    if (usersData[pUsername] != undefined) {
      return true;
    } else {
      
      return false;
    }
  } else {
    fs.writeFileSync(dataDir + usersFile, JSON.stringify({}));
    return false;
  }
}

function getUserData(pUser) {
  let rawJSON = fs.readFileSync(dataDir + usersFile);
  let usersData = JSON.parse(rawJSON);

  return usersData[pUser];
}


// SOCKET IO HANDLER
io.on("connection", (socket) => {
  // Print message on client connexion.
  console.log("user " + socket.id + " connected");

  //[-] {File manager}.
  // List directory's files on client request.
  socket.on('getDirFiles', (pDir = usernameFromSocket[socket.id]) => {
    if (usernameFromSocket[socket.id]) {
      //[TODO] Verify if user have rights to access this folder.
      socket.emit("dirFiles", listDirFiles(pDir));
    } else {
      console.log(`SID[${socket.id}] ask for dir (${pDir}) indexing but is not connected !`);
    }
  });

  // Delete file on client request.
  socket.on("deleteFile", (pFile) => {
    if (usernameFromSocket[socket.id]) {
      //[TODO] Verify if user have rights to delete this file.
      deleteFile(`${usernameFromSocket[socket.id]}/${pFile}`);
    } else {
      console.log(`SID[${socket.id}] ask for "%disconnectedUser%/${pFile}" deletion but is not connected !`);
    }
  })

  // Download file on client request.
  socket.on("downloadFile", (pFile) => {
    if (usernameFromSocket[socket.id]) {
      //[TODO] Verify if user have rights to download this file.
      downloadFile(socket, usernameFromSocket[socket.id], pFile);
    } else {
      console.log(`SID[${socket.id}] ask for "%disconnectedUser%/${pFile}" download but is not connected !`);
    }
  })

  socket.on('Start', (data) => { //data contains the variables that we passed through in the html file
    let names = data['Name'];
    files[names] = {  //Create a new Entry in The Files Variable
      FileSize: data['Size'],
      Data: "",
      Downloaded: 0
    }
    let place = 0;
    try{
      let stat = fs.statSync(tempPath +  names);
      if(stat.isFile()) {
        files[names]['Downloaded'] = stat.size;
        place = stat.size / 5e5;
      }
    } catch(er) {} //It's a New File
    fs.open(tempPath + names, "a", 0755, (err, fd) => {
      if(err) {
        console.log(err);
      } else {
        files[names]['Handler'] = fd; //We store the file handler so we can write to it later        
        socket.emit('MoreData', {Place : place, Percent : 0});
      }
    });
  });

  socket.on('Upload', (data) => {
    let names = data['Name'];
    files[names]['Downloaded'] += data['Data'].length;
    files[names]['Data'] += data['Data'];

    // If file is fully uploaded.
    if(files[names]['Downloaded'] == files[names]['FileSize']) {
      fs.write(files[names]['Handler'], files[names]['Data'], null, 'Binary', (err, Writen) => {
        fs.close(files[names]['Handler'], () => {
          fs.rename(`${tempPath}${names}`, `${storagePath}${usernameFromSocket[socket.id]}/${names}`, () => {
            socket.emit('Done');
          });
        });
      });
    // If the data buffer reaches 10MB
    } else if (files[names]['Data'].length > 1e7){
      fs.write(files[names]['Handler'], files[names]['Data'], null, 'Binary', (err, Writen) => {
        //Reset The Buffer
        files[names]['Data'] = "";
        let place = files[names]['Downloaded'] / 5e5;
        let percent = (files[names]['Downloaded'] / files[names]['Filesize']) * 100;
        socket.emit('MoreData', {'Place': place, 'Percent':  percent});
      });
    } else {
      let place = files[names]['Downloaded'] / 5e5;
      let percent = (files[names]['Downloaded'] / files[names]['FileSize']) * 100;
      socket.emit('MoreData', {'Place': place, 'Percent':  percent});
    }
  });

  //[-] {Client account}.
  // On user sign up.
  socket.on("userSignUp", (pUser) => {
    let errors = false;

    if (pUser.username.length >= 8) {
      if (!pUser.email.match(regexEmail)) {
        errors = true;
        socket.emit("showError", "Email invalide !");
      } 
    } else {
      errors = true;
      socket.emit("showError", "le pseudo a moins 8 caractere");
    }

    if (!errors) {
      if (userExist(pUser.username)) {
        socket.emit("showError", "pseudo déjà utilisé");
      } else {
        createUser(pUser);
        socket.emit("action", {actionType: "redirect", href: "connexion.html"});
      }
    }
  });

  // On user sign in.
  socket.on("userSignIn", (pUser) => {
   if (userExist(pUser.username)) {
        let requestedUserData = getUserData(pUser.username);
        if (pUser.password == requestedUserData.password) {
          let newUserToken = patternToBase16("xxxxx-xxxxx-xxxxx", "x");
          connectedUsers[pUser.username] = {socket: socket.id, authToken: newUserToken};
          usernameFromSocket[socket.id] = pUser.username;
          
          socket.emit("action", {actionType: "storeSessionVariable", key: "authToken", value: newUserToken});  
          socket.emit("action", {actionType: "storeSessionVariable", key: "username", value: pUser.username});  
          socket.emit("action", {actionType: "redirect", href: "index.html"});  
        } else {
          socket.emit("showError", "mot de passe ou nom utilisateur incorrect");
        } 
      } else {
        socket.emit("showError", "mot de passe ou nom utilisateur incorrect");
      }
  });

  // On user sign in through tokenAuth.
  socket.on("tokenAuth", (pData) => {
    if (connectedUsers[pData.username]) {
      if (pData.token == connectedUsers[pData.username].authToken) {
        usernameFromSocket[socket.id] = pData.username;
        socket.emit("dirFiles", listDirFiles(usernameFromSocket[socket.id]));

        fs.watch(`${storagePath}${usernameFromSocket[socket.id]}`, (eventType, filename) => {
          socket.emit("dirFiles", listDirFiles(usernameFromSocket[socket.id]));
        });
      } else {
        socket.emit("action", {actionType: "redirect", href: "connexion.html"});
      } 
    } else {
      socket.emit("action", {actionType: "redirect", href: "connexion.html"});
    }
  })
  socket.on("disconnect", () => {
    if (usernameFromSocket[socket.id]) {delete usernameFromSocket[socket.id];}
  });
});

server.listen(port, () => {
  console.log(`Application disponible sur http://localhost:${port}`);
});