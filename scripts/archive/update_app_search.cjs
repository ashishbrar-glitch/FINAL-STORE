const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const oldSearchBlock = /\/\/ Handle Search & Filter\s*useEffect\(\(\) => \{[\s\S]*?\}, \[searchQuery, products, selectedCategory, learnedSearches\]\);/g;

const newSearchBlock = `// Handle Search & Filter

  // 1. Memoize active catalog and Fuse index
  const activeProducts = useMemo(() => {
    return products.filter(p => p.isActive !== false && p.isAvailable !== false);
  }, [products]);

  const fuse = useMemo(() => {
    return new Fuse(activeProducts, {
      keys: [
        { name: 'name', weight: 3 },
        { name: 'nameEn', weight: 2 },
        { name: 'nameHi', weight: 2 },
        { name: 'category', weight: 1.5 },
        { name: 'manualSearchAliases', weight: 2.5 },
        { name: 'aiSearchAliases', weight: 2.5 }
      ],
      threshold: 0.3,
      ignoreLocation: true,
      minMatchCharLength: 2,
      includeScore: true
    });
  }, [activeProducts]);

  // Normalize string for consistent search matching
  const normalizeStr = (str?: string) => {
    if (!str) return '';
    return str.trim().toLowerCase().replace(/[.,/#!$%\\^&\\*;:{}=\\-_~\(\)]/g, "").replace(/\\s{2,}/g, " ");
  };

  useEffect(() => {
    const lowerQuery = normalizeStr(searchQuery);

    let categoryMatches = activeProducts;
    if (selectedCategory !== "All") {
      categoryMatches = activeProducts.filter(p => p.category === selectedCategory);
    }

    if (!lowerQuery) {
      setDisplayedProducts(categoryMatches);
      setIsSearching(false);
      return;
    }

    // 1. Gather candidates & Fuzzy match against category filter
    const fuseResults = fuse.search(lowerQuery).filter(r => 
      selectedCategory === "All" || r.item.category === selectedCategory
    );
    
    // 2. Exact matches
    const exactMatches = categoryMatches.filter(p => {
       const n1 = normalizeStr(p.name);
       const n2 = normalizeStr(p.nameEn);
       const n3 = normalizeStr(p.nameHi);
       const aliases = [...(p.manualSearchAliases || []), ...(p.aiSearchAliases || [])].map(normalizeStr);
       
       return n1.includes(lowerQuery) || n2.includes(lowerQuery) || n3.includes(lowerQuery) || aliases.some(a => a.includes(lowerQuery));
    });

    // 3. Learned Matches (Retrieval signal only)
    const learnedIds = new Set<string>();
    if (learnedSearches[lowerQuery]) {
       learnedSearches[lowerQuery].ids.forEach((id: string) => learnedIds.add(id));
    } else {
       Object.entries(learnedSearches).forEach(([learnedQuery, data]: [string, any]) => {
         if (lowerQuery.length >= 3 && (learnedQuery.includes(lowerQuery) || data.terms.some((t: string) => normalizeStr(t).includes(lowerQuery)))) {
           data.ids.forEach((id: string) => learnedIds.add(id));
         }
       });
    }
    
    const learnedMatches = categoryMatches.filter(p => learnedIds.has(p.id));

    // Combine and Rank
    // Rules: Exact > Fuzzy > Learned > Bestseller
    const candidateMap = new Map<string, { product: Product, score: number }>();
    
    const addCandidate = (p: Product, baseScore: number) => {
       // Hard filter just in case, though activeProducts already handles this
       if (p.isActive === false || p.isAvailable === false) return; 
       
       let finalScore = baseScore;
       if (p.isBestseller) finalScore += 0.5; // Small boost
       
       const existing = candidateMap.get(p.id);
       if (!existing || existing.score < finalScore) {
          candidateMap.set(p.id, { product: p, score: finalScore });
       }
    };

    exactMatches.forEach(p => addCandidate(p, 10)); // Highest
    fuseResults.forEach(r => addCandidate(r.item, 10 - (r.score || 0) * 5)); // Higher fuse score is worse (0 is perfect)
    learnedMatches.forEach(p => addCandidate(p, 3)); // Moderate signal

    const rankedResults = Array.from(candidateMap.values())
      .sort((a, b) => b.score - a.score)
      .map(c => c.product);

    setDisplayedProducts(rankedResults);
    setIsSearching(false);
  }, [searchQuery, activeProducts, selectedCategory, fuse, learnedSearches]);`;

if (oldSearchBlock.test(code)) {
  code = code.replace(oldSearchBlock, newSearchBlock);
  fs.writeFileSync('src/App.tsx', code);
  console.log('App.tsx search updated successfully.');
} else {
  console.log('Regex did not match in App.tsx');
}
