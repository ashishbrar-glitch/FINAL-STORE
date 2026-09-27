const fs = require('fs');

let file = 'server/aiWorker.ts';
let content = fs.readFileSync(file, 'utf8');

const replacement = `
             const pData = pFresh.data();
             
             if (pData.productVersion === data.productVersion) {
                const evs = [...(data.events || []), { type: 'RETRY_INITIATED', timestamp: Date.now(), detail: 'Admin triggered retry' }].slice(-10);
                t.update(doc.ref, {
                   status: 'queued',
                   attempts: 0,
                   events: evs,
                   nextRetryAt: null,
                   lastError: null,
                   lastErrorCode: null,
                   lockedBy: null,
                   lockedAt: null,
                   heartbeatAt: null,
                   updatedAt: Date.now()
                });
                return true;
             } else if (pData.productVersion > data.productVersion) {
                t.update(doc.ref, { status: 'superseded', updatedAt: Date.now() });
                
                const newJobId = \`enrich_\${pFresh.id}_v\${pData.productVersion}\`;
                const newJobRef = JOBS_REF.doc(newJobId);
                const newJobDoc = await t.get(newJobRef);
                
                if (!newJobDoc.exists) {
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
                }
                
                const cStatus = newJobDoc.data().status;
                if (cStatus === 'completed' || cStatus === 'queued' || cStatus === 'processing' || cStatus === 'retry_wait') {
                   return false;
                }
                
                if (cStatus === 'failed' || cStatus === 'superseded') {
                   const evs = [...(newJobDoc.data().events || []), { type: 'RETRY_INITIATED', timestamp: Date.now(), detail: 'Admin triggered retry (new version)' }].slice(-10);
                   t.update(newJobRef, {
                      status: 'queued',
                      attempts: 0,
                      events: evs,
                      nextRetryAt: null,
                      lastError: null,
                      lastErrorCode: null,
                      lockedBy: null,
                      lockedAt: null,
                      heartbeatAt: null,
                      updatedAt: Date.now()
                   });
                   return true;
                }
             }
             
             return false;
         });
         
         if (didRetry) retried++;
      }
`;

const regex = /const pData = pFresh\.data\(\);\s*if \(pData\.productVersion > data\.productVersion\) \{[^]+?\}\);\s*if \(didRetry\) retried\+\+;\s*\}/m;

if (regex.test(content)) {
    content = content.replace(regex, replacement.trim());
    fs.writeFileSync(file, content);
    console.log("Successfully patched retry transaction loop");
} else {
    console.log("Failed to match regex");
}
