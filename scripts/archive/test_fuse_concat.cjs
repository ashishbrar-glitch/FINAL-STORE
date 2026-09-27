const Fuse = require('fuse.js');
const products = [
  { id: "prod_2", name: "Maggi 2-Minute Noodles", variant: "70g", aliases: ["magi", "mggi"] },
  { id: "prod_12", name: "Garnier Color Naturals", variant: "Red", nameEn: "Hair Color", manualSearchAliases: ["baal ka colour"] }
];

const mapped = products.map(p => {
  return {
    ...p,
    _searchStr: [p.name, p.variant, p.nameEn, ...(p.aliases||[]), ...(p.manualSearchAliases||[])].join(" ")
  }
});

const fuseNormal = new Fuse(mapped, {
  keys: ['_searchStr'],
  threshold: 0.4,
  ignoreLocation: true,
  ignoreFieldNorm: true
});

console.log("Concat 'maggi 70g':", fuseNormal.search("maggi 70g").map(r=>r.item.id));
console.log("Concat 'red hair colour':", fuseNormal.search("red hair colour").map(r=>r.item.id));
console.log("Concat 'baal ka colour':", fuseNormal.search("baal ka colour").map(r=>r.item.id));
console.log("Concat 'magi':", fuseNormal.search("magi").map(r=>r.item.id));
