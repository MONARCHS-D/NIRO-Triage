import React from 'react';
import { WifiOff, Database } from 'lucide-react';
import { useRole } from '../../context/RoleContext';

export const OfflineBanner: React.FC = () => {
  const { isOffline, setIsOffline } = useRole();

  if (!isOffline) return null;

  return (
    <div className="bg-[#FFF6DD] border-b border-[#FDE68A] px-4 py-2 text-xs font-medium text-[#996500] flex items-center justify-between transition-all">
      <div className="flex items-center gap-2 max-w-5xl mx-auto w-full">
        <WifiOff className="w-4 h-4 text-[#D99A18] flex-shrink-0" />
        <div>
          <span className="font-semibold">Offline / reconnecting:</span> Your entered information is saved locally and will sync when network returns.
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded bg-white/70 border border-[#FDE68A]">
            <Database className="w-3 h-3" /> IndexedDB Active
          </span>
          <button
            onClick={() => setIsOffline(false)}
            className="underline text-[11px] hover:text-[#784f00] cursor-pointer ml-1"
          >
            Reconnect
          </button>
        </div>
      </div>
    </div>
  );
};
