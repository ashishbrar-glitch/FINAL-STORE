const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const searchLogic = `
  // Handle Search & Filter
  useEffect(() => {
    const lowerQuery = searchQuery.trim().toLowerCase();

    // 1. Filter by category
    let categoryMatches = products;
    if (selectedCategory !== "All") {
      categoryMatches = products.filter(p => p.category === selectedCategory);
    }

    if (!lowerQuery) {
      setDisplayedProducts(categoryMatches);
      setIsSearching(false);
      return;
    }

    // 2. Instant local fuzzy search using Fuse.js
    const fuse = new Fuse(categoryMatches, {
      keys: [
        'name',
        'nameHi',
        'nameEn',
        'category',
        'searchAliases'
      ],
      threshold: 0.3, // typo-tolerance
      ignoreLocation: true,
      minMatchCharLength: 2
    });

    const fuseResults = fuse.search(lowerQuery);
    let localMatches = fuseResults.map(r => r.item);

    // 2.5. Apply learned AI mappings (fast local lookup) as fallback/addition
    let hasExactLearnedMatch = false;
    
    // Check if we already have an exact learned search mapping
    if (learnedSearches[lowerQuery]) {
      hasExactLearnedMatch = true;
      const learnedIds = learnedSearches[lowerQuery].ids;
      const learnedProducts = products.filter(p => learnedIds.includes(p.id) && !localMatches.find(lm => lm.id === p.id));
      localMatches = [...localMatches, ...learnedProducts];
    } else {
      // Fuzzy mapping check based on terms
      const matchingLearnedIds = new Set<string>();
      Object.entries(learnedSearches).forEach(([learnedQuery, data]: [string, any]) => {
        if ((lowerQuery.length >= 3 && learnedQuery.includes(lowerQuery)) || data.terms.some(t => t.toLowerCase().includes(lowerQuery))) {
           data.ids.forEach(id => matchingLearnedIds.add(id));
        }
      });
      if (matchingLearnedIds.size > 0) {
        const learnedProducts = products.filter(p => matchingLearnedIds.has(p.id) && !localMatches.find(lm => lm.id === p.id));
        localMatches = [...localMatches, ...learnedProducts];
      }
    }

    setDisplayedProducts(localMatches);

    // If local matches are sufficient or we have a learned match, skip AI
    if (localMatches.length > 0 || hasExactLearnedMatch) {
      setIsSearching(false);
      return;
    }

    // 3. Debounced AI Deep Search (Fallback only)
    setIsSearching(true);
    const abortController = new AbortController();

    const performAISearch = async () => {
      try {
        const minimalSearchCatalog = products.map(p => ({
          id: p.id,
          name: p.name,
          nameHi: p.nameHi,
          nameEn: p.nameEn,
          category: p.category
        }));

        const res = await fetch('/api/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: searchQuery, products: minimalSearchCatalog }),
          signal: abortController.signal
        });
        
        if (!res.ok) throw new Error('AI search failed');
        
        const data = await res.json();
        
        if (data.ids && Array.isArray(data.ids) && data.ids.length > 0) {
          let aiMatches = data.ids.map((id: string) => products.find(p => p.id === id)).filter(Boolean) as Product[];
          if (selectedCategory !== "All") {
            aiMatches = aiMatches.filter(p => p.category === selectedCategory);
          }

          if (aiMatches.length > 0) {
            setDisplayedProducts(aiMatches);
            
            // Save to searchMappings
            const safeId = "q_" + encodeURIComponent(lowerQuery).replace(/\\./g, '%2E');
            if (safeId) {
              try {
                await setDoc(doc(db, "searchMappings", safeId), {
                  query: lowerQuery,
                  ids: data.ids,
                  terms: data.terms || [],
                  timestamp: Date.now()
                }, { merge: true });
                
                // NEW: Backfill searchAliases for matched products (learning)
                import("firebase/firestore").then(({ arrayUnion }) => {
                  data.ids.forEach((matchedId: string) => {
                     const productRef = doc(db, "products", matchedId);
                     updateDoc(productRef, {
                        searchAliases: arrayUnion(lowerQuery)
                     }).catch(e => console.error("Error backfilling alias:", e));
                  });
                });
              } catch (e) {
                console.error("Failed to save search learning:", e);
              }
            }
          }
        }
      } catch (error: any) {
        if (error.name !== 'AbortError') {
          console.error("AI Search fallback triggered:", error);
        }
      } finally {
        if (!abortController.signal.aborted) {
          setIsSearching(false);
        }
      }
    };

    const timeoutId = setTimeout(() => {
      performAISearch();
    }, 500); // 500ms debounce

    return () => {
      clearTimeout(timeoutId);
      abortController.abort();
    };
  }, [searchQuery, products, selectedCategory]);
`;

// Replace existing useEffect
code = code.replace(/\/\/ Handle Search & Filter\s+useEffect\(\(\) => \{[\s\S]*?\}, \[searchQuery, products, selectedCategory\]\);/, searchLogic);

fs.writeFileSync('src/App.tsx', code);
