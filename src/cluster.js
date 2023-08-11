//Clusters controller

import "@babel/polyfill/noConflict";

import cluster from "cluster";
import os from "os";
import dotenv from "dotenv";
import { $ } from "@dekproject/scope";

dotenv.config();

class ClusterManager {
    constructor(){
        if (cluster.isMaster) {
            cluster.setupMaster({ silent: false });

            const cpusCount = (process.env.NODE_ENV === "production") ? os.cpus().length : 1;
            const maxClusters = process.env.CLUSTER_MAX || cpusCount;

            for(let i = 0; i < maxClusters; i++)
                this.create(i +1);

            $.set("workerId", "master");
            //this.loadApp();
        }
        else{
            this.bind();
        }
    }

    create(id){
        //console.log(`[x] Create cluster ${id}`);

        let _this = this;
        const worker = cluster.fork({ id });

        worker.on("online", () => {
            //console.log(`[${id}] [x] Listening cluster`);
            worker.send(id);
        });

        worker.on("exit", () => {
            setTimeout(() => {
                _this.create(id);
            }, 3000);
        });
    }

    bind(){
        this.loadApp();

        process.on("message", (id) => {
            $.set("workerId", id);
            //console.log(`[${cluster.worker.id}-${$.workerId}] [x] Set worker`);
        });
    }

    loadApp(){
        require("./app.js");
    }
}

new ClusterManager();
