import React, { useState, useEffect } from 'react';
import { db } from '../../lib/firebase';
import { collection, getDocs, getDocsFromCache, doc, setDoc, serverTimestamp, onSnapshot } from 'firebase/firestore';
import { User, Loader2, UserMinus } from 'lucide-react';

// Reusing same seat generation logic
const GIRLS_SEATS = Array.from({ length: 33 }, (_, i) => `G${i + 1}`);
const BOYS_SEATS = Array.from({ length: 38 }, (_, i) => `B${i + 34}`);

export function SeatManagement() {
  const [seats, setSeats] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<'girls' | 'boys'>('girls');

  // Modal State
  const [selectedSeatId, setSelectedSeatId] = useState<string | null>(null);
  const [allocateeName, setAllocateeName] = useState('');
  const [allocateePhone, setAllocateePhone] = useState('');
  const [startDate, setStartDate] = useState('');
  const [deposit, setDeposit] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    const processSeats = (snapshot: any) => {
      const seatData: Record<string, any> = {};
      snapshot.forEach((doc: any) => {
        seatData[doc.id] = doc.data();
      });
      setSeats(seatData);
      setLoading(false);
    };

    const unsub = onSnapshot(collection(db, 'seats'), (snapshot) => {
      processSeats(snapshot);
    }, (err: any) => {
      if (!(err?.code === 'resource-exhausted' || err?.message?.toLowerCase().includes('quota'))) console.error('Fetch seats error:', err);
      if (err?.code === 'resource-exhausted' || err?.message?.toLowerCase().includes('quota')) {
        getDocsFromCache(collection(db, 'seats'))
          .then(processSeats)
          .catch(e => { console.error(e); setLoading(false); });
      } else {
        setLoading(false);
      }
    });

    return () => unsub();
  }, []);

  const handleSeatClick = (seatId: string) => {
    setSelectedSeatId(seatId);
    setAllocateeName(seats[seatId]?.allocatedTo || '');
    setAllocateePhone(seats[seatId]?.phone || '');
    setStartDate(seats[seatId]?.startDate || '');
    setDeposit(seats[seatId]?.deposit?.toString() || '');
  };

  const handleSaveAllocation = async () => {
    if (!selectedSeatId) return;
    setActionLoading(true);
        
    try {
      const isOccupied = allocateeName.trim().length > 0;
      await setDoc(doc(db, 'seats', selectedSeatId), {
        seatId: selectedSeatId,
        isOccupied,
        allocatedTo: isOccupied ? allocateeName.trim() : null,
        phone: isOccupied ? allocateePhone.trim() : null,
        startDate: isOccupied ? startDate : null,
        deposit: isOccupied ? Number(deposit) : null,
        updatedAt: serverTimestamp()
      }, { merge: true });
            
      
      setSelectedSeatId(null);
    } catch (err: any) {
      alert("Error saving: " + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleClearSeat = async () => {
    if (!selectedSeatId) return;
    setAllocateeName('');
    setAllocateePhone('');
    setStartDate('');
    setDeposit('');
    setActionLoading(true);
        
    try {
      await setDoc(doc(db, 'seats', selectedSeatId), {
        seatId: selectedSeatId,
        isOccupied: false,
        allocatedTo: null,
        phone: null,
        startDate: null,
        deposit: null,
        updatedAt: serverTimestamp()
      }, { merge: true });
            
      
      setSelectedSeatId(null);
    } catch (err: any) {
      alert("Error clearing: " + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <div className="p-8 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-gray-900 text-lg">Seat Allocation</h3>
      </div>

      <div className="bg-gray-50 p-1 rounded-xl flex items-center border border-gray-200">
        <button 
          onClick={() => setActiveSection('girls')}
          className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-colors ${activeSection === 'girls' ? 'bg-white shadow border border-gray-200 text-gray-900' : 'text-gray-500'}`}
        >
          Girls (G1-G33)
        </button>
        <button 
          onClick={() => setActiveSection('boys')}
          className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-colors ${activeSection === 'boys' ? 'bg-white shadow border border-gray-200 text-gray-900' : 'text-gray-500'}`}
        >
          Boys (B34-B71)
        </button>
      </div>

      <div className="grid grid-cols-5 gap-2">
        {(activeSection === 'girls' ? GIRLS_SEATS : BOYS_SEATS).map(seatId => {
          const isOccupied = seats[seatId]?.isOccupied;
          return (
            <button
              key={seatId}
              onClick={() => handleSeatClick(seatId)}
              className={`
                aspect-square rounded-lg border-2 font-medium text-xs transition-all flex flex-col items-center justify-center
                ${isOccupied 
                  ? 'bg-blue-50 border-blue-200 text-blue-700' 
                  : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                }
              `}
            >
              <span>{seatId}</span>
              {isOccupied && <User className="w-3 h-3 mt-0.5 opacity-60" />}
            </button>
          );
        })}
      </div>

      {/* Allocation Modal (Inline) */}
      {selectedSeatId && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-xl space-y-4">
            <h3 className="font-bold text-xl text-gray-900 text-center">Manage Seat {selectedSeatId}</h3>
            
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-700 ml-1">Student Name</label>
                <input 
                  type="text" 
                  value={allocateeName}
                  onChange={e => setAllocateeName(e.target.value)}
                  placeholder="Leave blank to make available"
                  className="w-full px-4 py-2.5 rounded-2xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-700 ml-1">Phone Number</label>
                <input 
                  type="tel" 
                  value={allocateePhone}
                  onChange={e => setAllocateePhone(e.target.value)}
                  placeholder="e.g. 9876543210"
                  className="w-full px-4 py-2.5 rounded-2xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-700 ml-1">Start Date</label>
                  <input 
                    type="date" 
                    value={startDate}
                    onChange={e => setStartDate(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-2xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-700 ml-1">Deposit (₹)</label>
                  <input 
                    type="number" 
                    value={deposit}
                    onChange={e => setDeposit(e.target.value)}
                    placeholder="Amount"
                    className="w-full px-3 py-2.5 rounded-2xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
            
            <div className="flex gap-2 pt-2">
              <button 
                onClick={() => setSelectedSeatId(null)}
                className="flex-1 py-3 bg-gray-100 text-gray-700 font-semibold rounded-2xl"
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveAllocation}
                disabled={actionLoading}
                className="flex-1 py-3 bg-blue-600 text-white font-semibold rounded-2xl flex items-center justify-center"
              >
                {actionLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Save'}
              </button>
            </div>
            
            {seats[selectedSeatId]?.isOccupied && (
              <button 
                onClick={handleClearSeat}
                disabled={actionLoading}
                className="w-full py-3 bg-red-50 text-red-600 font-semibold rounded-2xl flex items-center justify-center gap-2 mt-2"
              >
                <UserMinus className="w-4 h-4" /> Clear Seat (Make Available)
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
