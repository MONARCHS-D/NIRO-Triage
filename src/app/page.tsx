'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useRole } from '../context/RoleContext';

export default function RootPage() {
  const router = useRouter();
  const { isAuthenticated } = useRole();

  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/dashboard');
    } else {
      router.replace('/auth/login');
    }
  }, [isAuthenticated, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
      <div className="flex flex-col items-center gap-3 text-xs text-[#6B7B8F]">
        <div className="w-8 h-8 rounded-full border-2 border-[#2563EB] border-t-transparent animate-spin" />
        <span>Initializing NIRO Triage workspace…</span>
      </div>
    </div>
  );
}
