import React, { useState, useRef } from 'react';
import { db } from '../../lib/firebase';
import { collection, getDocs, doc, setDoc } from 'firebase/firestore';
import { Download, Upload, Loader2, Database } from 'lucide-react';

export function DataBackup() {
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleBackup = async () => {
    setIsBackingUp(true);
    try {
      // Fetch all collections
      const productsSnap = await getDocs(collection(db, 'products'));
      const categoriesSnap = await getDocs(collection(db, 'categories'));
      const seatsSnap = await getDocs(collection(db, 'seats'));

      const data = {
        products: productsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })),
        categories: categoriesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })),
        seats: seatsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      };

      // Create JSON string and trigger download
      const jsonString = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `bcn_store_backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Backup failed:', error);
      alert('Failed to create backup. Please try again.');
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleRestore = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!window.confirm('Are you sure you want to restore data? This will overwrite existing items with matching IDs.')) {
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setIsRestoring(true);
    try {
      const text = await file.text();
      const data = JSON.parse(text);

      if (!data.products || !data.categories || !data.seats) {
        throw new Error('Invalid backup file format.');
      }

      // Restore Categories
      for (const item of data.categories) {
        const { id, ...itemData } = item;
        if (id) await setDoc(doc(db, 'categories', id), itemData, { merge: true });
      }

      // Restore Products
      for (const item of data.products) {
        const { id, ...itemData } = item;
        if (id) await setDoc(doc(db, 'products', id), itemData, { merge: true });
      }

      // Restore Seats
      for (const item of data.seats) {
        const { id, ...itemData } = item;
        if (id) await setDoc(doc(db, 'seats', id), itemData, { merge: true });
      }

      alert('Data restored successfully!');
    } catch (error) {
      console.error('Restore failed:', error);
      alert('Failed to restore data. Please make sure the file is a valid backup.');
    } finally {
      setIsRestoring(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-gray-900 text-lg">Data Backup & Restore</h3>
      </div>
      
      <p className="text-sm text-gray-500">
        Download a complete backup of all products, categories, and library seat allocations. You can use this file to restore data later.
      </p>

      <div className="flex gap-3">
        <button
          onClick={handleBackup}
          disabled={isBackingUp || isRestoring}
          className="flex-1 py-3 px-4 bg-gray-900 text-white font-semibold rounded-2xl flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {isBackingUp ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
          Backup Data
        </button>

        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isBackingUp || isRestoring}
          className="flex-1 py-3 px-4 bg-white border border-gray-200 text-gray-900 font-semibold rounded-2xl flex items-center justify-center gap-2 disabled:opacity-50 shadow-sm"
        >
          {isRestoring ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
          Restore Data
        </button>
        <input
          type="file"
          accept=".json"
          ref={fileInputRef}
          onChange={handleRestore}
          className="hidden"
        />
      </div>
    </div>
  );
}
