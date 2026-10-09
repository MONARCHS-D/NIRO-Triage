'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  PlusCircle,
  Inbox,
  Mic,
  Settings,
  ShieldCheck,
  Hospital,
  LogOut,
  FileText,
  BarChart3,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useRole } from '../../context/RoleContext';
import { AccountStatusBadge } from '../common/rbac/AccountStatusBadge';

export interface SidebarProps {
  currentTab?: string;
  onSelectTab?: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, onSelectTab }) => {
  const pathname = usePathname();
  const { currentUser, currentFacility, logout, isSidebarCollapsed, toggleSidebar } = useRole();

  // Navigation items
  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/intake', label: 'New Intake', icon: PlusCircle },
    { href: '/intake/voice', label: 'Voice Intake', icon: Mic },
    { href: '/queue', label: 'Triage Queue', icon: Inbox },
    { href: '/patients', label: 'Patients', icon: Users },
    { href: '/reports', label: 'Clinical Reports', icon: FileText },
    { href: '/analytics', label: 'Analytics', icon: BarChart3 },
    { href: '/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside
      suppressHydrationWarning
      className={`${
        isSidebarCollapsed ? 'w-16' : 'w-60'
      } flex-shrink-0 bg-white border-r border-[#E6ECF2] flex flex-col h-screen sticky top-0 select-none z-40 transition-all duration-200`}
    >
      {/* Brand Header */}
      <div
        suppressHydrationWarning
        className={`p-4 border-b border-[#E6ECF2] flex items-center ${isSidebarCollapsed ? 'justify-center' : 'justify-between'}`}
      >
        <Link
          href="/dashboard"
          className="flex items-center gap-2.5 overflow-hidden"
          title="CareIntel — People First. Care Faster."
        >
          <div className="w-8 h-8 rounded-lg bg-[#2563EB] flex items-center justify-center text-white font-bold text-xs shadow-xs tracking-tight shrink-0">
            CI
          </div>
          {!isSidebarCollapsed && (
            <div className="min-w-0 transition-opacity duration-150">
              <h1 className="text-sm font-bold text-[#102033] tracking-tight truncate">CareIntel</h1>
              <p className="text-[11px] text-[#6B7B8F] font-medium leading-none mt-0.5 truncate">People First. Care Faster.</p>
            </div>
          )}
        </Link>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 p-2 sm:p-3 space-y-1 overflow-y-auto">
        {!isSidebarCollapsed && (
          <div className="text-[10px] font-bold uppercase tracking-wider text-[#6B7B8F] px-3 py-1.5 truncate">
            Clinical Operations
          </div>
        )}
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === '/dashboard' || item.href === '/intake'
              ? pathname === item.href
              : pathname === item.href || (item.href !== '/' && pathname?.startsWith(item.href + '/'));
          return (
            <Link
              key={item.href}
              href={item.href}
              title={isSidebarCollapsed ? item.label : undefined}
              className={`flex items-center ${
                isSidebarCollapsed ? 'justify-center px-2 py-2.5' : 'gap-3 px-3 py-2'
              } rounded-md text-sm transition-colors text-left cursor-pointer ${
                isActive
                  ? 'bg-[#E8F0FF] text-[#164FD6] font-semibold border-l-3 border-[#2563EB]'
                  : 'text-[#25364A] hover:bg-[#F8FAFC] hover:text-[#102033]'
              }`}
            >
              <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-[#2563EB]' : 'text-[#6B7B8F]'}`} />
              {!isSidebarCollapsed && <span className="truncate">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Sidebar Collapse Toggle Bar */}
      <div className="px-2 py-1.5 border-t border-[#E6ECF2] bg-slate-50 flex items-center justify-center">
        <button
          type="button"
          onClick={toggleSidebar}
          title={isSidebarCollapsed ? 'Expand Sidebar (Ctrl/Cmd + B)' : 'Collapse Sidebar to icon-rail (Ctrl/Cmd + B)'}
          className="w-full flex items-center justify-center gap-1.5 py-1 px-2 rounded text-xs text-[#526276] hover:text-[#102033] hover:bg-slate-200/60 transition-colors cursor-pointer"
        >
          {isSidebarCollapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <>
              <ChevronLeft className="w-4 h-4" />
              <span className="text-[11px] font-medium">Collapse Sidebar</span>
            </>
          )}
        </button>
      </div>

      {/* User / Reviewer Profile Card */}
      <div className="p-2 sm:p-3 border-t border-[#E6ECF2] bg-[#F8FAFC]">
        {isSidebarCollapsed ? (
          <div className="flex flex-col items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0 cursor-default ${
                currentUser.status === 'SUSPENDED'
                  ? 'bg-rose-50 text-rose-800 border border-rose-200'
                  : 'bg-blue-100 text-[#2563EB]'
              }`}
              title={`${currentUser.name} · ${currentUser.status === 'SUSPENDED' ? 'SUSPENDED' : currentUser.title} (${currentFacility.name})`}
            >
              {currentUser.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2)}
            </div>
            <Link
              href="/auth/login"
              onClick={logout}
              title="Sign Out"
              className="text-[#6B7B8F] hover:text-red-600 cursor-pointer p-1"
            >
              <LogOut className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <>
            <div className="flex items-start gap-2.5">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0 ${
                  currentUser.status === 'SUSPENDED'
                    ? 'bg-rose-50 text-rose-800 border border-rose-200'
                    : 'bg-blue-100 text-[#2563EB]'
                }`}
              >
                {currentUser.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-[#102033] truncate">{currentUser.name}</p>
                <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                  <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-blue-50 text-[#164FD6] border border-blue-200 truncate">
                    {currentUser.role === 'DOCTOR' ? 'Doctor · Full Signoff' : currentUser.role === 'NURSE' ? 'Nurse · Intake & Vitals' : currentUser.role === 'HEALTH_WORKER' ? 'CHO · Frontline' : currentUser.role === 'ADMIN' ? 'Facility Admin' : 'Patient'}
                  </span>
                  {currentUser.status === 'SUSPENDED' && (
                    <AccountStatusBadge status="SUSPENDED" variant="sidebar" />
                  )}
                </div>
                <div className="flex items-center gap-1 mt-1 text-[10px] text-[#526276] truncate">
                  <Hospital className="w-3 h-3 flex-shrink-0" />
                  <span className="truncate">{currentFacility.name}</span>
                </div>
              </div>
            </div>

            {/* Responsible AI prototype pill */}
            <div className="mt-2.5 pt-2 border-t border-slate-200/80 flex items-center justify-between text-[10px] text-[#6B7B8F]">
              <span className="flex items-center gap-1 font-medium">
                <ShieldCheck className="w-3 h-3 text-emerald-600" /> Non-Diagnostic
              </span>
              <Link href="/auth/login" onClick={logout} title="Sign Out" className="hover:text-red-600 cursor-pointer">
                <LogOut className="w-3.5 h-3.5" />
              </Link>
            </div>
          </>
        )}
      </div>
    </aside>
  );
};
