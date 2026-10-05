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
} from 'lucide-react';
import { useRole } from '../../context/RoleContext';

export interface SidebarProps {
  currentTab?: string;
  onSelectTab?: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, onSelectTab }) => {
  const pathname = usePathname();
  const { currentUser, currentFacility, logout } = useRole();

  // Section 33: Must-build MVP Navigation items
  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/intake', label: 'New Intake', icon: PlusCircle },
    { href: '/intake/voice', label: 'Voice Intake', icon: Mic },
    { href: '/queue', label: 'Triage Queue', icon: Inbox },
    { href: '/patients', label: 'Patients', icon: Users },
    { href: '/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="w-60 flex-shrink-0 bg-white border-r border-[#E6ECF2] flex flex-col h-screen sticky top-0 select-none z-40">
      {/* Brand Header */}
      <div className="p-4 border-b border-[#E6ECF2]">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#2563EB] flex items-center justify-center text-white font-bold text-xs shadow-xs tracking-tight">
            NIRO
          </div>
          <div>
            <h1 className="text-sm font-bold text-[#102033] tracking-tight">NIRO Triage</h1>
            <p className="text-[11px] text-[#6B7B8F] font-medium leading-none mt-0.5">People First. Care Faster.</p>
          </div>
        </Link>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        <div className="text-[10px] font-bold uppercase tracking-wider text-[#6B7B8F] px-3 py-1.5">
          Clinical Operations
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname?.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors text-left cursor-pointer ${
                isActive
                  ? 'bg-[#E8F0FF] text-[#164FD6] font-semibold border-l-3 border-[#2563EB]'
                  : 'text-[#25364A] hover:bg-[#F8FAFC] hover:text-[#102033]'
              }`}
            >
              <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-[#2563EB]' : 'text-[#6B7B8F]'}`} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* User / Reviewer Profile Card */}
      <div className="p-3 border-t border-[#E6ECF2] bg-[#F8FAFC]">
        <div className="flex items-start gap-2.5">
          <div className="w-8 h-8 rounded-full bg-blue-100 text-[#2563EB] flex items-center justify-center font-bold text-xs flex-shrink-0">
            {currentUser.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-[#102033] truncate">{currentUser.name}</p>
            <p className="text-[11px] text-[#6B7B8F] truncate">{currentUser.title}</p>
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
      </div>
    </aside>
  );
};
