import React from 'react';
import { FolderTree, LogOut, ArrowLeft, Users, ShieldAlert, BookOpen, Package, Database, Network } from 'lucide-react';
import { UserManagement } from './admin/UserManagement';
import { InventoryManagement } from './admin/InventoryManagement';
import { CategoryManagement } from './admin/CategoryManagement';
import { SeatManagement } from './admin/SeatManagement';
import { DataBackup } from './admin/DataBackup';
import { ImageFixer } from './admin/ImageFixer';

import { RelationshipManagement } from './admin/RelationshipManagement';
import { auth } from '../lib/firebase';
import { signOut } from 'firebase/auth';

interface Props {
  role: string;
  onLogout: () => void;
  onBack: () => void;
}

export function AdminDashboard({ role, onLogout, onBack }: Props) {
  const handleSignOut = () => {
    signOut(auth).catch(e => console.error(e));
    onLogout();
  };

  const isSuperAdmin = role === 'superadmin';
  const isAdmin = role === 'admin' || isSuperAdmin;
  const isManager = role === 'manager' || isAdmin;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col pb-24">
      <header className="sticky top-0 z-50 flex items-center justify-between px-4 py-3 bg-[#EFC04E] shadow-sm">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-1 -ml-1 rounded-full hover:bg-black/10 transition-colors">
            <ArrowLeft className="w-6 h-6 text-[#0e783a]" />
          </button>
          <div>
            <h1 className="font-semibold text-[#0e783a] text-lg leading-tight">Admin Dashboard</h1>
            <p className="text-xs text-[#0e783a]/80 font-medium uppercase tracking-wider">{role} Portal</p>
          </div>
        </div>
        <button onClick={handleSignOut} className="p-2 bg-white/20 rounded-full text-[#0e783a]">
          <LogOut className="w-5 h-5" />
        </button>
      </header>

      <main className="p-4 max-w-md mx-auto w-full space-y-4">
        
        {/* Module: Library Seats (Managers, Admins, Superadmins) */}
        {isManager && (
          <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm">
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-3">
              <BookOpen className="w-6 h-6" />
            </div>
            <SeatManagement />
          </div>
        )}

        
        {/* Module: Categories (Admins, Superadmins) */}
        {isAdmin && (
          <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm">
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-3">
              <FolderTree className="w-6 h-6" />
            </div>
            <CategoryManagement />
          </div>
        )}
        {/* Module: Store Inventory (Admins, Superadmins) */}
        {isAdmin && (
          <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm">
            <div className="w-12 h-12 bg-green-50 text-[#0e783a] rounded-2xl flex items-center justify-center mb-3">
              <Package className="w-6 h-6" />
            </div>
            <InventoryManagement />
          </div>
        )}

        {/* Module: Data Backup & Restore (Admins, Superadmins) */}
        {isAdmin && (
          <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm">
            <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center mb-3">
              <Database className="w-6 h-6" />
            </div>
            <DataBackup />
          </div>
        )}

        {isAdmin && <ImageFixer />}
        

        {isAdmin && (
          <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm mt-4">
            <div className="w-12 h-12 bg-orange-50 text-orange-600 rounded-2xl flex items-center justify-center mb-3">
              <Network className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-1">Product Relationships</h2>
            <p className="text-sm text-gray-500 mb-4">
              Review and approve AI-generated product recommendations.
            </p>
            <RelationshipManagement />
          </div>
        )}

        {/* Module: User Roles & Access (Superadmin ONLY) */}
        {isSuperAdmin && (
          <div className="bg-white p-5 rounded-3xl border border-red-100 shadow-sm bg-gradient-to-b from-red-50/30 to-white">
            <div className="w-12 h-12 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mb-3">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-4">System Users</h2>
            <UserManagement />
          </div>
        )}

      </main>
    </div>
  );
}
