var tmi = require("tmi.js");
var db = require("./db.js");
var config = require('./config.json');

var join = [];

db.query("SELECT username FROM channels", (error, results, fields) => {
    results.forEach(function(results){
      join.push(results['username']);
    });
});

var options = {
    options: {
        debug: true
    },
    connection: {
        reconnect: true
    },
    identity: {
        username: config.BotName,
        password: config.oauth
    },
    channels: join
};

var client = new tmi.client(options);

// Connect the client to the server..
client.connect();

client.on("chat", function (channel, userstate, message, self) {

    // Don't listen to my own messages..
    if (self) return;

    //Fetching commands from the database
    db.query("SELECT channel, commandname, value FROM commands WHERE channel = ? AND commandname = ?", [channel, message], function(error, results, fields) {
      if (results != undefined && results != 0) {
        if(message == results[0]['commandname'])
        {
          client.say(results[0]['channel'] ,results[0]['value']);
        }
      }
    });

      const args = message.slice().trim().split(/ +/g);
      const command = args.shift();

      var commandName = args[0];
      var commandValue = args.slice(1).join(" ");
      /*
      
      ALL CHANNELS HAVE ACCESS TO THESE COMMANDS

      */
      //Add's a command to the database.
      if (command == "!addcom" && channel == `#${userstate.username}` || command == "!addcom" && userstate.mod == true) {
        db.query("SELECT channel, commandname, value FROM commands WHERE channel = ? AND commandname = ?", [channel, commandName], function(error, results, fields) {
          if (results != undefined && results != 0) {
            client.say(channel, "/me >> Command "+ commandName +" already exists!");
          } else {
            db.query("INSERT INTO commands (channel, commandname, value) VALUES (?, ?, ?)", [channel, commandName, commandValue]);
            client.say(channel, "/me >> Command "+ commandName +" has been added!");
          }
        });
      }

      //Deletes a command from the database.
      if (command == "!delcom" &&  channel == `#${userstate.username}` || command == "!delcom" && userstate.mod == true) {
        db.query("SELECT channel, commandname, value FROM commands WHERE channel = ? AND commandname = ?", [channel, commandName], function(error, results, fields) {
          if (results != undefined && results != 0) {
            db.query("DELETE FROM commands WHERE channel = ? AND commandname = ?", [channel, commandName]);
            client.say(results[0]['channel'], "/me >> Command "+ commandName +" has been deleted!");
          } else {
            client.say(channel, "/me >> Command "+ commandName +" does not exist!");
          }
        });
      }
});
