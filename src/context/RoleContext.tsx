'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Facility, GrantAccessInput, PermissionCode, RoleCapabilities, UserProfile, UserRole } from '../types/roles';
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
  isAuthLoading: boolean;
  isSessionExpired: boolean;
  isSidebarCollapsed: boolean;
  capabilities: RoleCapabilities;
  permissions: PermissionCode[];
  hasPermission: (perm: PermissionCode) => boolean;
  grantStaffAccess: (input: GrantAccessInput) => UserProfile;
  updateStaffRole: (userId: string, newRole: UserRole) => void;
  toggleStaffStatus: (userId: string) => void;
  deleteStaffMember: (userId: string) => void;
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
const SIDEBAR_STORAGE_KEY = 'careintel_sidebar_collapsed';
const LEGACY_SIDEBAR_STORAGE_KEY = 'niro_sidebar_collapsed';
const STAFF_DIRECTORY_KEY = 'careintel_staff_directory_v1';

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const [facilities] = useState<Facility[]>(INITIAL_FACILITIES);
  const [users, setUsers] = useState<UserProfile[]>(INITIAL_USERS);
  const [currentUser, setCurrentUser] = useState<UserProfile>(INITIAL_USERS[0]);

  // Synchronize client-persisted preferences safely after hydration
  useEffect(() => {
    try {
      const storedSidebar = localStorage.getItem(SIDEBAR_STORAGE_KEY) ?? localStorage.getItem(LEGACY_SIDEBAR_STORAGE_KEY);
      if (storedSidebar !== null) {
        setIsSidebarCollapsed(storedSidebar === 'true');
      }

      const storedStaff = localStorage.getItem(STAFF_DIRECTORY_KEY);
      if (storedStaff) {
        const parsed = JSON.parse(storedStaff);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setUsers(parsed);
          setCurrentUser(parsed[0]);
        }
      }

    } catch {
      // ignore
    }
  }, []);

  // Synchronize currentUser whenever users array updates (e.g. status suspension or role edit)
  useEffect(() => {
    const matched = users.find((u) => u.id === currentUser.id);
    if (matched && (matched.status !== currentUser.status || matched.role !== currentUser.role)) {
      setCurrentUser(matched);
    }
  }, [users, currentUser.id, currentUser.status, currentUser.role]);

  const [currentFacility, setCurrentFacility] = useState<Facility>(INITIAL_FACILITIES[0]);
  const [viewMode, setViewMode] = useState<'REVIEWER_DESKTOP' | 'PATIENT_MOBILE'>('REVIEWER_DESKTOP');
  const [lastStaffRole, setLastStaffRole] = useState<UserRole>('DOCTOR');
  const [isOffline, setIsOffline] = useState<boolean>(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(true);
  const [isSessionExpired, setIsSessionExpired] = useState<boolean>(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);

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
        setViewMode((prev) => (prev === 'PATIENT_MOBILE' ? 'REVIEWER_DESKTOP' : prev));
      }
    }
  }, [users]);

  // Admin Staff Provisioning & Management
  const grantStaffAccess = useCallback((input: GrantAccessInput): UserProfile => {
    const newId = `user-${Date.now().toString(36)}`;
    const newUser: UserProfile = {
      id: newId,
      name: input.name,
      role: input.role,
      title: input.title,
      facility: input.facility,
      email: input.email,
      department: input.department,
      registrationNumber: input.registrationNumber,
      status: 'ACTIVE',
      joinedDate: new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      permissions: ROLE_PERMISSIONS[input.role] || [],
    };

    setUsers((prev) => {
      const updated = [...prev, newUser];
      if (typeof window !== 'undefined') {
        localStorage.setItem(STAFF_DIRECTORY_KEY, JSON.stringify(updated));
      }
      return updated;
    });

    return newUser;
  }, []);

  const updateStaffRole = useCallback((userId: string, newRole: UserRole) => {
    setUsers((prev) => {
      const updated = prev.map((u) => {
        if (u.id === userId) {
          return {
            ...u,
            role: newRole,
            permissions: ROLE_PERMISSIONS[newRole] || [],
          };
        }
        return u;
      });
      if (typeof window !== 'undefined') {
        localStorage.setItem(STAFF_DIRECTORY_KEY, JSON.stringify(updated));
      }
      return updated;
    });

    setCurrentUser((prev) => {
      if (prev.id === userId) {
        return {
          ...prev,
          role: newRole,
          permissions: ROLE_PERMISSIONS[newRole] || [],
        };
      }
      return prev;
    });
  }, []);

  const toggleStaffStatus = useCallback((userId: string) => {
    let nextStatus: 'ACTIVE' | 'SUSPENDED' = 'ACTIVE';
    setUsers((prev) => {
      const updated = prev.map((u) => {
        if (u.id === userId) {
          nextStatus = u.status === 'SUSPENDED' ? 'ACTIVE' : 'SUSPENDED';
          return { ...u, status: nextStatus };
        }
        return u;
      });
      if (typeof window !== 'undefined') {
        localStorage.setItem(STAFF_DIRECTORY_KEY, JSON.stringify(updated));
      }
      return updated;
    });

    setCurrentUser((prev) => {
      if (prev.id === userId) {
        return { ...prev, status: nextStatus };
      }
      return prev;
    });
  }, []);

  const deleteStaffMember = useCallback((userId: string) => {
    setUsers((prev) => {
      const updated = prev.filter((u) => u.id !== userId);
      if (typeof window !== 'undefined') {
        localStorage.setItem(STAFF_DIRECTORY_KEY, JSON.stringify(updated));
      }
      return updated;
    });
  }, []);

  const exitPatientMobile = useCallback(() => {
    setViewMode('REVIEWER_DESKTOP');
    const targetRole = lastStaffRole && lastStaffRole !== 'PATIENT' ? lastStaffRole : 'DOCTOR';
    const matched = users.find((u) => u.role === targetRole);
    if (matched) {
      setCurrentUser(matched);
    }
  }, [lastStaffRole, users]);

  const permissions = useMemo<PermissionCode[]>(() => {
    if (currentUser.status === 'SUSPENDED') {
      return [];
    }
    return currentUser.permissions && currentUser.permissions.length > 0
      ? currentUser.permissions
      : ROLE_PERMISSIONS[currentUser.role] || [];
  }, [currentUser]);

  const hasPermission = useCallback((perm: PermissionCode): boolean => {
    return permissions.includes(perm);
  }, [permissions]);

  const capabilities = useMemo<RoleCapabilities>(() => {
    const isSuspended = currentUser.status === 'SUSPENDED';
    if (isSuspended) {
      return {
        canApproveCase: false,
        canReferHandoff: false,
        canEscalateCase: false,
        canOverridePriority: false,
        canRunAi: false,
        canAcceptDraft: false,
        canManageSettings: false,
        canAccessDiagnostics: false,
        canPerformIntake: false,
        canViewReports: false,
        canAssignReview: false,
        isSuspended: true,
      };
    }

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
      isSuspended: false,
    };
  }, [currentUser.status, currentUser.role, hasPermission]);

  const hasInitializedAuthRef = useRef(false);

  // Initial load: check token and validate session with backend once
  useEffect(() => {
    if (hasInitializedAuthRef.current) return;
    hasInitializedAuthRef.current = true;

    const initAuth = async () => {
      try {
        const token = getAuthToken();
        if (token) {
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
        }
      } catch (e: any) {
        if (e?.code === 'NETWORK_ERROR') {
          setIsOffline(true);
          setIsAuthenticated(localStorage.getItem(AUTH_STORAGE_KEY) === 'true');
        } else {
          setAuthToken(null);
          localStorage.setItem(AUTH_STORAGE_KEY, 'false');
          setIsAuthenticated(false);
        }
      } finally {
        setIsAuthLoading(false);
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

    let backendUserId: string | undefined;
    try {
      // Attempt backend login first
      const email = staffIdOrEmail.includes('@') ? staffIdOrEmail : `${staffIdOrEmail}@careintel.local`;
      await authApi.login({ email, password });
      setIsOffline(false);

      const profile = await authApi.getMe();
      backendUserId = profile.id;
    } catch (e: any) {
      if (e?.code === 'NETWORK_ERROR') {
        // Keep the explicitly supported offline workflow available only when
        // cached data exists; rejected credentials never become a local login.
        setIsOffline(true);
      } else {
        setAuthToken(null);
        setIsAuthenticated(false);
        return false;
      }
    }

    // Role mapping and suspension verification
    const lower = staffIdOrEmail.toLowerCase();
    const matchedUser = users.find(
      (u) =>
        u.id.toLowerCase() === lower ||
        (u.email && u.email.toLowerCase() === lower) ||
        (u.role === 'DOCTOR' && (lower.includes('doc') || lower.includes('sharma') || lower.includes('dr'))) ||
        (u.role === 'NURSE' && (lower.includes('nurse') || lower.includes('sunita') || lower.includes('maya'))) ||
        (u.role === 'HEALTH_WORKER' && (lower.includes('cho') || lower.includes('ramesh') || lower.includes('rajesh') || lower.includes('health'))) ||
        (u.role === 'ADMIN' && lower.includes('admin'))
    );

    if (matchedUser && matchedUser.status === 'SUSPENDED') {
      throw new Error(
        `Account Suspended: Clinical credentials for ${matchedUser.name} (${matchedUser.registrationNumber || matchedUser.id}) have been deactivated by Facility Administration. Contact your Clinical Director.`
      );
    }

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

    if (backendUserId) {
      setCurrentUser((prev) => ({ ...prev, id: backendUserId! }));
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
        isAuthLoading,
        isSessionExpired,
        isSidebarCollapsed,
        capabilities,
        permissions,
        hasPermission,
        grantStaffAccess,
        updateStaffRole,
        toggleStaffStatus,
        deleteStaffMember,
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
