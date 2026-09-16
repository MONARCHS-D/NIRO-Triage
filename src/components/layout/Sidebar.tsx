'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  PlusCircle,
  Inbox,
  FileSpreadsheet,
  BarChart3,
  Settings,
  ShieldCheck,
  Smartphone,
  Hospital,
  UserCheck,
} from 'lucide-react';
import { useRole } from '../../context/RoleContext';

interface SidebarProps {
  currentTab?: string;
  onSelectTab?: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab = 'dashboard', onSelectTab }) => {
  const pathname = usePathname();
  const { currentUser, currentFacility, viewMode, setViewMode } = useRole();

  const navItems = [
    { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
    { id: 'patients', label: 'Patients', icon: Users },
    { id: 'intake', label: 'New Intake', icon: PlusCircle },
    { id: 'queue', label: 'Triage Queue', icon: Inbox },
    { id: 'reports', label: 'Reports', icon: FileSpreadsheet },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="w-60 flex-shrink-0 bg-white border-r border-[#E6ECF2] flex flex-col h-screen sticky top-0 select-none z-20">
      {/* Brand Header */}
      <div className="p-4 border-b border-[#E6ECF2]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#2563EB] flex items-center justify-center text-white font-bold text-base shadow-xs">
            SS
          </div>
          <div>
            <h1 className="text-sm font-bold text-[#102033] tracking-tight">SwasthyaSetu</h1>
            <p className="text-[11px] text-[#6B7B8F] font-medium leading-none mt-0.5">People First. Care Faster.</p>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        <div className="text-[10px] font-bold uppercase tracking-wider text-[#6B7B8F] px-3 py-1.5">
          Clinical Operations
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab && onSelectTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors text-left cursor-pointer ${
                isActive
                  ? 'bg-[#E8F0FF] text-[#164FD6] font-semibold border-l-3 border-[#2563EB]'
                  : 'text-[#25364A] hover:bg-[#F8FAFC] hover:text-[#102033]'
              }`}
            >
              <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-[#2563EB]' : 'text-[#6B7B8F]'}`} />
              <span>{item.label}</span>
            </button>
          );
        })}

        {/* View Mode Switcher */}
        <div className="pt-4 mt-4 border-t border-[#E6ECF2]">
          <div className="text-[10px] font-bold uppercase tracking-wider text-[#6B7B8F] px-3 py-1.5">
            Experience Mode
          </div>
          <button
            onClick={() => setViewMode(viewMode === 'REVIEWER_DESKTOP' ? 'PATIENT_MOBILE' : 'REVIEWER_DESKTOP')}
            className="w-full flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium border border-[#E6ECF2] bg-[#F8FAFC] hover:bg-slate-100 text-[#25364A] cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <Smartphone className="w-3.5 h-3.5 text-[#2563EB]" />
              <span>{viewMode === 'REVIEWER_DESKTOP' ? 'Switch to Patient App' : 'Switch to Reviewer'}</span>
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 font-semibold">
              {viewMode === 'REVIEWER_DESKTOP' ? 'Mobile' : 'Desk'}
            </span>
          </button>
        </div>
      </nav>

      {/* User / Reviewer Profile Card */}
      <div className="p-3 border-t border-[#E6ECF2] bg-[#F8FAFC]">
        <div className="flex items-start gap-2.5">
          <div className="w-8 h-8 rounded-full bg-blue-100 text-[#2563EB] flex items-center justify-center font-bold text-xs flex-shrink-0">
            {currentUser.name.split(' ').map((n) => n[0]).join('').substring(0, 2)}
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
          <span className="tabular-nums">v0.9-MVP</span>
        </div>
      </div>
    </aside>
  );
};
