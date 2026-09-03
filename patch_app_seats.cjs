const fs = require('fs');
const file = 'src/App.tsx';
let content = fs.readFileSync(file, 'utf8');

const oldFetchSeats = `    const fetchRealSeats = async () => {
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
        if (!(err?.code === 'resource-exhausted' || err?.message?.toLowerCase().includes('quota'))) console.error('Seat fetch error:', err);
        if (err?.code === 'resource-exhausted' || err?.message?.toLowerCase().includes('quota')) {
          try {
            const snapshot = await getDocsFromCache(collection(db, "seats"));
            processSeats(snapshot);
          } catch (cacheErr) {
            console.warn("Cache fallback for seats failed:", cacheErr);
          }
        }
      }
    };
    
    // Only fetch seats if we are viewing the library to save quota!
    if (currentView === "library" || currentView === "library-summary") {
      fetchRealSeats();
    }`;

const newFetchSeats = `    let unsub = () => {};
    // Only fetch seats if we are viewing the library to save quota!
    if (currentView === "library" || currentView === "library-summary") {
      const processSeats = (snapshot: any) => {
        const occupied = new Set<string>();
        snapshot.forEach((doc: any) => {
          if (doc.data().isOccupied) {
            occupied.add(doc.id);
          }
        });
        setOccupiedSeats(occupied);
      };

      unsub = onSnapshot(collection(db, "seats"), (snapshot) => {
        processSeats(snapshot);
      }, (err: any) => {
        if (!(err?.code === 'resource-exhausted' || err?.message?.toLowerCase().includes('quota'))) console.error('Seat fetch error:', err);
        if (err?.code === 'resource-exhausted' || err?.message?.toLowerCase().includes('quota')) {
          getDocsFromCache(collection(db, "seats"))
            .then(processSeats)
            .catch(cacheErr => console.warn("Cache fallback for seats failed:", cacheErr));
        }
      });
    }
    
    return () => unsub();`;

content = content.replace(oldFetchSeats, newFetchSeats);

fs.writeFileSync(file, content);
console.log("Patched App.tsx to use onSnapshot for seats");
