/* eslint-disable no-console */
// Baixa imagens na Google Image de produtos por categoria da B2W 
// @use yarn script importImagesCategoriesGI.js

import "@babel/polyfill/noConflict";

import fs from "fs";
import path from "path";
import axios from "axios";
import md5 from "md5";
import minimist from "minimist";

import { google } from "googleapis";
const customSearch = google.customsearch("v1");

import { $, plugins } from "@dekproject/scope";

import agents from "../utils/agents";
import KeepaliveAxios from "../utils/keepaliveAxios";

import Categories from "../models/categories";
import Product from "../models/product";

const argv = minimist(process.argv.slice(2));

class ImportImagesCategoriesGoogleImage{
    constructor() {
        this.import();    
    }

    async import(){

        let categories = await Categories.find({ haschildren: false }, "ref breadcrumb name").lean(); //, { sort: { level: -1 } }       

        for(let key in categories){
            try{
                let category = categories[key];

                if(category.breadcrumb){
                    let pathTraining = `../data/trainingset/train/${md5(category.breadcrumb)} - ${this.raw(category.breadcrumb.replace(/>/img, "-").replace(/\//img, "-"))}/`;
                    console.log(`[Import Images Categories] Carregando imagens: ${key} - ${category.breadcrumb} - ${md5(category.breadcrumb)}`);

                    /*let productList = await Product.find({
                        campaign : "5e6f454fcfbe5505b7e5b31c",
                        breadcrumb: category.breadcrumb.replace(/>/img, "-"),
                        title: new RegExp(`^${category.name}`)
                    }, "image gtin title ref").limit(200).lean();

                    if(productList.length <= 0){
                        productList = await Product.find({
                            campaign : "5e6f454fcfbe5505b7e5b31c",
                            breadcrumb: category.breadcrumb.replace(/>/img, "-")
                        }, "image gtin title ref").limit(200).lean();
                    }*/

                    if(!fs.existsSync(pathTraining))
                        fs.mkdirSync(pathTraining, { recursive: true });

                    let imageList = await customSearch.cse.list({
                        auth: process.env.GOOGLE_IMAGE_KEY,
                        cx: process.env.GOOGLE_IMAGE_CX,
                        q: category.breadcrumb,
                        num: 10,
                        searchType: "image",
                        imgSize: "medium"
                    });

                    let images = imageList.data.items.map((item) => { return item.link; });

                    for(let keyImage in images){
                        try{
                            await KeepaliveAxios.get(images[keyImage], {
                                "User-Agent": agents[Math.floor(Math.random() * agents.length)],
                                responseType: "stream"
                            }).then(response => { 
                                response.data.pipe(fs.createWriteStream(path.join(pathTraining, path.basename(images[keyImage]))));  
                            });
                        }
                        catch(err){}
                    }
                }
            }
            catch(err){
                console.log(err);
            }
        }

        if(process.env.console === true || process.env.console === "true")
            process.exit(1);

        console.log("[Import Images Categories] Finalizado");
    }

    raw(name) {
        var chars = ["aaaaceeiooouu", "àáâãçéêíóôõúü"].map((char) => {
            return char += char.toUpperCase();
        });

        if (typeof name === "string") {
            return name.toLowerCase().replace(/./g, (char) => {
                if (chars[1].includes(char))
                    return chars[0][chars[1].search(char)];
                else
                    return char;
            });
        }
        else {
            return name;
        }
    }
}

export default ImportImagesCategoriesGoogleImage;

(async () => {
    if(process.env.console === true || process.env.console === "true"){
        await plugins("../node_modules/@dekproject");

        $.wait(["mongoose"]).then(async () => { 
            new ImportImagesCategoriesGoogleImage(); 
        }, 3000);
    }  
})();
