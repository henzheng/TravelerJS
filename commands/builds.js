const Discord = require("discord.js");
const fetch = require('node-fetch');
const { GoogleSpreadsheet } = require('google-spreadsheet');
const creds = require("../traveler.json");
const reference = require("../reference.json");
const utils = require("../modules/utils");
require('dotenv').config();

class Builds{
    constructor(message, args){
        this.message = message;
        this.args = args;
        this.clientid = message.author.id;
        this.error = new Discord.MessageEmbed();
        this.reactions = ["⬅️", "➡️"];
        this.names = {"hu-tao": "Hu Tao"};
        this.currentIndex = 0;
        this.content = {};
        this.content.embeds = {};
    }
    async handleReaction(){
        const filter = (reaction, user)=> user.id == this.message.author.id && this.reactions.includes(reaction.emoji.name);
        await this.res.awaitReactions(filter, {time: 60000, errors: ["time"], max: 1}).then(async(collected)=>{
            if(collected.length == 0) return;
            const reaction = await collected.first().emoji.name
            if(reaction == "⬅️" && this.currentIndex > 0) this.currentIndex -= 1;
            else if(reaction == "➡️" && this.currentIndex + 1 < Object.keys(this.content.embeds).length) this.currentIndex += 1;
            const embed = this.content.embeds[this.currentIndex];
            embed.setFooter(`Use the reaction arrows to move between pages. \n Page ${this.currentIndex + 1} of ${Object.keys(this.content.embeds).length}`)
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
        if(this.args.length == 0){
            this.error.setColor("#F8C300");
            this.error.setTitle("Error");
            this.error.setDescription("Please specify a character!");
            await this.message.channel.send(this.error);
            return
        }
        this.character = this.args[0].toLowerCase();
        if(reference.hasOwnProperty(this.character) == false){
            this.error.setColor("#F8C300");
            this.error.setTitle("Error");
            this.error.setDescription("Couldn't find that character, maybe you typed their name wrong?");
            await this.message.channel.send(this.error);
            return
        }
        this.content.vision = reference[this.character];
        const load = new Discord.MessageEmbed();
        await load.setTitle("Loading Information...");
        await load.setColor("#F8C300");
        await load.setDescription("Please be patient.");
        await load.setThumbnail("https://i.imgur.com/NWgRRYE.png");
        this.res = await this.message.channel.send(load)
        //Connect to Google Sheet and filter for data
        const doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEET_ID);
        await doc.useServiceAccountAuth(creds);
        await doc.loadInfo();
        const data = doc.sheetsByIndex;
        const sheet = data.filter(e => e.title == this.content.vision + " ")[0];
        await sheet.setHeaderRow(["start", "name", "role", "weapon", "artifact", "main_stats", "sub_stats", "talents", "tips", "end"]);
        const sheet_row = await sheet.getRows();
        //character name on the google spreadsheet
        const sheet_name = Object.keys(this.names).includes(this.character) ? this.names[this.character] : this.character
        var row = sheet_row.findIndex(row => row.hasOwnProperty("_rawData") && row._rawData[1] == sheet_name.toUpperCase())
        const arr = []
        //Grab all content up to notes
        while(true){
            const temp = (sheet_row[row]["_rawData"][1]).toLowerCase()
            if(temp != "notes"){
                arr.push(sheet_row[row]["_rawData"]); 
                row +=1
            }else if(temp == "notes"){
                arr.push(sheet_row[row]["_rawData"]); 
                break
            }
        }
        //remove empty quotes and unused information
        for(var entry of arr) arr.splice(arr.indexOf(entry), 1, entry.filter(e => e != ""));
        arr.splice(0, 2);
        const headers = ["Weapon", "Artifact Set", "Main Stats", "Sub Stats", "Talent Priority", "Ability Tips"]
        for(var i=0; i<arr.length; i++){
            var headerIndex = 0;
            const role = arr[i].shift()
            const embed = new Discord.MessageEmbed();
            await embed.setTitle(utils.formatValue(this.character) + " " + role + " Build")
            await embed.setURL("https://docs.google.com/spreadsheets/d/1gNxZ2xab1J6o1TuNVWMeLOZ7TPOqrsf3SshP5DLvKzI");
            await embed.setThumbnail("https://api.genshin.dev/characters/" + this.character + "/icon.png");
            const color = await utils.getColor("https://api.genshin.dev/characters/" + this.character + "/portrait.png");
            embed.setColor(color);
            for(var value of arr[i]){
                if(i+1 != arr.length){
                    //conditional statement for possibility of empty field
                    if(value.length == 1) value = "N/A";
                    embed.addField(headers[headerIndex], value);
                    headerIndex += 1;
                }else{
                    // (arr[i].length != 1) ? arr[i].join("\n") : arr[i]
                    embed.setTitle(utils.formatValue(this.character) + " Notes")
                    embed.setDescription(arr[i]);
                }
            }
            this.content.embeds[i.toString()] = embed;
        }
        this.content.embeds[0].setFooter(`Use the reaction arrows to move between pages. \n Page ${this.currentIndex + 1} of ${Object.keys(this.content.embeds).length}`);
        this.res.edit(this.content.embeds[0])
        // this.res = await this.message.channel.send(this.content.embeds[0]);
        for(var emoji of this.reactions) await this.res.react(emoji);
        this.handleReaction();
    }
}
module.exports = {
    name: "builder",
    description: "fetch recommended character builds from spreadsheet",
    async execute(message, args){
        const instance = new Builds(message, args);
        await instance.run();
    }
}
