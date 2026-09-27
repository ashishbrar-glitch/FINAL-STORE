const fs = require('fs');

let content = fs.readFileSync('server/aiWorker.ts', 'utf8');

const newClassifier = `function classifyAIError(err: any) {
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
  }`;

content = content.replace(/function classifyAIError[\s\S]*?return 'UNKNOWN';\n  }/, newClassifier);

fs.writeFileSync('server/aiWorker.ts', content);
