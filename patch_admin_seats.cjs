const fs = require('fs');
const file = 'src/components/admin/SeatManagement.tsx';
let content = fs.readFileSync(file, 'utf8');

const oldSave = `      await setDoc(doc(db, 'seats', selectedSeatId), {
        seatId: selectedSeatId,
        isOccupied,
        allocatedTo: isOccupied ? allocateeName.trim() : null,
        phone: isOccupied ? allocateePhone.trim() : null,
        startDate: isOccupied ? startDate : null,
        deposit: isOccupied ? Number(deposit) : null,
        updatedAt: serverTimestamp()
      }, { merge: true });
            
      
      setSelectedSeatId(null);`;

const newSave = `      await setDoc(doc(db, 'seats', selectedSeatId), {
        seatId: selectedSeatId,
        isOccupied,
        allocatedTo: isOccupied ? allocateeName.trim() : null,
        phone: isOccupied ? allocateePhone.trim() : null,
        startDate: isOccupied ? startDate : null,
        deposit: isOccupied ? Number(deposit) : null,
        updatedAt: serverTimestamp()
      }, { merge: true });
      
      // Update local state manually in case quota is exceeded and listener is dead
      setSeats(prev => ({
        ...prev,
        [selectedSeatId]: {
          ...prev[selectedSeatId],
          seatId: selectedSeatId,
          isOccupied,
          allocatedTo: isOccupied ? allocateeName.trim() : null,
          phone: isOccupied ? allocateePhone.trim() : null,
          startDate: isOccupied ? startDate : null,
          deposit: isOccupied ? Number(deposit) : null,
        }
      }));
            
      setSelectedSeatId(null);`;

content = content.replace(oldSave, newSave);

const oldClear = `      await setDoc(doc(db, 'seats', selectedSeatId), {
        seatId: selectedSeatId,
        isOccupied: false,
        allocatedTo: null,
        phone: null,
        startDate: null,
        deposit: null,
        updatedAt: serverTimestamp()
      }, { merge: true });
            
      
      setSelectedSeatId(null);`;

const newClear = `      await setDoc(doc(db, 'seats', selectedSeatId), {
        seatId: selectedSeatId,
        isOccupied: false,
        allocatedTo: null,
        phone: null,
        startDate: null,
        deposit: null,
        updatedAt: serverTimestamp()
      }, { merge: true });
      
      // Update local state manually in case quota is exceeded and listener is dead
      setSeats(prev => ({
        ...prev,
        [selectedSeatId]: {
          ...prev[selectedSeatId],
          seatId: selectedSeatId,
          isOccupied: false,
          allocatedTo: null,
          phone: null,
          startDate: null,
          deposit: null,
        }
      }));
            
      setSelectedSeatId(null);`;

content = content.replace(oldClear, newClear);

fs.writeFileSync(file, content);
