const fs = require('fs');
let code = fs.readFileSync('src/components/admin/SeatManagement.tsx', 'utf8');

code = code.replace(/getDocs,/, 'getDocs, getDocsFromCache,');

const fetchSeatRegex = /const fetchSeats = async \(\) => \{\s*try \{\s*const snapshot = await getDocs\(collection\(db, 'seats'\)\);\s*const seatData: Record<string, any> = \{\};\s*snapshot\.forEach\(doc => \{\s*seatData\[doc\.id\] = doc\.data\(\);\s*\}\);\s*setSeats\(seatData\);\s*\} catch \(err\) \{\s*console\.error\(err\);\s*\} finally \{\s*setLoading\(false\);\s*\}\s*\};/g;

const fetchSeatReplace = `const fetchSeats = async () => {
    const processSeats = (snapshot: any) => {
      const seatData: Record<string, any> = {};
      snapshot.forEach((doc: any) => {
        seatData[doc.id] = doc.data();
      });
      setSeats(seatData);
    };
    try {
      const snapshot = await getDocs(collection(db, 'seats'));
      processSeats(snapshot);
    } catch (err: any) {
      console.error("Fetch seats error:", err);
      if (err?.code === 'resource-exhausted' || err?.message?.toLowerCase().includes('quota')) {
        try {
          const snapshot = await getDocsFromCache(collection(db, 'seats'));
          processSeats(snapshot);
        } catch (e) { console.error(e); }
      }
    } finally {
      setLoading(false);
    }
  };`;

code = code.replace(fetchSeatRegex, fetchSeatReplace);
fs.writeFileSync('src/components/admin/SeatManagement.tsx', code);
console.log("Patched SeatManagement successfully");
