/* eslint-disable no-console */
// Criar lista de categorias ordenada de B2W
// @use yarn script createTaxonomyB2W.js

import "@babel/polyfill/noConflict";

import fs from "fs";
import path from "path";
import axios from "axios";
import md5 from "md5";

import { $, plugins } from "@dekproject/scope"; 
const B2WCategories = JSON.parse(fs.readFileSync("../data/b2w-categories.json"));

B2WCategories.map((value, index) => {
    B2WCategories[index].breadcrumbraw = ((name) => {
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
    })(B2WCategories[index].breadcrumb);
});

B2WCategories.sort((a, b) => {
    if(a.breadcrumbraw < b.breadcrumbraw) return -1;
    if(a.breadcrumbraw > b.breadcrumbraw) return 1;
    return 0;
});

class CreateTaxonomyB2W{
    constructor() {
        this.import();        
    }

    async import(){
        let pathTaxonomyFile = path.resolve("../data/taxonomy.B2W.pt-BR.txt");
        let stream = fs.createWriteStream(pathTaxonomyFile, { flags: "w" });

        stream.once("open", () => {
            for(let key in B2WCategories){
                stream.write(`${B2WCategories[key].breadcrumb.replace(/&gt;/img, ">").replace(/&amp;/img, "&")}\n`);
                console.log(`[Create Taxonomy B2W] ${B2WCategories[key].breadcrumb.replace(/&gt;/img, ">")}`);
            }
    
            stream.end();
        });

        stream.once("close", () => {
            console.log("[Create Taxonomy B2W] Finalizado");

            if(process.env.console === true || process.env.console === "true")
                process.exit(1);
        });
    }
}

export default CreateTaxonomyB2W;

(async () => {
    if(process.env.console === true || process.env.console === "true")
        new CreateTaxonomyB2W();
})();
