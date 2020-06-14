// iPod Bot Loader System
// Funey, 2020.

// Basic initialisation is handled here, then we hand off to an evaluated file.

// START //

// Set global state of program.

var SYS_PROG_STATE = 0; // 0 means bot load, 1 means handoff to bot program.
var SYS_VERBOSE = 1; // 0 means not verbose, 1 means verbose.
var SYS_START_UTC = Math.floor(new Date() / 1000)

var CMD_DATA = [
    {
        "version": "1.3",
        "state": "release"
    }
]

var BOT_DATA = [
    {
        "version": "1.3",
        "state": "release"
    }
]

// Initialise libraries that will help with file management and bot loading.
const fs = require('fs');

// Create log.

fs.open('logs/bot-log-' + SYS_START_UTC + '.txt' , 'w', function (err, file) {
    if (err) throw err;
    //console.log('Saved!');
});

// Initialise verbose logging.
function SYS_FN_LOG(logText) {
    if (SYS_VERBOSE == 1) {
        // Verbose.
        if (SYS_PROG_STATE != 1) {
            // Bot load
            console.log("[iPod] [BOTLOADER] " + logText);
            fs.appendFile('logs/bot-log-' + SYS_START_UTC + '.txt', '[iPod] [BOTLOADER] ' + logText + "\n", function (err) {
                if (err) throw err;
            });
        } else {
            // Handoff.
            console.log("[iPod] [BOTCODE] " + logText)
            fs.appendFile('logs/bot-log-' + SYS_START_UTC + '.txt', '[iPod] [BOTCODE] ' + logText + "\n", function (err) {
                if (err) throw err;
            });
        }
        
    }
}


SYS_FN_LOG("Bot loader has been initiated.")
//SYS_FN_LOG("Initialising libraries for file management...")

SYS_FN_LOG("Parsing configuration JSON data - verbose mode may be disabled.")
// Grab and parse the configuration JSON.
var rawdata = fs.readFileSync('bot_config.json');
const BOT_CONFIG = JSON.parse(rawdata);
//delete rawdata; // Destroys the raw data buffer, leaving the bot configuration.

SYS_VERBOSE = BOT_CONFIG.verbose
SYS_FN_LOG("If you can see this, verbose logging is enabled.")
SYS_FN_LOG("------------------------------------------------")
SYS_FN_LOG("Contents of bot configuration: ")
SYS_FN_LOG("Bot Name: " + BOT_CONFIG.botName)
SYS_FN_LOG("Bot Prefix: " + BOT_CONFIG.prefix)
SYS_FN_LOG(BOT_CONFIG.verbose ? "Verbose Mode: Enabled" : "Verbose Mode: Disabled")
SYS_FN_LOG("------------------------------------------------")
// Initialise nonsensical variables which will be used in the evaluated file.
SYS_FN_LOG("Initialising variables for use within the bot code.")
const queue = new Map(); // Not nonsensical, music queue.

// Load libraries for discord.js, ytl and youtube searching.
SYS_FN_LOG("Initialising master libraries: https (fuck sync-request), discord.js, ytdl, youtube-search-promise.")
const Discord = require('discord.js');
const client = new Discord.Client();
const ytdl = require("ytdl-core");
const https = require('https');
var search = require("youtube-search-promise");

// Embed array

///////////////////////
//      NOTE         //
// 0 is kick message //
// 1 is BAN message  //
///////////////////////

SYS_FN_LOG("Initialising array for constant embeds.")
const constantEmbeds = [
    new Discord.MessageEmbed()
	    .setColor('ff0000')
	    .setTitle("Notice of automatic punishment")
	    .setAuthor('You were kicked from {server_name} automatically.', BOT_CONFIG.botImage)
	    .setDescription("Reason for being kicked: **Spamming**\nYou may rejoin the server at any time. Another spamming infraction may result in a ban.")
	    .setTimestamp()
        .setFooter('Brought to you by ' + BOT_CONFIG.botName),

    new Discord.MessageEmbed()
	    .setColor('ff0000')
	    .setTitle("Notice of automatic punishment")
	    .setAuthor('You were banned from {server_name} automatically.', BOT_CONFIG.botImage)
	    .setDescription("Reason for being banned: **Spamming**\nYou are not allowed to rejoin and are advised to submit an appeal if you think you have done nothing wrong.")
	    .setTimestamp()
	    .setFooter('Brought to you by ' + BOT_CONFIG.botName)
      
]

// Initialise and configure anti-spam system.
SYS_FN_LOG("Initialising and configuring anti-spam system.")
const AntiSpam = require('discord-anti-spam');
const antiSpam = new AntiSpam({
    warnThreshold: 6, // Amount of messages sent in a row that will cause a warning.
    kickThreshold: 99999999, // Amount of messages sent in a row that will cause a ban.
    banThreshold: 99999999, // Amount of messages sent in a row that will cause a ban.
    maxInterval: 2000, // Amount of time (in milliseconds) in which messages are considered spam.
    warnMessage: '{@user}, Please stop spamming. **__Please note, I will not attempt to kick or ban you. I am in trial at the moment, so these features are not enabled.__**', // Message that will be sent in chat upon warning a user.
    kickMessage: constantEmbeds[0], // Message that will be sent in chat upon kicking a user.
    banMessage: constantEmbeds[1], // Message that will be sent in chat upon banning a user.
    maxDuplicatesWarning: 7, // Amount of duplicate messages that trigger a warning.
    maxDuplicatesKick: 99999999, // Amount of duplicate messages that trigger a warning.
    maxDuplicatesBan: 99999999, // Amount of duplicate messages that trigger a warning.
    exemptPermissions: [ 'ADMINISTRATOR'], // Bypass users with any of these permissions.
    ignoreBots: true, // Ignore bot messages.
    verbose: true, // Extended Logs from module.
    ignoredUsers: [], // Array of User IDs that get ignored.
    // And many more options... See the documentation.
});

// Get keys and such from environment variables.
SYS_FN_LOG("Getting YouTube key and Discord token from system environment variables.")
const KEY_YT = process.env.KEY_YT
const DISCORD_TOKEN = process.env.DISCORD_TOKEN

// Initialise tokens for YouTube Searching
SYS_FN_LOG("Parsing YouTube key as a program-readable variable.")
const opts = {
    maxResults: 3,
    key: KEY_YT,
}

// Initialise shutdown/reboot scripting.
SYS_FN_LOG("Declaring shutdown and reboot functions.")

function SYS_FN_SHUTDOWN(reason) {
    // Announce intent.
    SYS_FN_LOG(reason ? "[PWR] SYSTEM GOING DOWN FOR SHUTDOWN NOW, REASON: " + reason : "[PWR] SYSTEM GOING DOWN FOR SHUTDOWN NOW, REASON: NOT SPECIFIED")
    // Destroy the client, disconnecting it from Discord.
    client.destroy()
    SYS_FN_LOG("[NET] Client disconnected from Discord.")
    // Exit the process with success code.
    SYS_FN_LOG("[PWR] Pre-shutdown tasks complete, this program terminates here.")
    SYS_FN_LOG("================================================")
    process.exit(99);
}

function SYS_FN_REBOOT(reason) {
    // Announce intent.
    SYS_FN_LOG(reason ? "[PWR] SYSTEM GOING DOWN FOR REBOOT NOW, REASON: " + reason : "[PWR] SYSTEM GOING DOWN FOR REBOOT NOW, REASON: NOT SPECIFIED")
    // Destroy the client, disconnecting it from Discord.
    client.destroy()
    SYS_FN_LOG("[NET] Client disconnected from Discord.")
    // Exit the process with success code.
    SYS_FN_LOG("[PWR] Pre-reboot tasks complete, defining exit code and rebooting.")

    SYS_FN_LOG("================================================")
    process.exit(0);
}

// Initialise error commands for output to user.
function SYS_FN_OUTERR(state, message, errorTitle, errorDescription) {
    if (state == "queue") {
        message = message.textChannel
    } else if (state == "message") {
        message = message.channel
    }

    const exampleEmbed = new Discord.MessageEmbed()
        .setColor('ff0000')
        .setTitle(errorTitle)
        .setAuthor('Fatal Exception', BOT_CONFIG.botImage)
        .setDescription(errorDescription)
        .setTimestamp()
        .setFooter('Brought to you by ' + BOT_CONFIG.botName);

    message.send(exampleEmbed)
}

// Initialise command database in preparation for handoff.
SYS_FN_LOG("Getting command database from bot CDN and evaluating in preparation for handoff.")

// Lets initiate things for music-playing here, as it appears that the new CDN system doesn't like that.

function str_pad_left(string, pad, length) {
    // Pads a string to the left.
    return (new Array(length + 1).join(pad) + string).slice(-length);
}

async function playMusic(message, args, serverQueue, results) {
    var checkResult = true;
    var currentResult = 0;

    while (checkResult) {
        SYS_FN_LOG("[AUD] [YT] Getting video link from first result of YT search.")
        var link_result = results[currentResult].link

        // Check if its a channel
        SYS_FN_LOG("[AUD] [YT] Checking if our result is a YT channel...")
        var chanCheck = results[currentResult].link
        chanCheck = String(chanCheck).match(/(channel)/)
        console.log(chanCheck)
        if (chanCheck) {
            // it's a channel
            SYS_FN_LOG("[AUD] [YT] This result is a YouTube channel.")
            if(currentResult > 1) {
                // end it
                SYS_FN_LOG("[AUD] [YT] Out of results, mark as failure.")
                checkResult = false;
            }
            // so its a channel and we aint done, add 1
            SYS_FN_LOG("[AUD] [YT] Adding one to result and inspecting other result.")
            currentResult++
        } else {
            SYS_FN_LOG("[AUD] [YT] Found a non-channel - marking as complete.")
            checkResult = false
        }
    }

    if (chanCheck) {
        return false;
    }

    // Get the information on the video from the search.
    SYS_FN_LOG("[AUD] [YT] Getting information about the link using YTDL.")
    const songInfo = await ytdl.getInfo(link_result)

    // Get the video link from the first result of a YT search.

    const voice_channel = message.member.voice.channel;
    
    // Set voice channel.
    SYS_FN_LOG("[AUD] [INIT] Setting current voice channel, if any.")

    SYS_FN_LOG("[AUD] [INIT] Creating song table for addition to the server queueset.")
    // Initialise song table for addition to queueset.
    const song = {
        title: songInfo.title,
        url: results[currentResult].link,
        length_seconds: songInfo.length_seconds,
        requester: message.author.tag,
        description: results[currentResult].description
    }
    
    // Check for a server queue, if there isn't one - make one.
    if (!serverQueue) {
        // Make a queue construct for this server.
        SYS_FN_LOG("[AUD] [CREATE] No server queue for guild id " + message.guild.id + ", creating one now.")
        const queueConstruct = {
            textChannel: message.channel,
            voiceChannel: voice_channel,
            connection: null,
            songs: [],
            volume: 5,
            playing: true
        }
        
        // Gives the guild a queue to add/remove songs.
        queue.set(message.guild.id, queueConstruct)
        SYS_FN_LOG("[AUD] [CREATE] Server queue created for guild ID " + message.guild.id + ".")
        // Push the song table that we made to the queue.
        queueConstruct.songs.push(song);
        SYS_FN_LOG("[AUD] [ADD] Song added to queue successfully for guild ID " + message.guild.id + ".")

        try {
            SYS_FN_LOG("[AUD] [CONNECT] Attempting to join voice channel on guild ID " + message.guild.id + ".")
            var connection = await voice_channel.join()
            SYS_FN_LOG("[AUD] [CONNECT] Connection attempt successful for guild ID " + message.guild.id + ", starting music.")
            queueConstruct.connection = connection;
            play(message.guild, queueConstruct.songs[0]);
        } catch(err) {
            // Error occurred whilst making queue.
            SYS_FN_LOG("[ERROR] Failure to establish connection: " + err)
            SYS_FN_OUTERR("message", message, "Failure to establish connection to voice channel.", "Please report this error to a bot administrator:\n```" + err + "```")
            queue.delete(message.guild.id);
        }
    } else {
        serverQueue.songs.push(song);

        SYS_FN_LOG("[AUD] [OUT] Calculating length of track for text output.")
        // Get length of track.
        var time = songInfo.length_seconds
    
        // Calculate hours, minutes, seconds.
        var hours = Math.floor(time / 3600);
        time = time - hours * 3600;
        var minutes = Math.floor(time / 60);
        var seconds = time - minutes * 60;
    
        // Parse those variables into one string to send.
        var finalTime = str_pad_left(minutes,'0',2)+':'+str_pad_left(seconds,'0',2);
        
        SYS_FN_LOG("[AUD] [OUT] Creating and sending embed to appropriate channel for guild " + message.guild.id + ".")
        // Send embed to user saying that their song has been added
        var addedEmbed = new Discord.MessageEmbed()
            .setColor('#00FF00')
            .setTitle(results[currentResult].title)
            .setAuthor('Successfully added to queue', BOT_CONFIG.botImage)
            .setDescription(results[currentResult].description)
            .addFields(
                {
                    "name": "Link",
                    "value": "[" + results[0].link + "](" + results[0].link + ")",
                    "inline": false
                },
                {
                    "name": "Requested by",
                    "value": song.requester,
                    "inline": true
                },
                {
                    "name": "Length",
                    "value": finalTime,
                    "inline": true
                }
            )
            .setTimestamp()
            .setFooter('Brought to you by ' + BOT_CONFIG.botName);

        // Send this newly crafted embed to the user.
        return message.channel.send(addedEmbed);
    }
}

function play(guild, song) {
    // This function plays the song for the specific guild.
    // Get the queue for the guild we're playing for.
    SYS_FN_LOG("[AUD] [PLAY] Playing song for guild ID " + guild.id)
    SYS_FN_LOG("[AUD] [PLAY] Getting queue.")
    const serverQueue = queue.get(guild.id);

    // This statement checks if there are no songs left and that the user wants the bot to leave the call after it has finished music.
    if (!song) {
        SYS_FN_LOG("[AUD] [LEAVE] Leaving voice channel on guild " + guild.id + " and deleting queue.")
        serverQueue.voiceChannel.leave();
        queue.delete(guild.id);
        return;
    }

    // Initialise dispatcher to play music.
    SYS_FN_LOG("[AUD] [PLAY] Initialising dispatcher to play music for guild " + guild.id)
    const dispatcher = serverQueue.connection
        .play( ytdl(song.url, {
            highWaterMark: 1024 * 1024 * 10 // 10 megabytes
        }) )
        .on("finish", () => {
            // Shift the queue up one, and recurse this function.
            SYS_FN_LOG("[AUD] [PLAY] Video finished for guild " + guild.id + ", shifting song queue and playing next song (if any).")
            serverQueue.songs.shift();
            play(guild, serverQueue.songs[0]);
        })
        .on("error", (error) => {
            SYS_FN_LOG("[ERROR] [DISPATCHER] Error playing music to guild ID " + guild.id + ": " + error)
            SYS_FN_OUTERR("queue", serverQueue, "Failure to create dispatcher.", "Please report this error to a bot administrator:\n```" + error + "```")
        });
    
    SYS_FN_LOG("[AUD] [VOL] Audio volume set to " + serverQueue.volume + " for guild " + guild.id + ".")
    dispatcher.setVolumeLogarithmic(serverQueue.volume / 5);

    SYS_FN_LOG("[AUD] [OUT] Calculating length of track for text output.")
    // Get length of track.
    var time = song.length_seconds

    // Calculate hours, minutes, seconds.
    var hours = Math.floor(time / 3600);
    time = time - hours * 3600;
    var minutes = Math.floor(time / 60);
    var seconds = time - minutes * 60;

    // Parse those variables into one string to send.
    var finalTime = str_pad_left(minutes,'0',2)+':'+str_pad_left(seconds,'0',2);
    
    SYS_FN_LOG("[AUD] [OUT] Creating and sending embed to appropriate channel for guild " + guild.id + ".")
    const playingEmbed = new Discord.MessageEmbed()
	    .setColor('7289da')
	    .setTitle(song.title)
	    .setAuthor('Now Playing', BOT_CONFIG.botImage)
	    .setDescription(song.description)
	    .addFields(
            {
                "name": "Link",
                "value": "[" + song.url + "](" + song.url + ")",
                "inline": false
            },
            {
                "name": "Requested by",
                "value": song.requester,
                "inline": true
            },
            {
                "name": "Length",
                "value": finalTime,
                "inline": true
            }
	    )
	    .setTimestamp()
	    .setFooter('Brought to you by ' + BOT_CONFIG.botName);

     serverQueue.textChannel.send(playingEmbed);
}

// Manky!
SYS_FN_LOG("Loading entire command database...")
var commands = [
    {
        "command": "ping",
        "prettyName": "ping",
        "desc": "Returns a response when " + BOT_CONFIG.botName + " receives the command.",
        "callback": function (message, Arguments) {
            message.reply("This is a responce, therefore the command was received.")
        }
    },
	{
		"command": "help",
		"prettyName": "help",
		"aliases": ["h"],
		"desc": "Returns helpful information about " + BOT_CONFIG.botName,
		"callback": function(MesgElement, Args) {
		    const exampleEmbed = new Discord.MessageEmbed()
	            .setColor('7289da')
	            .setAuthor(BOT_CONFIG.botName + ' Commands', BOT_CONFIG.botImage)
                .setTimestamp()
	            .setFooter('Brought to you by ' + BOT_CONFIG.botName);

		    for (i = 1; i < commands.length; i++) {
			    exampleEmbed.addField(BOT_CONFIG.prefix + commands[i].prettyName, commands[i].desc, false)
		    }

      
			MesgElement.channel.send(exampleEmbed)
		}
    },
    {
        "command": "skip",
        "prettyName": "skip",
        "aliases": ["s"],
        "desc": "Skip a music track, you must have DJ role in order to do this.",
        "callback": async function (message, args, serverQueue) {
            if (!message.member.voice.channel) {
                const exampleEmbed = new Discord.MessageEmbed()
                    .setColor('ff0000')
                    .setTitle("Cannot skip!")
                    .setAuthor('Fatal Exception', BOT_CONFIG.botImage)
                    .setDescription("You must be in a voice channel to skip a track!")
                    .setTimestamp()
                    .setFooter('Brought to you by ' + BOT_CONFIG.botName);
                    message.channel.send(exampleEmbed)
                return false
            }

            if (!serverQueue) {
                const exampleEmbed = new Discord.MessageEmbed()
                    .setColor('ff0000')
                    .setTitle("Cannot skip!")
                    .setAuthor('Fatal Exception', BOT_CONFIG.botImage)
                    .setDescription("There is no songs to skip.")
                    .setTimestamp()
                    .setFooter('Brought to you by ' + BOT_CONFIG.botName);
                    message.channel.send(exampleEmbed)
                return false
            }

			if (message.member.roles.cache.some(role => role.name === 'DJ') || message.member.id == message.guild.ownerID ) {
				serverQueue.connection.dispatcher.end();
			} else {
		        const exampleEmbed = new Discord.MessageEmbed()
	                .setColor('ff0000')
	                .setTitle("Cannot skip!")
	                .setAuthor('Fatal Exception', BOT_CONFIG.botImage)
	                .setDescription("You don't have the DJ Role")
	                .setTimestamp()
	                .setFooter('Brought to you by ' + BOT_CONFIG.botName);
                
                    message.channel.send(exampleEmbed)
                    return false		            
            }

            // END OF SKIP //
        }
    },
    {
        "command": "disconnect",
        "prettyName": "disconnect",
        "aliases": ["leave"],
        "desc": "Disconnects the bot from the voice channel.",
        "callback": async function (message, args, serverQueue) {
            if (!message.member.voice.channel) {
                const exampleEmbed = new Discord.MessageEmbed()
                    .setColor('ff0000')
                    .setTitle("Cannot disconnect!")
                    .setAuthor('Fatal Exception', BOT_CONFIG.botImage)
                    .setDescription("You must be in a voice channel to disconnect.")
                    .setTimestamp()
                    .setFooter('Brought to you by ' + BOT_CONFIG.botName);
                    message.channel.send(exampleEmbed)
                return false
            }

            if (!serverQueue) {
                const exampleEmbed = new Discord.MessageEmbed()
                    .setColor('ff0000')
                    .setTitle("Cannot disconnect!")
                    .setAuthor('Fatal Exception', BOT_CONFIG.botImage)
                    .setDescription("I'm pretty sure I'm not connected.")
                    .setTimestamp()
                    .setFooter('Brought to you by ' + BOT_CONFIG.botName);
                    message.channel.send(exampleEmbed)
                return false
            }

            serverQueue.connection.dispatcher.end();
            var connection = await VoiceChannel.leave()
            serverQueue = [];

            // END OF DISCONNECT //
        }
    },
    {
        "command": "queue",
        "prettyName": "queue",
        "aliases": ["q"],
        "desc": "Get a list of the current queue of music to be played.",
        "callback": async function(message, args, serverQueue) {
            if (!serverQueue) {
                const exampleEmbed = new Discord.MessageEmbed()
                    .setColor('ff0000')
                    .setTitle("Cannot get queue!")
                    .setAuthor('Fatal Exception', BOT_CONFIG.botImage)
                    .setDescription("No queue currently exists for this server. Try playing something first.")
                    .setTimestamp()
                    .setFooter('Brought to you by ' + BOT_CONFIG.botName);
                    message.channel.send(exampleEmbed)
                return false
            }
            
            var i
            var songQueue = serverQueue.songs
            if (songQueue.length > 1) {
                for (i = 1; i < songQueue.length; i++) {
                    currentDesc = currentDesc + "**" + i + ".** " + "_ [" + serverQueue.songs[i].title + "](" + serverQueue.songs[i].url + "), requested by " + serverQueue.songs[i].requester + ". _\n"
                }
            } else {
                currentDesc = "_No songs in queue._"
            }

            const exampleEmbed = new Discord.MessageEmbed()
                .setColor('7289da')
                .setAuthor('Now Playing', BOT_CONFIG.botImage)
                .setDescription("_[" + serverQueue.songs[0].title + "](" + serverQueue.songs[0].url + "), requested by " + serverQueue.songs[0].requester + "._")
                .addField('**Current Queue**', currentDesc, false)
                .setTimestamp()
                .setFooter('Brought to you by ' + BOT_CONFIG.botName);
  
        
            message.channel.send(exampleEmbed)
        }
    },
    {
        "command": "np",
        "prettyName": "np",
        "aliases": ["playing"],
        "desc": "Check what is currently playing on " + BOT_CONFIG.botName + ".",
        "callback": async function(message, args, serverQueue) {
            if (!serverQueue) {
                const exampleEmbed = new Discord.MessageEmbed()
                    .setColor('ff0000')
                    .setTitle("Cannot get queue!")
                    .setAuthor('Fatal Exception', BOT_CONFIG.botImage)
                    .setDescription("No queue currently exists for this server. Try playing something first.")
                    .setTimestamp()
                    .setFooter('Brought to you by ' + BOT_CONFIG.botName);
                    message.channel.send(exampleEmbed)
                return false
            }

            var song = serverQueue.songs[0]
            var time = song.length_seconds

            var hours = Math.floor(time / 3600);
            time = time - hours * 3600;
            var minutes = Math.floor(time / 60);
            var seconds = time - minutes * 60;


            var finalTime = str_pad_left(minutes,'0',2)+':'+str_pad_left(seconds,'0',2);
            const exampleEmbed = new Discord.MessageEmbed()
	            .setColor('7289da')
	            .setTitle(song.title)
	            .setAuthor('Now Playing', BOT_CONFIG.botImage)
	            .setDescription(song.description)
	            .addFields(
                    {
                        "name": "Link",
                        "value": "[" + song.url + "](" + song.url + ")",
                        "inline": false
                    },
                    {
                        "name": "Requested by",
                        "value": song.requester,
                        "inline": true
                    },
                    {
                        "name": "Length",
                        "value": finalTime,
                        "inline": true
                    }
	            )
	            .setTimestamp()
	            .setFooter('Brought to you by ' + BOT_CONFIG.botName);

            message.channel.send(exampleEmbed)

            // END OF NOW PLAYING //
        }
    },
    {
        "command": "play",
        "prettyName": "play",
        "aliases": ["p"],
        "desc": "Play music using " + BOT_CONFIG.botName + ".",
        "callback": async function(message, args, serverQueue) {
            const voice_channel = message.member.voice.channel
            
            if (!voice_channel) {
                const exampleEmbed = new Discord.MessageEmbed()
                    .setColor('ff0000')
                    .setTitle("Cannot play!")
                    .setAuthor('Fatal Exception', BOT_CONFIG.botImage)
                    .setDescription("You must be in a voice channel in order to start playing music.")
                    .setTimestamp()
                    .setFooter('Brought to you by ' + BOT_CONFIG.botName);
                    message.channel.send(exampleEmbed)
                return false  
            }

            const permissions = voice_channel.permissionsFor(message.client.user);
            if (!permissions.has("CONNECT") || !permissions.has("SPEAK")) {
                const exampleEmbed = new Discord.MessageEmbed()
                    .setColor('ff0000')
                    .setTitle("Cannot play!")
                    .setAuthor('Fatal Exception', BOT_CONFIG.botImage)
                    .setDescription("I need the permission to join and speak in the voice channel you are currently in to play music.")
                    .setTimestamp()
                    .setFooter('Brought to you by ' + BOT_CONFIG.botName);
                    message.channel.send(exampleEmbed)
                return false  
            }

            var link = ""
            var i;
            var query = ""

            for (i = 1; i < args.length; i++) {
                query = query + args[i] + " "
            }

            search(query, opts)
                .then(results => playMusic(message,args,serverQueue,results))
                .catch(error => SYS_FN_LOG("[CMD] [PLAY] Error searching for video: " + error));

            // END OF PLAY //
        
        }
    },
    {
        "command": "dev--status",
        "prettyName": "dev--status",
        "desc": "DEVELOPER ONLY: Prints out status of bot, along with other developer things.",
        "callback": function (message, args) {
            if (message.author.id == 490609510734364692) {
                // funey
                var outputmsg = '```\n------------------------------------------------\nDEVELOPER INFORMATION\n\n((( COMMAND DATABASE )))\nVersion: ' + CMD_DATA[0].version + '\nState: ' + CMD_DATA[0].state + '\n\n((( BOTCODE )))\nVersion: ' + BOT_DATA[0].version + '\nState: ' + BOT_DATA[0].state + '\n\n------------------------------------------------```'
                message.channel.send(outputmsg)                
            }
        }
    },
    {
        "command": "dev--debug",
        "prettyName": "dev--debug,",
        "desc": "DEVELOPER ONLY: Debug commands/system setup.",
        "callback": function(message, args) {
            // whee
            if (message.author.id == 490609510734364692) {
                if (args[1] == "reload_cmd") {
                    message.channel.send(":grey_question: Reloading command database...")
                    SYS_FN_LOG("Loading command database in preparation for handoff.")
                    var SYS_BOT_CMD_DB = fs.readFileSync('new_cmd.js').toString();
                    eval(SYS_BOT_CMD_DB);

                    SYS_FN_LOG("------------------------------------------------")
                    SYS_FN_LOG("COMMAND DATABASE VERSION INFORMATION")
                    SYS_FN_LOG("Version: " + CMD_DATA[0].version);
                    SYS_FN_LOG("State: " + CMD_DATA[0].state);
                    SYS_FN_LOG("------------------------------------------------")

                    message.channel.send(":white_check_mark: Done reloading command database.")
                } else if (args[1] == "shutdown") {
                    SYS_FN_LOG("[DEV] [DEBUG] System has been called for shutdown by user " + message.author.tag + ".")
                    SYS_FN_SHUTDOWN("Forced shutdown called by user " + message.author.tag + ".")
                } else if (args[1] == "reboot") {
                    SYS_FN_LOG("[DEV] [DEBUG] System has been called for reboot by user " + message.author.tag + ".")
                    SYS_FN_REBOOT("Forced reboot called by user " + message.author.tag + ".")
                } else {
                    message.channel.send("**DEBUG STUFF** \n*reload_cmd - reload the command database*\n*shutdown - shutdown bot*\n*reboot - restart bot*\n\nAll commands must be run using ==dev--debug <arguments>.")
                }
            }
        }
    }
]
    
SYS_FN_LOG("------------------------------------------------")
SYS_FN_LOG("COMMAND DATABASE VERSION INFORMATION")
SYS_FN_LOG("Version: " + CMD_DATA[0].version);
SYS_FN_LOG("State: " + CMD_DATA[0].state);
SYS_FN_LOG("------------------------------------------------")
SYS_FN_LOG("Loading botcode direct.")

// We're now handing off, change program state to reflect.
SYS_PROG_STATE = 1;
            
// Full botcode is now included here for conciseness...

// Log that we're now in botcode.
SYS_FN_LOG("Botcode has been initialised by the botloader.")


client.on('ready', () => {
    // Intentionally logged normally as to reaffirm user that botcode has loaded.
    console.log(`[iPod] [BOTCODE] Bot has connected to Discord, and is currently logged in as ${client.user.tag}!`);
    
    SYS_FN_LOG("[NET] Bot connected to Discord, setting activity status.")
    client.user.setActivity('over the iPod Discord...', { type: 'WATCHING' });
});

client.on('message', msg => {
    // Regardless if this message is meant for us or not, run it through the antispam.
    SYS_FN_LOG("[MSG] Received message - running through antispam system.")
    antiSpam.message(msg);

    SYS_FN_LOG("[MSG] Checking if this message was meant for us.")
    // Efficiency measure, make sure command is meant for us before even bothering to look.
    if (msg.content.substring(0,BOT_CONFIG.prefix.length) == BOT_CONFIG.prefix) {
        SYS_FN_LOG("[CMD] Message was intended for us, we can start parsing now.")
        // Remove the prefix from the command to ensure we can split arguments.
        SYS_FN_LOG("[CMD] Removing prefix to ensure argument split.")
        var ParsedMessage = msg.content.substring(BOT_CONFIG.prefix.length, msg.content.length - BOT_CONFIG.prefix.length + 2)
        SYS_FN_LOG("[CMD] ParsedMessage variable is currently " + ParsedMessage)
        // Split by spacebar, as that is our argument delimiter.
        SYS_FN_LOG("[CMD] Splitting parsed message to extract arguments.")
        var Arguments = ParsedMessage.split(" ")
        console.log(Arguments)
        
        // We know that this is intended for us, so fully parse now.
        SYS_FN_LOG("[CMD] Starting full parse to run command...")
        var i;
        for (i = 0; i < commands.length; i++) {
            // This part checks for aliases
            var k;
            var CommandAlias = commands[i].aliases
            if ( CommandAlias ) {
                SYS_FN_LOG("[CMD] Command " + commands[i].prettyName + " has an alias. Check if we're using this alias here.")
                for (k = 0; k < CommandAlias.length; k++) {
                    if (CommandAlias[k] == Arguments[0]) {
                        SYS_FN_LOG("[CMD] Use of alias in command " + commands[i].prettyName + " found. Running command.")
                        commands[i].callback(msg, Arguments, queue.get(msg.guild.id))
                    }
                }
            } 
            
            if (commands[i].command == Arguments[0]) {
                SYS_FN_LOG("[CMD] Use of command " + commands[i].prettyName + " has been found. Running command.")
                commands[i].callback(msg, Arguments, queue.get(msg.guild.id))
            }
        }
    }
})

SYS_FN_LOG("Logging in to the Discord network with provided token.")
client.login(DISCORD_TOKEN)

        
SYS_FN_LOG("------------------------------------------------")
SYS_FN_LOG("BOTCODE VERSION INFORMATION")
SYS_FN_LOG("Version: " + BOT_DATA[0].version);
SYS_FN_LOG("State: " + BOT_DATA[0].state);
SYS_FN_LOG("------------------------------------------------")
