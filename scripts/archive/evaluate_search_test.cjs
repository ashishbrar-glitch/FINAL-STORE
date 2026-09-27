const fs = require('fs');
const Fuse = require('fuse.js');

function runSearch(query, products, learnedSearches) {
    const normalizeStr = (str) => {
      if (!str) return '';
      return str.trim().toLowerCase().replace(/[.,/#!$%\\^&\\*;:{}=\\-_~\\(\\)]/g, "").replace(/\\s{2,}/g, " ");
    };

    const lowerQuery = normalizeStr(query);
    
    const fuseActiveProducts = products.map(p => ({
      item: p,
      _searchStr: [
        p.name, p.nameEn, p.nameHi, p.brand, p.category, p.subcategory, p.variant,
        ...(p.manualSearchAliases || []),
        ...(p.aiSearchAliases || [])
      ].filter(Boolean).join(" ")
    }));

    const fuse = new Fuse(fuseActiveProducts, {
      keys: ['_searchStr'],
      threshold: 0.4,
      ignoreLocation: true,
      ignoreFieldNorm: true,
      minMatchCharLength: 2,
      includeScore: true
    });

    const fuseResults = fuse.search(lowerQuery).map(r => ({ ...r, item: r.item.item }));
    
    const exactMatches = products.filter(p => {
       const n1 = normalizeStr(p.name);
       const n2 = normalizeStr(p.nameEn);
       const n3 = normalizeStr(p.nameHi);
       const aliases = [...(p.manualSearchAliases || []), ...(p.aiSearchAliases || [])].map(normalizeStr);
       return n1.includes(lowerQuery) || n2.includes(lowerQuery) || n3.includes(lowerQuery) || aliases.some(a => a.includes(lowerQuery));
    });

    const learnedIds = new Set();
    if (learnedSearches[lowerQuery]) {
       learnedSearches[lowerQuery].ids.forEach(id => learnedIds.add(id));
    } else {
       Object.entries(learnedSearches).forEach(([learnedQuery, data]) => {
         if (lowerQuery.length >= 3 && (learnedQuery.includes(lowerQuery) || data.terms.some(t => normalizeStr(t).includes(lowerQuery)))) {
           data.ids.forEach(id => learnedIds.add(id));
         }
       });
    }
    
    const learnedMatches = products.filter(p => learnedIds.has(p.id));

    const candidateMap = new Map();
    const addCandidate = (p, baseScore) => {
       if (p.isActive === false || p.isAvailable === false) return;
       let finalScore = baseScore;
       if (p.isBestseller) finalScore += 0.5;
       
       const existing = candidateMap.get(p.id);
       if (!existing || existing.score < finalScore) {
          candidateMap.set(p.id, { product: p, score: finalScore });
       }
    };

    exactMatches.forEach(p => addCandidate(p, 10));
    fuseResults.forEach(r => addCandidate(r.item, 10 - (r.score || 0) * 5));
    learnedMatches.forEach(p => addCandidate(p, 3));

    return Array.from(candidateMap.values())
      .sort((a, b) => b.score - a.score)
      .map(c => c.product);
}

const evaluationSuite = [
  { query: "makhan", expectedProductIds: ["prod_1"] }, // assuming prod_1 is Ghee
  { query: "ghee", expectedProductIds: ["prod_1"] },
  { query: "maggi", expectedProductIds: ["prod_2"] }, // maggi noodles
  { query: "mggi", expectedProductIds: ["prod_2"] },
  { query: "doodh", expectedProductIds: ["prod_3"] }, // milk
  { query: "dudh", expectedProductIds: ["prod_3"] },
  { query: "aata", expectedProductIds: ["prod_4"] }, // atta
  { query: "ata", expectedProductIds: ["prod_4"] },
  { query: "cheeni", expectedProductIds: ["prod_5"] }, // sugar
  { query: "chini", expectedProductIds: ["prod_5"] },
  { query: "shakar", expectedProductIds: ["prod_5"] },
  { query: "chawal", expectedProductIds: ["prod_6"] }, // rice
  { query: "chawl", expectedProductIds: ["prod_6"] },
  { query: "tel", expectedProductIds: ["prod_7"] }, // oil
  { query: "tail", expectedProductIds: ["prod_7"] },
  { query: "sabun", expectedProductIds: ["prod_8"] }, // soap
  { query: "surf", expectedProductIds: ["prod_9"] }, // detergent
  { query: "namak", expectedProductIds: ["prod_10"] }, // salt
  { query: "patti", expectedProductIds: ["prod_11"] }, // tea
  { query: "chai", expectedProductIds: ["prod_11"] },
  { query: "maggi 70g", expectedProductIds: ["prod_2"] },
  { query: "kapde dhone ka powder", expectedProductIds: ["prod_9"] },
  { query: "baal ka colour", expectedProductIds: ["prod_12"] },
  { query: "red hair colour", expectedProductIds: ["prod_12"] }
];

const mockProducts = [
  { id: "prod_1", name: "Amul Ghee 500ml", nameEn: "Ghee", nameHi: "घी", manualSearchAliases: ["makhan"], aiSearchAliases: ["ghiyu"], category: "Grocery" },
  { id: "prod_2", name: "Maggi 2-Minute Noodles", nameEn: "Noodles", nameHi: "मैगी", variant: "70g", manualSearchAliases: [], aiSearchAliases: ["magi", "mggi"], category: "Grocery" },
  { id: "prod_3", name: "Amul Taaza Milk 1L", nameEn: "Milk", nameHi: "दूध", manualSearchAliases: ["doodh"], aiSearchAliases: ["dudh"], category: "Dairy" },
  { id: "prod_4", name: "Aashirvaad Atta 5kg", nameEn: "Wheat Flour", nameHi: "आटा", manualSearchAliases: ["aata"], aiSearchAliases: ["ata"], category: "Grocery" },
  { id: "prod_5", name: "Madhur Pure Sugar 1kg", nameEn: "Sugar", nameHi: "चीनी", manualSearchAliases: ["cheeni", "shakar"], aiSearchAliases: ["chini"], category: "Grocery" },
  { id: "prod_6", name: "India Gate Basmati Rice 5kg", nameEn: "Rice", nameHi: "चावल", manualSearchAliases: ["chawal"], aiSearchAliases: ["chawl"], category: "Grocery" },
  { id: "prod_7", name: "Fortune Sunflower Oil 1L", nameEn: "Oil", nameHi: "तेल", manualSearchAliases: ["tel"], aiSearchAliases: ["tail"], category: "Grocery" },
  { id: "prod_8", name: "Lifebuoy Soap", nameEn: "Soap", nameHi: "साबुन", manualSearchAliases: ["sabun"], aiSearchAliases: [], category: "Personal Care" },
  { id: "prod_9", name: "Surf Excel 1kg", nameEn: "Detergent", nameHi: "सर्फ", manualSearchAliases: ["surf"], aiSearchAliases: ["sarf", "kapde dhone ka powder"], category: "Household" },
  { id: "prod_10", name: "Tata Salt 1kg", nameEn: "Salt", nameHi: "नमक", manualSearchAliases: ["namak"], aiSearchAliases: [], category: "Grocery" },
  { id: "prod_11", name: "Brooke Bond Red Label Tea", nameEn: "Tea", nameHi: "चाय", manualSearchAliases: ["chai", "patti"], aiSearchAliases: [], category: "Grocery" },
  { id: "prod_12", name: "Garnier Color Naturals", nameEn: "Hair Color", nameHi: "हेयर कलर", variant: "Red", manualSearchAliases: ["baal ka colour"], aiSearchAliases: [], category: "Personal Care" }
];

let totalRecall = 0;
let zeroResults = 0;

console.log("--- SEARCH EVALUATION SUITE ---");
for (const test of evaluationSuite) {
  const results = runSearch(test.query, mockProducts, {});
  const resultIds = results.map(r => r.id);
  
  const expectedSet = new Set(test.expectedProductIds);
  const matchedExpected = resultIds.filter(id => expectedSet.has(id));
  
  const recall = matchedExpected.length / test.expectedProductIds.length;
  totalRecall += recall;
  
  if (results.length === 0) zeroResults++;
  
  if (recall < 1.0) {
    console.log(`Query: "${test.query}"`);
    console.log(`  Expected: ${test.expectedProductIds.join(", ")}`);
    console.log(`  Got: ${resultIds.join(", ") || "(none)"}`);
    console.log(`  Recall: ${recall * 100}%`);
  }
}

const avgRecall = totalRecall / evaluationSuite.length;
console.log("-------------------------------");
console.log(`Average Recall: ${(avgRecall * 100).toFixed(1)}%`);
console.log(`Zero Result Rate: ${(zeroResults / evaluationSuite.length * 100).toFixed(1)}%`);
