const fs = require('fs');
const content = fs.readFileSync('src/data/dictionary.ts', 'utf8');
const ids = [];
const regex = /id: '([^']+)'/g;
let match;
while ((match = regex.exec(content)) !== null) {
  ids.push(match[1]);
}
const counts = {};
ids.forEach(id => {
  counts[id] = (counts[id] || 0) + 1;
});
const duplicates = Object.keys(counts).filter(id => counts[id] > 1);
console.log(duplicates);
