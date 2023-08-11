/* eslint-disable no-console */
// Gerar uma lista limpa de lojas vtex
// @use yarn script parserVTexStores.js

import "@babel/polyfill/noConflict";

import fs from "fs";
import path from "path";
import axios from "axios";

import { $, plugins } from "@dekproject/scope"; 
const List = fs.readFileSync(path.resolve("../data/vtex-stores.txt"));

class ParserVTexStore{
    constructor() {
        this.import();        
    }

    async import(){
        let links = List.toString().split("\n");
        let XMLGS = false, XMLZoom = false, XMLLomadee = false, XMLBuscape = false, XMLAwin = false;
        let stream = fs.createWriteStream(path.resolve("../data/vtex-stores-validate.txt"), { flags: "w" });

        stream.once("open", async () => {
            for(let key in links){
                links[key] = links[key].replace(/\r/, "");
            
                if(links[key].indexOf(".com.br") > -1 && (links[key].match(/\//g) || []).length == 3 && links[key][links[key].length-1] == "/"){                        
                    try{ XMLGS = await axios.head(`${links[key]}XMLData/GoogleShopping.xml`); } catch(err){ XMLGS = false; }
                    try{ XMLZoom = await axios.head(`${links[key]}XMLData/Zoom.xml`); } catch(err){ XMLZoom = false; }
                    try{ XMLLomadee = await axios.head(`${links[key]}XMLData/Lomadee.xml`); } catch(err){ XMLLomadee = false; }
                    try{ XMLBuscape = await axios.head(`${links[key]}XMLData/Buscape.xml`); } catch(err){ XMLBuscape = false; }
                    try{ XMLAwin = await axios.head(`${links[key]}XMLData/Zanox.xml`); } catch(err){ XMLAwin = false; }
                    
                    if(XMLGS || XMLZoom || XMLLomadee || XMLBuscape || XMLAwin){
                        let xml = "";

                        if(XMLGS) xml = `${links[key]}XMLData/GoogleShopping.xml`;
                        else if(XMLZoom) xml = `${links[key]}XMLData/Zoom.xml`;
                        else if(XMLLomadee) xml = `${links[key]}XMLData/Lomadee.xml`;
                        else if(XMLBuscape) xml = `${links[key]}XMLData/Buscape.xml`;
                        else if(XMLAwin) xml = `${links[key]}XMLData/Zanox.xml`;

                        stream.write(`${links[key]},${xml}\n`);
                        console.log(`[Parser VTex Stores] ${links[key]} is store | ${xml}`);

                        XMLGS = XMLZoom = XMLLomadee = XMLBuscape = XMLAwin = false;
                    }
                }   
            }

            stream.end();
        });

        stream.once("close", () => {
            console.log("[Parser VTex Stores] Finalizado");

            if(process.env.console === true || process.env.console === "true")
                process.exit(1);
        });
    }
}

export default ParserVTexStore;

(async () => {
    if(process.env.console === true || process.env.console === "true"){
        await plugins("../node_modules/@dekproject");

        $.wait(["mongoose"]).then(async () => { 
            new ParserVTexStore(); 
        }, 3000);
    }
})();
