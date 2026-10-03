'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { db } from '@/lib/db';
import { Notification } from '@/lib/types';
import {
  Sparkles,
  User,
  Briefcase,
  Users,
  MessageSquare,
  ShieldAlert,
  Bell,
  LogOut,
  ChevronDown,
  LayoutDashboard,
  Search,
  CheckCircle,
  Menu,
  X
} from 'lucide-react';

export function Navbar() {
  const pathname = usePathname();
  const { currentUser, role, logout } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifs, setShowNotifs] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (currentUser) {
      db.notifications.listByUserId(currentUser.id).then(setNotifications);
    }
  }, [currentUser, pathname]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleMarkAllRead = async () => {
    if (currentUser) {
      await db.notifications.markAllAsRead(currentUser.id);
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    }
  };

  const navLinks = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/projects', label: 'Marketplace', icon: Briefcase },
    { href: '/freelancers', label: 'Freelancers', icon: Search },
    { href: '/community', label: 'Community', icon: Users },
    { href: '/assistant', label: 'AI Assistant', icon: Sparkles, badge: 'AI' },
  ];

  if (role === 'ADMIN') {
    navLinks.push({ href: '/admin', label: 'Admin Panel', icon: ShieldAlert, badge: 'ADMIN' });
  }

  return (
    <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 text-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Brand Logo */}
          <div className="flex items-center space-x-3">
            <Link href="/" className="flex items-center space-x-2 group">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 p-0.5 shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform">
                <div className="h-full w-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                  <Sparkles className="h-5 w-5 text-indigo-400" />
                </div>
              </div>
              <span className="font-bold text-xl tracking-tight bg-gradient-to-r from-white via-indigo-100 to-indigo-300 bg-clip-text text-transparent">
                SkillBridge <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">AI</span>
              </span>
            </Link>
          </div>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center space-x-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-all flex items-center space-x-2 ${
                    isActive
                      ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className="h-4 w-4 text-slate-400" />
                  <span>{link.label}</span>
                  {link.badge && (
                    <span className={`text-[10px] px-1.5 py-0.2 rounded font-semibold uppercase ${
                      link.badge === 'ADMIN' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                    }`}>
                      {link.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Right Utilities (Notifications + Profile) */}
          <div className="hidden md:flex items-center space-x-3">
            {!mounted ? (
              <div className="h-9 w-24 bg-slate-800/40 rounded-xl animate-pulse" />
            ) : currentUser ? (
              <>
                {/* Notifications Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setShowNotifs(!showNotifs)}
                    className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors relative"
                    title="Notifications"
                  >
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                      <span className="absolute top-1 right-1 h-4 w-4 bg-indigo-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-slate-900">
                        {unreadCount}
                      </span>
                    )}
                  </button>

                  {showNotifs && (
                    <div className="absolute right-0 mt-2 w-80 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl z-50 p-4 animate-in fade-in slide-in-from-top-2 duration-150">
                      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                        <h4 className="font-semibold text-sm text-slate-100">Notifications</h4>
                        {unreadCount > 0 && (
                          <button
                            onClick={handleMarkAllRead}
                            className="text-xs text-indigo-400 hover:underline flex items-center space-x-1"
                          >
                            <CheckCircle className="h-3.5 w-3.5" />
                            <span>Mark all read</span>
                          </button>
                        )}
                      </div>
                      <div className="max-h-64 overflow-y-auto space-y-2 mt-3 text-xs">
                        {notifications.length === 0 ? (
                          <p className="text-slate-500 text-center py-4">No notifications yet.</p>
                        ) : (
                          notifications.map((n) => (
                            <div
                              key={n.id}
                              className={`p-2.5 rounded-xl border transition-all ${
                                n.read ? 'bg-slate-950/40 border-slate-800/60 text-slate-400' : 'bg-indigo-950/30 border-indigo-500/30 text-slate-200 font-medium'
                              }`}
                            >
                              <p>{n.message}</p>
                              <span className="text-[10px] text-slate-500 mt-1 block">
                                {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Profile Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setShowUserDropdown(!showUserDropdown)}
                    className="flex items-center space-x-2 p-1.5 rounded-xl hover:bg-slate-800/80 transition-all border border-slate-800/60"
                  >
                    <div className="h-7 w-7 rounded-lg bg-indigo-600/30 border border-indigo-400/40 flex items-center justify-center font-bold text-indigo-300 text-xs">
                      {currentUser.name.charAt(0)}
                    </div>
                    <span className="text-xs font-medium text-slate-200 max-w-[100px] truncate">{currentUser.name}</span>
                    <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
                  </button>

                  {showUserDropdown && (
                    <div className="absolute right-0 mt-2 w-64 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl z-50 p-2 animate-in fade-in slide-in-from-top-2 duration-150">
                      <div className="p-3 border-b border-slate-800">
                        <p className="text-sm font-semibold text-white">{currentUser.name}</p>
                        <p className="text-xs text-slate-400 truncate">{currentUser.email}</p>
                        <span className="inline-block mt-1.5 text-[10px] font-semibold uppercase px-2 py-0.5 bg-indigo-500/20 text-indigo-300 rounded border border-indigo-500/30">
                          Role: {currentUser.role}
                        </span>
                      </div>

                      <div className="pt-1">
                        {role === 'FREELANCER' && (
                          <Link
                            href={`/profile/${currentUser.id}`}
                            onClick={() => setShowUserDropdown(false)}
                            className="flex items-center space-x-2 px-3 py-2 text-xs text-slate-300 hover:bg-slate-800 rounded-lg"
                          >
                            <User className="h-4 w-4 text-indigo-400" />
                            <span>My Public Profile</span>
                          </Link>
                        )}
                        {role === 'FREELANCER' && (
                          <Link
                            href="/profile/edit"
                            onClick={() => setShowUserDropdown(false)}
                            className="flex items-center space-x-2 px-3 py-2 text-xs text-slate-300 hover:bg-slate-800 rounded-lg"
                          >
                            <Sparkles className="h-4 w-4 text-indigo-400" />
                            <span>Edit & AI Enhance Profile</span>
                          </Link>
                        )}
                        <button
                          onClick={() => {
                            logout();
                            setShowUserDropdown(false);
                          }}
                          className="w-full flex items-center space-x-2 px-3 py-2 text-xs text-rose-400 hover:bg-rose-950/30 rounded-lg mt-1"
                        >
                          <LogOut className="h-4 w-4" />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  href="/login"
                  className="px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white rounded-lg transition-colors"
                >
                  Log In
                </Link>
                <Link
                  href="/signup"
                  className="px-3.5 py-1.5 text-xs font-medium bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-xl shadow-md transition-all"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu trigger */}
          <div className="md:hidden flex items-center space-x-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-400 hover:text-white bg-slate-800/60"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile navigation menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-800 bg-slate-900 px-4 pt-2 pb-4 space-y-2">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-base font-medium text-slate-200 hover:bg-slate-800"
            >
              {link.label}
            </Link>
          ))}
        </div>
      )}
    </header>
  );
}
