const fs = require('fs');
const path = require('path');
const sharp = require('C:/Users/HONOR/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
(async () => {
 const root = __dirname;
 const screens = JSON.parse(fs.readFileSync(path.join(root, 'manifest.json'), 'utf8'));
 for (const screen of screens) {
  const folder = path.join(root, 'png', screen.device);
  fs.mkdirSync(folder, {recursive: true});
  await sharp(path.join(root, screen.file)).png().toFile(path.join(folder, screen.id + '.png'));
 }
 console.log('Exported ' + screens.length + ' full-resolution PNG images.');
})();
