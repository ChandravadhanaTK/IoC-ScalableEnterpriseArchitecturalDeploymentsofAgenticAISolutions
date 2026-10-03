import React from 'react';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, Mail, Building, User, Calendar, Lock, Key } from 'lucide-react';

export const AdminProfile: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="pb-4 border-b border-slate-200">
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          Administrator Profile & Credentials
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Authorized campus facilities operations account details.
        </p>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        {/* Banner */}
        <div className="p-6 bg-slate-900 text-white flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-blue-600 flex items-center justify-center font-bold text-xl shadow-lg shadow-blue-500/30">
            <ShieldCheck className="w-8 h-8 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">{user?.name}</h2>
            <div className="flex items-center gap-2 text-xs text-slate-300 mt-0.5">
              <span className="font-semibold text-blue-300 bg-blue-900/80 px-2 py-0.5 rounded border border-blue-700">
                System Administrator
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                Active Since {new Date(user?.createdAt || Date.now()).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>

        {/* Readonly details */}
        <div className="p-6 sm:p-8 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-xl">
              <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1">
                <User className="w-4 h-4 text-blue-600" />
                <span>Admin Official Name</span>
              </div>
              <div className="text-sm font-bold text-slate-900">{user?.name}</div>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-xl">
              <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1">
                <Mail className="w-4 h-4 text-blue-600" />
                <span>Administrative Email</span>
              </div>
              <div className="text-sm font-bold text-slate-900">{user?.email}</div>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-xl">
              <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1">
                <Building className="w-4 h-4 text-blue-600" />
                <span>Assigned Division / Office</span>
              </div>
              <div className="text-sm font-bold text-slate-900">
                {user?.department || 'Estate & Campus Facilities Office'}
              </div>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-xl">
              <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1">
                <Key className="w-4 h-4 text-blue-600" />
                <span>Access Permissions</span>
              </div>
              <div className="text-sm font-bold text-emerald-700 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                Full Dispatch & Triage Rights
              </div>
            </div>
          </div>

          <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-xl text-xs text-blue-900 space-y-1">
            <div className="font-bold flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-blue-600" />
              Administrative Security Note
            </div>
            <p className="text-blue-800 leading-relaxed">
              Administrative credentials cannot be altered from public forms. Passwords are hash-protected with bcrypt and all status updates are written with auditable administrator timestamps.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
