const { JSDOM } = require("jsdom");
const dom = new JSDOM(`<i data-lucide="chevron-right"></i>`);
global.window = dom.window;
global.document = dom.window.document;
const lucide = require("./package/dist/umd/lucide.min.js");
console.log("Lucide exported keys:", Object.keys(lucide).length);

lucide.createIcons({
  icons: lucide,
  root: dom.window.document.body
});
console.log(dom.window.document.body.innerHTML);
