const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const serviceAccount = require('./firebase-applet-config.json');

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();
db.collection('users').get().then(snap => {
  snap.forEach(doc => {
    console.log(doc.id, doc.data());
  });
}).catch(e => console.error(e));
