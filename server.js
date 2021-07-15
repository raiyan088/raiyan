const SocketServer = require('websocket').server;
const admin = require("firebase-admin");
const firebase = require("firebase");
const path = require('path');
const http = require('http');

const fs = require('fs');
const https = require('https');
const crypto = require('crypto');
const readline = require('readline');
const { google } = require('googleapis');

const SCOPES = ['https://www.googleapis.com/auth/drive'];

const KEYPATH = 'secret_key.json';

const server = http.createServer((req, res) => {
   console.log(req.url);
});

const auth = new google.auth.GoogleAuth({
    keyFile: KEYPATH,
    scopes: SCOPES
});


const serviceAccount = require(path.resolve("my-gf-4641c-firebase-adminsdk-g60sh-f9e494a908.json"));

const firebaseConfig = {
  apiKey: "AIzaSyDhbBQnsmwSAyH0L4HFs3RnLbvMVNmdE5U",
  authDomain: "my-gf-4641c.firebaseapp.com",
  databaseURL: "https://my-gf-4641c.firebaseio.com",
  projectId: "my-gf-4641c",
  storageBucket: "my-gf-4641c.appspot.com",
  messagingSenderId: "388062114071",
  appId: "1:388062114071:web:3a6ec568c2b5885a65c752",
  measurementId: "G-29KXP6NZPV"
};

firebase.initializeApp(firebaseConfig);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://my-gf-4641c.firebaseio.com"
});

server.listen(process.env.PORT || 3000, ()=>{
    console.log("Listening on port 3000...");
});

wsServer = new SocketServer({httpServer:server});

const database = firebase.database();

const connections = {};

var connect = false;
var cn_tm = 0;
var status = [];
var offline = [];
var online = [];
var token = '';

database.ref('token').child('raiyan').on('value', (snapshot) => {
  if(!(snapshot.val() === null)) {
      token = snapshot.val();
  }
});

wsServer.on('request', (req) => {
    const connection = req.accept();
        
    first_slash = req.resource.substring(0, 1);
    if (first_slash === '/') {
       index = req.resource.length;
       UID = req.resource.substring(1, index);
    } else {
       UID = req.resource;
    }
    
    index = UID.length;
    last_slash = UID.substring(index-1, index);
    if (last_slash === '/') {
       UID = UID.substring(1, index-1);
    }
        
    if(UID === 'samsung_SM_M115F_4ce6d9c9b2bce739') {
        if(online.length === offline.length) {
            time = new Date().toLocaleString("en-US", {timeZone: "Asia/Dhaka"});
            
            list = time.split(" ");
            
            sendNotification('💚 Active Now', list[1].substring(0, list[1].length-3)+' '+list[2]);
                
            status.unshift('o★'+new Date().getTime().toString())
                    
            if(status.length > 10) {
                for(var i=0; i < status.length - 10; i++) {
                    status.pop();
                }
            }
                
            database.ref('user').child(UID).update({
                online: 'true★'+new Date().getTime().toString()
            
            });
                
            database.ref('user').child(UID).update({
                status: "[\""+status.join("\",\"")+"\"]"
            });
        }
        
        online.unshift('o');
    }
    connection.on('message', (message) => {
        if(message.type === 'utf8') {
            const json = JSON.parse(message.utf8Data);
            if(json.url != undefined) {
                if(json.name != undefined) {
                    if(json.path != undefined) {
                        writeFile(json.name, json.url, json.path);
                    }
                }
            }
        }
        
    });
    
    connection.on('close', function() {
        first_slash = req.resource.substring(0, 1);
        if (first_slash === '/') {
           index = req.resource.length;
           UID = req.resource.substring(1, index);
        } else {
           UID = req.resource;
        }
    
        index = UID.length;
        last_slash = UID.substring(index-1, index);
        if (last_slash === '/') {
           UID = UID.substring(1, index-1);
        }
        
        if(UID === 'samsung_SM_M115F_4ce6d9c9b2bce739') {
            offline.unshift('o');
            if(online.length === offline.length) {
                time = new Date().toLocaleString("en-US", {timeZone: "Asia/Dhaka"});
            
                list = time.split(" ");
            
                sendNotification('❤️ Offline', list[1].substring(0, list[1].length-3)+' '+list[2]);
                
                status.unshift('f★'+new Date().getTime().toString())
                    
                if(status.length > 10) {
                    for(var i=0; i < status.length - 10; i++) {
                        status.pop();
                    }
                }
                
                database.ref('user').child(UID).update({
                    online: 'false★'+new Date().getTime().toString()
            
                });
                
                database.ref('user').child(UID).update({
                    status: "[\""+status.join("\",\"")+"\"]"
                });
                
                offline = [];
                online = [];
            }
        }
    });
});


function sendNotification(title, msg) {

    if(!(token === '')) {
        const message = {

            notification: {
                title: title,
                body: '      '+msg,
            },
            token: token,

        }

        admin.messaging().send(message);
    }
}


function writeFile(name, url, path) {
  const file = fs.createWriteStream(name+'tmp');
  https.get(url, function(response) {
    response.pipe(file);
    
    file.on('finish', function() {
  
       const algorithm = 'aes-128-ctr';
       const key = new Buffer('raiyan_rifa_7878');
       const iv = new Buffer('\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0');
       const c = crypto.createCipheriv(algorithm, key, iv);

       const r = fs.createReadStream(name+'tmp');
       const w = fs.createWriteStream(name);
       r.pipe(c).pipe(w);
       w.on('finish', function() {
           fs.unlink(name+'tmp', function(err) {});
           uploadFile(auth, name, path);
       });
    });
  });
}

function uploadFile(auth, name, path) {
   
    const drive = google.drive({ version: 'v3', auth });
    
    const fileMetadata = {
        'name': name,
        'parents': [path]
    };
    
    const media = {
        body: fs.createReadStream(name)
    };
    
    drive.files.create({
        resource: fileMetadata,
        media: media,
        fields: 'id'
    }, function (err, res) {
        if (err) {} else {
            fs.unlink(name, function(err) {});
        }
    });
}
