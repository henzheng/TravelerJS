const Vibrant = require('node-vibrant')

async function getColor(url){
    try{
        const result = await Vibrant.from(url).getPalette()
        const rgb = await result.Vibrant._rgb;
        const color = await rgbToHex(rgb[0], rgb[1], rgb[2]);
        return color;
    }catch(err){
        console.log("Error occurred when extracting color from url.");
        return "#0099E1"
    }
}
function mapAttr(seperator, data){
    var temp = data;
    if(Object.keys(temp).length == 0) return [];
    const attr_list = Object.keys(temp).slice(0, seperator);
    var mapDict = {};
    for(var attr of attr_list){
        mapDict[attr] = temp[attr];
        delete temp[attr];
    }
    const arr = []
    arr.push(mapDict)
    return arr.concat(mapAttr(seperator, temp))
}
function formatValue(value){
    if(typeof(value) == "number") return value;
    else if(value[0] == "0"){
        const temp = value.slice(5);
        const arr = temp.split("-");
        arr.splice(2);
        var formatted = [];
        for(var number of arr){
            if(number.charAt(0) == "0") number = number[1];
            formatted.push(number)
        }
        return formatted.join("/")
    }
    const valueCapitalized = value.charAt(0).toUpperCase() + value.slice(1).toLowerCase()
    return valueCapitalized
}

function componentToHex(c) {
    let hex = c.toString(16);
    return hex.length == 1 ? "0" + hex : hex;
}

function rgbToHex(r, g, b) {
    return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
}
async function sleep(time){
    await new Promise(resolve => setTimeout(resolve, time));
}
module.exports = {formatValue, getColor, mapAttr, sleep}
