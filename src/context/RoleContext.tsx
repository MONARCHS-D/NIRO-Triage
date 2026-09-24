'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Facility, UserProfile, UserRole } from '../types/roles';
import { INITIAL_FACILITIES, INITIAL_USERS } from '../lib/syntheticData';
import { checkBackendHealth, tokenStorage } from '../lib/api/client';
import { loginWithApi, logoutWithApi } from '../lib/api/authService';

interface RoleContextType {
  currentUser: UserProfile;
  currentFacility: Facility;
  facilities: Facility[];
  users: UserProfile[];
  viewMode: 'REVIEWER_DESKTOP' | 'PATIENT_MOBILE';
  isOffline: boolean;
  isAuthenticated: boolean;
  isSessionExpired: boolean;
  accessToken: string | null;
  isBackendOnline: boolean | null;
  backendLatency: number | null;
  setCurrentUser: (user: UserProfile) => void;
  setCurrentFacility: (facility: Facility) => void;
  setUserRole: (role: UserRole) => void;
  setViewMode: (mode: 'REVIEWER_DESKTOP' | 'PATIENT_MOBILE') => void;
  setIsOffline: (offline: boolean) => void;
  login: (staffIdOrEmail: string, password?: string) => Promise<boolean>;
  logout: () => void;
  setIsSessionExpired: (expired: boolean) => void;
  saveAuthSession: (
    tokens: { accessToken: string; refreshToken?: string },
    user?: Partial<UserProfile>,
    facility?: Partial<Facility>
  ) => void;
  addOrSelectFacility: (newFacility: Facility) => void;
  refreshBackendHealth: () => Promise<void>;
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = 'niro_auth_state_v1';
const USER_STORAGE_KEY = 'niro_active_user_v1';
const FACILITY_STORAGE_KEY = 'niro_active_facility_v1';

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<UserProfile>(INITIAL_USERS[0]);
  const [currentFacility, setCurrentFacility] = useState<Facility>(INITIAL_FACILITIES[0]);
  const [facilities, setFacilities] = useState<Facility[]>(INITIAL_FACILITIES);
  const [users, setUsers] = useState<UserProfile[]>(INITIAL_USERS);
  const [viewMode, setViewMode] = useState<'REVIEWER_DESKTOP' | 'PATIENT_MOBILE'>('REVIEWER_DESKTOP');
  const [isOffline, setIsOffline] = useState<boolean>(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true);
  const [isSessionExpired, setIsSessionExpired] = useState<boolean>(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isBackendOnline, setIsBackendOnline] = useState<boolean | null>(null);
  const [backendLatency, setBackendLatency] = useState<number | null>(null);

  const refreshBackendHealth = useCallback(async () => {
    try {
      const res = await checkBackendHealth();
      setIsBackendOnline(res.isOnline);
      setBackendLatency(res.latencyMs);
    } catch {
      setIsBackendOnline(false);
      setBackendLatency(null);
    }
  }, []);

  useEffect(() => {
    try {
      const storedAuth = localStorage.getItem(AUTH_STORAGE_KEY);
      if (storedAuth !== null) {
        setIsAuthenticated(storedAuth === 'true');
      }

      const storedToken = tokenStorage.getAccessToken();
      if (storedToken) {
        setAccessToken(storedToken);
      }

      const storedUser = localStorage.getItem(USER_STORAGE_KEY);
      if (storedUser) {
        try {
          setCurrentUser(JSON.parse(storedUser));
        } catch {
          // ignore parsing error
        }
      }

      const storedFacility = localStorage.getItem(FACILITY_STORAGE_KEY);
      if (storedFacility) {
        try {
          const parsed = JSON.parse(storedFacility);
          setCurrentFacility(parsed);
          setFacilities((prev) => (prev.some((f) => f.id === parsed.id) ? prev : [parsed, ...prev]));
        } catch {
          // ignore parsing error
        }
      }
    } catch {
      // ignore storage errors
    }

    // Check backend health asynchronously
    refreshBackendHealth();
  }, [refreshBackendHealth]);

  const setUserRole = (role: UserRole) => {
    const matched = users.find((u) => u.role === role);
    if (matched) {
      setCurrentUser(matched);
      if (typeof window !== 'undefined') {
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(matched));
      }
      if (role === 'PATIENT') {
        setViewMode('PATIENT_MOBILE');
      } else if (viewMode === 'PATIENT_MOBILE') {
        setViewMode('REVIEWER_DESKTOP');
      }
    }
  };

  const addOrSelectFacility = (newFacility: Facility) => {
    setFacilities((prev) => {
      const exists = prev.some((f) => f.id === newFacility.id || f.code === newFacility.code);
      return exists ? prev : [newFacility, ...prev];
    });
    setCurrentFacility(newFacility);
    if (typeof window !== 'undefined') {
      localStorage.setItem(FACILITY_STORAGE_KEY, JSON.stringify(newFacility));
    }
  };

  const saveAuthSession = (
    tokens: { accessToken: string; refreshToken?: string },
    user?: Partial<UserProfile>,
    facility?: Partial<Facility>
  ) => {
    tokenStorage.setTokens(tokens.accessToken, tokens.refreshToken || '');
    setAccessToken(tokens.accessToken);
    setIsAuthenticated(true);
    setIsSessionExpired(false);

    if (user) {
      const updatedUser: UserProfile = {
        id: user.id || currentUser.id,
        name: user.name || currentUser.name,
        role: user.role || currentUser.role,
        title: user.title || currentUser.title,
        facility: facility?.name || user.facility || currentUser.facility,
        department: user.department || currentUser.department,
        registrationNumber: user.registrationNumber || currentUser.registrationNumber,
      };
      setCurrentUser(updatedUser);
      setUsers((prev) => [updatedUser, ...prev.filter((u) => u.id !== updatedUser.id)]);
      if (typeof window !== 'undefined') {
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updatedUser));
      }
    }

    if (facility) {
      const updatedFacility: Facility = {
        id: facility.id || currentFacility.id,
        name: facility.name || currentFacility.name,
        code: facility.code || currentFacility.code,
        type: facility.type || currentFacility.type,
        district: facility.district || currentFacility.district,
        state: facility.state || currentFacility.state,
        activePatients: facility.activePatients ?? currentFacility.activePatients,
      };
      addOrSelectFacility(updatedFacility);
    }

    if (typeof window !== 'undefined') {
      localStorage.setItem(AUTH_STORAGE_KEY, 'true');
    }
  };

  const login = async (staffIdOrEmail: string, password?: string): Promise<boolean> => {
    if (!staffIdOrEmail || staffIdOrEmail.trim().length === 0) {
      return false;
    }

    // Attempt live API authentication with Spring Boot backend
    try {
      const authRes = await loginWithApi({
        identifier: staffIdOrEmail.trim(),
        password: password || 'demo123',
      });

      if (authRes && authRes.accessToken) {
        setAccessToken(authRes.accessToken);
        setIsAuthenticated(true);
        setIsSessionExpired(false);

        let userRole: UserRole = 'DOCTOR';
        if (authRes.role === 'NURSE') userRole = 'NURSE';
        else if (authRes.role === 'HEALTH_WORKER') userRole = 'HEALTH_WORKER';
        else if (authRes.role === 'ADMIN') userRole = 'ADMIN';

        const updatedUser: UserProfile = {
          id: authRes.userPublicId || 'usr-active',
          name: authRes.fullName || (staffIdOrEmail.includes('@') ? staffIdOrEmail.split('@')[0] : staffIdOrEmail),
          role: userRole,
          title:
            userRole === 'DOCTOR'
              ? 'Medical Officer'
              : userRole === 'NURSE'
              ? 'Staff Nurse'
              : userRole === 'HEALTH_WORKER'
              ? 'Community Health Officer'
              : 'Facility Administrator',
          facility: currentFacility.name,
        };

        setCurrentUser(updatedUser);
        setUsers((prev) => [updatedUser, ...prev.filter((u) => u.id !== updatedUser.id)]);

        if (typeof window !== 'undefined') {
          localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updatedUser));
          localStorage.setItem(AUTH_STORAGE_KEY, 'true');
        }

        if (viewMode === 'PATIENT_MOBILE') {
          setViewMode('REVIEWER_DESKTOP');
        }

        return true;
      }
    } catch (error: unknown) {
      const err = error as { statusCode?: number; message?: string };
      // If backend responded with 400/401/403 (Invalid credentials or validation error), rethrow for UI display
      if (err.statusCode && err.statusCode >= 400 && err.statusCode < 500) {
        throw error;
      }
      console.warn('[NIRO] API login failed, using prototype demo role.', error);
    }

    // Prototype / Demo fallback when offline
    const lower = staffIdOrEmail.toLowerCase();
    let targetRole: UserRole = 'DOCTOR';
    if (lower.includes('nurse') || lower.includes('sunita')) {
      targetRole = 'NURSE';
    } else if (lower.includes('cho') || lower.includes('ramesh') || lower.includes('health')) {
      targetRole = 'HEALTH_WORKER';
    } else if (lower.includes('patient')) {
      targetRole = 'PATIENT';
    } else if (lower.includes('admin')) {
      targetRole = 'ADMIN';
    }

    setUserRole(targetRole);
    setIsAuthenticated(true);
    setIsSessionExpired(false);
    if (typeof window !== 'undefined') {
      localStorage.setItem(AUTH_STORAGE_KEY, 'true');
    }
    return true;
  };

  const logout = () => {
    setIsAuthenticated(false);
    setAccessToken(null);
    tokenStorage.clearTokens();
    if (typeof window !== 'undefined') {
      localStorage.setItem(AUTH_STORAGE_KEY, 'false');
    }
    logoutWithApi().catch((e) => console.warn('[NIRO] Backend logout call handled.', e));
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
        accessToken,
        isBackendOnline,
        backendLatency,
        setCurrentUser,
        setCurrentFacility,
        setUserRole,
        setViewMode,
        setIsOffline,
        login,
        logout,
        setIsSessionExpired,
        saveAuthSession,
        addOrSelectFacility,
        refreshBackendHealth,
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
