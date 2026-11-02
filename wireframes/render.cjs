const fs = require('fs');
const path = require('path');
const sharp = require('C:/Users/HONOR/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const root = __dirname;
(async () => {
 const keys = ['home','shop','product','shrine','wishlist','compare','comparison-result','cart','checkout','order-success','about'];
 const tiles=[]; const tw=280, th=450;
 for(let i=0;i<keys.length;i++) {
  const f=path.join(root,'screens',keys[i]+'-desktop.svg');
  const thumb=await sharp(f).resize({width:tw-24,height:th-65,fit:'inside'}).png().toBuffer();
  const title=Buffer.from('<svg width="280" height="38"><text x="12" y="24" font-size="16" font-family="Arial" fill="#222">'+String(i+1).padStart(2,'0')+' / '+keys[i]+'</text></svg>');
  tiles.push({input:title,left:(i%4)*tw,top:Math.floor(i/4)*th});
  tiles.push({input:thumb,left:(i%4)*tw+12,top:Math.floor(i/4)*th+42});
 }
 await sharp({create:{width:tw*4,height:th*3,channels:3,background:'#eeeeee'}}).composite(tiles).png().toFile(path.join(root,'overview.png'));
 for(const name of ['home-desktop','product-desktop','shrine-desktop','compare-desktop','comparison-result-desktop','checkout-mobile','shrine-mobile','wishlist-desktop']) {
  await sharp(path.join(root,'screens',name+'.svg')).resize({width:name.endsWith('mobile')?390:1200}).png().toFile(path.join(root,name+'.png'));
 }
 console.log('Rendered overview and 8 review images.');
})();
