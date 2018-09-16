var express = require('express');
var router = express.Router();
var ArtikCloud = require('artikcloud-js');
// 비동기 -> 동기
// js 함수 인자로 넘길수 있다.
// 변수로도 지정할 수 있다.

// var artik = function(passport){
var fs = require('fs');
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
} catch(e) {
    console.error("File config.json not found or is invalid. " + e);
    process.exit(1);
}



router.get('/',
  function(req, res) {
    if (!req.user) {
      res.redirect('/login');
    } else {
      // res.redirect('/profile');
      res.redirect('/main');
    }
  }
);

router.get('/login', function(req, res) {
  res.render('login.html')
}
);

router.get('/logout', function(req, res){
req.logout();
res.redirect('/');
});


function isAuthenticated(req, res, next){
  if (req.hasOwnProperty("user") && req.user.hasOwnProperty("accessToken")) {
    next();
  } else {
    res.redirect("/login");
  }
}

router.get('/profile',
  isAuthenticated,
  function(req, res) {
    res.render('profile.html', { user: req.user });
  }
);

router.post('/actions',
  isAuthenticated,
  function(req, res) {
    console.log(JSON.stringify(req.body));
    var data = {
      Fan_mode:parseInt(req.body.Fan_mode)
    };
    console.log("Data: " + JSON.stringify(data));

    var _defaultClient = new ArtikCloud.ApiClient();
    console.log(JSON.stringify(_defaultClient));
    console.log("req.user.accessToken");
    console.log(req.user.accessToken);
    _defaultClient.authentications['artikcloud_oauth'].accessToken = req.user.accessToken;
    var _usersApi = new ArtikCloud.UsersApi(_defaultClient);
    var _messagesApi = new ArtikCloud.MessagesApi(_defaultClient);
  console.log("set up defaultClient");
  console.log(JSON.stringify(_defaultClient));

    console.log(req.user.id);
    _usersApi.getUserDevices(req.user.id, {}, function(error, response) {
  console.log("call getUserDevices");
      if (error) throw error;
      var devices = {};

  console.log(JSON.stringify(response));
      var sdids = "";
      for (var j = 0; j < response.count; j++) {
        var device = response.data.devices[j];
        if (device.dtid === "dt93687a03945948aeb6690753bbc4af62") {
          var ddid = device.id;
          if (config.debug) {
            console.log("Found Open Weather Map Device: " + ddid);
          }

          var actiondt =
          [
            {
              "name": "toggleFan",
              "parameters": data
            }
          ];
          console.log("\naction testing: "+action+"\n");
          var action = {
            ddid: ddid,
            type: "action",
            ts: new Date().getTime(),
            data: {
              actions: actiondt
            }
          };
          console.log("\naction json testing: "+action+"\n");

          _messagesApi.sendActions(action, function(error, response) {
            if (error) {
              console.error("Error sending action: " + JSON.stringify(error));
            } else {
              if (config.debug) {
                console.log("Sent action " + JSON.stringify(response));
              }

              // Re-direct to GET /messages
              res.redirect('/messages');
            }
          });
        }
      }
    });
  }
);

router.post('/messages',
isAuthenticated,
function(req, res) {
  console.log(JSON.stringify(req.body));
  var data = {
    steps: parseInt(req.body.steps),
    distance: parseFloat(req.body.distance)
  };
  console.log("Pedometer Data: " + JSON.stringify(data));

  var _defaultClient = new ArtikCloud.ApiClient();
  _defaultClient.authentications['artikcloud_oauth'].accessToken = req.user.accessToken;
  var _usersApi = new ArtikCloud.UsersApi(_defaultClient);
  var _messagesApi = new ArtikCloud.MessagesApi(_defaultClient);
  _usersApi.getUserDevices(req.user.id, {}, function(error, response) {
    if (error) throw error;
    var devices = {};

    var sdids = "";
    for (var j = 0; j < response.count; j++) {
      var device = response.data.devices[j];
      if (device.dtid === "dta8ad42083f33441b8677e5b36f049a4b") {
        var sdid = device.id;
        if (config.debug) {
          console.log("Found Pedometer Device: " + sdid);
        }

        var message = {
          sdid: sdid,
          type: "message",
          ts: new Date().getTime(),
          data: data
        };

        _messagesApi.sendMessage(message, function(error, response) {
          if (error) {
            console.error("Error sending messages: " + JSON.stringify(error));
          } else {
            if (config.debug) {
              console.log("Sent messages " + JSON.stringify(response));
            }

            // Re-direct to GET /messages
            res.redirect('/messages');
          }
        });
      }
    }
  });
}
);

router.get('/messages',
isAuthenticated,
function(req, res) {
  var _defaultClient = new ArtikCloud.ApiClient();
  _defaultClient.authentications['artikcloud_oauth'].accessToken = req.user.accessToken;
  if (config.debug) {
    console.log("GET /messages: " + req.user.accessToken + ", user: " + req.user.id);
  }
  var _usersApi = new ArtikCloud.UsersApi(_defaultClient);
  var _messagesApi = new ArtikCloud.MessagesApi(_defaultClient);
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

    if (config.debug) {
      console.log("Found Matching Devices: " + sdids);
      console.log("Devices " + JSON.stringify(devices));
    }
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
          message.data2 = getReadableData(message);
          message.time = new Date(message.ts).toISOString();
        }

        res.render('messages.html', { user: req.user, messages: messages});
      }
    });
  });
}
);

function getReadableData(message) {
var data = message.data;
switch (message.dt.name) {
  case "openweathermap":
    return data.name + " : <b>" + data.main.temp + " F</b>  <img src='http://openweathermap.org/img/w/" + data.weather.icon + ".png'/>";
  case "mypedometer":
    return "Travelled: <b>" + data.distance + " miles</b>, Step Count: <b>" + data.steps + "</b>";
  case "jawbone":
  case "fitbit":
  case "misfit":
    return JSON.stringify(data);
}

return JSON.stringify(data);
}

router.get('/devices',
isAuthenticated,
function(req, res) {
  var _defaultClient = new ArtikCloud.ApiClient();
  _defaultClient.authentications['artikcloud_oauth'].accessToken = req.user.accessToken;
  var _usersApi = new ArtikCloud.UsersApi(_defaultClient);
  var _devicesApi = new ArtikCloud.DevicesApi(_defaultClient);
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
      var _defaultClient = new ArtikCloud.ApiClient();
      _defaultClient.authentications['artikcloud_oauth'].accessToken = req.user.accessToken;
      if (config.debug) {
          console.log("GET /messages: " + req.user.accessToken + ", user: " + req.user.id);
      }
      var _usersApi = new ArtikCloud.UsersApi(_defaultClient);
      var _messagesApi = new ArtikCloud.MessagesApi(_defaultClient);
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

          if (config.debug) {
              console.log("Found Matching Devices: " + sdids);
              console.log("Devices " + JSON.stringify(devices));
          }
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
                      message.data2 = getReadableData(message);
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
