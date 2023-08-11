/* eslint-disable no-console */
// Criar relevancia entre produtos da base
// @use yarn script relevanceProducts.js

import "@babel/polyfill/noConflict";

import Barcoder from "barcoder";

import { $, plugins } from "@dekproject/scope";

import Product from "../models/product";

class RelevanceProducts{
    constructor() {
        this.import();    
    }

    async import(){
        let query = { 
            "campaign" : "5e6f454fcfbe5505b7e5b31c", 
            "gtin": { $nin: [""] } 
        };

        let offset = null;
        let products = [];

        do{
            if(offset)
                query._id = { $gt: offset };

            products = await Product.find(query, "gtin title", { limit: 1000 }).lean();  
            
            if(products.length > 0){
                for(let key in products){
                    try{
                        offset = products[key]._id;

                        let countProducts = (Barcoder.validate(products[key].gtin)) ? await Product.countDocuments({ gtin: products[key].gtin }) : 0;                        
                        await Product.updateOne({ _id: products[key]._id }, { $set: { relevance: countProducts }});
                        console.log(`${products[key].title} - ${products[key]._id} - ${countProducts}`);
                    }
                    catch(err){ console.log(err); }
                }
            }
            else{
                break;
            }
        }while(products.length > 0);

        if(process.env.console === true || process.env.console === "true")
            process.exit(1);

        console.log("[Import Images Categories] Finalizado");
    }
}

export default RelevanceProducts;

(async () => {
    if(process.env.console === true || process.env.console === "true"){
        await plugins("../node_modules/@dekproject");

        $.wait(["mongoose"]).then(async () => { 
            new RelevanceProducts(); 
        }, 3000);
    }  
})();
