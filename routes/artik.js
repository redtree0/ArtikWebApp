var express = require('express');
var router = express.Router();
var ArtikCloud = require('artikcloud-js');
// 비동기 -> 동기
// js 함수 인자로 넘길수 있다.
// 변수로도 지정할 수 있다.

// var artik = function(passport){
var fs = require('fs');
const config = loadConfig();

function loadConfig(){
  try {
    var file = fs.readFileSync("config.json", "utf8");
    var config = JSON.parse(file);

    if (config.debug) {
      console.log(JSON.stringify(config));
    }

    var deviceTypes = config.devices;

    if (config.debug) {
      console.log(deviceTypes);
    }
    return config;

  } catch(e) {
      console.error("File config.json not found or is invalid. " + e);
      process.exit(1);
  }
}




function isAuthenticated(req, res, next){
  if (req.hasOwnProperty("user") && req.user.hasOwnProperty("accessToken")) {
    next();
  } else {
    res.redirect("/login");
  }
}

function getDefaultClient(accessToken){
  var _defaultClient = {}
  if(typeof(accessToken)==='string' ){

    _defaultClient = new ArtikCloud.ApiClient();
    _defaultClient.authentications['artikcloud_oauth'].accessToken = accessToken;

  }

  return _defaultClient;
}

function getUserApi(accessToken){
   
    var _defaultClient = getDefaultClient(accessToken);
    var _usersApi = {};
    if(_defaultClient){
      _usersApi = new ArtikCloud.UsersApi(_defaultClient);
    }
    return _usersApi;
 
}

function getMsgApi(accessToken){
   
  var _defaultClient = getDefaultClient(accessToken);
  var _messagesApi = {};
  if(_defaultClient){
    _messagesApi = new ArtikCloud.MessagesApi(_defaultClient);
  }
  return _messagesApi;

}

router.get('/timer',
  isAuthenticated,
  function(req, res) {
    res.render('timer.html', { user: req.user });
  }
);

router.post('/actions',
  isAuthenticated,
  function(req, res) {
    // console.log(JSON.stringify(req.body));

   
    const ACCESSTOKEN = req.user.accessToken;
    var _usersApi = getUserApi(ACCESSTOKEN)
    var _messagesApi = getMsgApi(ACCESSTOKEN);

    // console.log(req.user.id);
    var params = {
      Fan_mode: parseInt(req.body.Fan_mode)
    };
    _usersApi.getUserDevices(req.user.id, {}, function(error, response) {
    
      if (error) throw error;
      // var devices = {};

      // var sdids = "";
      for (var j = 0; j < response.count; j++) {
        var device = response.data.devices[j];
        var deviceKeyid = Object.keys(config.devices)
        // console.log("Test");
        // console.log(deviceKeyid);
        deviceKeyid.forEach((e)=>{

          if (device.dtid ===  e){

            var ddid = device.id;
          
            var actiondt =
            [
              {
                "name": "toggleFan",
                "parameters": params
              }
            ];

            // console.log("\naction testing: "+action+"\n");
            var action = {
              ddid: ddid,
              type: "action",
              ts: new Date().getTime(),
              data: {
                actions: actiondt
              }
            };

            // console.log("\naction json testing: "+action+"\n");
  
            _messagesApi.sendActions(action, function(error, response) {
              if (error) {
                console.error("Error sending action: " + JSON.stringify(error));
              } else {
                if (config.debug) {
                  console.log("Sent action " + JSON.stringify(response));
                }
  
                // Re-direct to GET /messages
                res.redirect('/main');
              }
            });
          }

        })
        
      }
    });
  }
);


router.get('/devices',
  isAuthenticated,
  function(req, res) {

    const ACCESSTOKEN = req.user.accessToken;
    var _usersApi = getUserApi(ACCESSTOKEN)
    var _messagesApi = getMsgApi(ACCESSTOKEN);

    _usersApi.getUserDevices(req.user.id, {}, function(error, response) {
      if (error) {
        console.error(error + ", " + JSON.stringify(error));
        //throw new Error("Couldnt Get User Devices");
      } else {
        var devices = {};
        var missingDeviceTypes = JSON.parse(JSON.stringify(deviceTypes));
        //var missingDtIds = Object.keys(deviceTypes);
        if (config.debug) {
          console.log("Initial Device Types: " + missingDeviceTypes);
        }
        for (var j = 0; j < response.count; j++) {
          var device = response.data.devices[j];
          if (device.dtid in deviceTypes) {
            // Add to list of found device
            devices[device.id] = device;
            // Remove from list of missing DeviceType IDs
            delete missingDeviceTypes[device.dtid];
          }
        }

        if (config.debug) {
          console.log("Found Devices: " + JSON.stringify(devices));
          console.log("Missing Device Types: " + JSON.stringify(missingDeviceTypes));
        }

        var dtIdsToCreate = Object.keys(missingDeviceTypes);
        async.each(dtIdsToCreate,
          function(dtIdToCreate, callback) {
            var deviceParams = {
              uid: req.user.id,
              dtid: dtIdToCreate,
              name: dtIdToCreate,
              manifestVersionPolicy: "LATEST"
            };
            if (config.debug) {
              console.log("Creating device: " + JSON.stringify(deviceParams));
            }
            _devicesApi.addDevice(deviceParams, function(error, response) {
              if (error) {
                console.error("Error creating device: " + error);
              } else {
                if (config.debug) {
                  console.log("Created device: " + response.data.id);
                  devices[response.data.id] = response.data;
                }
              }
            });
          },
          function(err) {
            // Do Once all are done
            if (err) {
              throw err;
              //console.error("Error Creating all devices: " + err);
              //res.sendStatus(400);
            } else {
              if (config.debug) {
                console.log("Devices: " + JSON.stringify(devices));
              }

              var annotatedDevices = [];
              var deviceIds = Object.keys(devices);
              for (var index = 0; index < deviceIds.length; index++) {
                var aDevice = devices[deviceIds[index]];
                aDevice.readableName = deviceTypes[aDevice.dtid].name;
                aDevice.fullName = deviceTypes[aDevice.dtid].fullName;

                annotatedDevices.push(aDevice);
              }
              res.render('devices.html', { user: req.user, devices: annotatedDevices});
            }
          }
        );
      }
    });
  }
);

router.get('/pminfo',
  isAuthenticated,
  function(req, res) {
      if (config.debug) {
          console.log("GET /messages: " + req.user.accessToken + ", user: " + req.user.id);
      }
      const ACCESSTOKEN = req.user.accessToken;
      var _usersApi = getUserApi(ACCESSTOKEN)
      var _messagesApi = getMsgApi(ACCESSTOKEN);

      _usersApi.getUserDevices(req.user.id, {}, function(error, response) {
          if (error) throw error;
          var devices = {};

          var sdids = "";
          for (var j = 0; j < response.count; j++) {
              var device = response.data.devices[j];
              if (device.dtid in deviceTypes) {
                  // Add to list of found device
                  devices[device.id] = device;
                  devices[device.id].dt = deviceTypes[device.dtid];
                  if (sdids.length > 0) {
                      sdids = sdids + ",";
                  }
                  sdids = sdids + device.id;
              }
          }

          // if (config.debug) {
          //     console.log("Found Matching Devices: " + sdids);
          //     console.log("Devices " + JSON.stringify(devices));
          // }
          var opts = {
              count: 5,
              sdids: sdids
          }
          _messagesApi.getLastNormalizedMessages(opts, function(error, response) {
              if (error) {
                  console.error("Error retrieving normalized messages: " + JSON.stringify(error));
              } else {
                  if (config.debug) {
                      console.log("Found normalized messages " + JSON.stringify(response));
                  }

                  var messages = response.data;
                  // Embellish the messages with Device Information
                  for (var index = 0; index < messages.length; index++) {
                      var message = messages[index];
                      message.dt = devices[message.sdid].dt;
                      // message.data2 = getReadableData(message);
                      message.time = new Date(message.ts).toISOString();
                  }
                  console.log("messages data");
                  console.log(JSON.stringify(messages));
                  console.log("------------");
                  res.json({ 'messages' : messages});
              }
          });
      });
  }
);

// }



// module.exports = router;
module.exports = router;
