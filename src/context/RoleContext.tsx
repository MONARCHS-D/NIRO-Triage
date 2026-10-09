'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { Facility, PermissionCode, RoleCapabilities, UserProfile, UserRole } from '../types/roles';
import { INITIAL_FACILITIES, INITIAL_USERS } from '../lib/syntheticData';
import { authApi } from '../lib/api/auth';
import { getAuthToken, setAuthToken } from '../lib/api/client';

export const ROLE_PERMISSIONS: Record<UserRole, PermissionCode[]> = {
  DOCTOR: [
    'consent:read',
    'consent:write',
    'case:read',
    'case:write',
    'evidence:read',
    'evidence:write',
    'processing:read',
    'processing:write',
    'structuring:read',
    'structuring:write',
    'knowledge:read',
    'knowledge:write',
    'ai:read',
    'ai:write',
    'review:read',
    'review:write',
    'review:assign',
    'escalation:read',
    'escalation:write',
    'referral:read',
    'referral:write',
    'handoff:read',
    'handoff:write',
  ],
  NURSE: [
    'consent:read',
    'consent:write',
    'case:read',
    'case:write',
    'evidence:read',
    'evidence:write',
    'processing:read',
    'structuring:read',
    'review:read',
    'review:write',
    'knowledge:read',
  ],
  HEALTH_WORKER: [
    'consent:read',
    'consent:write',
    'case:read',
    'case:write',
    'evidence:read',
    'evidence:write',
    'processing:read',
    'structuring:read',
    'review:write',
  ],
  ADMIN: [
    'manage:users',
    'manage:system',
    'consent:read',
    'consent:write',
    'case:read',
    'case:write',
    'evidence:read',
    'evidence:write',
    'processing:read',
    'processing:write',
    'structuring:read',
    'structuring:write',
    'knowledge:read',
    'knowledge:write',
    'ai:read',
    'ai:write',
    'review:read',
    'review:write',
    'review:assign',
    'escalation:read',
    'escalation:write',
    'referral:read',
    'referral:write',
    'handoff:read',
    'handoff:write',
    'recipient:manage',
  ],
  PATIENT: [
    'consent:read',
    'consent:write',
    'case:read',
  ],
};

interface RoleContextType {
  currentUser: UserProfile;
  currentFacility: Facility;
  facilities: Facility[];
  users: UserProfile[];
  viewMode: 'REVIEWER_DESKTOP' | 'PATIENT_MOBILE';
  isOffline: boolean;
  isAuthenticated: boolean;
  isSessionExpired: boolean;
  isSidebarCollapsed: boolean;
  capabilities: RoleCapabilities;
  permissions: PermissionCode[];
  hasPermission: (perm: PermissionCode) => boolean;
  setIsSidebarCollapsed: (collapsed: boolean) => void;
  toggleSidebar: () => void;
  setCurrentUser: (user: UserProfile) => void;
  setCurrentFacility: (facility: Facility) => void;
  setUserRole: (role: UserRole) => void;
  exitPatientMobile: () => void;
  setViewMode: (mode: 'REVIEWER_DESKTOP' | 'PATIENT_MOBILE') => void;
  setIsOffline: (offline: boolean) => void;
  login: (staffIdOrEmail: string, password?: string) => Promise<boolean>;
  logout: () => Promise<void>;
  setIsSessionExpired: (expired: boolean) => void;
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = 'careintel_auth_state_v1';
const LEGACY_AUTH_STORAGE_KEY = 'niro_auth_state_v1';
const SIDEBAR_STORAGE_KEY = 'careintel_sidebar_collapsed';
const LEGACY_SIDEBAR_STORAGE_KEY = 'niro_sidebar_collapsed';

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<UserProfile>(INITIAL_USERS[0]);
  const [currentFacility, setCurrentFacility] = useState<Facility>(INITIAL_FACILITIES[0]);
  const [facilities] = useState<Facility[]>(INITIAL_FACILITIES);
  const [users] = useState<UserProfile[]>(INITIAL_USERS);
  const [viewMode, setViewMode] = useState<'REVIEWER_DESKTOP' | 'PATIENT_MOBILE'>('REVIEWER_DESKTOP');
  const [lastStaffRole, setLastStaffRole] = useState<UserRole>('DOCTOR');
  const [isOffline, setIsOffline] = useState<boolean>(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(AUTH_STORAGE_KEY) ?? localStorage.getItem(LEGACY_AUTH_STORAGE_KEY);
      return stored !== 'false';
    }
    return true;
  });
  const [isSessionExpired, setIsSessionExpired] = useState<boolean>(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(SIDEBAR_STORAGE_KEY) ?? localStorage.getItem(LEGACY_SIDEBAR_STORAGE_KEY);
      return stored === 'true';
    }
    return false;
  });

  const toggleSidebar = useCallback(() => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      if (typeof window !== 'undefined') {
        localStorage.setItem(SIDEBAR_STORAGE_KEY, String(next));
      }
      return next;
    });
  }, []);

  const setUserRole = useCallback((role: UserRole) => {
    const matched = users.find((u) => u.role === role);
    if (matched) {
      setCurrentUser(matched);
      if (role === 'PATIENT') {
        setViewMode('PATIENT_MOBILE');
      } else {
        setLastStaffRole(role);
        if (viewMode === 'PATIENT_MOBILE') {
          setViewMode('REVIEWER_DESKTOP');
        }
      }
    }
  }, [users, viewMode]);

  const exitPatientMobile = useCallback(() => {
    setViewMode('REVIEWER_DESKTOP');
    const targetRole = lastStaffRole && lastStaffRole !== 'PATIENT' ? lastStaffRole : 'DOCTOR';
    const matched = users.find((u) => u.role === targetRole);
    if (matched) {
      setCurrentUser(matched);
    }
  }, [lastStaffRole, users]);

  const permissions = useMemo<PermissionCode[]>(() => {
    return currentUser.permissions && currentUser.permissions.length > 0
      ? currentUser.permissions
      : ROLE_PERMISSIONS[currentUser.role] || [];
  }, [currentUser]);

  const hasPermission = useCallback((perm: PermissionCode): boolean => {
    return permissions.includes(perm);
  }, [permissions]);

  const capabilities = useMemo<RoleCapabilities>(() => {
    const role = currentUser.role;
    const isDoc = role === 'DOCTOR';
    const isAdmin = role === 'ADMIN';
    const isNurse = role === 'NURSE';
    const isCHO = role === 'HEALTH_WORKER';

    return {
      canApproveCase: (isDoc || isAdmin) && hasPermission('review:write'),
      canReferHandoff: (isDoc || isAdmin) && hasPermission('referral:write') && hasPermission('handoff:write'),
      canEscalateCase: (isDoc || isAdmin) && hasPermission('escalation:write'),
      canOverridePriority: (isDoc || isAdmin) && hasPermission('escalation:write'),
      canRunAi: (isDoc || isAdmin) && hasPermission('ai:write'),
      canAcceptDraft: (isDoc || isAdmin) && hasPermission('ai:write'),
      canManageSettings: isAdmin || hasPermission('manage:system'),
      canAccessDiagnostics: isAdmin || hasPermission('manage:system'),
      canPerformIntake: hasPermission('case:write'),
      canViewReports: hasPermission('evidence:read') || isDoc || isNurse || isCHO || isAdmin,
      canAssignReview: (isDoc || isAdmin) && hasPermission('review:assign'),
    };
  }, [currentUser.role, hasPermission]);

  // Initial load: check token and validate session with backend
  useEffect(() => {
    const initAuth = async () => {
      const token = getAuthToken();
      if (token) {
        try {
          const profile = await authApi.getMe();
          if (profile && profile.id) {
            setIsAuthenticated(true);
            setIsOffline(false);
            // Map backend role to frontend role if available and store backend user UUID
            const backendRole = profile.roles?.[0]?.toUpperCase();
            if (backendRole && users.some((u) => u.role === backendRole)) {
              setUserRole(backendRole as UserRole);
            }
            setCurrentUser((prev) => ({
              ...prev,
              id: profile.id,
            }));
          }
        } catch (e: any) {
          console.warn('Backend session verification failed, falling back to local storage:', e);
          if (e?.code === 'NETWORK_ERROR') {
            setIsOffline(true);
          }
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

  const login = async (staffIdOrEmail: string, password = 'demo123'): Promise<boolean> => {
    if (!staffIdOrEmail || staffIdOrEmail.trim().length === 0) {
      return false;
    }

    try {
      // Attempt backend login first
      const email = staffIdOrEmail.includes('@') ? staffIdOrEmail : `${staffIdOrEmail}@careintel.local`;
      await authApi.login({ email, password });
      setIsOffline(false);

      // Retrieve backend profile and capture actual user UUID
      try {
        const profile = await authApi.getMe();
        if (profile && profile.id) {
          setCurrentUser((prev) => ({
            ...prev,
            id: profile.id,
          }));
        }
      } catch {
        // Non-fatal
      }
    } catch (e: any) {
      console.warn('Backend login endpoint unavailable or rejected, using prototype mode:', e);
      if (e?.code === 'NETWORK_ERROR') {
        setIsOffline(true);
      }
    }

    // Role mapping for UI layout
    const lower = staffIdOrEmail.toLowerCase();
    if (lower.includes('nurse') || lower.includes('sunita') || lower.includes('maya')) {
      setUserRole('NURSE');
    } else if (lower.includes('cho') || lower.includes('ramesh') || lower.includes('rajesh') || lower.includes('health')) {
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
        isSidebarCollapsed,
        capabilities,
        permissions,
        hasPermission,
        setIsSidebarCollapsed,
        toggleSidebar,
        setCurrentUser,
        setCurrentFacility,
        setUserRole,
        exitPatientMobile,
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
