const fs = require('fs');

let code = fs.readFileSync('src/components/admin/RelationshipManagement.tsx', 'utf8');
if (!code.includes('import { collection, doc, onSnapshot, query, updateDoc, deleteDoc, setDoc, getDoc }')) {
  code = code.replace(
    "import { collection, doc, onSnapshot, query, updateDoc, deleteDoc, setDoc } from 'firebase/firestore';",
    "import { collection, doc, onSnapshot, query, updateDoc, deleteDoc, setDoc, getDoc } from 'firebase/firestore';"
  );
}
code = code.replace("const { doc, getDoc, updateDoc, setDoc } = require('firebase/firestore');", "");
fs.writeFileSync('src/components/admin/RelationshipManagement.tsx', code);

let modalCode = fs.readFileSync('src/components/admin/AdminProductModal.tsx', 'utf8');
if (!modalCode.includes(', getDocs }')) {
  modalCode = modalCode.replace(
    "import { collection, addDoc, updateDoc, doc, setDoc } from 'firebase/firestore';",
    "import { collection, addDoc, updateDoc, doc, setDoc, getDoc, getDocs } from 'firebase/firestore';"
  );
}
modalCode = modalCode.replace("const { doc, getDoc, getDocs, collection, updateDoc, setDoc } = require('firebase/firestore');", "");
modalCode = modalCode.replace("const { doc, updateDoc } = require('firebase/firestore');", "");
fs.writeFileSync('src/components/admin/AdminProductModal.tsx', modalCode);
