// Names describe the supplied poses; IDs remain stable for bags, links and order snapshots.
export const CATALOGUE_NAMES_VERSION=20261105
const rules:any={
 'earth-touching':{old:'Earth Touching',name:'Lotus Meditation',assetSet:'buddha_4'},
 'gentle-blessing':{old:'Gentle Blessing',name:'Gentle Serenity',assetSet:'buddha_3'}
}
export function correctedProductName(product:any){
 const rule=rules[product.id]
 return rule&&product.name===rule.old&&product.assetSet===rule.assetSet?{...product,name:rule.name}:product
}
