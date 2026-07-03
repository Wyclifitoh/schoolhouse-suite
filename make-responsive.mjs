import fs from 'fs';
import path from 'path';

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

let modifiedCount = 0;

function processFile(filePath) {
  if (!filePath.endsWith('.tsx')) return;
  const content = fs.readFileSync(filePath, 'utf-8');
  // Match grid-cols-2, grid-cols-3, etc. that DO NOT have a breakpoint prefix (sm:, md:, lg:, xl:, 2xl: etc.)
  // We use negative lookbehind to ensure there's no colon right before "grid-cols"
  // Actually, we don't want to match "lg:grid-cols-2", so negative lookbehind for ":" or "-" or a word char
  const regex = /(?<![a-zA-Z0-9:-])grid-cols-([2-9])/g;
  
  if (regex.test(content)) {
    const newContent = content.replace(regex, 'grid-cols-1 md:grid-cols-$1');
    if (newContent !== content) {
      fs.writeFileSync(filePath, newContent, 'utf-8');
      modifiedCount++;
      console.log(`Modified: ${filePath}`);
    }
  }
}

walkDir('./src/pages', processFile);
walkDir('./src/components', processFile);

console.log(`Finished. Modified ${modifiedCount} files.`);
