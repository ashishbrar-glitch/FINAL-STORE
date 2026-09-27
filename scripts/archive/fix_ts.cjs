const fs = require('fs');

let modalCode = fs.readFileSync('src/components/admin/AdminProductModal.tsx', 'utf8');
if (!modalCode.includes('getDoc,')) {
    modalCode = modalCode.replace(/import \{ doc, updateDoc, setDoc \}/, 'import { doc, updateDoc, setDoc, getDoc }');
}
fs.writeFileSync('src/components/admin/AdminProductModal.tsx', modalCode);

let relCode = fs.readFileSync('src/components/admin/RelationshipManagement.tsx', 'utf8');
if (!relCode.includes('getDocs')) {
    relCode = relCode.replace(/import \{ collection, onSnapshot, doc, deleteDoc, updateDoc, setDoc, getDoc, query \}/, 'import { collection, onSnapshot, doc, deleteDoc, updateDoc, setDoc, getDoc, query, getDocs }');
}

// Fix unknown type errors for Object.values(products)
relCode = relCode.replace(/Object\.values\(products\)/g, '(Object.values(products) as any[])');

fs.writeFileSync('src/components/admin/RelationshipManagement.tsx', relCode);
