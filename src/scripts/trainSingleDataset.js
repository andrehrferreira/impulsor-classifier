/* eslint-disable no-console */
// Treina modelo
// @use yarn script trainSingleDataset.js

import "@babel/polyfill/noConflict";

import model from "../utils/tfjs-model";
import data from "../utils/tfjs-data";

class TrainSingleDataset{
    constructor() {
        this.train();        
    }

    async train(){
        try{
            const Model = new model();
            await Model.init();

            console.log("Loaded Labels and Images");
            await data.loadLabelsAndImages("../data/trainingset/train");

            console.log("Loaded Training Data");
            await data.loadTrainingData(Model.decapitatedMobilenet);

            if (data.dataset.images) {
                const trainingParams = {
                    batchSizeFraction: 0.2,
                    denseUnits: 100,
                    epochs: 200,
                    learningRate: 0.0001,
                    trainStatus: console.log
                };
        
                const labels = data.labelsAndImages.map(element => element.label);

                const trainResult = await Model.train(
                    data.dataset,
                    labels,
                    trainingParams
                );

                console.log("Training Complete!");
                const losses = trainResult.history.loss;
                console.log(`Final Loss: ${Number(losses[losses.length - 1]).toFixed(5)}`);
        
                console.log(Model.model.summary());
                await Model.saveModel("../data/dataset");
            } 
            else {
                new Error("Must load data before training the model.");
            }

            if(process.env.console === true || process.env.console === "true")
                process.exit(1);
        }
        catch(err){
            console.log(err);
        }
    }
}

export default TrainSingleDataset;

(async () => {
    if(process.env.console === true || process.env.console === "true")
        new TrainSingleDataset(); 
})();
