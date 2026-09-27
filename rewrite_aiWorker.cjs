const fs = require('fs');

let content = fs.readFileSync('server/aiWorker.ts', 'utf8');

// 1. Fix Error Classification
content = content.replace(
  /function classifyAIError[\s\S]*?return 'UNKNOWN';\n  }/,
  `function classifyAIError(err: any) {
    const status = err?.status || err?.response?.status;
    const code = err?.code;
    const msg = (err?.message || '').toLowerCase();
    
    // Check actual Google GenAI SDK error properties if present
    if (status === 429) return 'RATE_LIMIT';
    if (status === 403) {
      if (msg.includes('quota')) return 'QUOTA_EXHAUSTED';
      return 'AUTHENTICATION';
    }
    if (status === 401) return 'AUTHENTICATION';
    if (status === 400) {
       // Only if token/size limit
       if (msg.includes('token') || msg.includes('size') || msg.includes('too large')) return 'TOKEN_LIMIT';
       if (msg.includes('safety') || msg.includes('policy')) return 'CONTENT_POLICY';
    }
    if (status >= 500) return 'TRANSIENT';
    if (err instanceof SyntaxError || err?.name === 'SyntaxError') return 'INVALID_RESPONSE';
    return 'UNKNOWN';
  }`
);

// 2. Harden /api/ai/start
content = content.replace(
  /app\.post\("\/api\/ai\/start"[\s\S]*?\/\/ Pause Worker/,
  `app.post("/api/ai/start", async (req, res) => {
    try {
      const authData = await verifyAdminAuth(req, res);
      if (!authData) return;
      
      await adminDb.runTransaction(async (t) => {
         const doc = await t.get(GLOBAL_WORKER_REF);
         if (!doc.exists) {
            t.set(GLOBAL_WORKER_REF, {
              status: 'RUNNING',
              pauseReason: null,
              workerId: WORKER_ID,
              workerStartedAt: Date.now(),
              workerHeartbeatAt: Date.now(),
              concurrencyLimit: 1,
              updatedAt: Date.now()
            });
         } else {
            const data = doc.data();
            if (data.status === 'RUNNING') {
               const staleWorker = Date.now() - (data.workerHeartbeatAt || 0) > (3 * 60 * 1000);
               if (staleWorker) {
                  t.update(GLOBAL_WORKER_REF, { workerId: WORKER_ID, workerStartedAt: Date.now(), workerHeartbeatAt: Date.now(), updatedAt: Date.now() });
               }
            } else if (data.status === 'IDLE' || data.status === 'PAUSED') {
               t.update(GLOBAL_WORKER_REF, { status: 'RUNNING', pauseReason: null, workerId: WORKER_ID, workerStartedAt: Date.now(), workerHeartbeatAt: Date.now(), updatedAt: Date.now() });
            }
         }
      });
      res.json({ success: true });
    } catch(e) {
      res.status(500).json({ error: e.message });
    }
  });

  // Pause Worker`
);

// 3. Fix Enqueue duplicate productVersion
content = content.replace(
  `productId: pDoc.id,
             productVersion: v,
             status: 'queued',`,
  `productId: pDoc.id,
             productVersion: v,
             status: 'queued',`
); // Already looks fine in the dump? Wait, the instructions say "remove the duplicated productVersion: v, productVersion: v," Let's use a regex to remove a second one if it exists.

content = content.replace(/productVersion: v,\s*productVersion: v,/g, 'productVersion: v,');

// 4. Zombie Migration: Remove searchStatus update
content = content.replace(
  /const newStatus[\s\S]*?batch\.update\(doc\.ref, \{ searchStatus: newStatus \}\);\s*/,
  ``
);

// 5. Atomic Final Ownership Check + Bounded Recommendations + Discard Stale
content = content.replace(
  /const batch = adminDb\.batch\(\);[\s\S]*?await batch\.commit\(\);/,
  `// 1. Fetch old AI recommendations OUTSIDE the final transaction
      const oldRelsSnap = await adminDb.collection('productRecommendations')
        .where('sourceProductId', '==', productSnap.id)
        .where('source', '==', 'ai')
        .limit(400) // Hard safe bound for firestore ops
        .get();

      // 2. Final Atomic Verification and Write
      await adminDb.runTransaction(async (t) => {
         const freshJob = await t.get(jobDoc.ref);
         if (!freshJob.exists) return;
         const jd = freshJob.data();
         if (jd.status !== 'processing' || jd.lockedBy !== WORKER_ID || jd.productVersion !== currentVersion) {
            // Ownership lost or version changed. Discard result safely.
            return;
         }

         const pFresh = await t.get(productRef);
         if (!pFresh.exists || pFresh.data().productVersion > currentVersion) {
            // Superseded while processing
            t.update(jobDoc.ref, { status: 'superseded', lockedBy: null, lockedAt: null, updatedAt: now });
            return;
         }

         // Enforce MAX_AI_RECOMMENDATIONS_PER_SOURCE = 10
         const boundedRecs = validatedRelationships.slice(0, MAX_AI_RECOMMENDATIONS_PER_SOURCE);

         // We must stay well within Firestore 500 limit. 
         // Delete at most 400 old AI recs to leave room for new writes
         let deletedCount = 0;
         for (const d of oldRelsSnap.docs) {
             if (deletedCount < 400) {
                 t.delete(d.ref);
                 deletedCount++;
             }
         }

         // Write new AI recs
         for (const rel of boundedRecs) {
            const relId = \`\${productSnap.id}_\${rel.targetId}\`;
            t.set(adminDb.collection('productRecommendations').doc(relId), {
               sourceProductId: productSnap.id,
               targetProductId: rel.targetId,
               type: rel.type,
               placement: rel.placement,
               confidence: rel.confidence,
               priority: rel.priority,
               categoryFit: rel.categoryFit,
               priceFit: rel.priceFit,
               bestsellerBoost: rel.bestsellerBoost,
               source: "ai",
               status: "approved",
               updatedAt: now,
               createdAt: now
            });
         }

         t.update(productRef, { aiSearchAliases: aiAliases, lastProcessedAt: now });

         const event = { type: 'COMPLETED', timestamp: now, detail: \`Generated \${boundedRecs.length} recs\` };
         const newEvents = [...(jd.events || []), event].slice(-10);
         
         t.update(jobDoc.ref, {
            status: 'completed',
            lockedBy: null,
            lockedAt: null,
            updatedAt: now,
            events: newEvents
         });
      });`
);

// 6. Token Limit Permanent Error
content = content.replace(
  /if \(code === 'CONTENT_POLICY' \|\| attempts >= job\.maxAttempts\) \{/,
  `if (code === 'CONTENT_POLICY' || (code === 'TOKEN_LIMIT' && attempts >= 2) || attempts >= job.maxAttempts) {`
);

// 7. Ensure event slices correctly
content = content.replace(/events: newEvents/g, 'events: newEvents.slice(-10)');
content = content.replace(/events: evs/g, 'events: evs.slice(-10)');

// Fix the newEvents slice in the error handler if needed, it's already sliced but safe to re-slice
// wait, if I used 'events: newEvents.slice(-10)', I might have 'events: evs.slice(-10).slice(-10)'.
// I'll be careful.

fs.writeFileSync('server/aiWorker.ts', content);
console.log("Rewritten aiWorker.ts successfully");
