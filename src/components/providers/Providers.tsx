'use client';

import React from 'react';
import { RoleProvider } from '../../context/RoleContext';
import { TriageProvider } from '../../context/TriageContext';
import { ToastProvider } from '../../context/ToastContext';

export const Providers: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <RoleProvider>
      <TriageProvider>
        <ToastProvider>{children}</ToastProvider>
      </TriageProvider>
    </RoleProvider>
  );
};
