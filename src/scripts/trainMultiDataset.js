/* eslint-disable no-console */
// Treina modelos
// @use yarn script trainMultiDataset.js
// @use yarn script trainMultiDataset.js --offset=musica

import "@babel/polyfill/noConflict";

import path from "path";
import fg from "fast-glob";
import gc from "expose-gc/function";

import model from "../utils/tfjs-model";
import data from "../utils/tfjs-data";

class TrainMultiDataset{
    constructor() {
        this.train();        
    }

    async train(){
        try{
            let rootPath = path.resolve("../data/trainingset/train-parsed");
            let paths = await fg(`${rootPath}/*`, { onlyDirectories: true });

            for(let key in paths){
                let subPaths = await fg(`${paths[key]}/*`, { onlyDirectories: true });

                console.log(`Loading: ${paths[key]}`);

                if(subPaths.length >= 2){
                    let Model = new model();
                    await Model.init();

                    console.log("Loaded Labels and Images");
                    await data.loadLabelsAndImages(paths[key]);

                    console.log("Loaded Training Data");
                    await data.loadTrainingData(Model.decapitatedMobilenet);

                    if (data.dataset.images) {
                        let trainingParams = {
                            batchSizeFraction: 0.2,
                            denseUnits: 100,
                            epochs: 200,
                            learningRate: 0.0001,
                            trainStatus: console.log
                        };
                
                        let labels = data.labelsAndImages.map(element => element.label);

                        let trainResult = await Model.train(
                            data.dataset,
                            labels,
                            trainingParams
                        );

                        console.log("Training Complete!");
                        let losses = trainResult.history.loss;
                        console.log(`Final Loss: ${Number(losses[losses.length - 1]).toFixed(5)}`);
                
                        console.log(Model.model.summary());
                        console.log(`../data/dataset/${path.basename(paths[key])}`);
                        await Model.saveModel(path.resolve(`../data/dataset/${path.basename(paths[key])}`));
                    } 
                    else {
                        new Error("Must load data before training the model.");
                    } 
                } 
                
                gc();
            }

            if(process.env.console === true || process.env.console === "true")
                process.exit(1);
        }
        catch(err){
            console.log(err);
        }
    }
}

export default TrainMultiDataset;

(async () => {
    if(process.env.console === true || process.env.console === "true")
        new TrainMultiDataset(); 
})();
