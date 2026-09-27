const fs = require('fs');

let file = 'server/aiWorker.ts';
let content = fs.readFileSync(file, 'utf8');

const replacement = `
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
                   retried++;
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
                   retried++;
                }
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
                retried++;
             }
`;

const regex = /if \(pData\.productVersion > data\.productVersion\) \{\s*t\.update\(doc\.ref, \{ status: 'superseded', updatedAt: Date\.now\(\) \}\);\s*const newJobId = [^]+?retried\+\+;\s*\}\s*\} else \{\s*const evs = [^]+?retried\+\+;\s*\}/m;

if (regex.test(content)) {
    content = content.replace(regex, replacement.trim());
    fs.writeFileSync(file, content);
    console.log("Successfully patched retry logic");
} else {
    console.log("Failed to match regex");
}
