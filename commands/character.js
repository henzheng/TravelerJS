const Discord = require('discord.js');
const fetch = require("node-fetch");
const utils = require("../modules/utils")
const wikiapi = require('wikiapi');
const wikiparser = require("parse-wikitext");

const parser = new wikiparser();

class Character{
    constructor(message, args){
        this.message = message;
        this.args = args;
        this.clientid = message.author.id;
        this.reactions = ["⬅️", "➡️"];
        this.currentIndex =  1;
        this.character = args.shift().toLowerCase();
        this.filter = ["vision_key", "weapon_type"]
        this.url = "https://api.genshin.dev/characters/" + this.character;
    }
    async getEmbed(){
        const embed = new Discord.MessageEmbed();
        const color = await utils.getColor(this.url + "/portrait.png");
        await embed.setURL("https://genshin-impact.fandom.com/wiki/" + this.character);
        await embed.setColor(color);
        await embed.setThumbnail(this.url + "/icon.png");
        await embed.setFooter(`Use the reaction arrows to move between pages. \n Page ${this.currentIndex} of 4`)
        if(this.currentIndex <= 1){
            await embed.setTitle("Character Overview");
            await embed.addField("Name", this.content.name, true);
            await embed.addField("Vision", this.content.vision, true);
            await embed.addField("Weapon", this.content.weapon, true);
            await embed.addField("Nation", this.content.nation, true);
            await embed.addField("Affiliation", this.content.affiliation, true);
            await embed.addField("Rarity", "⭐".repeat(this.content.rarity), true);
            await embed.addField("Constellation", this.content.constellation, true);
            await embed.addField("Birthday", utils.formatValue(this.content.birthday), true);
            await embed.addField("Description", this.content.description, true);
        }
        else if(this.currentIndex == 2){
            await embed.setTitle("Character Ascension Materials");
            await embed.setDescription(utils.formatValue(this.character) + "'s special ascension stat is " + this.content.spec);
            await embed.addField("Elemental Jewel", this.content.ascension.values.ele1);
            await embed.addField("Boss Material", this.content.ascension.values.ele2);
            await embed.addField("Local Speciality", this.content.ascension.values.local);
            await embed.addField("Common Material", this.content.ascension.values.common1);
        }else if(this.currentIndex == 3){
            await embed.setTitle("Character Passives")
            for(var passive of this.content.passiveTalents) embed.addField(passive.name, passive.description, true);
        }else if(this.currentIndex >= 4){
            await embed.setTitle("Character Constellations")
            for(var constellation of this.content.constellations) embed.addField(constellation.name, constellation.description);
        }
        return embed
    }
    async handleReaction(){
        const filter = (reaction, user)=> user.id == this.message.author.id && this.reactions.includes(reaction.emoji.name);
        await this.res.awaitReactions(filter, {time: 60000, errors: ["time"], max: 1}).then(async(collected)=>{
            if(collected.length == 0) return;
            const reaction = await collected.first().emoji.name
            if(reaction == "⬅️" && this.currentIndex > 1) this.currentIndex -= 1;
            else if(reaction == "➡️" && this.currentIndex < 4) this.currentIndex += 1;
            const embed = await this.getEmbed()
            //removing user reaction for ease of access
            await this.res.reactions.resolve(reaction).users.remove(this.message.author)
            await this.res.edit(embed);
            await this.handleReaction().catch((err)=>{
                console.log(err)
                console.log("The above error is most likely due to a reaction timeout.")
            })
        })
    }
    async run(){
        //this.message is the client message, this.res is the bot response
        //fetch information from genshin api
        const req = await fetch(this.url);
        this.content = await req.json();

        //fetch information from genshin fandom wiki
        const wiki = new wikiapi("https://genshin-impact.fandom.com/api.php");
        const page = await wiki.page(this.character, {format: "json"});
        const page_text = page.wikitext;
        //additional information available in parsed object
        const parsed = parser.pageToSectionObject(page_text);
        for(var attr of ["Navigation", "References", "Availabilty"]){
            delete parsed[attr];
        }
        this.content.ascension = parser.parseInfoBox(parsed["Combat Info"].Ascensions.content);
        //accessing character special ascension stat
        this.content.spec = parser.parseInfoBox(parsed["Combat Info"]["Base Stats"].content).values.spec;
        //handle embed and reactions
        const embed = await this.getEmbed();
        this.res = await this.message.channel.send(embed);
        for(var emoji of this.reactions) await this.res.react(emoji)
        this.handleReaction()
    }
}
module.exports = {
    name: "character",
    description: "fetch character information from api",
    async execute(message, args){
        const instance = new Character(message, args)
        await instance.run()
    }
}
