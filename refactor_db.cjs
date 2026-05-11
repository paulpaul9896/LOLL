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
      
      // Replace old nested paths
      content = content.replace(/'artifacts', 'wildrift-companion-platform', 'public', 'data', 'matches'/g, "'matches'");
      content = content.replace(/'artifacts', 'wildrift-companion-platform', 'public', 'data', 'friends'/g, "'friends'");
      content = content.replace(/'artifacts', 'wildrift-companion-platform', 'public', 'appConfig'/g, "'appConfig', 'settings'");

      fs.writeFileSync(fullPath, content);
    }
  }
}

processDir(path.join(__dirname, 'src'));
console.log('Done refactoring');
