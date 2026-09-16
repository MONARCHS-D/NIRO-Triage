'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Facility, UserProfile, UserRole } from '../types/roles';
import { INITIAL_FACILITIES, INITIAL_USERS } from '../lib/syntheticData';

interface RoleContextType {
  currentUser: UserProfile;
  currentFacility: Facility;
  facilities: Facility[];
  users: UserProfile[];
  viewMode: 'REVIEWER_DESKTOP' | 'PATIENT_MOBILE';
  isOffline: boolean;
  setCurrentUser: (user: UserProfile) => void;
  setCurrentFacility: (facility: Facility) => void;
  setUserRole: (role: UserRole) => void;
  setViewMode: (mode: 'REVIEWER_DESKTOP' | 'PATIENT_MOBILE') => void;
  setIsOffline: (offline: boolean) => void;
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<UserProfile>(INITIAL_USERS[0]);
  const [currentFacility, setCurrentFacility] = useState<Facility>(INITIAL_FACILITIES[0]);
  const [facilities] = useState<Facility[]>(INITIAL_FACILITIES);
  const [users] = useState<UserProfile[]>(INITIAL_USERS);
  const [viewMode, setViewMode] = useState<'REVIEWER_DESKTOP' | 'PATIENT_MOBILE'>('REVIEWER_DESKTOP');
  const [isOffline, setIsOffline] = useState<boolean>(false);

  const setUserRole = (role: UserRole) => {
    const matched = users.find((u) => u.role === role);
    if (matched) {
      setCurrentUser(matched);
      if (role === 'PATIENT') {
        setViewMode('PATIENT_MOBILE');
      } else if (viewMode === 'PATIENT_MOBILE') {
        setViewMode('REVIEWER_DESKTOP');
      }
    }
  };

  return (
    <RoleContext.Provider
      value={{
        currentUser,
        currentFacility,
        facilities,
        users,
        viewMode,
        isOffline,
        setCurrentUser,
        setCurrentFacility,
        setUserRole,
        setViewMode,
        setIsOffline,
      }}
    >
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  const context = useContext(RoleContext);
  if (!context) {
    throw new Error('useRole must be used within a RoleProvider');
  }
  return context;
}
