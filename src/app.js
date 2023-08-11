import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import mongoose from "mongoose";

import { $, plugins, rabbitmq } from "@dekproject/scope";

import KeepaliveAxios from "./utils/keepaliveAxios";
import Classifier from "./scripts/testDatasetMulti";
import classifierModel from "./models/classifier";

try {
    plugins("node_modules/@dekproject");
} catch (err) {
    console.error(err);
}

dotenv.config();

$.wait(["mongoose", "rabbitmq"], 3000).then(async () => {
    let channelWrapper = rabbitmq({ reconnectTimeInSecond: 1 }).createChannel({
        json: true,
        setup: (channel) => {
            return Promise.all([
                channel.assertQueue("classifier", { 
                    autoDelete: false, 
                    durable: true
                }),
                channel.prefetch(1),
                channel.consume("classifier", async (msg) => {
                    try{
                        let data = JSON.parse(msg.content.toString());
                        console.log("Recive ", data);

                        let fileTmp = path.resolve(`./data/tmp/${new Date().getTime()}`);

                        console.log(`Download file ${fileTmp}`);

                        await KeepaliveAxios.get(data.image, { responseType: "stream"}).then(response => { 
                            response.data.pipe(fs.createWriteStream(fileTmp));  
                        });

                        console.log("Start classifier");

                        let classifier = new Classifier();
                        let result = await classifier.test(fileTmp, data.breadcrumb);

                        await classifierModel.updateOne({ _id: mongoose.Types.ObjectId(data._id) }, { $set: {
                            result: JSON.stringify(result),
                            inprocess: false
                        }});

                        try{ fs.unlinkSync(fileTmp); } catch(err) { }
                        
                        channelWrapper.ack(msg);
                    }
                    catch(err){
                        //channelWrapper.ack(msg);
                        console.log(err);                        
                    }
                }, { noAck: false })
            ]);
        }
    });
}, 3000).catch((error) => {
    console.error(error);
});