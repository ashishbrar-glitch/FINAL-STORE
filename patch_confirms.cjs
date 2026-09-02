const fs = require('fs');

function patchFile(filePath, itemType) {
  let code = fs.readFileSync(filePath, 'utf8');

  // Add state for delete confirmation and error
  if (!code.includes('deleteConfirmId')) {
    code = code.replace(
      'const [loading, setLoading] = useState(true);',
      'const [loading, setLoading] = useState(true);\n  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);\n  const [actionError, setActionError] = useState<string | null>(null);'
    );
  }
  
  // Replace window.confirm in delete handler
  const confirmRegex = /if \(!window\.confirm\([^)]+\)\) return;/g;
  code = code.replace(confirmRegex, `setDeleteConfirmId(id);\n    return;\n  };\n\n  const executeDelete = async (id: string) => {`);

  // Replace alert in delete handler
  code = code.replace(/alert\("Error deleting [^"]+:\s*" \+ (err\.message)\);/g, 'setActionError("Error deleting: " + $1);');
  
  // Replace alert in save handler
  code = code.replace(/alert\("Error saving [^"]+:\s*" \+ (err\.message)\);/g, 'setActionError("Error saving: " + $1);');

  // Add the modal JSX just before the final </div> of the component, or inside the main wrapper.
  // We can inject it before the last </div>
  const modalJsx = `
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-xl">
            <h3 className="text-lg font-bold text-gray-900">Confirm Deletion</h3>
            <p className="text-gray-600">Are you sure you want to delete this ${itemType}?</p>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setDeleteConfirmId(null)} className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200">Cancel</button>
              <button onClick={() => { executeDelete(deleteConfirmId); setDeleteConfirmId(null); }} className="flex-1 px-4 py-2 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700">Delete</button>
            </div>
          </div>
        </div>
      )}
      {actionError && (
        <div className="fixed bottom-4 left-4 right-4 bg-red-600 text-white p-4 rounded-xl shadow-lg flex justify-between items-center z-50">
          <span>{actionError}</span>
          <button onClick={() => setActionError(null)} className="p-1 hover:bg-red-700 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>
      )}
  `;

  // Find the last </div> (we'll just replace the last </div> with modalJsx + </div>)
  if (!code.includes('Confirm Deletion')) {
     const lastDivIndex = code.lastIndexOf('</div>');
     if (lastDivIndex !== -1) {
       code = code.substring(0, lastDivIndex) + modalJsx + '\n</div>' + code.substring(lastDivIndex + 6);
     }
  }

  // Also replace onClick={() => handleDeleteCategory(cat.id)} if it's named something else
  // wait, the regex replaced `if (!window.confirm...) return;` with `setDeleteConfirmId(id); return; }; const executeDelete = async (id: string) => {`
  // so the original handleDelete... calls setDeleteConfirmId. That works!

  fs.writeFileSync(filePath, code);
}

patchFile('src/components/admin/CategoryManagement.tsx', 'category');
patchFile('src/components/admin/InventoryManagement.tsx', 'product');

console.log('Patched confirms successfully');
