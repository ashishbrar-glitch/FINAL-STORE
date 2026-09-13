const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

// Update local search
const localSearchOld = `        p.name.toLowerCase().includes(lowerQuery) ||
        p.category.toLowerCase().includes(lowerQuery),`;
const localSearchNew = `        p.name.toLowerCase().includes(lowerQuery) ||
        p.category.toLowerCase().includes(lowerQuery) ||
        (p.nameEn && p.nameEn.toLowerCase().includes(lowerQuery)),`;

code = code.replace(localSearchOld, localSearchNew);

// Update minimalSearchCatalog payload
const minimalSearchOld = `          name: p.name,
          nameHi: p.nameHi,
          category: p.category
        }));`;
const minimalSearchNew = `          name: p.name,
          nameHi: p.nameHi,
          nameEn: p.nameEn,
          category: p.category
        }));`;

code = code.replace(minimalSearchOld, minimalSearchNew);

fs.writeFileSync('src/App.tsx', code);
