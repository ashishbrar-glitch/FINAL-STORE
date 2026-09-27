const fs = require('fs');

let content = fs.readFileSync('server/aiWorker.ts', 'utf8');

// Replace the pre-Gemini logic to add cleanup
content = content.replace(
  /const validCatalog = catalog\.filter/,
  `// Legacy Excess Check before Gemini
      const oldRelsQuery = adminDb.collection('productRecommendations')
        .where('sourceProductId', '==', productSnap.id)
        .where('source', '==', 'ai')
        .limit(400);

      const preCheckSnap = await oldRelsQuery.get();
      if (preCheckSnap.size >= 400) {
         await adminDb.runTransaction(async (t) => {
            const freshJob = await t.get(jobDoc.ref);
            if (!freshJob.exists || freshJob.data().lockedBy !== WORKER_ID || freshJob.data().status !== 'processing' || freshJob.data().productVersion !== currentVersion) return;
            
            const toDelete = await t.get(oldRelsQuery);
            toDelete.docs.forEach(d => t.delete(d.ref));
            
            const event = { type: 'CLEANUP', timestamp: Date.now(), detail: \`Deleted \${toDelete.size} legacy AI recs\` };
            const evs = [...(freshJob.data().events || []), event].slice(-10);
            t.update(jobDoc.ref, {
                status: 'queued',
                lockedBy: null,
                lockedAt: null,
                updatedAt: Date.now(),
                events: evs
            });
         });
         return;
      }
      
      const validCatalog = catalog.filter`
);

// Replace the success persistence block
content = content.replace(
  /\/\/ 1\. Fetch old AI recommendations OUTSIDE the final transaction[\s\S]*?t\.update\(jobDoc\.ref, \{\s*status: 'completed',\s*lockedBy: null,\s*lockedAt: null,\s*updatedAt: now,\s*events: newEvents\.slice\(-10\)\s*\}\);\s*\}\);/,
  `// Final Atomic Verification and Write
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

         // Fetch old AI recommendations INSIDE the final transaction
         const oldRelsSnap = await t.get(oldRelsQuery);

         if (oldRelsSnap.size >= 400) {
             // Unexpected race condition caused legacy excess. Cleanup and requeue.
             oldRelsSnap.docs.forEach(d => t.delete(d.ref));
             const event = { type: 'CLEANUP', timestamp: now, detail: 'Deleted 400 legacy AI recs inside final tx' };
             const newEvents = [...(jd.events || []), event].slice(-10);
             t.update(jobDoc.ref, {
                 status: 'queued',
                 lockedBy: null,
                 lockedAt: null,
                 updatedAt: now,
                 events: newEvents
             });
             return;
         }

         // Enforce MAX_AI_RECOMMENDATIONS_PER_SOURCE = 10
         const boundedRecs = validatedRelationships.slice(0, MAX_AI_RECOMMENDATIONS_PER_SOURCE);

         // Delete all old AI recs safely (guaranteed < 400)
         oldRelsSnap.docs.forEach(d => t.delete(d.ref));

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

// Replace the error handling block
content = content.replace(
  /\} catch \(error\) \{[\s\S]*?\} finally \{/m,
  `} catch (error: any) {
      console.error("Worker Job Error:", error);
      const code = classifyAIError(error);
      const job = jobDoc.data();
      const attempts = (job.attempts || 0) + 1;
      const newEvents = [...(job.events || []), { type: \`ERROR_\${code}\`, timestamp: Date.now(), detail: String(error.message).slice(0, 200) }].slice(-10);
      
      if (code === 'QUOTA_EXHAUSTED') {
         await adminDb.runTransaction(async (t) => {
            const freshJob = await t.get(jobDoc.ref);
            if (!freshJob.exists || freshJob.data().lockedBy !== WORKER_ID || freshJob.data().status !== 'processing') return;

            const gw = await t.get(GLOBAL_WORKER_REF);
            if (gw.exists && gw.data().workerId === WORKER_ID) {
               t.update(GLOBAL_WORKER_REF, { status: 'QUOTA_EXHAUSTED', pauseReason: 'Quota exhausted from provider', updatedAt: Date.now() });
            }
            t.update(jobDoc.ref, { status: 'queued', lockedBy: null, lockedAt: null, updatedAt: Date.now() });
         });
         return;
      }
      
      if (code === 'AUTHENTICATION') {
         await adminDb.runTransaction(async (t) => {
            const freshJob = await t.get(jobDoc.ref);
            if (!freshJob.exists || freshJob.data().lockedBy !== WORKER_ID || freshJob.data().status !== 'processing') return;

            const gw = await t.get(GLOBAL_WORKER_REF);
            if (gw.exists && gw.data().workerId === WORKER_ID) {
               t.update(GLOBAL_WORKER_REF, { status: 'PAUSED', pauseReason: 'Authentication/API Key Failure', updatedAt: Date.now() });
            }
            t.update(jobDoc.ref, { status: 'queued', lockedBy: null, lockedAt: null, updatedAt: Date.now() });
         });
         return;
      }
      
      if (code === 'CONTENT_POLICY' || attempts >= job.maxAttempts) {
         await adminDb.runTransaction(async (t) => {
             const freshJob = await t.get(jobDoc.ref);
             if (!freshJob.exists || freshJob.data().lockedBy !== WORKER_ID || freshJob.data().status !== 'processing') return;
             t.update(jobDoc.ref, { status: 'failed', lastError: String(error.message), lastErrorCode: code, events: newEvents, lockedBy: null, lockedAt: null, updatedAt: Date.now() });
         });
         return;
      }
      
      const backoffSecs = Math.pow(2, attempts) * 15;
      const nextRetryAt = Date.now() + (backoffSecs * 1000);
      
      await adminDb.runTransaction(async (t) => {
         const freshJob = await t.get(jobDoc.ref);
         if (!freshJob.exists || freshJob.data().lockedBy !== WORKER_ID || freshJob.data().status !== 'processing') return;

         if (code === 'RATE_LIMIT') {
            const gw = await t.get(GLOBAL_WORKER_REF);
            if (gw.exists && gw.data().workerId === WORKER_ID) {
               t.update(GLOBAL_WORKER_REF, { globalRateLimitUntil: Date.now() + 60000 });
            }
         }

         t.update(jobDoc.ref, {
            status: 'retry_wait',
            attempts,
            nextRetryAt,
            lastError: String(error.message),
            lastErrorCode: code,
            events: newEvents,
            lockedBy: null,
            lockedAt: null,
            updatedAt: Date.now()
         });
      });
    } finally {`
);

fs.writeFileSync('server/aiWorker.ts', content);
