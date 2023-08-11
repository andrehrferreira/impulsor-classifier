/* eslint-disable no-console */
// Re organiza diretorios de treino em blocos
// @use yarn script reOrderTrain.js

import "@babel/polyfill/noConflict";

import fs from "fs";
import path from "path";
import fg from "fast-glob";

import { $, plugins } from "@dekproject/scope"; 

class ReorderTrain{
    constructor() {
        this.import();        
    }

    async import(){
        let rootPath = path.resolve("../data/trainingset/train-parsed");
        let paths = await fg(["../data/trainingset/train/*"], { onlyDirectories: true });

        try {
            if (!fs.existsSync(rootPath)) fs.mkdirSync(rootPath);
        } catch (err) {}

        for(let key in paths){
            let tree = path.basename(paths[key]).split(" - ");
            let subPath = path.resolve(`../data/trainingset/train-parsed/${tree[1]}/`);

            try {
                if (!fs.existsSync(subPath)) fs.mkdirSync(subPath);
            } catch (err) { }

            let childPath = path.resolve(`${subPath}/${tree[0]}/`);

            try {
                if (!fs.existsSync(childPath)) fs.mkdirSync(childPath);
            } catch (err) { }

            let files = await fg(`${paths[key]}/*`, { onlyFiles: true } );

            for(let keyFile in files)
                fs.createReadStream(files[keyFile]).pipe(fs.createWriteStream(`${childPath}/${path.basename(files[keyFile])}`));

            console.log(childPath);
        }

        if(process.env.console === true || process.env.console === "true")
            process.exit(1);
    }
}

export default ReorderTrain;

(async () => {
    if(process.env.console === true || process.env.console === "true")
        new ReorderTrain(); 
})();
