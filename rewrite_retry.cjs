const fs = require('fs');
let content = fs.readFileSync('server/aiWorker.ts', 'utf8');

const regex = /app\.post\("\/api\/ai\/retry-failed", async \(req, res\) => \{[\s\S]*?res\.json\(\{ success: true, retried \}\);\s*\} catch \(e: any\) \{/m;

const replacement = `app.post("/api/ai/retry-failed", async (req, res) => {
    try {
      const authData = await verifyAdminAuth(req, res);
      if (!authData) return;
      
      const failedJobs = await JOBS_REF.where('status', '==', 'failed').get();
      if (failedJobs.empty) {
         return res.json({ success: true, retried: 0 });
      }
      
      let retried = 0;
      for (const doc of failedJobs.docs) {
         const data = doc.data();
         const pFresh = await adminDb.collection('products').doc(data.productId).get();
         
         if (!pFresh.exists || pFresh.data().isActive === false || pFresh.data().isAvailable === false) {
             // Inactive or unavailable product, do not retry
             continue;
         }
         
         const pData = pFresh.data();
         if (pData.productVersion > data.productVersion) {
            // Outdated version: Supersede old job
            await doc.ref.update({ status: 'superseded', updatedAt: Date.now() });
            
            // Create current-version job
            const newJobId = \`enrich_\${pFresh.id}_v\${pData.productVersion}\`;
            const newJobRef = JOBS_REF.doc(newJobId);
            const newJobDoc = await newJobRef.get();
            if (!newJobDoc.exists || newJobDoc.data().status === 'failed') {
               await newJobRef.set({
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
            }
         } else {
            // Same version, just retry
            const evs = [...(data.events || []), { type: 'RETRY_INITIATED', timestamp: Date.now(), detail: 'Admin triggered retry' }].slice(-10);
            await doc.ref.update({
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
      }
      
      res.json({ success: true, retried });
    } catch (e: any) {`;

content = content.replace(regex, replacement);
fs.writeFileSync('server/aiWorker.ts', content);
