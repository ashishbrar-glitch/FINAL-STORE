const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const targetStr = `  // Fetch real seat allocations
  const [occupiedSeats, setOccupiedSeats] = useState<Set<string>>(new Set());
  useEffect(() => {
    const fetchRealSeats = async () => {
      try {
        const snapshot = await getDocs(collection(db, "seats"));
        const occupied = new Set<string>();
        snapshot.forEach((doc) => {
          if (doc.data().isOccupied) {
            occupied.add(doc.id);
          }
        });
        setOccupiedSeats(occupied);
      } catch (err) {
        console.error(err);
      }
    };
    fetchRealSeats();
  }, [currentView]); // Re-fetch seats when opening the library`;

const replaceStr = `  // Fetch real seat allocations
  const [occupiedSeats, setOccupiedSeats] = useState<Set<string>>(new Set());
  useEffect(() => {
    const fetchRealSeats = async () => {
      const processSeats = (snapshot: any) => {
        const occupied = new Set<string>();
        snapshot.forEach((doc: any) => {
          if (doc.data().isOccupied) {
            occupied.add(doc.id);
          }
        });
        setOccupiedSeats(occupied);
      };

      try {
        const snapshot = await getDocs(collection(db, "seats"));
        processSeats(snapshot);
      } catch (err: any) {
        console.error("Seat fetch error:", err);
        if (err?.code === 'resource-exhausted' || err?.message?.toLowerCase().includes('quota')) {
          try {
            const snapshot = await getDocsFromCache(collection(db, "seats"));
            processSeats(snapshot);
          } catch (cacheErr) {
            console.error("Cache fallback for seats failed:", cacheErr);
          }
        }
      }
    };
    
    // Only fetch seats if we are viewing the library to save quota!
    if (currentView === "library" || currentView === "library-summary") {
      fetchRealSeats();
    }
  }, [currentView]); // Re-fetch seats when opening the library`;

if (code.includes(targetStr)) {
  code = code.replace(targetStr, replaceStr);
  fs.writeFileSync('src/App.tsx', code);
  console.log("Patched fetchRealSeats successfully");
} else {
  console.log("Could not find fetchRealSeats target string.");
}
