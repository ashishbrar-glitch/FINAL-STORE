const fs = require('fs');
let content = fs.readFileSync('server/aiWorker.ts', 'utf8');

const newEndpoint = `
  app.post("/api/process-product", async (req, res) => {
    try {
      const authData = await verifyAdminAuth(req, res);
      if (!authData) return;
      
      const { productId } = req.body;
      if (!productId) return res.status(400).json({ error: "Missing productId" });
      
      const pFresh = await adminDb.collection('products').doc(productId).get();
      if (!pFresh.exists || pFresh.data().isActive === false || pFresh.data().isAvailable === false) {
         return res.json({ success: true, message: "Product inactive/unavailable, skipped" });
      }
      
      const pData = pFresh.data();
      const v = pData.productVersion || 1;
      const jobId = \`enrich_\${productId}_v\${v}\`;
      const jobRef = JOBS_REF.doc(jobId);
      
      await adminDb.runTransaction(async (t) => {
         const jobDoc = await t.get(jobRef);
         if (!jobDoc.exists || jobDoc.data().status === 'failed' || jobDoc.data().status === 'superseded') {
             t.set(jobRef, {
                 productId: productId,
                 productVersion: v,
                 status: 'queued',
                 lockedAt: null,
                 lockedBy: null,
                 heartbeatAt: null,
                 attempts: 0,
                 maxAttempts: 3,
                 nextRetryAt: null,
                 lastError: null,
                 lastErrorCode: null,
                 events: [{ type: 'ENQUEUED', timestamp: Date.now(), detail: 'Admin triggered product processing' }],
                 createdAt: Date.now(),
                 updatedAt: Date.now()
             });
         }
      });
      
      res.json({ success: true, enqueued: 1 });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });
`;

content = content.replace('app.post("/api/ai/enqueue", async (req, res) => {', newEndpoint + '\n  app.post("/api/ai/enqueue", async (req, res) => {');
fs.writeFileSync('server/aiWorker.ts', content);
