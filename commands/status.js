const Discord = require('discord.js');

module.exports = {
    name: "status",
    description: "returns bot information and credits",
    async execute(message, args){
        const embed = new Discord.MessageEmbed();
        embed.setTitle("Bot Information:")
        embed.setThumbnail("https://i.imgur.com/Y6rAoZi.png");
        embed.addField("Version:", "`Alpha`");
        embed.addField("Status:", "`Online`");
        embed.addField("Developer:", "<@538523256668291092>");
        embed.setColor("#F1C40F");
        await message.channel.send(embed)
    }
}
