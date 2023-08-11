const fs = require("fs");
const path = require("path");

const FuzzySet = require("fuzzyset.js");
const Taxonomy = fs.readFileSync(path.resolve("./data/taxonomy.pt-BR.txt"));

let dataset = FuzzySet(Taxonomy.toString().split("\n"), true, 3, 4);
console.log(dataset.get("Automotivo > Direção Hidráulica"));