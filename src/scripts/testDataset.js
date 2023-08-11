/* eslint-disable no-console */
// Testar dataset 
// @use yarn script testDataset.js

import "@babel/polyfill/noConflict";

import fg from "fast-glob";
import { $, plugins } from "@dekproject/scope"; 

import model from "../utils/tfjs-model";
import data from "../utils/tfjs-data";

class TestDataset{
    constructor() {
        this.test();        
    }

    async test(){
        try{
            const Model = new model();
            await Model.init();
            await Model.loadModel("../data/dataset");

            let files = await fg("../data/trainingset/validation/*");

            for(let key in files){
                console.log(files[key]);

                let bufferImage = await data.fileToTensor(files[key]);
                const predict = await Model.getPrediction(bufferImage);
                
                console.log(predict);
            }

            if(process.env.console === true || process.env.console === "true")
                process.exit(1);
        }
        catch(err){
            console.log(err);
        }
    }
}

export default TestDataset;

(async () => {
    if(process.env.console === true || process.env.console === "true"){
        await plugins("../node_modules/@dekproject");

        $.wait(["mongoose"]).then(async () => { 
            new TestDataset(); 
        }, 3000);
    }
})();
