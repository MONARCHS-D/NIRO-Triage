'use client';

import React from 'react';
import { RoleProvider } from '../context/RoleContext';
import { TriageProvider } from '../context/TriageContext';
import { AppShell } from '../components/layout/AppShell';

export default function Home() {
  return (
    <RoleProvider>
      <TriageProvider>
        <AppShell />
      </TriageProvider>
    </RoleProvider>
  );
}
