const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const deleteEndpoint = `
  app.delete("/api/admin/users/:uid", async (req, res) => {
    const authData = await verifyAdminAuth(req, res, ['admin', 'superadmin']);
    if (!authData) return;
    
    try {
      const targetUid = req.params.uid;
      
      const targetDoc = await adminDb.collection("users").doc(targetUid).get();
      if (targetDoc.exists) {
         const targetRole = targetDoc.data().role;
         if (targetRole === 'superadmin' && authData.role !== 'superadmin') {
            return res.status(403).json({ error: "Only superadmin can delete a superadmin" });
         }
      }
      
      try {
        await adminAuth.deleteUser(targetUid);
      } catch (e) {
        if (e.code !== 'auth/user-not-found') throw e;
      }
      
      await adminDb.collection("users").doc(targetUid).delete();
      
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });
`;

code = code.replace(/  app\.post\("\/api\/admin\/users"/, deleteEndpoint + '\n  app.post("/api/admin/users"');

fs.writeFileSync('server.ts', code);
