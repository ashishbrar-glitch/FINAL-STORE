const fs = require('fs');

let relCode = fs.readFileSync('src/components/admin/RelationshipManagement.tsx', 'utf8');
if (!relCode.includes('getDocs')) {
    relCode = relCode.replace(/import \{ collection, doc, onSnapshot, query, updateDoc, deleteDoc, setDoc, getDoc \} from 'firebase\/firestore';/, 'import { collection, doc, onSnapshot, query, updateDoc, deleteDoc, setDoc, getDoc, getDocs } from "firebase/firestore";');
}
fs.writeFileSync('src/components/admin/RelationshipManagement.tsx', relCode);
