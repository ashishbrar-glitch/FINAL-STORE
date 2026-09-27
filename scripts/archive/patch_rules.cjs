const fs = require('fs');

// Patch firestore.rules
let firestoreRules = fs.readFileSync('firestore.rules', 'utf8');
firestoreRules = firestoreRules.replace(
  /match \/users\/\{userId\} \{\n      allow read: if isSignedIn\(\) && \(request\.auth\.uid == userId \|\| isManager\(\)\);\n      allow write: if isSuperAdmin\(\) \|\| \(isSignedIn\(\) && request\.auth\.uid == userId\);\n    \}/,
  `match /users/{userId} {
      allow read: if isSignedIn() && (request.auth.uid == userId || isManager());
      allow create, delete: if isSuperAdmin();
      allow update: if isSuperAdmin() || (isSignedIn() && request.auth.uid == userId && incoming().role == existing().role && incoming().email == existing().email);
    }`
);
fs.writeFileSync('firestore.rules', firestoreRules);

// Patch storage.rules
let storageRules = `rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}`;
fs.writeFileSync('storage.rules', storageRules);

