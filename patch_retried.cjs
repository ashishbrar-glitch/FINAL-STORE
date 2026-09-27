const fs = require('fs');

let file = 'server/aiWorker.ts';
let content = fs.readFileSync(file, 'utf8');

const regex = /let retried = 0;\s*for \(const doc of failedJobs\.docs\) \{\s*await adminDb\.runTransaction\(async \(t\) => \{([^]+?)\}\);\s*\}/m;

const replacement = `
      let retried = 0;
      for (const doc of failedJobs.docs) {
         const didRetry = await adminDb.runTransaction(async (t) => {
             const freshJob = await t.get(doc.ref);
             if (!freshJob.exists || freshJob.data().status !== 'failed') return false;
             const data = freshJob.data();
             
             const pRef = adminDb.collection('products').doc(data.productId);
             const pFresh = await t.get(pRef);
             
             if (!pFresh.exists || pFresh.data().isActive === false || pFresh.data().isAvailable === false) {
                 return false;
             }
             
             const pData = pFresh.data();
             if (pData.productVersion > data.productVersion) {
                t.update(doc.ref, { status: 'superseded', updatedAt: Date.now() });
                
                const newJobId = \`enrich_\${pFresh.id}_v\${pData.productVersion}\`;
                const newJobRef = JOBS_REF.doc(newJobId);
                const newJobDoc = await t.get(newJobRef);
                
                if (!newJobDoc.exists || newJobDoc.data().status === 'superseded') {
                   t.set(newJobRef, {
                     productId: pFresh.id,
                     productVersion: pData.productVersion,
                     status: 'queued',
                     lockedAt: null,
                     lockedBy: null,
                     heartbeatAt: null,
                     attempts: 0,
                     maxAttempts: 3,
                     nextRetryAt: null,
                     lastError: null,
                     lastErrorCode: null,
                     events: [{ type: 'RETRY_INITIATED', timestamp: Date.now(), detail: 'Admin triggered retry (new version)' }],
                     createdAt: Date.now(),
                     updatedAt: Date.now()
                   });
                   return true;
                } else if (newJobDoc.data().status === 'failed') {
                   const evs = [...(newJobDoc.data().events || []), { type: 'RETRY_INITIATED', timestamp: Date.now(), detail: 'Admin triggered retry (new version)' }].slice(-10);
                   t.update(newJobRef, {
                      status: 'queued',
                      attempts: 0,
                      events: evs,
                      nextRetryAt: null,
                      lastError: null,
                      lastErrorCode: null,
                      updatedAt: Date.now()
                   });
                   return true;
                }
                return false;
             } else {
                const evs = [...(data.events || []), { type: 'RETRY_INITIATED', timestamp: Date.now(), detail: 'Admin triggered retry' }].slice(-10);
                t.update(doc.ref, {
                   status: 'queued',
                   attempts: 0,
                   events: evs,
                   nextRetryAt: null,
                   lastError: null,
                   lastErrorCode: null,
                   updatedAt: Date.now()
                });
                return true;
             }
         });
         
         if (didRetry) retried++;
      }
`;

if (regex.test(content)) {
    content = content.replace(regex, replacement.trim());
    fs.writeFileSync(file, content);
    console.log("Successfully patched retry transaction loop");
} else {
    console.log("Failed to match regex");
}
