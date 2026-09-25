'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Facility, UserProfile, UserRole } from '../types/roles';
import { INITIAL_FACILITIES, INITIAL_USERS } from '../lib/syntheticData';
import { authApi } from '../lib/api/auth';
import { getAuthToken, setAuthToken } from '../lib/api/client';

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
  login: (staffIdOrEmail: string, password?: string) => Promise<boolean>;
  logout: () => Promise<void>;
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
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isSessionExpired, setIsSessionExpired] = useState<boolean>(false);

  const setUserRole = useCallback((role: UserRole) => {
    const matched = users.find((u) => u.role === role);
    if (matched) {
      setCurrentUser(matched);
      if (role === 'PATIENT') {
        setViewMode('PATIENT_MOBILE');
      } else if (viewMode === 'PATIENT_MOBILE') {
        setViewMode('REVIEWER_DESKTOP');
      }
    }
  }, [users, viewMode]);

  // Initial load: check token and validate session with backend
  useEffect(() => {
    const initAuth = async () => {
      const token = getAuthToken();
      if (token) {
        try {
          const profile = await authApi.getMe();
          if (profile && profile.id) {
            setIsAuthenticated(true);
            // Map backend role to frontend role if available
            const backendRole = profile.roles?.[0]?.toUpperCase();
            if (backendRole && users.some((u) => u.role === backendRole)) {
              setUserRole(backendRole as UserRole);
            }
          }
        } catch (e) {
          console.warn('Backend session verification failed, falling back to local storage:', e);
          const stored = localStorage.getItem(AUTH_STORAGE_KEY);
          if (stored === 'true') {
            setIsAuthenticated(true);
          }
        }
      } else {
        const stored = localStorage.getItem(AUTH_STORAGE_KEY);
        if (stored === 'true') {
          setIsAuthenticated(true);
        }
      }
    };

    initAuth();

    // Session expiration listener
    const handleSessionExpired = () => {
      setIsSessionExpired(true);
      setIsAuthenticated(false);
      setAuthToken(null);
    };

    window.addEventListener('careintel:session-expired', handleSessionExpired);
    return () => {
      window.removeEventListener('careintel:session-expired', handleSessionExpired);
    };
  }, [setUserRole, users]);

  const login = async (staffIdOrEmail: string, password = 'password123'): Promise<boolean> => {
    if (!staffIdOrEmail || staffIdOrEmail.trim().length === 0) {
      return false;
    }

    try {
      // Attempt backend login first
      const email = staffIdOrEmail.includes('@') ? staffIdOrEmail : `${staffIdOrEmail}@careintel.local`;
      await authApi.login({ email, password });
      setIsOffline(false);
    } catch (e) {
      console.warn('Backend login endpoint unavailable or rejected, using prototype mode:', e);
      setIsOffline(true);
    }

    // Role mapping for UI layout
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

  const logout = async () => {
    try {
      await authApi.logout();
    } catch {
      // Ignore network errors during logout
    }
    setIsAuthenticated(false);
    setAuthToken(null);
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
