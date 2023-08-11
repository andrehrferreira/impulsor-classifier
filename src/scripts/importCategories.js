/* eslint-disable no-console */
// Migrador de categorias do de arquivos de taxonomia
// @use yarn script importCategories.js

import "@babel/polyfill/noConflict";

import fs from "fs";
import path from "path";
import md5 from "md5";

import { $, plugins } from "@dekproject/scope"; 
const Taxonomy = fs.readFileSync(path.resolve("../data/taxonomy.B2W.pt-BR.txt"));

import Categories from "../models/categories";

class ImportCategories{
    constructor() {
        this.import();        
    }

    async import(){
        const categories = Taxonomy.toString().split("\n");

        for(let key in categories){
            try{
                let breadcrumb = categories[key];

                if(breadcrumb.indexOf(">") == -1){//Root categorie
                    console.log(`[Categories] ${breadcrumb}`);

                    if(breadcrumb){
                        await new Categories({
                            breadcrumb,
                            name: breadcrumb,
                            raw: this.raw(breadcrumb),
                            ref: md5(breadcrumb),
                            level: 0,
                            haschildren: this.hasChildren(categories, breadcrumb)
                        }).save();
                    }
                }
                else{
                    console.log(`[Categories] ${breadcrumb}`);
                    
                    let parseBreadcrumb = breadcrumb.split(" > ");
                    let name = parseBreadcrumb[parseBreadcrumb.length-1];
                    parseBreadcrumb.pop();
 
                    let previousCategory = parseBreadcrumb.join(" > ");
                    let tmpCategory = await Categories.findOne({ breadcrumb: previousCategory }).lean();

                    let newTree = tmpCategory.tree;
                    newTree.push(tmpCategory._id);
    
                    await new Categories({
                        ref: md5(breadcrumb),
                        raw: this.raw(breadcrumb),
                        name: name,
                        tree: newTree,
                        breadcrumb,
                        root: tmpCategory._id,
                        level: (breadcrumb.match(/>/g) || []).length,
                        haschildren: this.hasChildren(categories, breadcrumb)
                    }).save();
                }
            }
            catch(err){
                //console.log(err);
            }
        }

        if(process.env.console === true || process.env.console === "true")
            process.exit(1);
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

    hasChildren(categories, breadcrumb) {
        let itens = categories.filter((item) => { return (item.indexOf(breadcrumb) > -1); });
        return (itens.length > 1);
    }
}

export default ImportCategories;

(async () => {
    if(process.env.console === true || process.env.console === "true"){
        await plugins("../node_modules/@dekproject");

        $.wait(["mongoose"]).then(async () => { 
            new ImportCategories(); 
        }, 3000);
    }
})();
