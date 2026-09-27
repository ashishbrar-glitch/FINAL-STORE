const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Remove ProductRecommendation global state
code = code.replace(/const \[recommendations, setRecommendations\] = useState<Record<string, RecommendationRel\[\]>>\({}\);/, '');
code = code.replace(/const unsubRecommendations = onSnapshot.*?unsubRecommendations\(\);\n/gs, (match) => {
    return '    // recommendations subscription removed\n';
});
// also remove it from the return of useEffect
code = code.replace(/unsubRecommendations\(\);/g, '');

// 2. Modify RecommendationRow to fetch data
const oldRow = /function RecommendationRow\(\{.*?\}\) \{.*?return \(\s*<div className="w-full mt-6 mb-8 px-2">/s;

const newRow = `function RecommendationRow({
  sourceProduct,
  products,
  onClose,
  onAddToCart
}: {
  sourceProduct: Product;
  products: Product[];
  onClose: () => void;
  onAddToCart: (id: string, delta: number) => void;
}) {
  const [candidates, setCandidates] = useState<{ product: Product, rel: ProductRecommendation }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const q = query(
      collection(db, "productRecommendations"),
      where("sourceProductId", "==", sourceProduct.id),
      where("status", "==", "approved")
    );
    
    const unsub = onSnapshot(q, (snap) => {
       const results: { product: Product, rel: ProductRecommendation }[] = [];
       const seenTargetIds = new Set<string>();
       
       snap.forEach(docSnap => {
          const rel = docSnap.data() as ProductRecommendation;
          
          if (seenTargetIds.has(rel.targetProductId)) return; // Remove duplicate target IDs
          
          const p = products.find(prod => prod.id === rel.targetProductId);
          if (p && p.isActive && p.isAvailable) {
             results.push({ product: p, rel });
             seenTargetIds.add(rel.targetProductId);
          }
       });
       
       // Sort: complementary > similar, then by priority, then by confidence
       results.sort((a, b) => {
          if (a.rel.type !== b.rel.type) {
             return a.rel.type === 'complementary' ? -1 : 1;
          }
          if ((b.rel.priority || 0) !== (a.rel.priority || 0)) {
             return (b.rel.priority || 0) - (a.rel.priority || 0);
          }
          return (b.rel.confidence || 0) - (a.rel.confidence || 0);
       });
       
       setCandidates(results);
       setLoading(false);
    });
    
    return () => unsub();
  }, [sourceProduct.id, products]);

  if (loading) return null;
  if (candidates.length === 0) return null;

  return (
    <div className="w-full mt-6 mb-8 px-2">`;

code = code.replace(oldRow, newRow);

// 3. Fix RecommendationRow usage
code = code.replace(/<RecommendationRow\s*sourceProduct=\{crossSellSource\}\s*recommendations=\{recommendations\}\s*products=\{products\}/s, `<RecommendationRow
            sourceProduct={crossSellSource}
            products={products}`);

fs.writeFileSync('src/App.tsx', code);
