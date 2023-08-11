/* eslint-disable no-console */
// Testar dataset 
// @use yarn script testDatasetMulti.js

import "@babel/polyfill/noConflict";

import fs from "fs";
import path from "path";
import fg from "fast-glob";

import { Worker, isMainThread, workerData, threadId, parentPort } from "worker_threads";

import { $, plugins } from "@dekproject/scope"; 

import model from "../utils/tfjs-model";
import data from "../utils/tfjs-data";

import Categories from "../models/categories";

const FuzzySet = require("fuzzyset.js");

class TestDataset{
    constructor() {
        this.maxWorkers = 3;
        this.workers = 0;       
    }

    test(fileValidation, breadcrumb){
        return new Promise(async (resolve, reject) => {
            try{
                let titles = await fg([`${path.resolve("../data/titles/")}/*.txt`], { onlyFiles: true });
                let baseTitles = [];

                for(let keyTitles in titles){
                    let rawTitle = path.basename(titles[keyTitles]).replace(".txt", "");
                    let category = await Categories.findOne({ raw: rawTitle.replace(/ \- /img, " > ") }, "raw ref");

                    if(category)
                        baseTitles.push(`${category.ref} - ${category.raw.replace(/\>/img, "").replace(/\-/img, "")}`);
                }

                let datasetTitles = FuzzySet(baseTitles);   
                let titlesPredicts = datasetTitles.get(this.raw(breadcrumb.replace(/\>/img, "").replace(/\-/img, "")));         

                let datasets = await fg([`${path.resolve("../data/dataset/")}/*`, `${path.resolve("./data/dataset/")}/*`], { onlyDirectories: true });
                let promises = [];
    
                for(let key in datasets){
                    promises.push(this.sendForWorker({
                        datasets: datasets[key],
                        fileValidation
                    }));
                }
    
                Promise.all(promises)
                    .then(async (predicts) => {
                        predicts.sort((a, b) => {
                            if (a.confidence < b.confidence) 
                                return 1;
                            else if (a.confidence > b.confidence) 
                                return -1;
                            
                            return 0;
                        });
            
                        for(let key in predicts){
                            let category = await Categories.findOne({ ref: predicts[key].label }, "breadcrumb");
                            predicts[key].category = category.breadcrumb;
                        }

                        console.log({
                            images: predicts,
                            titles: titlesPredicts
                        });
    
                        resolve({
                            images: predicts,
                            titles: titlesPredicts
                        });
    
                        if(process.env.console === true || process.env.console === "true")
                            process.exit(1);
                    })
                    .catch(error => console.log(error));
            }
            catch(err){
                console.log(err);
                reject(err);
            }
        });
    }

    sendForWorker(data) {
        return new Promise((resolve, reject) => {
            const worker = new Worker(__filename, { workerData: data, env: {
                console: true
            }});
            
            //worker.on("online", () => { console.log(`Worker ${threadId} start`); });
            worker.on("message", resolve);
            worker.on("error", reject);
            worker.on("exit", (code) => {
                if (code !== 0)
                    reject(new Error(`Worker stopped with exit code ${code}`));
            });
        });
    }

    async parse(workerData){
        console.log(`Worker ${threadId} parser ${workerData.datasets}`);
        
        let bufferImage = await data.fileToTensor(workerData.fileValidation);

        let Model = new model();
        await Model.init();
        await Model.loadModel(workerData.datasets);                
        let predict = await Model.getPrediction(bufferImage);

        parentPort.postMessage(predict);
        console.log(`Worker ${threadId} sending predict`);
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

export default TestDataset;

(async () => {
    if(process.env.console === true || process.env.console === "true"){
        let testDataset = new TestDataset();

        if (isMainThread){
            await plugins("../node_modules/@dekproject");

            $.wait(["mongoose"]).then(async () => { 
                await testDataset.test("../data/trainingset/validation/ar-condicionado-split-lg-dual-inverter-voice-9000-btus-frio-220v-1502510149.jpg", "Ar e Ventilação > Ar-Condicionado > Inverter");
            }, 3000);
        }
        else
            testDataset.parse(workerData);
    }
})();
