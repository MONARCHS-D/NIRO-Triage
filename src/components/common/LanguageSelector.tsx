import React from 'react';
import { SUPPORTED_LANGUAGES, LanguageOption } from '../../lib/audioSimulator';
import { Globe } from 'lucide-react';

interface LanguageSelectorProps {
  selectedLanguage: string;
  onSelect: (lang: LanguageOption) => void;
  className?: string;
  compact?: boolean;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  selectedLanguage,
  onSelect,
  className = '',
  compact = false,
}) => {
  return (
    <div className={`relative ${className}`}>
      <div className="flex items-center gap-2 mb-1.5">
        <Globe className="w-4 h-4 text-[#526276]" />
        <label className="text-xs font-semibold text-[#25364A] uppercase tracking-wider">
          Intake Language / ଭାଷା / भाषा
        </label>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {SUPPORTED_LANGUAGES.map((lang) => {
          const isSelected = selectedLanguage === lang.code;
          return (
            <button
              key={lang.code}
              type="button"
              onClick={() => onSelect(lang)}
              className={`text-left p-2.5 rounded-md border transition-all cursor-pointer ${
                isSelected
                  ? 'border-[#2563EB] bg-[#E8F0FF] text-[#164FD6] font-medium shadow-xs'
                  : 'border-[#E6ECF2] bg-white hover:bg-[#F8FAFC] text-[#25364A]'
              }`}
            >
              <div className="text-xs font-semibold">{lang.name}</div>
              <div className="text-sm font-medium opacity-90">{lang.nativeName}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
