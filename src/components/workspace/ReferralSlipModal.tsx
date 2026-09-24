'use client';

import React from 'react';
import { Patient } from '../../types/triage';
import { ReferralResponse } from '../../lib/api/types';
import { Facility } from '../../types/roles';
import { Button } from '../common/Button';
import {
  Printer,
  X,
  ShieldCheck,
  Building2,
  User,
  Heart,
  Activity,
  Wind,
  Thermometer,
  QrCode,
  FileCheck2,
  AlertTriangle,
} from 'lucide-react';

interface ReferralSlipModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: Patient;
  referral: ReferralResponse | null;
  facility: Facility;
  authorizingDoctorName?: string;
}

export const ReferralSlipModal: React.FC<ReferralSlipModalProps> = ({
  isOpen,
  onClose,
  patient,
  referral,
  facility,
  authorizingDoctorName = 'Dr. A. Sharma (Medical Officer)',
}) => {
  if (!isOpen || !referral) return null;

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  const urgencyColors = {
    IMMEDIATE: 'bg-red-100 text-red-800 border-red-300',
    PRIORITY: 'bg-amber-100 text-amber-800 border-amber-300',
    ROUTINE: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 my-8">
        {/* Top Control Bar (Hidden during printing) */}
        <div className="print:hidden bg-slate-900 text-white px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileCheck2 className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-semibold tracking-wide">
              Official Inter-Facility Transfer &amp; Referral Slip
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="primary"
              size="sm"
              onClick={handlePrint}
              icon={<Printer className="w-3.5 h-3.5" />}
            >
              Print / Save PDF
            </Button>
            <button
              onClick={onClose}
              title="Close"
              className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Area */}
        <div id="printable-referral-slip" className="p-6 sm:p-8 space-y-5 text-slate-800 bg-white">
          {/* Slip Header */}
          <div className="text-center border-b-2 border-slate-900 pb-4 space-y-1">
            <div className="flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-600">
              <ShieldCheck className="w-4 h-4 text-blue-700" />
              <span>AYUSHMAN BHARAT DIGITAL MISSION · TRIAGEMITRA NETWORK</span>
            </div>
            <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
              CLINICAL TRANSFER &amp; INTER-FACILITY REFERRAL SLIP
            </h1>
            <p className="text-[11px] font-mono text-slate-500">
              Referral UUID: <strong className="text-slate-800">{referral.publicId}</strong> · Issued:{' '}
              {new Date(referral.createdAt).toLocaleString()}
            </p>
          </div>

          {/* Urgency Tier Banner */}
          <div
            className={`p-3 rounded-xl border flex items-center justify-between text-xs font-bold ${
              urgencyColors[referral.urgencyLevel] || urgencyColors.PRIORITY
            }`}
          >
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              <span>TRANSFER URGENCY: {referral.urgencyLevel} ACTION REQUIRED</span>
            </div>
            <span className="font-mono text-[11px]">Token #{patient.id}</span>
          </div>

          {/* Facility Routing Box */}
          <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
            <div>
              <span className="text-[10px] font-bold uppercase text-slate-500 block mb-0.5">
                Referring Source Facility:
              </span>
              <span className="font-bold text-slate-900 block text-sm">{facility.name}</span>
              <span className="text-[11px] text-slate-600">
                Code: {facility.code} ({facility.type} · {facility.district})
              </span>
            </div>
            <div className="border-l border-slate-200 pl-4">
              <span className="text-[10px] font-bold uppercase text-blue-700 block mb-0.5">
                Destination Receiving Facility:
              </span>
              <span className="font-bold text-slate-900 block text-sm">
                {referral.targetFacilityName}
              </span>
              <span className="text-[11px] text-slate-600">
                Emergency &amp; Specialized Triage Unit
              </span>
            </div>
          </div>

          {/* Patient Demographics */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 pb-1.5 mb-2 border-b border-slate-200 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-blue-600" />
              <span>Patient Information</span>
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-[#F8FAFC] p-3 rounded-lg border border-slate-200">
              <div>
                <span className="text-slate-500 block text-[10px]">Patient Name:</span>
                <span className="font-bold text-slate-900">{patient.name}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">Age / Gender:</span>
                <span className="font-bold text-slate-900">
                  {patient.age} yrs · {patient.gender}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">Health ID / Token:</span>
                <span className="font-mono font-bold text-blue-700">{patient.id}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">Arrival Time:</span>
                <span className="font-medium text-slate-800">{patient.arrivalTime}</span>
              </div>
            </div>
          </div>

          {/* Clinical Reason for Referral */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 pb-1.5 mb-2 border-b border-slate-200">
              Clinical Justification &amp; Findings
            </h3>
            <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-800 space-y-2">
              <p className="font-semibold text-slate-900">&ldquo;{referral.clinicalReason}&rdquo;</p>
              <div className="text-[11px] text-slate-600 pt-1 border-t border-slate-200">
                <span className="font-bold text-slate-700">Chief Complaint: </span>
                <span>{patient.chiefComplaint}</span>
              </div>
            </div>
          </div>

          {/* Recorded Vitals at Transfer */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 pb-1.5 mb-2 border-b border-slate-200 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-emerald-600" />
              <span>Vital Parameters at Handoff</span>
            </h3>
            <div className="grid grid-cols-4 gap-2 text-center text-xs">
              <div className="p-2 rounded bg-slate-50 border border-slate-200">
                <span className="text-[10px] text-slate-500 block">Blood Pressure</span>
                <span className="font-bold font-mono text-slate-900">
                  {patient.vitals.bloodPressure || 'N/A'}
                </span>
              </div>
              <div className="p-2 rounded bg-slate-50 border border-slate-200">
                <span className="text-[10px] text-slate-500 block">Pulse Rate</span>
                <span className="font-bold font-mono text-slate-900">
                  {patient.vitals.pulseRate || 'N/A'}
                </span>
              </div>
              <div
                className={`p-2 rounded border ${
                  patient.vitals.spO2 && parseInt(patient.vitals.spO2) < 94
                    ? 'bg-red-50 border-red-200 text-red-900'
                    : 'bg-slate-50 border-slate-200 text-slate-900'
                }`}
              >
                <span className="text-[10px] text-slate-500 block">SpO₂ Saturation</span>
                <span className="font-bold font-mono">{patient.vitals.spO2 || 'N/A'}</span>
              </div>
              <div className="p-2 rounded bg-slate-50 border border-slate-200">
                <span className="text-[10px] text-slate-500 block">Temperature</span>
                <span className="font-bold font-mono text-slate-900">
                  {patient.vitals.temperature || 'N/A'}
                </span>
              </div>
            </div>
          </div>

          {/* Authorization & Digital Signature Section */}
          <div className="pt-4 border-t-2 border-slate-900 flex items-end justify-between gap-4">
            {/* Left: QR Mock & Fast Triage Token */}
            <div className="flex items-center gap-3">
              <div className="w-16 h-16 rounded-lg border-2 border-slate-900 p-1 flex items-center justify-center bg-slate-50 flex-shrink-0">
                <QrCode className="w-12 h-12 text-slate-900" />
              </div>
              <div className="text-[10px] text-slate-500 leading-tight">
                <span className="font-bold text-slate-900 block">Fast Ingestion QR</span>
                <span>Scan at receiving hospital triage counter for instant EHR pre-population</span>
              </div>
            </div>

            {/* Right: Authorizing Doctor Digital Signature */}
            <div className="text-right space-y-1">
              <div className="inline-block border-b border-slate-400 pb-1 px-4 text-xs font-serif italic text-blue-900 font-bold">
                {authorizingDoctorName}
              </div>
              <div className="text-[10px] font-bold text-slate-700">
                Authorized Medical Officer
              </div>
              <div className="text-[9px] font-mono text-slate-400">
                Registration: MCI-OD-2018-84729 · Digital Sign-Off Timestamp:{' '}
                {new Date().toISOString().split('T')[0]}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
