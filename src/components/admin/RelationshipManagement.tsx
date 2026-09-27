import React, { useState, useEffect } from "react";
import { auth } from "../../lib/firebase";
import { Loader2, Play, Pause, RefreshCw, AlertCircle } from "lucide-react";

import { collection, doc, setDoc, deleteDoc, updateDoc } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { onSnapshot } from "firebase/firestore";
import { Plus, CheckCircle, XCircle, Trash2, Zap, Network } from "lucide-react";


export function RelationshipManagement() {
  const user = auth.currentUser;
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  
  const [productsRaw, setProductsRaw] = useState<any[]>([]);
  const [relationships, setRelationships] = useState<any[]>([]);
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [newRel, setNewRel] = useState({ p1: "", p2: "", type: "similar" });

  useEffect(() => {
    const unsubProducts = onSnapshot(collection(db, "products"), (snap) => {
      setProductsRaw(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    const unsubRels = onSnapshot(collection(db, "productRecommendations"), (snap) => {
      setRelationships(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => {
      unsubProducts();
      unsubRels();
    };
  }, []);

  const products = productsRaw.reduce((acc: any, p: any) => ({ ...acc, [p.id]: p }), {});
  
  const addRelationship = async () => {
    if (!newRel.p1 || !newRel.p2 || newRel.p1 === newRel.p2) return;
    const relId = `${newRel.p1}_${newRel.p2}`;
    await setDoc(doc(db, "productRecommendations", relId), {
      sourceProductId: newRel.p1,
      targetProductId: newRel.p2,
      type: newRel.type,
      placement: "goes_well_with",
      confidence: 1.0,
      priority: 100,
      categoryFit: 1.0,
      priceFit: 1.0,
      bestsellerBoost: 0,
      source: "manual",
      status: "approved",
      updatedAt: Date.now(),
      createdAt: Date.now()
    });
    setNewRel({ p1: "", p2: "", type: "similar" });
    setShowAddForm(false);
  };
  
  const updateStatus = async (id: string, status: string) => {
    await updateDoc(doc(db, "productRecommendations", id), { status, updatedAt: Date.now() });
  };
  
  const deleteRelationship = async (id: string) => {
    if (confirm("Are you sure you want to delete this relationship?")) {
      await deleteDoc(doc(db, "productRecommendations", id));
    }
  };

  const fetchStatus = async () => {
    if (!user) return;
    try {
      const token = await user.getIdToken();
      const res = await fetch("/api/ai/status", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      setStatus(data);
    } catch (e: any) {
      if (e.message !== "Failed to fetch" && !e.message?.includes("Unexpected token \'<\'")) {
        console.error(e);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 5000);
    return () => clearInterval(interval);
  }, [user]);

  const handleAction = async (endpoint: string) => {
    if (!user) return;
    setActionLoading(true);
    try {
      const token = await user.getIdToken();
      await fetch(endpoint, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` }
      });
      await fetchStatus();
    } catch (e: any) {
      if (e.message !== "Failed to fetch" && !e.message?.includes("Unexpected token \'<\'")) {
        console.error(e);
      }
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return <div className="p-8 flex justify-center"><Loader2 className="animate-spin w-8 h-8 text-neutral-400" /></div>;
  }

  const worker = status?.worker || { status: 'IDLE' };
  const counts = status?.counts || { queued: 0, processing: 0, completed: 0, failed: 0, retry_wait: 0, superseded: 0 };
  const total = counts.queued + counts.processing + counts.completed + counts.failed + counts.retry_wait + counts.superseded;
  
  const progress = total > 0 ? (counts.completed / total) * 100 : 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold mb-1">AI Product Enrichment Engine</h2>
        <p className="text-neutral-500 text-sm">Background processor for search aliases and product relationships.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-xl border border-neutral-200">
          <div className="text-sm font-medium text-neutral-500 mb-2">Worker Status</div>
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${worker.status === 'RUNNING' ? 'bg-green-500 animate-pulse' : worker.status === 'PAUSED' ? 'bg-amber-500' : worker.status === 'QUOTA_EXHAUSTED' ? 'bg-red-500' : 'bg-neutral-300'}`}></div>
            <span className="font-bold text-lg">{worker.status}</span>
          </div>
          {worker.pauseReason && (
            <div className="mt-2 text-xs text-red-600 bg-red-50 p-2 rounded-md flex items-start gap-1">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{worker.pauseReason}</span>
            </div>
          )}
        </div>
        
        <div className="bg-white p-6 rounded-xl border border-neutral-200">
          <div className="text-sm font-medium text-neutral-500 mb-2">Progress</div>
          <div className="font-bold text-2xl mb-2">{Math.round(progress)}%</div>
          <div className="w-full bg-neutral-100 rounded-full h-2">
            <div className="bg-black h-2 rounded-full transition-all" style={{ width: `${progress}%` }}></div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-neutral-200">
          <div className="text-sm font-medium text-neutral-500 mb-2">Controls</div>
          <div className="flex flex-wrap gap-2">
            {worker.status !== 'RUNNING' ? (
              <button onClick={() => handleAction("/api/ai/start")} disabled={actionLoading} className="flex items-center gap-1 bg-black text-white px-3 py-1.5 rounded-lg text-sm hover:bg-neutral-800 disabled:opacity-50">
                <Play className="w-4 h-4" /> Start
              </button>
            ) : (
              <button onClick={() => handleAction("/api/ai/pause")} disabled={actionLoading} className="flex items-center gap-1 bg-amber-500 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-amber-600 disabled:opacity-50">
                <Pause className="w-4 h-4" /> Pause
              </button>
            )}
            
            <button onClick={() => handleAction("/api/ai/enqueue")} disabled={actionLoading} className="flex items-center gap-1 bg-neutral-100 text-black px-3 py-1.5 rounded-lg text-sm hover:bg-neutral-200 border border-neutral-200 disabled:opacity-50">
               Queue Missing
            </button>
            
            <button onClick={() => handleAction("/api/ai/migrate-zombies")} disabled={actionLoading} className="flex items-center gap-1 bg-neutral-100 text-black px-3 py-1.5 rounded-lg text-sm hover:bg-neutral-200 border border-neutral-200 disabled:opacity-50">
               Migrate Stuck
            </button>

            <button onClick={() => handleAction("/api/ai/retry-failed")} disabled={actionLoading} className="flex items-center gap-1 bg-red-50 text-red-600 px-3 py-1.5 rounded-lg text-sm hover:bg-red-100 border border-red-200 disabled:opacity-50">
               Retry Failed
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
        <div className="p-4 border-b border-neutral-100 bg-neutral-50">
          <h3 className="font-semibold">Queue Statistics</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-6 divide-y md:divide-y-0 md:divide-x divide-neutral-100">
          <div className="p-4 text-center">
            <div className="text-2xl font-bold text-neutral-800">{counts.queued}</div>
            <div className="text-xs text-neutral-500 uppercase tracking-wider font-medium mt-1">Queued</div>
          </div>
          <div className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{counts.processing}</div>
            <div className="text-xs text-neutral-500 uppercase tracking-wider font-medium mt-1">Processing</div>
          </div>
          <div className="p-4 text-center">
            <div className="text-2xl font-bold text-amber-500">{counts.retry_wait}</div>
            <div className="text-xs text-neutral-500 uppercase tracking-wider font-medium mt-1">Retry Wait</div>
          </div>
          <div className="p-4 text-center">
            <div className="text-2xl font-bold text-red-500">{counts.failed}</div>
            <div className="text-xs text-neutral-500 uppercase tracking-wider font-medium mt-1">Failed</div>
          </div>
          <div className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{counts.completed}</div>
            <div className="text-xs text-neutral-500 uppercase tracking-wider font-medium mt-1">Completed</div>
          </div>
          <div className="p-4 text-center">
            <div className="text-2xl font-bold text-neutral-400">{counts.superseded}</div>
            <div className="text-xs text-neutral-500 uppercase tracking-wider font-medium mt-1">Superseded</div>
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center pt-8 border-t border-neutral-100">
        <h2 className="text-xl font-bold">Manual Relationships</h2>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Manual
        </button>
      </div>

      {showAddForm && (
        <div className="bg-white border border-gray-200 p-4 rounded-xl shadow-sm space-y-3 mb-4">
           <h3 className="text-sm font-bold text-gray-800">Add Manual Relationship</h3>
           <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <select
                 value={newRel.p1}
                 onChange={e => setNewRel({...newRel, p1: e.target.value})}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-green-500"
              >
                 <option value="">Select Product 1</option>
                 {(Object.values(products) as any[]).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <select
                 value={newRel.p2}
                 onChange={e => setNewRel({...newRel, p2: e.target.value})}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-green-500"
              >
                 <option value="">Select Product 2</option>
                 {(Object.values(products) as any[]).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <select
                 value={newRel.type}
                 onChange={e => setNewRel({...newRel, type: e.target.value})}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-green-500"
              >
                 <option value="similar">Similar (Substitutes)</option>
                 <option value="complementary">Complementary (Pairs well)</option>
              </select>
           </div>
           <div className="flex justify-end gap-2">
              <button onClick={() => setShowAddForm(false)} className="px-3 py-1.5 text-gray-500 hover:text-gray-700 text-sm font-medium">Cancel</button>
              <button onClick={addRelationship} className="bg-green-600 hover:bg-green-700 text-white px-4 py-1.5 rounded-lg text-sm font-bold">Add Relationship</button>
           </div>
        </div>
      )}
      
      <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
        {!(relationships || []).length ? (
           <div className="text-center py-8 text-gray-400 text-sm font-medium">No relationships found.</div>
        ) : (relationships || []).map((r: any) => {
           const p1 = products[r.sourceProductId];
           const p2 = products[r.targetProductId];
           if (!p1 || !p2) return null;
           return (
             <div key={r.id} className="bg-gray-50 border border-gray-100 p-3 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
               <div className="flex-1">
                 <div className="flex items-center gap-2">
                   <div className="w-8 h-8 rounded bg-white border flex items-center justify-center shrink-0">
                      {p1.image ? (!p1.image.startsWith('http') && p1.image.length < 10 ? p1.image : <img src={p1.image} className="w-full h-full object-contain" alt=""/>) : null}
                   </div>
                   <span className="text-sm font-semibold text-gray-800 line-clamp-1">{p1.name}</span>
                   <Network className="w-3 h-3 text-gray-400 shrink-0 mx-1" />
                   <div className="w-8 h-8 rounded bg-white border flex items-center justify-center shrink-0">
                      {p2.image ? (!p2.image.startsWith('http') && p2.image.length < 10 ? p2.image : <img src={p2.image} className="w-full h-full object-contain" alt=""/>) : null}
                   </div>
                   <span className="text-sm font-semibold text-gray-800 line-clamp-1">{p2.name}</span>
                 </div>
                 <div className="mt-1.5 flex gap-2 text-[10px] font-bold uppercase tracking-wider text-gray-500">
                    <span className="bg-gray-200/50 px-1.5 py-0.5 rounded">{r.type}</span>
                    <span className="bg-blue-100/50 text-blue-700 px-1.5 py-0.5 rounded">{r.placement || 'goes_well_with'}</span>
                    <span>Prio: {r.priority}</span>
                    <span>Conf: {Math.round((r.confidence||0)*100)}%</span>
                 </div>
               </div>
               
               <div className="flex items-center gap-2">
                 {r.status !== 'approved' && (
                   <button 
                     onClick={() => updateStatus(r.id, 'approved')}
                     className="px-3 py-1.5 bg-green-50 text-green-700 hover:bg-green-100 font-bold text-xs rounded-lg flex items-center gap-1 transition-colors"
                   >
                     <CheckCircle className="w-3 h-3" /> Approve
                   </button>
                 )}
                 {r.status !== 'blocked' && (
                   <button 
                     onClick={() => updateStatus(r.id, 'blocked')}
                     className="px-3 py-1.5 bg-red-50 text-red-700 hover:bg-red-100 font-bold text-xs rounded-lg flex items-center gap-1 transition-colors"
                   >
                     <XCircle className="w-3 h-3" /> Block
                   </button>
                 )}
                 <button 
                   onClick={() => deleteRelationship(r.id)}
                   className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors ml-1"
                   title="Delete Relationship"
                 >
                   <Trash2 className="w-4 h-4" />
                 </button>
               </div>
             </div>
           );
        })}
      </div>
    </div>

  );
}
