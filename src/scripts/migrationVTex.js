/* eslint-disable no-console */
// Migrar lista de lojas
// @use yarn script migrationVTex.js

import "@babel/polyfill/noConflict";

import fs from "fs";
import path from "path";
import axios from "axios";
import url from "url";

import { $, plugins } from "@dekproject/scope"; 
const Stores = fs.readFileSync(path.resolve("../data/vtex-stores-ok.csv"));

import Campaign from "../models/campaign";
import Feeds from "../models/feeds";

class MigrationVTex{
    constructor() {
        this.import();        
    }

    async import(){
        let store = Stores.toString().split("\n");

        for(let key in store){     
            try{
                let [ name, urlRoot, xml ] = store[key].split(",");
                let domain = url.parse(urlRoot).hostname.replace("www.", "");
                let campaign = await Campaign.findOne({ domain });

                //Cadastrar loja na impulsor
                if(!campaign){
                    await new Campaign({
                        name,
                        domain
                    }).save();

                    campaign = await Campaign.findOne({ domain });
                }
                
                //Recuperar ID do vigia
                let vigiaInfos = await axios.post("https://api.vigiadepreco.com.br/public/integrations/campaings?token=qvcGyi2g4HLPEkjPYXqAn7SQK53DxzoA", {
                    "vtex": true,
                    "name": name,
                    "link": urlRoot
                });

                console.log(`[${key}/${store.length}]`, urlRoot, campaign._id, vigiaInfos.data.data.ref.toString());

                //console.log(vigiaInfos.data.data.ref);
                let feed = await Feeds.findOne({ campaign: campaign._id, auto: true });

                if(!feed){
                    try{
                        await new Feeds({
                            campaign: campaign._id,
                            url: xml,
                            format: "googleshopping",
                            enabled: false,
                            vigiaenabled: true,
                            schedule: "hourly",
                            vigiaid: vigiaInfos.data.data.ref.toString(),
                            label: "Feed direto",
                            linktype: "direct",
                            rootfield: "item",
                            auto: true,
                            nextactivation: new Date(),
                            lastactivation: new Date()
                        }).save();
                    }
                    catch(err){
                        console.log(err);
                    }
                } 
            }   
            catch(err){ console.log(err); }  
        }

        if(process.env.console === true || process.env.console === "true")
            process.exit(1);
    }
}

export default MigrationVTex;

(async () => {
    if(process.env.console === true || process.env.console === "true"){
        await plugins("../node_modules/@dekproject");

        $.wait(["mongoose"]).then(async () => { 
            new MigrationVTex(); 
        }, 3000);
    }
})();
