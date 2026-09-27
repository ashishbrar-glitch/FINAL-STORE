const Fuse = require('fuse.js');
const products = [
  { id: "prod_2", name: "Maggi 2-Minute Noodles", variant: "70g" },
  { id: "prod_12", name: "Garnier Color Naturals", variant: "Red", nameEn: "Hair Color" }
];
const fuseExtended = new Fuse(products, {
  keys: ['name', 'variant', 'nameEn'],
  threshold: 0.3,
  ignoreLocation: true,
  ignoreFieldNorm: true,
  useExtendedSearch: true
});

const fuseNormal = new Fuse(products, {
  keys: ['name', 'variant', 'nameEn'],
  threshold: 0.3,
  ignoreLocation: true,
  ignoreFieldNorm: true
});

console.log("Extended 'maggi 70g':", fuseExtended.search("maggi 70g").map(r=>r.item.id));
console.log("Normal 'maggi 70g':", fuseNormal.search("maggi 70g").map(r=>r.item.id));
console.log("Extended 'red hair colour':", fuseExtended.search("red hair colour").map(r=>r.item.id));
console.log("Normal 'red hair colour':", fuseNormal.search("red hair colour").map(r=>r.item.id));
