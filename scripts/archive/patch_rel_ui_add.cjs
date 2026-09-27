const fs = require('fs');
let code = fs.readFileSync('src/components/admin/RelationshipManagement.tsx', 'utf8');

if (!code.includes('import { deleteDoc')) {
   code = code.replace(
     "import { collection, doc, onSnapshot, query, updateDoc } from 'firebase/firestore';",
     "import { collection, doc, onSnapshot, query, updateDoc, deleteDoc, setDoc } from 'firebase/firestore';"
   );
}
if (!code.includes('import { Plus')) {
   code = code.replace(
     "import { Network, CheckCircle, XCircle, RefreshCw, Loader2, Search, Zap } from 'lucide-react';",
     "import { Network, CheckCircle, XCircle, RefreshCw, Loader2, Search, Zap, Plus, Trash2 } from 'lucide-react';"
   );
}

// Add state for modal
code = code.replace(
  'const [triggering, setTriggering] = useState(false);',
  'const [triggering, setTriggering] = useState(false);\n  const [showAddForm, setShowAddForm] = useState(false);\n  const [newRel, setNewRel] = useState({ p1: "", p2: "", type: "similar" });'
);

// Delete function
const deleteStatusStr = `  const updateStatus = async (id: string, status: string) => {`;
const deleteFunc = `  const deleteRelationship = async (id: string) => {
    if (!confirm("Are you sure you want to delete this relationship?")) return;
    try {
      await deleteDoc(doc(db, "productRelationships", id));
    } catch (e) {
      console.error(e);
      alert("Failed to delete relationship");
    }
  };
  
  const addRelationship = async () => {
    if (!newRel.p1 || !newRel.p2 || newRel.p1 === newRel.p2) {
       alert("Please select two different products.");
       return;
    }
    const sortedIds = [newRel.p1, newRel.p2].sort();
    const relId = sortedIds.join('_');
    try {
      await setDoc(doc(db, "productRelationships", relId), {
         participants: sortedIds,
         type: newRel.type,
         confidence: 1.0,
         source: "manual",
         status: "approved",
         createdAt: Date.now(),
         updatedAt: Date.now()
      });
      setShowAddForm(false);
      setNewRel({ p1: "", p2: "", type: "similar" });
    } catch (e) {
      console.error(e);
      alert("Failed to add relationship");
    }
  };

  const updateStatus = async (id: string, status: string) => {`;

code = code.replace(deleteStatusStr, deleteFunc);

// Buttons and UI
const generateMissingBtnStr = `          {triggering ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}\n          Generate Missing ({Object.values(products).filter(p => p.searchStatus !== "ready" && p.searchStatus !== "processing").length})\n        </button>`;

const generateAndAddBtnStr = `          {triggering ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}\n          Generate Missing ({Object.values(products).filter(p => p.searchStatus !== "ready" && p.searchStatus !== "processing").length})\n        </button>\n        <button\n          onClick={() => setShowAddForm(!showAddForm)}\n          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors"\n        >\n          <Plus className="w-4 h-4" /> Add Manual\n        </button>`;

code = code.replace(generateMissingBtnStr, generateAndAddBtnStr);

const addFormStr = `      <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">`;

const addFormHtml = `      {showAddForm && (
        <div className="bg-white border border-gray-200 p-4 rounded-xl shadow-sm space-y-3 mb-4">
           <h3 className="text-sm font-bold text-gray-800">Add Manual Relationship</h3>
           <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <select 
                value={newRel.p1} 
                onChange={e => setNewRel({...newRel, p1: e.target.value})}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-green-500"
              >
                 <option value="">Select Product 1</option>
                 {Object.values(products).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <select 
                value={newRel.p2} 
                onChange={e => setNewRel({...newRel, p2: e.target.value})}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-green-500"
              >
                 <option value="">Select Product 2</option>
                 {Object.values(products).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
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
      <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">`;

code = code.replace(addFormStr, addFormHtml);

const blockBtnStr = `                   </button>\n                 )}\n               </div>`;
const deleteBtnStr = `                   </button>\n                 )}\n                 <button \n                   onClick={() => deleteRelationship(r.id)}\n                   className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors ml-1"\n                   title="Delete Relationship"\n                 >\n                   <Trash2 className="w-4 h-4" />\n                 </button>\n               </div>`;

code = code.replace(blockBtnStr, deleteBtnStr);

fs.writeFileSync('src/components/admin/RelationshipManagement.tsx', code);
