const fs = require('fs');
let content = fs.readFileSync('server/aiWorker.ts', 'utf8');

const regex = /if \(\!productSnap\.exists\) \{[\s\S]*?return;\s*\}\s*const product = productSnap\.data\(\);\s*const currentVersion = product\.productVersion \|\| 1;\s*if \(currentVersion > job\.productVersion\) \{[\s\S]*?return;\s*\}/m;

const replacement = `if (!productSnap.exists) {
        await adminDb.runTransaction(async (t) => {
           const freshJob = await t.get(jobDoc.ref);
           if (!freshJob.exists || freshJob.data().lockedBy !== WORKER_ID || freshJob.data().status !== 'processing') return;
           t.update(jobDoc.ref, { status: 'failed', lastError: 'Product deleted', updatedAt: Date.now() });
        });
        return;
      }
      const product = productSnap.data();
      const currentVersion = product.productVersion || 1;
      
      if (currentVersion > job.productVersion) {
        await adminDb.runTransaction(async (t) => {
           const freshJob = await t.get(jobDoc.ref);
           if (!freshJob.exists || freshJob.data().lockedBy !== WORKER_ID || freshJob.data().status !== 'processing') return;
           t.update(jobDoc.ref, { status: 'superseded', updatedAt: Date.now() });
        });
        return;
      }`;

content = content.replace(regex, replacement);
fs.writeFileSync('server/aiWorker.ts', content);
