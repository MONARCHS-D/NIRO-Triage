'use client';

import React from 'react';
import { ShellLayout } from '../../components/layout/ShellLayout';
import { SettingsView } from '../../components/views/SettingsView';

export default function SettingsPage() {
  return (
    <ShellLayout>
      <SettingsView />
    </ShellLayout>
  );
}

