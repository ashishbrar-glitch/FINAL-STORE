import React, { useState } from 'react';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs, getDocsFromCache } from 'firebase/firestore';
import { Lock, Mail, ArrowLeft, Loader2, AlertTriangle } from 'lucide-react';

interface Props {
  onBack: () => void;
  onLoginSuccess: (userRole: string) => void;
}

export function AdminLogin({ onBack, onLoginSuccess }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const processLogin = (snapshot: any) => {
      if (snapshot.empty) {
        setError('Invalid email or password.');
        setLoading(false);
        return;
      }

      let loggedIn = false;
      snapshot.forEach((doc: any) => {
        const data = doc.data();
        if (data.password === password) { 
           loggedIn = true;
           localStorage.setItem('adminSessionRole', data.role);
           onLoginSuccess(data.role);
        }
      });

      if (!loggedIn) {
        setError('Invalid email or password.');
      }
    };

    try {
      const q = query(collection(db, 'users'), where('email', '==', email));
      const snapshot = await getDocs(q);
      processLogin(snapshot);
    } catch (err: any) {
      if (!(err?.code === 'resource-exhausted' || err?.message?.toLowerCase().includes('quota'))) console.error(err);
      if (err?.code === 'resource-exhausted' || err?.message?.toLowerCase().includes('quota')) {
         try {
            const q = query(collection(db, 'users'), where('email', '==', email));
            const snapshot = await getDocsFromCache(q);
            processLogin(snapshot);
         } catch(e) {
            setError('System is offline/quota exceeded. Cannot verify credentials.');
         }
      } else {
        setError('An error occurred during login.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="sticky top-0 z-50 flex items-center px-4 py-3 bg-[#EFC04E] shadow-sm">
        <button onClick={onBack} className="p-1 -ml-1 mr-3 rounded-full hover:bg-black/10 transition-colors">
          <ArrowLeft className="w-6 h-6 text-[#0e783a]" />
        </button>
        <h1 className="font-semibold text-[#0e783a] text-lg leading-tight">Admin Portal</h1>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-4">
        
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 w-full max-w-sm space-y-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-[#0e783a]/10 text-[#0e783a] rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Admin Login</h2>
            <p className="text-sm text-gray-500 mt-1">Sign in to manage store and library.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 text-red-600 rounded-xl text-sm border border-red-100">
                {error}
              </div>
            )}
            
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-700 ml-1">Email Address</label>
              <div className="relative">
                <Mail className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#0e783a]/30 focus:border-[#0e783a] transition-all bg-gray-50"
                  placeholder="admin@bcnstore.com"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-700 ml-1">Password</label>
              <div className="relative">
                <Lock className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#0e783a]/30 focus:border-[#0e783a] transition-all bg-gray-50"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#0e783a] text-white py-3.5 rounded-2xl font-semibold hover:bg-[#0b6330] active:scale-[0.98] transition-all disabled:opacity-70 flex items-center justify-center mt-2"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Sign In'}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
