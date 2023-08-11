/* eslint-disable no-console */
// Baixa imagens de produtos por categoria da B2W
// @use yarn script importImagesCategories.js --offset=1276

import "@babel/polyfill/noConflict";

import fs from "fs";
import path from "path";
import md5 from "md5";
import minimist from "minimist";

import { $, plugins } from "@dekproject/scope";

import agents from "../utils/agents";
import KeepaliveAxios from "../utils/keepaliveAxios";

import Categories from "../models/categories";
import Product from "../models/product";

const argv = minimist(process.argv.slice(2));

class ImportImagesCategories{
    constructor() {
        this.import();    
    }

    async import(){
        let offset = argv.offset || 0;
        let categories = await Categories.find({ haschildren: false }, "ref breadcrumb name").lean(); //, { sort: { level: -1 } }       

        for(let key in categories){
            if(key >= offset){
                try{
                    let category = categories[key];
    
                    if(category.breadcrumb){
                        let pathTraining = `../data/trainingset/train/${md5(category.breadcrumb)} - ${this.raw(category.breadcrumb.replace(/>/img, "-").replace(/\//img, "-"))}/`;
                        console.log(`[Import Images Categories] Carregando imagens: ${key} - ${category.breadcrumb} - ${md5(category.breadcrumb)}`);
                        let stream = await fs.createWriteStream(`../data/titles/${this.raw(category.breadcrumb.replace(/>/img, "-").replace(/\//img, "-"))}.txt`, { flags: "w" });
    
                        let images = await Product.find({ 
                            breadcrumb: category.breadcrumb.replace(/>/img, "-"),
                            campaign : "5e6f454fcfbe5505b7e5b31c",
                            gtin: { $nin: [""] },
                            relevance: { $gt: 1 }
                        }, "image gtin title", { limit: 100, sort: { relevance: -1 }}).lean();
    
                        if(images.length > 0){
                            if(!fs.existsSync(pathTraining))
                                fs.mkdirSync(pathTraining, { recursive: true });
    
                            let promises = [];
    
                            for(let keyImage in images){
                                try{
                                    await stream.write(`${images[keyImage].title}\n`);
    
                                    promises.push(KeepaliveAxios.get(images[keyImage].image, {
                                        "User-Agent": agents[Math.floor(Math.random() * agents.length)],
                                        responseType: "stream"
                                    }).then(response => { 
                                        response.data.pipe(fs.createWriteStream(path.join(pathTraining, path.basename(images[keyImage].image).replace(/\//img, "-"))));  
                                    }));
                                }
                                catch(err){}
                            }
    
                            try{ 
                                await Promise.all(promises).catch((err) => {}); 
                            }
                            catch(err){}
                            
                            stream.end(); 
                        }                                     
                    }
                }
                catch(err){
                    console.log(err);
                }
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

export default ImportImagesCategories;

(async () => {
    if(process.env.console === true || process.env.console === "true"){
        await plugins("../node_modules/@dekproject");

        $.wait(["mongoose"]).then(async () => { 
            new ImportImagesCategories(); 
        }, 3000);
    }  
})();
