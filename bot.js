// iPod Bot "BotCode"
// Funey, 2020

var BOT_DATA = [
    {
        "version": "1.1",
        "state": "debug"
    }
]

// Log that we're now in botcode.
SYS_FN_LOG("Botcode has been initialised by the botloader.")


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
        .play( ytdl(song.url) )
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

client.on('ready', () => {
    // Intentionally logged normally as to reaffirm user that botcode has loaded.
    console.log(`[iPod] [BOTCODE] Bot has connected to Discord, and is currently logged in as ${client.user.tag}!`);
    
    SYS_FN_LOG("[NET] Bot connected to Discord, setting activity status.")
    client.user.setActivity('[DEV BUILD] over the iPod Discord...', { type: 'WATCHING' });
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

