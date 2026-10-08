'use client';

import React from 'react';
import { RoleProvider } from '../../context/RoleContext';
import { TriageProvider } from '../../context/TriageContext';
import { NotificationProvider } from '../../context/NotificationContext';
import { ArrivalToastContainer } from '../common/ArrivalToastContainer';

export const Providers: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <RoleProvider>
      <TriageProvider>
        <NotificationProvider>
          {children}
          <ArrivalToastContainer />
        </NotificationProvider>
      </TriageProvider>
    </RoleProvider>
  );
};
