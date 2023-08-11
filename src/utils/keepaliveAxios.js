import axios from "axios";

const Agent = require("agentkeepalive");
const HttpsAgent = require("agentkeepalive").HttpsAgent;

const options = {
    maxSockets: 100,
    maxFreeSockets: 10,
    timeout: 10000, 
    freeSocketTimeout: 10000,
};

const keepaliveAgentHttp = new Agent(options);
const keepaliveAgentHttps = new HttpsAgent(options);

export default axios.create({
    httpAgent: keepaliveAgentHttp,
    httpsAgent: keepaliveAgentHttps,
});