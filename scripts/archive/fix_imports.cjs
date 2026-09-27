const fs = require('fs');

let modalCode = fs.readFileSync('src/components/admin/AdminProductModal.tsx', 'utf8');
if (!modalCode.includes('getDoc')) {
    modalCode = modalCode.replace(/import \{ doc, updateDoc, setDoc \} from "firebase\/firestore";/, 'import { doc, updateDoc, setDoc, getDoc, getDocs } from "firebase/firestore";');
}
fs.writeFileSync('src/components/admin/AdminProductModal.tsx', modalCode);

let relCode = fs.readFileSync('src/components/admin/RelationshipManagement.tsx', 'utf8');
if (!relCode.includes('getDocs')) {
    relCode = relCode.replace(/import \{ collection, onSnapshot, doc, deleteDoc, updateDoc, setDoc, getDoc, query \} from "firebase\/firestore";/, 'import { collection, onSnapshot, doc, deleteDoc, updateDoc, setDoc, getDoc, query, getDocs } from "firebase/firestore";');
}
fs.writeFileSync('src/components/admin/RelationshipManagement.tsx', relCode);
