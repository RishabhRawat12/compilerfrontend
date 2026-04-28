const { JSDOM } = require("jsdom");
const dom = new JSDOM(`<i data-lucide="chevron-right"></i>`);
global.window = dom.window;
global.document = dom.window.document;
const lucide = require("./package/dist/umd/lucide.min.js");

console.log("BEFORE:", dom.window.document.body.innerHTML);
try {
  lucide.createIcons({ root: dom.window.document.body });
} catch (e) {
  console.log("ERROR:", e);
}
console.log("AFTER NO ICONS PARAM:", dom.window.document.body.innerHTML);

const dom2 = new JSDOM(`<i data-lucide="chevron-right"></i>`);
global.window = dom2.window;
global.document = dom2.window.document;
try {
  lucide.createIcons({ icons: lucide, root: dom2.window.document.body });
} catch (e) {
  console.log("ERROR2:", e);
}
console.log("AFTER WITH ICONS PARAM:", dom2.window.document.body.innerHTML);

