const fs = require('fs');

let file = 'src/components/admin/RelationshipManagement.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/\{p1\.image && \!p1\.image\.startsWith\('http'\) && p1\.image\.length < 10 \? p1\.image : <img src=\{p1\.image\} className="w-full h-full object-contain" alt=""\/>\}/g, 
  "{p1.image ? (!p1.image.startsWith('http') && p1.image.length < 10 ? p1.image : <img src={p1.image} className=\"w-full h-full object-contain\" alt=\"\"/>) : null}");

content = content.replace(/\{p2\.image && \!p2\.image\.startsWith\('http'\) && p2\.image\.length < 10 \? p2\.image : <img src=\{p2\.image\} className="w-full h-full object-contain" alt=""\/>\}/g,
  "{p2.image ? (!p2.image.startsWith('http') && p2.image.length < 10 ? p2.image : <img src={p2.image} className=\"w-full h-full object-contain\" alt=\"\"/>) : null}");

fs.writeFileSync(file, content);
