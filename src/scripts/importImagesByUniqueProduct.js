/* eslint-disable no-console */
// Baixa imagens de produtos unico por GTIN
// @use yarn script importImagesByUniqueProduct.js --offset=501

import "@babel/polyfill/noConflict";

import fs from "fs";
import path from "path";
import md5 from "md5";
import minimist from "minimist";
import fg from "fast-glob";
import crypto from "crypto";

import { $, plugins } from "@dekproject/scope";

import agents from "../utils/agents";
import KeepaliveAxios from "../utils/keepaliveAxios";

import Categories from "../models/categories";
import Product from "../models/product";

const argv = minimist(process.argv.slice(2));

class ImportImagesUniqueProduct{
    constructor() {
        this.import();    
    }

    __weightsTitle(products){
        let baseTitles = [];
        let weightsTitle = {};
        let weightsTitleArr = [];

        for(let key in products)
            baseTitles.push(products[key].title.split(" ")[0]);

        for(let key in baseTitles){
            if(!weightsTitle[baseTitles[key]])
                weightsTitle[baseTitles[key]] = 0;

            weightsTitle[baseTitles[key]]++;
        }

        for(let key in weightsTitle)
            weightsTitleArr.push([key, weightsTitle[key]]);

        weightsTitleArr.sort((item1, item2) => item1[1] - item2[1]);
        weightsTitleArr.reverse(); 
        return weightsTitleArr.filter((item) => item[1] >= 5);
    }

    async import(){
        let offset = argv.offset || 0;

        let categories = await Categories.find({ 
            //breadcrumb: "Celulares e Smartphones > Smartphone > Samsung Galaxy > Galaxy S > Galaxy S10",
            haschildren: false 
        }, "ref breadcrumb").lean(); //, { sort: { level: -1 } }       

        for(let keyCategory in categories){
            if(keyCategory >= offset){
                console.log(`[Import Images By Unique Product] Carregando imagens: ${keyCategory} - ${categories[keyCategory].breadcrumb} - ${md5(categories[keyCategory].breadcrumb)}`);

                let products = await Product.find({ 
                    campaign: "5e6f454fcfbe5505b7e5b31c",
                    breadcrumb: categories[keyCategory].breadcrumb.replace(/>/img, "-").replace(/\//img, "-"),
                    gtin: { $nin: [""] }
                }, "ref gtin breadcrumb title", { limit: 100, sort: { relevance: -1 } }).lean();   

                let weights = this.__weightsTitle(products);
                let weightsIn = weights.map((item) => item[0]);
                                                
                for(let key in products){
                    try{
                        let breadcrumb = products[key].breadcrumb;
                        let pathTraining = `../data/trainingset/train/${md5(breadcrumb)} - ${this.raw(breadcrumb.replace(/>/img, "-").replace(/\//img, "-"))}/`;
                        
                        let files = await fg(`${pathTraining}/*`, { onlyFiles: true });

                        if(files.length >= 99)
                            break;

                        if(weightsIn.includes(products[key].title.split(" ")[0]) || products.length < 10){
                            //console.log(`[Import Images By Unique Product] Carregando imagens: ${products[key].title}`);
                            //let stream = await fs.createWriteStream(`../data/titles/${this.raw(breadcrumb.replace(/>/img, "-").replace(/\//img, "-"))}.txt`, { flags: "w" });
            
                            let images = await Product.find({ 
                                gtin: products[key].gtin
                            }, "image title", { limit: 10 }).lean();
            
                            if(images.length > 0){
                                if(!fs.existsSync(pathTraining))
                                    fs.mkdirSync(pathTraining, { recursive: true });
            
                                let promises = [];
            
                                for(let keyImage in images){
                                    if(weightsIn.includes(images[keyImage].title.split(" ")[0]) || products.length < 10){
                                        try{
                                            //await stream.write(`${images[keyImage].title}\n`);
                
                                            promises.push(KeepaliveAxios.get(images[keyImage].image, {
                                                "User-Agent": agents[Math.floor(Math.random() * agents.length)],
                                                responseType: "stream"
                                            }).then(async response => { 
                                                await response.data.pipe(fs.createWriteStream(path.join(pathTraining, `${new Date().getTime()}.tmp`)));  
                                            }));
                                        }
                                        catch(err){}
                                    }
                                }
            
                                try{ 
                                    await Promise.all(promises).then(async () => {
                                        let files = await fg(`${pathTraining}*.tmp`, { onlyFiles: true });
                                    
                                        //Convertendo arquivos temporario 
                                        for(let key in files){
                                            (async (filename) => {
                                                let tmpHash = fs.ReadStream(filename);
                                                let shasum = crypto.createHash("sha1");

                                                tmpHash.on("data", (data) => {
                                                    shasum.update(data);
                                                });

                                                tmpHash.on("error", async () => {
                                                    try{ await fs.unlinkSync(filename); } catch(err){}
                                                });

                                                tmpHash.on("end", async () =>{
                                                    let hash = shasum.digest("hex");
                                                    let finalFilename = path.join(pathTraining, `${hash}.jpg`);

                                                    try{
                                                        if(!fs.existsSync(finalFilename)){
                                                            await fs.copyFileSync(filename, finalFilename);
                                                            await fs.unlinkSync(filename);
                                                        }
                                                        else{
                                                            await fs.unlinkSync(filename);
                                                        }
                                                    }
                                                    catch(err){}                                                
                                                });
                                            })(files[key]);
                                        }
                                    }).catch((err) => {}); 
                                }
                                catch(err){}
                                    
                                //stream.end(); 
                            }                                     
                        }
                    }
                    catch(err){
                        console.log(err);
                    }
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

export default ImportImagesUniqueProduct;

(async () => {
    if(process.env.console === true || process.env.console === "true"){
        await plugins("../node_modules/@dekproject");

        $.wait(["mongoose"]).then(async () => { 
            new ImportImagesUniqueProduct(); 
        }, 3000);
    }  
})();
