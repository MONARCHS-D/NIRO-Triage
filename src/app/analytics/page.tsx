'use client';

import React from 'react';
import { ShellLayout } from '../../components/layout/ShellLayout';
import { AnalyticsView } from '../../components/views/AnalyticsView';

export default function AnalyticsPage() {
  return (
    <ShellLayout>
      <AnalyticsView />
    </ShellLayout>
  );
}
