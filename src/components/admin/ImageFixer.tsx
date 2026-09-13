import React, { useState, useEffect } from 'react';
import { db } from '../../lib/firebase';
import { collection, getDocs, doc, setDoc } from 'firebase/firestore';
import { Scissors, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { autoCropImage } from '../../lib/autoCrop';

export function ImageFixer() {
  const [hasStarted, setHasStarted] = useState(false);
  const [isFixing, setIsFixing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [total, setTotal] = useState(0);
  const [fixedCount, setFixedCount] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const [isFinished, setIsFinished] = useState(false);

  const addLog = (msg: string) => {
    setLogs(prev => [msg, ...prev].slice(0, 10));
  };

  const fixImages = async () => {
    setHasStarted(true);
    setIsFixing(true);
    setIsFinished(false);
    setProgress(0);
    setFixedCount(0);
    setLogs(["Initializing scanner..."]);
    
    // Force React to render the loading state BEFORE doing any heavy lifting
    await new Promise(resolve => setTimeout(resolve, 100));
    
    try {
      addLog("Fetching products from database...");
      const snap = await getDocs(collection(db, 'products'));
      const products = snap.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) }));
      setTotal(products.length);
      addLog(`Found ${products.length} products to scan.`);
      
      let fixed = 0;
      let current = 0;
      
      for (const product of products) {
        current++;
        setProgress(current);
        
        // Yield to the main thread so React can render the progress bar visually
        await new Promise(resolve => setTimeout(resolve, 50));
        
        if (product.image && (product.image.startsWith('data:image') || product.image.startsWith('http'))) {
          addLog(`Scanning product: ${product.name}`);
          try {
            const cropped = await autoCropImage(product.image);
            if (cropped) {
              await setDoc(doc(db, 'products', product.id as string), { image: cropped }, { merge: true });
              fixed++;
              setFixedCount(fixed);
              addLog(`✅ Cropped & saved: ${product.name}`);
            } else {
              addLog(`Skipped (No cropping needed): ${product.name}`);
            }
          } catch (e: any) {
            console.error("Failed to crop image for", product.name, e);
            addLog(`❌ Failed to process ${product.name}: ${e.message || "Unknown error"}`);
          }
        } else {
          addLog(`Skipped (No image or invalid format): ${product.name}`);
        }
      }
      
      addLog(`🎉 Finished scanning! Fixed ${fixed} images.`);
    } catch (e: any) {
      console.error(e);
      addLog(`❌ Fatal Error: ${e.message}`);
    } finally {
      setIsFinished(true);
      setIsFixing(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm mt-8">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
          <Scissors className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <h3 className="font-bold text-gray-900 text-lg">Auto-Fix Small Images</h3>
          <p className="text-sm text-gray-500">Automatically crops excess whitespace from product images to make them display larger and uniformly.</p>
        </div>
      </div>
      
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <button
            onClick={fixImages}
            disabled={isFixing}
            className="py-3 px-5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-2xl flex items-center justify-center gap-2 disabled:opacity-50 shadow-sm transition-colors"
          >
            {isFixing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Scissors className="w-5 h-5" />}
            {isFixing ? 'Scanning...' : 'Scan & Fix Images Now'}
          </button>
          
          {isFinished && (
            <div className="text-sm font-medium text-green-600 flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" />
              Finished. Fixed {fixedCount} images.
            </div>
          )}
        </div>

        {hasStarted && (
          <div className="w-full bg-gray-50 rounded-xl p-4 border border-gray-100 flex flex-col gap-3">
            <div className="flex justify-between text-sm font-medium text-gray-700">
              <span className="flex items-center gap-2">
                {isFixing ? <Loader2 className="w-4 h-4 animate-spin text-blue-600" /> : <CheckCircle2 className="w-4 h-4 text-green-600" />}
                {total === 0 ? "Fetching products from database..." : `Processed ${progress} of ${total} products...`}
              </span>
              <span>{total === 0 ? "0%" : `${Math.round((progress / total) * 100)}%`}</span>
            </div>
            
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-300 ease-out ${isFinished ? 'bg-green-500' : 'bg-blue-600'}`}
                style={{ width: `${total === 0 ? 0 : (progress / total) * 100}%` }}
              ></div>
            </div>
            
            <div className="flex justify-between items-center text-xs text-gray-500 mt-1">
              <span>Successfully fixed: <strong className="text-gray-900">{fixedCount}</strong> images</span>
            </div>

            {logs.length > 0 && (
              <div className="mt-2 bg-gray-900 text-gray-300 text-xs font-mono p-3 rounded-lg flex flex-col gap-1 max-h-32 overflow-y-auto">
                {logs.map((log, i) => (
                  <div key={i} className="truncate">{log}</div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
