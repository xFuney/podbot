var CMD_DATA = [
    {
        "version": "1.1",
        "state": "debug"
    }
]


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
                var outputmsg = '```\n------------------------------------------------\nDEVELOPER INFORMATION\n\n((( COMMAND DATABASE )))\nVersion: ' + CMD_DATA[0].version + '\nState: ' + CMD_DATA[0].state + '\n\n((( COMMAND DATABASE )))\nVersion: ' + CMD_DATA[0].version + '\nState: ' + CMD_DATA[0].state + '\n\n------------------------------------------------```'
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
                    message.channel.send("**DEBUG STUFF** \n*reload_cmd - reload the command database*\n*shutdown - shutdown bot*")
                }
            }
        }
    }
]