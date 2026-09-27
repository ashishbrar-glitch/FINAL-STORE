import React, { useState, useEffect } from 'react';
import { db, auth } from '../../lib/firebase';
import { collection, getDocs, getDocsFromCache, doc, setDoc, deleteDoc, query } from 'firebase/firestore';
import { ShieldAlert, Trash2, Key, Loader2, UserPlus, X } from 'lucide-react';

export function UserManagement() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('manager');
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    const processUsers = (snapshot: any) => {
      const userList = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
      setUsers(userList);
    };
    try {
      const q = query(collection(db, 'users'));
      const snapshot = await getDocs(q);
      processUsers(snapshot);
    } catch (err: any) {
      if (err?.code === 'permission-denied') { setError('Insufficient permissions or session expired. Please re-login.'); } else if (!(err?.code === 'resource-exhausted' || err?.message?.toLowerCase().includes('quota'))) console.error('Fetch users error:', err);
      if (err?.code === 'resource-exhausted' || err?.message?.toLowerCase().includes('quota')) {
        try {
          const snapshot = await getDocsFromCache(query(collection(db, 'users')));
          processUsers(snapshot);
        } catch (e) { console.error(e); }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setError('');
    
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("Not authenticated");
      const token = await user.getIdToken();
      
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ email, password, role })
      });
      
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create user");
      }
      
      alert("User created successfully!");
      setEmail('');
      setPassword('');
      setRole('manager');
      setShowAddForm(false);
      fetchUsers();
    } catch (err: any) {
      if (!(err?.code === 'resource-exhausted' || err?.message?.toLowerCase().includes('quota') || err?.message === 'Failed to fetch' || err?.message?.includes("Unexpected token '<'"))) {
        console.error(err);
        setError(err.message);
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteUser = async (uid: string) => {
    if (!window.confirm("Are you sure?")) return;
    
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("Not authenticated");
      const token = await user.getIdToken();
      
      const res = await fetch(`/api/admin/users/${uid}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to delete user");
      }
      
      fetchUsers();
    } catch (err: any) {
      if (!err?.message?.includes("Unexpected token '<'") && err.message !== "Failed to fetch") {
        alert("Error deleting user: " + err.message);
      }
    }
  };

  if (loading) return <div className="p-8 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-[#0e783a]" /></div>;

  return (
    <div className="space-y-4">
      {error && !showAddForm && <div className="p-3 bg-red-50 text-red-600 rounded-xl text-sm border border-red-100">{error}</div>}
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-gray-900 text-lg">System Users</h3>
        <button 
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-1 text-sm bg-red-50 text-red-700 px-3 py-1.5 rounded-lg font-medium"
        >
          {showAddForm ? <X className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
          {showAddForm ? 'Cancel' : 'New User'}
        </button>
      </div>

      {showAddForm && (
        <form onSubmit={handleCreateUser} className="bg-red-50/50 p-4 rounded-2xl border border-red-100 space-y-3">
          {error && <div className="text-xs text-red-600 bg-red-100 p-2 rounded">{error}</div>}
          <input 
            type="email" 
            placeholder="Email" 
            required 
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full text-sm px-3 py-2 rounded-xl border border-gray-200"
          />
          <input 
            type="password" 
            placeholder="Password (Plaintext demo)" 
            required 
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full text-sm px-3 py-2 rounded-xl border border-gray-200"
          />
          <select 
            value={role}
            onChange={e => setRole(e.target.value)}
            className="w-full text-sm px-3 py-2 rounded-xl border border-gray-200 bg-white"
          >
            <option value="manager">Manager (Seats only)</option>
            <option value="admin">Admin (Seats + Inventory)</option>
            <option value="superadmin">Superadmin (Full Access)</option>
          </select>
          <button 
            type="submit" 
            disabled={actionLoading}
            className="w-full bg-red-600 text-white py-2 rounded-xl font-medium flex justify-center"
          >
            {actionLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Create Account'}
          </button>
        </form>
      )}

      <div className="space-y-3">
        {users.map(user => (
          <div key={user.id} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
            <div>
              <p className="font-semibold text-gray-900 text-sm">{user.email}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full inline-block
                  ${user.role === 'superadmin' ? 'bg-red-100 text-red-700' : 
                    user.role === 'admin' ? 'bg-green-100 text-[#0e783a]' : 
                    'bg-blue-100 text-blue-700'}`}
                >
                  {user.role}
                </span>
                
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => handleDeleteUser(user.id)} className="p-2 text-gray-400 hover:text-red-600 bg-gray-50 hover:bg-red-50 rounded-lg transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
