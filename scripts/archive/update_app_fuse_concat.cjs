const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const targetStr = `  const fuse = useMemo(() => {
    return new Fuse(activeProducts, {
      keys: [
        { name: 'name', weight: 3 },
        { name: 'nameEn', weight: 2 },
        { name: 'nameHi', weight: 2 },
        { name: 'brand', weight: 1.5 },
        { name: 'category', weight: 1.5 },
        { name: 'subcategory', weight: 1.5 },
        { name: 'variant', weight: 1.2 },
        { name: 'manualSearchAliases', weight: 2.5 },
        { name: 'aiSearchAliases', weight: 2.5 }
      ],
      threshold: 0.3,
      ignoreLocation: true,
      ignoreFieldNorm: true,
      useExtendedSearch: true,
      minMatchCharLength: 2,
      includeScore: true
    });
  }, [activeProducts]);`;

const replacement = `  const fuseActiveProducts = useMemo(() => {
    return activeProducts.map(p => ({
      item: p,
      _searchStr: [
        p.name, p.nameEn, p.nameHi, p.brand, p.category, p.subcategory, p.variant,
        ...(p.manualSearchAliases || []),
        ...(p.aiSearchAliases || [])
      ].filter(Boolean).join(" ")
    }));
  }, [activeProducts]);

  const fuse = useMemo(() => {
    return new Fuse(fuseActiveProducts, {
      keys: ['_searchStr'],
      threshold: 0.4,
      ignoreLocation: true,
      ignoreFieldNorm: true,
      minMatchCharLength: 2,
      includeScore: true
    });
  }, [fuseActiveProducts]);`;

if (code.includes(targetStr)) {
  code = code.replace(targetStr, replacement);
  // Also update fuse.search(lowerQuery).filter(r => r.item.item.category === ...)
  // because now r.item is { item: Product, _searchStr }
  const searchFilterStr = `const fuseResults = fuse.search(lowerQuery).filter(r => 
      selectedCategory === "All" || r.item.category === selectedCategory
    );`;
  const replaceSearchFilterStr = `const fuseResults = fuse.search(lowerQuery).filter(r => 
      selectedCategory === "All" || r.item.item.category === selectedCategory
    ).map(r => ({ ...r, item: r.item.item }));`;
  code = code.replace(searchFilterStr, replaceSearchFilterStr);
  fs.writeFileSync('src/App.tsx', code);
  console.log("App.tsx fuse updated");
} else {
  console.log("Target not found");
}
