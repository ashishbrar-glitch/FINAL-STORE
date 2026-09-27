const fs = require('fs');
let content = fs.readFileSync('server/aiWorker.ts', 'utf8');

// Replace the job heartbeat batch with a transaction
content = content.replace(
  /const myJobs = await JOBS_REF\.where\('status', '==', 'processing'\)\.where\('lockedBy', '==', WORKER_ID\)\.get\(\);\s*if \(\!myJobs\.empty\) \{\s*const batch = adminDb\.batch\(\);\s*myJobs\.docs\.forEach\(d => batch\.update\(d\.ref, \{ heartbeatAt: Date\.now\(\) \}\)\);\s*await batch\.commit\(\);\s*\}/,
  `const myJobs = await JOBS_REF.where('status', '==', 'processing').where('lockedBy', '==', WORKER_ID).get();
       for (const d of myJobs.docs) {
          await adminDb.runTransaction(async (t) => {
             const fresh = await t.get(d.ref);
             if (fresh.exists && fresh.data().status === 'processing' && fresh.data().lockedBy === WORKER_ID) {
                t.update(d.ref, { heartbeatAt: Date.now() });
             }
          });
       }`
);

fs.writeFileSync('server/aiWorker.ts', content);
