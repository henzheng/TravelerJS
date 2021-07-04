const fetch = require("node-fetch");
const fs = require("fs");

module.exports = {
    name: "update",
    description: "update json files and google sheets (yet to be implemented)",
    async execute(message, args){
        if(["538523256668291092", "372188000798507030"].includes(message.author.id) == false){
            await message.channel.send("You don't have permission to use this command!");
            return
        }
        const res = await fetch("https://api.genshin.dev/characters");
        if(res.ok == false){
            await message.channel.send("Error occured when fetching characters from api.");
            return
        }
        const characters = await res.json();
        const data = {};
        for(var char of characters){
            const res = await fetch("https://api.genshin.dev/characters/" + char);
            if(res.ok == false){
                await message.channel.send("Error occured when fetching specific character data from api.");
                return
            }
            const content = await res.json();
            const vision = content.vision;
            data[char] = vision;
        }
        //add newer characters that aren't in the genshin api yet
        const additions = {eula: "Cryo", kazuha: "Anemo"}
        payload = Object.assign({}, data, additions);
        fs.writeFile("reference.json", JSON.stringify(payload), async (err)=>{
            if(err) console.log(err);
            await message.channel.send("Updated content successfully.");
            console.log("reference.json was just updated.");
        })
    }
}