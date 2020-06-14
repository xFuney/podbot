// iPod Bot "BotCode"
// Funey, 2020

var BOT_DATA = [
    {
        "version": "1.2",
        "state": "release"
    }
]

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
