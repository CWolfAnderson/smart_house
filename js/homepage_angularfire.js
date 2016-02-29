console.clear();
var usertalking = "";
var currentRoom;
var globalScope;

(function(){
  
  var app = angular.module('smartHouse', ['firebase']);
  
  app.controller('houseController', ['$scope', '$firebaseObject',
  function ($scope, $firebaseObject) {
    
    globalScope = $scope;
    
    var ref = new Firebase('https://smart-house.firebaseio.com/');
    
    var fridgeRef = ref.child("fridge");
    
    // download users to local object
    $scope.ref = ref;
    $scope.house = $firebaseObject(ref);
    $scope.house.$loaded().then(function() {
      
      setTimeout(function(){
        
        $('[data-toggle="popover"]').popover({html: true});
        
        $(".draggable").draggable({
          stop: function(event, ui) {
            $scope.house.users[event.target.id].posX = ui.position.left;
            $scope.house.users[event.target.id].posY = ui.position.top;
            $scope.house.$save();
          }
        });
        
        for (var key in $scope.house.users) {
          if($scope.house.users.hasOwnProperty(key)) {
            $("#"+key).css({'top': $scope.house.users[key].posY, 'left' : $scope.house.users[key].posX});
          }
        }
        
        ref.child("users").on('child_changed', function(childSnapshot, prevChildKey) {
          $("#"+childSnapshot.key()).css({'top': childSnapshot.val().posY, 'left' : childSnapshot.val().posX});
        });
        
        ref.child("users").on('child_changed', function(childSnapshot, prevChildKey) {
          $("#"+childSnapshot.key()).css({'top': childSnapshot.val().posY, 'left' : childSnapshot.val().posX});
        });
        
        // speech recognition
        if (annyang !== undefined) {
          
          console.log("Annyang activated.");
          
          var commands = {
            
            "turn :onOrOff all the lights": function(onOrOff) {
              
              if (userTalking.priority > 4) {
                if (onOrOff === "on") {
                  alert("Turning on all the lights.");
                  $.each($scope.house.rooms, function(room) {
                    $scope.house.rooms[room].light.on = true;                  
                  });
                  console.log("Turning on all the lights.");
                } else if (onOrOff === "off") {
                  alert("Turning off all the lights.");
                  $.each($scope.house.rooms, function(room) {
                    $scope.house.rooms[room].light.on = false;                  
                  });
                  
                }
                $scope.house.$save();
              } else {
                alert("You have no authoritah (must be 5)");
              }
            },
            
            "(set) (change) (make) (the) temperature (to) :deg (degrees)": function(deg) {
              
              if (userTalking.priority > 2) {
                if (parseInt(deg) > 54 && parseInt(deg) < 101) {
                  alert("Setting the temperature to " + deg + " degrees.");
                  
                  $scope.house.rooms[currentRoom.getAttribute("DBid")].thermostat.on = true;
                  $scope.house.rooms[currentRoom.getAttribute("DBid")].thermostat.temp = deg;
                  $scope.house.$save();                  
                  
                } else {
                  alert("Check your temperature range and try again.");
                }
              } else {
                alert("You have no authoritah! (must be 3 or higher)");
              }
              
            },
            
            "(set) (change) (make) (the) mode (to) :mode (mode)": function(mode) {
              
              if (userTalking.priority > 2) {
                if (mode === "study" || mode === "lock down" || mode === "party" || mode === "lockdown") {
                  alert("Setting the mode to " + mode);
                  
                  $scope.house.rooms[currentRoom.getAttribute("DBid")].mode = mode;
                  $scope.house.$save();                  
                  
                } else {
                  alert("Check your mode and try again.");
                }
              } else {
                alert("You have no authoritah! (must be 3 or higher)");
              }
              
            },
            
            "(set) (change) (make) (the) volume (to) :volume (percent)": function(volume) {
              
              if (userTalking.priority > 2) {
                if (volume >= 0 && volume < 101) {
                  alert("Setting the volume to " + volume);
                  
                  $scope.house.rooms[currentRoom.getAttribute("DBid")].music.volume = volume;
                  $scope.house.$save();                  
                  
                } else {
                  alert("Check your volume and try again.");
                }
              } else {
                alert("You have no authoritah! (must be 3 or higher)");
              }
              
            },
            
            "turn :onOrOff (the) (:room) (light) (lights)": function(onOrOff, roomName) {
              alert(usertalking);
              if (onOrOff === "on") {
                alert("Turning on the lights in the " + roomName);
              } else if (onOrOff === "off") {
                alert("Turning off the lights.");
              }
            },
            
            "(set) (change) (make) (the) light color (to) *color": function(color) {
              color = color.toLowerCase();
              
              if (userTalking.priority > 2) {
                
                if (CSS_COLOR_NAMES.indexOf(color) >= 0) {
                  alert("Setting the light color to " + color);                  
                  
                  $scope.house.rooms[currentRoom.getAttribute("DBid")].light.color = color;
                  $scope.house.$save();                  
                  
                } else {
                  alert("Check your color and try again.");
                }
              } else {
                alert("You have no authoritah! (must be 3 or higher)");
              }
            },
            
            "turn on the lights in (the) *room": function(room) {
              alert(usertalking);
              alert("Turning on the lights in the " + room);
            },
            
            "turn on the lights": function() {
              // TODO: track what room the use is in and turn the lights on
              alert(usertalking);
              alert("Turning on the lights in your room.");
            },
            
            // special case for living room
            "turn on (the) living room lights": function() {
              alert(usertalking);
              alert("Turning on the living room lights");
            },
            
            "play *artistOrSong": function(artistOrSong) {
              if (artistOrSong === "Nickelback") {alert("How about no...");} else {
                alert("Playing " + artistOrSong);
              }
            },
            
            "order :number :units of *item": function(number, units, item) {
              alert("Ordering " + number + " " + units + " of " + item);
              
              fridgeRef.push().set(
                {name: item, quantity: number, units: units}
              );
              
            }
            
          };
          
          // Add our commands to annyang
          annyang.addCommands(commands);
          
          // To print what annyang hears
          annyang.debug();
          
          $(".room").droppable({
            
            drop: function(event, ui) {
              // to getstatus of person after drop
              console.log(ui.draggable[0].getAttribute("status"));
              
              if (ui.draggable[0].getAttribute("status") === "unknown") {
                alert("Intruder alert! Interuder alert!");
                
                alarmInterval = setInterval(flashColor, 500);
                
                $("body").append("<button onclick=stopAlarm()>Coast Clear</button>");
              }
              
              function flashColor() {
                
                if ($(".room").css("backgroundColor") !== "rgb(213, 20, 20)") {
                  $(".room").css("backgroundColor", "rgb(213, 20, 20)"); // red
                  $(".room").removeClass("lightsoff");
                  $(".room").addClass("lightson");
                } else if ($(".room").css("backgroundColor") === "rgb(255, 255, 255)") {
                  $(".room").css("backgroundColor", "rgb(255, 255, 255)"); // white
                  $(".room").removeClass("lightson");
                  $(".room").addClass("lightsoff");
                } else {
                  $(".room").css("backgroundColor", "#f6f4f4");
                }
                
                console.log($(".room").css("backgroundColor"));
              }
              
              function stopTextColor() {
                clearInterval(nIntervId);
              }
              
              if(event.target.getAttribute("occupants") !== null && event.target.getAttribute("occupants").indexOf($(ui.draggable)[0].getAttribute("id"))) {
                event.target.setAttribute("occupants", $.trim(event.target.getAttribute("occupants") + " " + $(ui.draggable)[0].getAttribute("id")));
                $scope.house.rooms[event.target.getAttribute("DBid")].occupants = event.target.getAttribute("occupants");
                $scope.house.rooms[event.target.getAttribute("DBid")].light.on = true;
                $scope.house.$save();
              }
              else {
                event.target.setAttribute("occupants", $.trim($(ui.draggable)[0].getAttribute("id")));
                $scope.house.rooms[event.target.getAttribute("DBid")].occupants = event.target.getAttribute("occupants");
                $scope.house.rooms[event.target.getAttribute("DBid")].light.on = true;
                $scope.house.$save();
              }              //event.target.style.backgroundColor = "yellow";
              console.log(event.target.getAttribute("occupants"));
            },
            out: function(event, ui) {
              var name = $(ui.draggable)[0].getAttribute("id");
              var index = event.target.getAttribute("occupants").indexOf(name);
              var occupants = event.target.getAttribute("occupants");
              occupants = occupants.slice(0,index) + occupants.slice(index+name.length);
              event.target.setAttribute("occupants", $.trim(occupants));
              $scope.house.rooms[event.target.getAttribute("DBid")].occupants = event.target.getAttribute("occupants");
              // check if there is still an occupant
              if(occupants === '') {
                console.log(event.target.id + " is empty. Turning off lights.");
                $scope.house.rooms[event.target.getAttribute("DBid")].light.on = false;
              }
              $scope.house.$save();
              console.log(event.target.getAttribute("occupants"));
            }
          });
        }
        
      }, 0);
    });
    
    var roomAlert = customAlert();
    $scope.roomClick = function(room) {
      // console.log("room: " + room);
      clickedRoom = room;
      // set values:
      // database: room.mode, room.light.on, room.light.color, room.temp, room.music.on, room.music.source, room.music.volume
      // ids: mode, light, light-color, temp-slider, music-on, music-source, volume
      $("[name=mode]").val(room.mode);
      
      $("#lightswitch").prop("checked", room.light.on);
      
      $("#light-color").val(room.light.color);
      
      if (room.thermostat.on) {
        $("#temperature").text(room.thermostat.temp);
        $("#temp-slider").val(room.thermostat.temp);
      } else {
        $("#temperature").text("");
        $("#temp-slider").val(80);
      }
      $("#thermostatswitch").prop("checked", room.thermostat.on);
      
      $("#musicswitch").prop("checked", room.music.on);
      if (room.music.on) {
        $("#volume").text(room.music.volume);
        $("#volume-slider").val(room.music.volume);
      } else {
        $("#volume").text(0);
      }
      $("#source").val(room.music.source);
      roomAlert.render(room);
    };
    
    function customAlert() {
      return {
        render: function(room){
          var winW = window.innerWidth;
          var winH = window.innerHeight;
          var dialogoverlay = document.getElementById('dialogoverlay');
          var dialogbox = document.getElementById('dialogbox');
          dialogoverlay.style.display = "block";
          dialogoverlay.style.height = winH+"px";
          dialogbox.style.left = (winW/2) - (550 * 0.5)+"px";
          dialogbox.style.top = "100px";
          dialogbox.style.display = "block";
          document.getElementById('dialogboxhead').innerHTML = room.name;
          // document.getElementById('dialogboxbody').innerHTML = dialog;
          // set mode, light, temperature
          
          document.getElementById('dialogboxfoot').innerHTML = '<button onclick="cancelAlert()">Cancel</button> <button onclick="dismissAlert()">OK</button>';
          
          currentRoom = room;
        }
      };
    } // end customAlert
    
    $scope.userClick = function(user, guid) {
      userTalking = user;
      userLocation(guid);
      // localStorage.userTalking = $(this).attr("name");
      // localStorage.userRoom = userLocation(this.id);  
      
      console.log("Starting Annyang");
      annyang.start();
      
      setTimeout(function() {
        console.log("Pausing annyang");
        annyang.abort();
      }, 6000);
    };
    
    function userLocation(guid) {
      // console.log("guid: " + guid);
      $(".room").each(function(num, room) {
        // console.log("ADAM: " + room.getAttribute("occupants").indexOf(guid));
        if(room.getAttribute("occupants").indexOf(guid) >= 0) {
          console.log("Setting current room: ");
          console.log(room);
          console.log("----------------------");
          currentRoom = room;
        }
      });
    }
    
    $scope.updateTemperature = function(val) {
      document.getElementById('temperature').textContent = val;
    };
    
  }]);
  
})();

var alarmInterval;

function updateTemperature(val) {
  document.getElementById('temperature').textContent = val;
}

function updateVolume(val) {
  document.getElementById('volume').textContent = val;
}

var dismissAlert = function() {
  
  // update firebase
  console.log("From dismissAlert:");
  
  console.log(currentRoom);
  
  currentRoom.mode = $("[name=mode]").val();
  
  currentRoom.light.on = $("#lightswitch").prop("checked");
  
  currentRoom.light.color = $("#light-color").val();
  
  currentRoom.thermostat.on = $("#thermostatswitch").prop("checked");
  if (currentRoom.thermostat.on) {
    
    currentRoom.thermostat.temp = $("#temp-slider").val();
  }
  
  currentRoom.music.on = $("#musicswitch").prop("checked");
  if (currentRoom.music.on) {
    currentRoom.music.volume = $("#volume-slider").val();
  }
  currentRoom.music.source = $("#source").val();
  globalScope.house.$save();
  document.getElementById('dialogbox').style.display = "none";
  document.getElementById('dialogoverlay').style.display = "none";
};

var cancelAlert = function() {
  document.getElementById('dialogbox').style.display = "none";
  document.getElementById('dialogoverlay').style.display = "none";
};

function stopAlarm() {
  clearInterval(alarmInterval);
  location.reload();
}

var CSS_COLOR_NAMES = ["alice blue", "antique white", "aqua", "aquamarine", "azure", "beige", "bisque", "black", "blanched almond", "blue", "blue violet", "brown", "burlyWood", "cadet blue", "chartreuse", "chocolate", "coral", "cornflower blue", "cornsilk", "crimson", "cyan", "dark blue", "dark cyan", "dark golden rod", "dark gray", "dark grey", "dark green", "dark khaki", "dark magenta", "dark olive green", "dark orange", "dark orchid", "dark red", "dark salmon", "dark sea green", "dark slate blue", "dark slate gray", "dark slate grey", "dark turquoise", "dark violet", "deep pink", "deep sky blue", "dim gray", "dim grey", "dodger blue", "fire brick", "floral white", "forest green", "fuchsia", "gainsboro", "ghost white", "gold", "golden rod", "goldenrod", "gray", "grey", "green", "green yellow", "honey dew", "honeydew", "hot pink", "hotpink", "indian red", "indigo", "ivory", "khaki", "lavender", "lavender blush", "lawn green", "lemon chiffon", "light blue", "light coral", "light cyan", "light golden rod yellow", "light gray", "light grey", "light green", "light pink", "light salmon", "light sea green", "light sky blue", "light slate gray", "light slate grey", "light steel blue", "light yellow", "lime", "lime green", "linen", "magenta", "maroon", "medium aqua marine", "medium blue", "medium orchid", "medium purple", "medium sea green", "medium slate blue", "medium spring green", "medium turquoise", "medium violet red", "midnight blue", "mint cream", "misty rose", "moccasin", "navajo white", "navy", "old lace", "olive", "olive drab", "orange", "orange red", "orchid", "pale golden rod", "pale green", "pale turquoise", "pale violet red", "papaya whip", "peach puff", "peru", "pink", "plum", "powder blue", "purple", "red", "rosy brown", "royal blue", "saddle brown", "salmon", "sandy brown", "sea green", "sea shell", "sienna", "silver", "sky blue", "slate blue", "slate gray", "slate grey", "snow", "spring green", "steel blue", "tan", "teal", "thistle", "tomato", "turquoise", "violet", "wheat", "white", "white smoke", "yellow", "yellow green"];
