const fs = require('fs');
const path = require('path');

function processDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDir(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      // Reverse old nested paths
      content = content.replace(/'matches'/g, "'artifacts', 'wildrift-companion-platform', 'public', 'data', 'matches'");
      content = content.replace(/'friends'/g, "'artifacts', 'wildrift-companion-platform', 'public', 'data', 'friends'");
      content = content.replace(/'appConfig', 'settings'/g, "'artifacts', 'wildrift-companion-platform', 'public', 'appConfig'");

      fs.writeFileSync(fullPath, content);
    }
  }
}

processDir(path.join(__dirname, 'src'));
console.log('Done reverse refactoring');
