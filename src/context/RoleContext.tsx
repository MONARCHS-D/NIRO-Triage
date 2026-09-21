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
  isAuthenticated: boolean;
  isSessionExpired: boolean;
  setCurrentUser: (user: UserProfile) => void;
  setCurrentFacility: (facility: Facility) => void;
  setUserRole: (role: UserRole) => void;
  setViewMode: (mode: 'REVIEWER_DESKTOP' | 'PATIENT_MOBILE') => void;
  setIsOffline: (offline: boolean) => void;
  login: (staffIdOrEmail: string, password?: string) => boolean;
  logout: () => void;
  setIsSessionExpired: (expired: boolean) => void;
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = 'niro_auth_state_v1';

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<UserProfile>(INITIAL_USERS[0]);
  const [currentFacility, setCurrentFacility] = useState<Facility>(INITIAL_FACILITIES[0]);
  const [facilities] = useState<Facility[]>(INITIAL_FACILITIES);
  const [users] = useState<UserProfile[]>(INITIAL_USERS);
  const [viewMode, setViewMode] = useState<'REVIEWER_DESKTOP' | 'PATIENT_MOBILE'>('REVIEWER_DESKTOP');
  const [isOffline, setIsOffline] = useState<boolean>(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true);
  const [isSessionExpired, setIsSessionExpired] = useState<boolean>(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(AUTH_STORAGE_KEY);
      if (stored !== null) {
        setIsAuthenticated(stored === 'true');
      }
    } catch {
      // ignore storage errors
    }
  }, []);

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

  const login = (staffIdOrEmail: string, password?: string): boolean => {
    // Validate credentials: accept any non-empty input for prototype, or match known profiles
    if (!staffIdOrEmail || staffIdOrEmail.trim().length === 0) {
      return false;
    }

    const lower = staffIdOrEmail.toLowerCase();
    if (lower.includes('nurse') || lower.includes('sunita')) {
      setUserRole('NURSE');
    } else if (lower.includes('cho') || lower.includes('ramesh') || lower.includes('health')) {
      setUserRole('HEALTH_WORKER');
    } else if (lower.includes('patient')) {
      setUserRole('PATIENT');
    } else if (lower.includes('admin')) {
      setUserRole('ADMIN');
    } else {
      setUserRole('DOCTOR');
    }

    setIsAuthenticated(true);
    setIsSessionExpired(false);
    if (typeof window !== 'undefined') {
      localStorage.setItem(AUTH_STORAGE_KEY, 'true');
    }
    return true;
  };

  const logout = () => {
    setIsAuthenticated(false);
    if (typeof window !== 'undefined') {
      localStorage.setItem(AUTH_STORAGE_KEY, 'false');
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
        isAuthenticated,
        isSessionExpired,
        setCurrentUser,
        setCurrentFacility,
        setUserRole,
        setViewMode,
        setIsOffline,
        login,
        logout,
        setIsSessionExpired,
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
