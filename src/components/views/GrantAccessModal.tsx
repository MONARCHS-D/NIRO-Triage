'use client';

import React, { useState } from 'react';
import { X, UserPlus, Shield, CheckCircle2, Hospital } from 'lucide-react';
import { Button } from '../common/Button';
import { useRole } from '../../context/RoleContext';
import { UserRole } from '../../types/roles';

interface GrantAccessModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: (createdName: string) => void;
}

const DEFAULT_TITLES: Record<UserRole, string> = {
  DOCTOR: 'Medical Officer',
  NURSE: 'Staff Nurse Grade-I',
  HEALTH_WORKER: 'Community Health Officer (CHO)',
  ADMIN: 'Health Systems Administrator',
  PATIENT: 'Citizen View',
};

const DEFAULT_DEPARTMENTS: Record<UserRole, string> = {
  DOCTOR: 'Emergency Medicine & Triage',
  NURSE: 'Outpatient Triage & Vitals',
  HEALTH_WORKER: 'Primary Healthcare Services',
  ADMIN: 'Clinical Informatics & Operations',
  PATIENT: 'Outpatient Services',
};

export const GrantAccessModal: React.FC<GrantAccessModalProps> = ({
  open,
  onClose,
  onSuccess,
}) => {
  const { facilities, currentFacility, grantStaffAccess } = useRole();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('DOCTOR');
  const [title, setTitle] = useState(DEFAULT_TITLES.DOCTOR);
  const [department, setDepartment] = useState(DEFAULT_DEPARTMENTS.DOCTOR);
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [facility, setFacility] = useState(currentFacility.name);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const handleRoleChange = (newRole: UserRole) => {
    setRole(newRole);
    setTitle(DEFAULT_TITLES[newRole] || '');
    setDepartment(DEFAULT_DEPARTMENTS[newRole] || '');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Practitioner full name is required.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setError('A valid professional email address is required.');
      return;
    }

    setIsSubmitting(true);
    try {
      const created = grantStaffAccess({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        role,
        title: title.trim() || DEFAULT_TITLES[role],
        department: department.trim() || DEFAULT_DEPARTMENTS[role],
        registrationNumber: registrationNumber.trim() || undefined,
        facility,
      });

      if (onSuccess) {
        onSuccess(created.name);
      }
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to provision staff member.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-white rounded-xl border border-[#E6ECF2] shadow-2xl flex flex-col overflow-hidden my-6">
        {/* Header */}
        <div className="px-6 py-4 bg-[#F8FAFC] border-b border-[#E6ECF2] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-blue-100 text-[#2563EB] flex items-center justify-center">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#102033]">Grant Access / Add Practitioner</h3>
              <p className="text-xs text-[#6B7B8F]">
                Provision and assign clinical authority for a new facility staff member
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-md text-[#526276] hover:bg-slate-200/60 hover:text-[#102033] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs">
              {error}
            </div>
          )}

          {/* Full Name & Email */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block font-semibold text-[#25364A] mb-1">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Dr. Rajesh Mohanty"
                className="w-full p-2.5 rounded-lg border border-slate-300 focus:border-[#2563EB] focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold text-[#25364A] mb-1">
                Professional Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. rmohanty@careintel.local"
                className="w-full p-2.5 rounded-lg border border-slate-300 focus:border-[#2563EB] focus:outline-none"
              />
            </div>
          </div>

          {/* Role Selection */}
          <div>
            <label className="block font-semibold text-[#25364A] mb-1">
              Clinical Role &amp; Authority Level <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(
                [
                  { r: 'DOCTOR', label: 'Doctor / MO', desc: 'Full review & signoff' },
                  { r: 'NURSE', label: 'Staff Nurse', desc: 'Vitals & triage note' },
                  { r: 'HEALTH_WORKER', label: 'CHO / Field', desc: 'Frontline intake' },
                  { r: 'ADMIN', label: 'Administrator', desc: 'System management' },
                ] as const
              ).map(({ r, label, desc }) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => handleRoleChange(r as UserRole)}
                  className={`p-2.5 rounded-lg border text-left cursor-pointer transition-all ${
                    role === r
                      ? 'border-[#2563EB] bg-[#E8F0FF] text-[#164FD6]'
                      : 'border-[#E6ECF2] bg-white text-[#25364A] hover:bg-slate-50'
                  }`}
                >
                  <span className="font-bold block truncate">{label}</span>
                  <span className="text-[10px] text-[#6B7B8F] block truncate">{desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Clinical Title & Medical Registration # */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block font-semibold text-[#25364A] mb-1">Clinical Title / Designation</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Senior Medical Officer"
                className="w-full p-2.5 rounded-lg border border-slate-300 focus:border-[#2563EB] focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold text-[#25364A] mb-1">
                Statutory Registration No. <span className="text-[#6B7B8F] font-normal">(MCI / Nursing Council)</span>
              </label>
              <input
                type="text"
                value={registrationNumber}
                onChange={(e) => setRegistrationNumber(e.target.value)}
                placeholder="e.g. MCI-2023-77419"
                className="w-full p-2.5 rounded-lg border border-slate-300 focus:border-[#2563EB] focus:outline-none font-mono"
              />
            </div>
          </div>

          {/* Department & Facility Scope */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block font-semibold text-[#25364A] mb-1">Clinical Department</label>
              <input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="e.g. Outpatient & Emergency Triage"
                className="w-full p-2.5 rounded-lg border border-slate-300 focus:border-[#2563EB] focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold text-[#25364A] mb-1">Assigned Health Facility</label>
              <select
                value={facility}
                onChange={(e) => setFacility(e.target.value)}
                className="w-full p-2.5 rounded-lg border border-slate-300 bg-white focus:border-[#2563EB] focus:outline-none cursor-pointer"
              >
                {facilities.map((fac) => (
                  <option key={fac.id} value={fac.name}>
                    {fac.name} ({fac.type})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-blue-50/70 border border-blue-200 text-[#164FD6] text-[11px] flex items-start gap-2">
            <Shield className="w-4 h-4 shrink-0 mt-0.5" />
            <p>
              Granting access will immediately assign statutory clinical permissions matching role <strong>{role}</strong> according to the national healthcare credentialing policy.
            </p>
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <Button variant="secondary" size="md" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="md"
              type="submit"
              disabled={isSubmitting}
              icon={isSubmitting ? undefined : <CheckCircle2 className="w-4 h-4" />}
            >
              {isSubmitting ? 'Granting Access...' : 'Confirm & Grant Access'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
