const jsdom = require("jsdom");
const { JSDOM } = jsdom;
const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');

async function testDOM() {
  const dom = new JSDOM(html, {
    url: "file:///" + __dirname.replace(/\\/g, '/') + "/index.html",
    runScripts: "dangerously",
    resources: "usable",
    pretendToBeVisual: true
  });
  
  setTimeout(() => {
    const document = dom.window.document;
    const btnRun = document.querySelector("#btn-run");
    const container = document.querySelector("#monaco-container");
    console.log("btn-run found:", !!btnRun);
    console.log("container classes:", container ? container.className : 'null');
    console.log("explorer buttons:", document.querySelector("[data-action='new-file']"));
    
    if (btnRun) {
      console.log("btn-run style background:", dom.window.getComputedStyle(btnRun).backgroundColor);
      console.log("btn-run classes:", btnRun.className);
    }
  }, 2000);
}

testDOM();
