const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else {
      if (file.endsWith('.js')) results.push(file);
    }
  });
  return results;
}

const files = walk(path.join(__dirname, 'js'));

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  // Re-patch it correctly
  let newContent = content.replace(/lucide\.createIcons\(\{\s*icons:\s*window\.lucide\s*\|\|\s*window\.lucide\?\.icons,\s*root:\s*([^}]+)\}\)/g, "lucide.createIcons({ icons: window.lucide?.icons || window.lucide, root: $1 })");
  if (content !== newContent) {
    fs.writeFileSync(file, newContent, 'utf8');
    console.log('Fixed', file);
  }
});
