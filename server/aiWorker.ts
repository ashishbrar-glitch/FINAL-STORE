
import { GoogleGenAI } from "@google/genai";
import crypto from "crypto";

export function initAIWorker(adminDb, adminAuth, getAiClient, app) {
  const WORKER_ID = crypto.randomUUID();
  const MAX_AI_RECOMMENDATIONS_PER_SOURCE = 10;
  let isShuttingDown = false;
  let activePromises = 0;
  
  const GLOBAL_WORKER_REF = adminDb.collection('system').doc('ai_worker');
  const JOBS_REF = adminDb.collection('ai_jobs');
  
  // Classification
  function classifyAIError(err: any) {
    const status = err?.status || err?.response?.status;
    const msg = (err?.message || '').toLowerCase();
    
    // Inspect structured provider information (Google GenAI / Google Cloud errors)
    const details = err?.details || err?.errorDetails || err?.response?.data?.error?.details || [];
    let reason = err?.reason || null;
    
    if (Array.isArray(details)) {
        for (const d of details) {
            if (d.reason) reason = d.reason;
        }
    }
    
    const providerStatus = err?.response?.data?.error?.status || err?.errorStatus;

    if (status === 429) return 'RATE_LIMIT';
    if (status === 401) return 'AUTHENTICATION';
    if (status === 403) {
      if (reason === 'QUOTA_EXCEEDED' || reason === 'RATE_LIMIT_EXCEEDED' || providerStatus === 'RESOURCE_EXHAUSTED') {
         return 'QUOTA_EXHAUSTED';
      }
      if (reason === 'ACCESS_TOKEN_EXPIRED' || reason === 'ACCESS_TOKEN_SCOPE_INSUFFICIENT' || providerStatus === 'PERMISSION_DENIED') {
         return 'AUTHENTICATION';
      }
      if (msg.includes('quota')) return 'QUOTA_EXHAUSTED'; // Fallback
      if (msg.includes('permission') || msg.includes('auth')) return 'AUTHENTICATION'; // Fallback
    }
    if (status === 400) {
       if (reason === 'TOKEN_LIMIT_EXCEEDED' || (providerStatus === 'INVALID_ARGUMENT' && (msg.includes('token') || msg.includes('size')))) {
          return 'TOKEN_LIMIT';
       }
       if (reason === 'SAFETY_BLOCKED' || (providerStatus === 'FAILED_PRECONDITION' && (msg.includes('safety') || msg.includes('policy')))) {
          return 'CONTENT_POLICY';
       }
       // Fallbacks
       if (msg.includes('token') || msg.includes('size') || msg.includes('too large')) return 'TOKEN_LIMIT';
       if (msg.includes('safety') || msg.includes('policy')) return 'CONTENT_POLICY';
    }
    if (status >= 500) return 'TRANSIENT';
    if (err?.name === 'TimeoutError' || err?.code === 'ECONNRESET' || err?.code === 'ETIMEDOUT') return 'TRANSIENT';
    if (err instanceof SyntaxError || err?.name === 'SyntaxError') return 'INVALID_RESPONSE';
    return 'UNKNOWN';
  }

  // --- Endpoints ---
  async function verifyAdminAuth(req, res) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({ error: "Unauthorized" });
      return null;
    }
    const token = authHeader.split("Bearer ")[1];
    try {
      const decoded = await adminAuth.verifyIdToken(token);
      if (decoded.role !== 'manager' && decoded.role !== 'admin' && decoded.role !== 'superadmin') {
        res.status(403).json({ error: "Forbidden" });
        return null;
      }
      return decoded;
    } catch (e) {
      res.status(401).json({ error: "Invalid token" });
      return null;
    }
  }

  // Status Dashboard Endpoint
  
  app.post("/api/ai/retry-failed", async (req, res) => {
    try {
      const authData = await verifyAdminAuth(req, res);
      if (!authData) return;
      
      const failedJobs = await JOBS_REF.where('status', '==', 'failed').get();
      if (failedJobs.empty) {
         return res.json({ success: true, retried: 0 });
      }
      
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
                
                const newJobId = `enrich_${pFresh.id}_v${pData.productVersion}`;
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
      
      res.json({ success: true, retried });
    } catch (e: any) {
      console.error(e);
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/ai/status", async (req, res) => {
    try {
      const authData = await verifyAdminAuth(req, res);
      if (!authData) return;
      
      const workerDoc = await GLOBAL_WORKER_REF.get();
      const workerData = workerDoc.exists ? workerDoc.data() : { status: 'IDLE' };
      
      const counts = { queued: 0, processing: 0, completed: 0, failed: 0, retry_wait: 0, superseded: 0 };
      
      // Use efficient aggregate queries
      const states = Object.keys(counts);
      for (const s of states) {
        const agg = await JOBS_REF.where('status', '==', s).count().get();
        counts[s] = agg.data().count;
      }
      
      res.json({ worker: workerData, counts });
    } catch(e) {
      console.error(e);
      res.status(500).json({ error: e.message });
    }
  });

  // Start Worker
  app.post("/api/ai/start", async (req, res) => {
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

  // Pause Worker
  app.post("/api/ai/pause", async (req, res) => {
    try {
      const authData = await verifyAdminAuth(req, res);
      if (!authData) return;
      
      await adminDb.runTransaction(async (t) => {
         const doc = await t.get(GLOBAL_WORKER_REF);
         t.set(GLOBAL_WORKER_REF, { status: 'PAUSED', pauseReason: 'Manual pause', updatedAt: Date.now() }, { merge: true });
      });
      res.json({ success: true });
    } catch(e) {
      res.status(500).json({ error: e.message });
    }
  });

  // Enqueue 
  
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
      const jobId = `enrich_${productId}_v${v}`;
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

  app.post("/api/ai/enqueue", async (req, res) => {
    try {
      const authData = await verifyAdminAuth(req, res);
      if (!authData) return;
      
      const productsSnap = await adminDb.collection('products').where('isActive', '!=', false).get();
      let enqueued = 0;
      
      let batch = adminDb.batch();
      let batchCount = 0;
      
      for (const pDoc of productsSnap.docs) {
        const p = pDoc.data();
        if (p.isAvailable === false) continue;
        
        const v = p.productVersion || 1;
        const jobId = `enrich_${pDoc.id}_v${v}`;
        
        const jobRef = JOBS_REF.doc(jobId);
        
        const jobDoc = await jobRef.get();
        if (!jobDoc.exists || (jobDoc.exists && jobDoc.data().status === 'failed')) {
          // Removed searchStatus update
          batch.set(jobRef, {
             productId: pDoc.id,
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
             events: [],
             createdAt: Date.now(),
             updatedAt: Date.now()
          });
          enqueued++;
          batchCount++;
          
          if (batchCount >= 400) {
            await batch.commit();
            batch = adminDb.batch();
            batchCount = 0;
          }
        }
      }
      if (batchCount > 0) await batch.commit();
      
      res.json({ success: true, enqueued });
    } catch(e) {
      console.error(e);
      res.status(500).json({ error: e.message });
    }
  });

  // Migrate Zombies
  app.post("/api/ai/migrate-zombies", async (req, res) => {
    try {
      const authData = await verifyAdminAuth(req, res);
      if (!authData) return;
      
      const snap = await adminDb.collection('products').where('searchStatus', '==', 'processing').get();
      let migrated = 0;
      let batch = adminDb.batch();
      let count = 0;
      
      for (const doc of snap.docs) {
        const p = doc.data();
        const v = p.productVersion || 1;
        const jobId = `enrich_${doc.id}_v${v}`;
        batch.set(JOBS_REF.doc(jobId), {
           productId: doc.id,
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
           events: [{ type: 'MIGRATED', timestamp: Date.now(), detail: 'Recovered from processing zombie state' }],
           createdAt: Date.now(),
           updatedAt: Date.now()
        }, { merge: true });
        
        migrated++;
        count += 2;
        if (count >= 400) {
           await batch.commit();
           batch = adminDb.batch();
           count = 0;
        }
      }
      if (count > 0) await batch.commit();
      
      res.json({ success: true, migrated });
    } catch(e) {
      res.status(500).json({ error: e.message });
    }
  });

  // --- Worker Logic ---

  async function processJob(jobDoc) {
    activePromises++;
    try {
      const job = jobDoc.data();
      const productRef = adminDb.collection('products').doc(job.productId);
      const productSnap = await productRef.get();
      
      if (!productSnap.exists) {
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
      }
      
      const poolLimit = job.lastErrorCode === 'TOKEN_LIMIT' ? (job.attempts === 1 ? 15 : 5) : 30;
      
      const catalogSnap = await adminDb.collection('products')
        .where('isActive', '!=', false)
        .get();
        
      const catalog = catalogSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      // Legacy Excess Check before Gemini
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
            
            const event = { type: 'CLEANUP', timestamp: Date.now(), detail: `Deleted ${toDelete.size} legacy AI recs` };
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
      
      const validCatalog = catalog.filter((p) => p.id !== productSnap.id && p.isAvailable !== false);
      
      validCatalog.sort((a, b) => {
         let scoreA = 0; let scoreB = 0;
         if (a.subcategory && a.subcategory === product.subcategory) scoreA += 100;
         if (b.subcategory && b.subcategory === product.subcategory) scoreB += 100;
         if (a.brand && a.brand === product.brand) scoreA += 50;
         if (b.brand && b.brand === product.brand) scoreB += 50;
         if (a.category === product.category) scoreA += 10;
         if (b.category === product.category) scoreB += 10;
         if (scoreA !== scoreB) return scoreB - scoreA;
         return a.id.localeCompare(b.id);
      });
      
      const candidatePool = validCatalog.slice(0, poolLimit);
      const minimalPool = candidatePool.map((p) => ({ id: p.id, name: p.name, category: p.category }));
      
      const ai = getAiClient();
      const now = Date.now();
      
      let aiAliases = [];
      try {
        const aliasPrompt = `Generate realistic search aliases for this grocery product in India to improve fuzzy search.\nInclude common misspellings, local village names (Hinglish/Hindi vocabulary like "makhan" for ghee, "shakar" for sugar), and phonetic transliterations.\nProduct: ${product.name} (English: ${product.nameEn || ''}, Hindi: ${product.nameHi || ''}, Category: ${product.category})\nReturn ONLY a JSON object: { "aliases": ["alias1", "alias2"] }`;
        const aliasRes = await ai.models.generateContent({
          model: "gemini-3.8-flash",
          contents: aliasPrompt,
          config: { responseMimeType: "application/json" }
        });
        const parsed = JSON.parse(aliasRes.text || '{"aliases":[]}');
        aiAliases = (parsed.aliases || []).slice(0, 15).map(a => String(a).toLowerCase().trim());
      } catch (err) {
        throw err;
      }
      
      let validatedRelationships = [];
      if (minimalPool.length > 0) {
        try {
          const relPrompt = `You are an AI for a grocery store. Suggest products that are complementary or similar to the target product.\nTarget Product: ${product.name} (${product.category})\nCandidate Pool (only these IDs are valid): ${JSON.stringify(minimalPool)}\nReturn ONLY a JSON object: { "recommendations": [{ "targetId": "string", "type": "similar" | "complementary", "confidence": 0.92, "priority": 90, "categoryFit": 0.85, "priceFit": 0.80, "bestsellerBoost": 0.10, "placement": "goes_well_with" | "similar_products" }] }`;
          const relRes = await ai.models.generateContent({
            model: "gemini-3.8-flash",
            contents: relPrompt,
            config: { responseMimeType: "application/json" }
          });
          
          const parsedRel = JSON.parse(relRes.text || '{"recommendations":[]}');
          const recommendations = parsedRel.recommendations || [];
          const poolMap = new Map(candidatePool.map(p => [p.id, p]));
          
          for (const rel of recommendations) {
            const target = poolMap.get(rel.targetId) as any;
            if (!target || target.id === productSnap.id || target.isActive === false || target.isAvailable === false) continue;
            if (rel.type !== "similar" && rel.type !== "complementary") continue;
            if (rel.placement !== "goes_well_with" && rel.placement !== "similar_products") continue;
            
            validatedRelationships.push({
              targetId: rel.targetId,
              type: rel.type,
              placement: rel.placement,
              confidence: Math.max(0, Math.min(1, Number(rel.confidence) || 0)),
              priority: Math.max(0, Math.min(100, Number(rel.priority) || 0)),
              categoryFit: Math.max(0, Math.min(1, Number(rel.categoryFit) || 0)),
              priceFit: Math.max(0, Math.min(1, Number(rel.priceFit) || 0)),
              bestsellerBoost: Math.max(0, Math.min(1, Number(rel.bestsellerBoost) || 0))
            });
          }
          validatedRelationships = validatedRelationships.slice(0, 10);
        } catch (err) {
          throw err;
        }
      }
      
      // Final Atomic Verification and Write
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
            const relId = `${productSnap.id}_${rel.targetId}`;
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

         const event = { type: 'COMPLETED', timestamp: now, detail: `Generated ${boundedRecs.length} recs` };
         const newEvents = [...(jd.events || []), event].slice(-10);
         
         t.update(jobDoc.ref, {
            status: 'completed',
            lockedBy: null,
            lockedAt: null,
            updatedAt: now,
            events: newEvents
         });
      });
      
    } catch (error: any) {
      console.error("Worker Job Error:", error);
      const code = classifyAIError(error);
      const job = jobDoc.data();
      const attempts = (job.attempts || 0) + 1;
      const newEvents = [...(job.events || []), { type: `ERROR_${code}`, timestamp: Date.now(), detail: String(error.message).slice(0, 200) }].slice(-10);
      
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
    } finally {
      activePromises--;
    }
  }

  async function engineLoop() {
    if (isShuttingDown) return;
    try {
      const gDoc = await GLOBAL_WORKER_REF.get();
      if (!gDoc.exists) {
        setTimeout(engineLoop, 5000);
        return;
      }
      
      const gState = gDoc.data();
      if (gState.status !== 'RUNNING' || gState.workerId !== WORKER_ID) {
         setTimeout(engineLoop, 5000);
         return;
      }
      
      if (gState.globalRateLimitUntil && Date.now() < gState.globalRateLimitUntil) {
         setTimeout(engineLoop, 5000);
         return;
      }
      
      const concurrency = gState.concurrencyLimit || 1;
      
      if (activePromises >= concurrency) {
         setTimeout(engineLoop, 1000);
         return;
      }
      
      let candSnap = await JOBS_REF.where('status', '==', 'queued').limit(concurrency).get();
      if (candSnap.empty) {
         candSnap = await JOBS_REF.where('status', '==', 'retry_wait').where('nextRetryAt', '<=', Date.now()).limit(concurrency).get();
      }
      
      if (candSnap.empty) {
         setTimeout(engineLoop, 5000);
         return;
      }
      
      for (const d of candSnap.docs) {
         if (isShuttingDown || activePromises >= concurrency) break;
         
         const claimed = await adminDb.runTransaction(async (t) => {
            const fresh = await t.get(d.ref);
            if (!fresh.exists) return null;
            const fData = fresh.data();
            if (fData.status !== 'queued' && (fData.status !== 'retry_wait' || fData.nextRetryAt > Date.now())) return null;
            if (fData.lockedBy) return null;
            
            const pFresh = await t.get(adminDb.collection('products').doc(fData.productId));
            if (pFresh.exists && pFresh.data().productVersion > fData.productVersion) {
               t.update(d.ref, { status: 'superseded', updatedAt: Date.now() });
               return null;
            }
            
            t.update(d.ref, { status: 'processing', lockedBy: WORKER_ID, lockedAt: Date.now(), heartbeatAt: Date.now(), updatedAt: Date.now() });
            return fresh;
         });
         
         if (claimed) {
            processJob(claimed);
         }
      }
      
    } catch (e) {
       console.error("Worker Engine Loop Error:", e);
    }
    
    setTimeout(engineLoop, 2000);
  }
  
  setInterval(async () => {
     if (isShuttingDown) return;
     try {
       await adminDb.runTransaction(async (t) => {
          const gw = await t.get(GLOBAL_WORKER_REF);
          if (gw.exists && gw.data().workerId === WORKER_ID) {
             t.update(GLOBAL_WORKER_REF, { workerHeartbeatAt: Date.now() });
          }
       });
       
       const myJobs = await JOBS_REF.where('status', '==', 'processing').where('lockedBy', '==', WORKER_ID).get();
       for (const d of myJobs.docs) {
          await adminDb.runTransaction(async (t) => {
             const fresh = await t.get(d.ref);
             if (fresh.exists && fresh.data().status === 'processing' && fresh.data().lockedBy === WORKER_ID) {
                t.update(d.ref, { heartbeatAt: Date.now() });
             }
          });
       }
       
       const staleThreshold = Date.now() - (5 * 60 * 1000);
       const allProcessing = await JOBS_REF.where('status', '==', 'processing').get();
       
       for (const pJob of allProcessing.docs) {
          const pd = pJob.data();
          if (pd.lockedBy !== WORKER_ID && pd.heartbeatAt < staleThreshold) {
             await adminDb.runTransaction(async (t) => {
                const fresh = await t.get(pJob.ref);
                if (fresh.exists && fresh.data().status === 'processing' && fresh.data().heartbeatAt < staleThreshold) {
                   const evs = [...(fresh.data().events || []), { type: 'RECLAIMED', timestamp: Date.now(), detail: 'Recovered from stale lock' }].slice(-10);
                   t.update(pJob.ref, { status: 'queued', lockedBy: null, lockedAt: null, heartbeatAt: null, events: evs.slice(-10), updatedAt: Date.now() });
                }
             });
          }
       }
       
     } catch (e) {
       if (e.message && e.message.includes('PERMISSION_DENIED')) {
         console.warn("⚠️ AI Worker disabled: Admin SDK lacks permissions in this environment (likely AI Studio dev environment without service account).");
         isShuttingDown = true;
       } else {
         console.error("Worker Heartbeat Error:", e);
       }
     }
  }, 30000);

    async function startup() {
     try {
        await adminDb.runTransaction(async (t) => {
           const gw = await t.get(GLOBAL_WORKER_REF);
           if (!gw.exists) {
              t.set(GLOBAL_WORKER_REF, { status: 'IDLE', workerId: WORKER_ID, workerStartedAt: Date.now(), workerHeartbeatAt: Date.now(), concurrencyLimit: 1, updatedAt: Date.now() });
           } else {
              const data = gw.data();
              if (data.status === 'RUNNING') {
                 const staleWorker = Date.now() - (data.workerHeartbeatAt || 0) > (3 * 60 * 1000);
                 if (staleWorker) {
                    t.update(GLOBAL_WORKER_REF, { workerId: WORKER_ID, workerStartedAt: Date.now(), workerHeartbeatAt: Date.now(), updatedAt: Date.now() });
                 }
              } else if (data.status === 'IDLE') {
                 t.update(GLOBAL_WORKER_REF, { workerId: WORKER_ID, workerStartedAt: Date.now(), workerHeartbeatAt: Date.now(), updatedAt: Date.now() });
              } else if (data.status === 'PAUSED') {
                 // Do nothing, leave it paused
              }
           }
        });
        
        setTimeout(engineLoop, 1000);
     } catch (e) {
        console.error("Startup reconciliation error", e);
     }
  }

  process.on('SIGTERM', async () => {
    isShuttingDown = true;
    console.log("SIGTERM received, shutting down AI worker safely...");
    
    let waited = 0;
    while (activePromises > 0 && waited < 10000) {
       await new Promise(r => setTimeout(r, 500));
       waited += 500;
    }
    
    try {
      const myJobs = await JOBS_REF.where('status', '==', 'processing').where('lockedBy', '==', WORKER_ID).get();
      for (const d of myJobs.docs) {
         await adminDb.runTransaction(async (t) => {
            const fresh = await t.get(d.ref);
            if (fresh.exists && fresh.data().lockedBy === WORKER_ID) {
               t.update(d.ref, { status: 'queued', lockedBy: null, lockedAt: null, updatedAt: Date.now() });
            }
         });
      }
      
      await adminDb.runTransaction(async (t) => {
         const gw = await t.get(GLOBAL_WORKER_REF);
         if (gw.exists && gw.data().workerId === WORKER_ID) {
            t.update(GLOBAL_WORKER_REF, { status: 'IDLE', workerId: null, updatedAt: Date.now() });
         }
      });
      
    } catch (e) {
       console.error("Shutdown cleanup error:", e);
    }
    
    process.exit(0);
  });

  startup();
}
