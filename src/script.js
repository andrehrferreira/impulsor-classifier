import "@babel/polyfill/noConflict";

import dotenv from "dotenv";
import path from "path";
import minimist from "minimist";
import childProcessExecArgv from "child-process-exec-argv";

import { spawn } from "child_process";
import { $, plugins } from "@dekproject/scope";

const argv = minimist(process.argv.slice(2));

(async () => {
    dotenv.config();
    await plugins("node_modules/@dekproject");
    $.set("dev", !(process.env.NODE_ENV === "production"));

    $.wait(["mongoose"]).then(async () => {
        try{
            let params = ["--expose-gc", "--unhandled-rejections=strict", "--experimental-worker", "--max-old-space-size=65536", path.resolve(`${($.dev ? "src" : "build")}/scripts/${argv._[0]}`)];
            let argvArr = Object.entries(argv).filter((item) => (item[0] !== "_"));
            
            if(argvArr.length){
                for(let key in argvArr)
                    params.push(`--${argvArr[key][0]}=${argvArr[key][1]}`);
            }
            
            var child = spawn(($.dev ? "babel-node" : "node"), params, {
                execArgv: await childProcessExecArgv.getExecArgv(),
                env: { ...process.env, ...argv, ...{ console: true, gpu: false } },
                cwd: __dirname,
                stdio: [process.stdin, process.stdout, process.stderr]
            });

            child.on("exit", () => {
                // eslint-disable-next-line no-console
                console.log("Rotina finalizada");
                process.exit(0);
            });
        }
        catch(err){
            console.log(err);
        }
    });
})();
