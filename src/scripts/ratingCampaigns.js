/* eslint-disable no-console */
// Verifica ranking e reclamações de cada campanha
// @use yarn script ratingCampaigns.js

import "@babel/polyfill/noConflict";

import fs from "fs";
import path from "path";
import cheerio from "cheerio";

import { $, plugins } from "@dekproject/scope";

import agents from "../utils/agents";
import KeepaliveAxios from "../utils/keepaliveAxios";

import Campaign from "../models/campaign";

class RatingCampaigns{
    constructor() {
        this.import();        
    }

    async import(){
        let campaigns = await Campaign.find({}, "name domain").sort({ name: 1 }).lean();

        for(let key in campaigns){
            try{
                console.log(`[${key}/${campaigns.length}][ Rating Campaigns ] ${campaigns[key].name} - ${campaigns[key].domain}`);

                let updateData = {};

                //Reclame aqui
                console.log(`[${key}/${campaigns.length}][ Rating Campaigns ] https://iosearch.reclameaqui.com.br/raichu-io-site-search-v1/companies/search/${encodeURIComponent(campaigns[key].name)}`);

                try{
                    let resReclameAqui = await KeepaliveAxios.get(`https://iosearch.reclameaqui.com.br/raichu-io-site-search-v1/companies/search/${encodeURIComponent(campaigns[key].name)}`, {
                        "User-Agent": agents[Math.floor(Math.random() * agents.length)]
                    });

                    if(resReclameAqui.data){
                        updateData.rascore = parseFloat(resReclameAqui.data.companies[0].finalScore);

                        if(isNaN(updateData.rascore))
                            updateData.rascore = 0;

                        updateData.rasolvedperc = parseFloat(resReclameAqui.data.companies[0].solvedPercentual);

                        if(isNaN(updateData.rasolvedperc))
                            updateData.rasolvedperc = 0;

                        updateData.rastatus = resReclameAqui.data.companies[0].status;
                    }
                }
                catch(err){}

                //Compre e confie
                console.log(`[${key}/${campaigns.length}][ Rating Campaigns ] https://apis.compreconfie.com.br/seller/seller/seller_participats?pageNumber=1&selleNickName=${encodeURIComponent(campaigns[key].name)}`);
                
                try{
                    let resCompreeConfie = await KeepaliveAxios.get(`https://apis.compreconfie.com.br/seller/seller/seller_participats?pageNumber=1&selleNickName=${encodeURIComponent(campaigns[key].name)}`, {
                        "User-Agent": agents[Math.floor(Math.random() * agents.length)]
                    });

                    if(resCompreeConfie.data){
                        if(resCompreeConfie.data.data[0].ecommerce_url.indexOf(campaigns[key].domain) > -1){
                            updateData.ceclevel = resCompreeConfie.data.data[0].level_id;
                            updateData.cecstar = resCompreeConfie.data.data[0].star;
                        }
                    }
                }
                catch(err){}

                //Ebit
                console.log(`[${key}/${campaigns.length}][ Rating Campaigns ] https://www.ebit.com.br/reputacao-de-lojas?s=${encodeURIComponent(campaigns[key].name)}`);

                try{
                    let resEbit = await KeepaliveAxios.get(`https://www.ebit.com.br/reputacao-de-lojas?s=${encodeURIComponent(campaigns[key].name)}`, {
                        "User-Agent": agents[Math.floor(Math.random() * agents.length)]
                    });

                    if(resEbit.data){
                        let $ = cheerio.load(resEbit.data);
                        let buffer = $("#JSONCompanyReputation").attr("value");
                        let dataEbit = JSON.parse(buffer);
                        
                        if(dataEbit.Data[0].StoreUrl.indexOf(campaigns[key].domain) > -1){
                            updateData.ebit = dataEbit.Data[0].Medal;
                            updateData.ebitdeliverytime = dataEbit.Data[0].DeliveryTime;
                            updateData.ebitreturnpurchase = dataEbit.Data[0].ReturnPurchase;
                        }
                    }
                }
                catch(err){ }

                try{                    
                    await Campaign.updateOne({ _id: campaigns[key]._id }, { $set: updateData });
                }
                catch(err){ console.log(err); }
            }
            catch(err){
                console.log(err);
            }
        }

        if(process.env.console === true || process.env.console === "true")
            process.exit(1);
    }
}

export default RatingCampaigns;

(async () => {
    if(process.env.console === true || process.env.console === "true"){
        await plugins("../node_modules/@dekproject");

        $.wait(["mongoose"]).then(async () => { 
            new RatingCampaigns(); 
        }, 3000);
    }
})();
