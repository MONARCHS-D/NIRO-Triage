'use client';

import React from 'react';
import { RoleProvider } from '../../context/RoleContext';
import { TriageProvider } from '../../context/TriageContext';

export const Providers: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <RoleProvider>
      <TriageProvider>{children}</TriageProvider>
    </RoleProvider>
  );
};
