'use client';

import React, { useState } from 'react';
import { Patient } from '../../types/triage';
import { Button } from '../common/Button';
import { X, Save, Edit3 } from 'lucide-react';
import { useTriage } from '../../context/TriageContext';

interface EditPatientModalProps {
  patient: Patient;
  isOpen: boolean;
  onClose: () => void;
}

export const EditPatientModal: React.FC<EditPatientModalProps> = ({ patient, isOpen, onClose }) => {
  const { updatePatient } = useTriage();
  const [complaint, setComplaint] = useState(patient.chiefComplaint);
  const [bloodPressure, setBloodPressure] = useState(
    patient.vitals.bloodPressure || (patient.vitals.bpSys ? `${patient.vitals.bpSys}/${patient.vitals.bpDia || ''}` : '')
  );
  const [pulseRate, setPulseRate] = useState(
    patient.vitals.pulseRate || (patient.vitals.heartRate ? `${patient.vitals.heartRate} bpm` : '')
  );
  const [temperature, setTemperature] = useState(
    patient.vitals.temperature || (patient.vitals.temp ? `${patient.vitals.temp}°F` : '')
  );
  const [spO2, setSpO2] = useState(
    patient.vitals.spO2 || (patient.vitals.spo2 ? `${patient.vitals.spo2}%` : '')
  );

  React.useEffect(() => {
    if (isOpen) {
      setComplaint(patient.chiefComplaint);
      setBloodPressure(
        patient.vitals.bloodPressure || (patient.vitals.bpSys ? `${patient.vitals.bpSys}/${patient.vitals.bpDia || ''}` : '')
      );
      setPulseRate(
        patient.vitals.pulseRate || (patient.vitals.heartRate ? `${patient.vitals.heartRate} bpm` : '')
      );
      setTemperature(
        patient.vitals.temperature || (patient.vitals.temp ? `${patient.vitals.temp}°F` : '')
      );
      setSpO2(
        patient.vitals.spO2 || (patient.vitals.spo2 ? `${patient.vitals.spo2}%` : '')
      );
    }
  }, [isOpen, patient.id, patient.chiefComplaint, patient.vitals]);

  if (!isOpen) return null;

  const handleSave = () => {
    const spo2Num = parseInt(spO2.replace(/[^0-9]/g, '')) || patient.vitals.spo2;
    const hrNum = parseInt(pulseRate.replace(/[^0-9]/g, '')) || patient.vitals.heartRate;
    const tempNum = parseFloat(temperature.replace(/[^0-9.]/g, '')) || patient.vitals.temp;
    const bpParts = bloodPressure.split('/');
    const bpSys = bpParts[0] ? parseInt(bpParts[0].replace(/[^0-9]/g, '')) : patient.vitals.bpSys;
    const bpDia = bpParts[1] ? parseInt(bpParts[1].replace(/[^0-9]/g, '')) : patient.vitals.bpDia;

    updatePatient(patient.id, {
      chiefComplaint: complaint,
      vitals: {
        ...patient.vitals,
        bloodPressure,
        pulseRate,
        temperature,
        spO2,
        spo2: spo2Num,
        heartRate: hrNum,
        temp: tempNum,
        bpSys,
        bpDia,
      },
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
      <div className="w-full max-w-lg bg-white rounded-xl border border-[#E6ECF2] p-6 shadow-xl animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between pb-3 border-b border-[#E6ECF2]">
          <div className="flex items-center gap-2">
            <Edit3 className="w-4 h-4 text-[#2563EB]" />
            <h3 className="text-base font-bold text-[#102033]">
              Edit Clinical Information: {patient.id}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="mt-4 space-y-4 text-xs">
          <div>
            <label htmlFor="edit-chief-complaint" className="block font-semibold text-[#25364A] mb-1">Chief Complaint</label>
            <textarea
              id="edit-chief-complaint"
              name="edit-chief-complaint"
              value={complaint}
              onChange={(e) => setComplaint(e.target.value)}
              rows={3}
              className="w-full p-2.5 rounded-md border border-slate-300 focus:border-[#2563EB] focus:outline-none text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="edit-blood-pressure" className="block font-semibold text-[#25364A] mb-1">Blood Pressure</label>
              <input
                id="edit-blood-pressure"
                name="edit-blood-pressure"
                type="text"
                value={bloodPressure}
                onChange={(e) => setBloodPressure(e.target.value)}
                placeholder="e.g. 120/80 mmHg"
                className="w-full p-2 rounded-md border border-slate-300 focus:border-[#2563EB] focus:outline-none text-xs"
              />
            </div>
            <div>
              <label htmlFor="edit-pulse-rate" className="block font-semibold text-[#25364A] mb-1">Pulse Rate</label>
              <input
                id="edit-pulse-rate"
                name="edit-pulse-rate"
                type="text"
                value={pulseRate}
                onChange={(e) => setPulseRate(e.target.value)}
                placeholder="e.g. 78 bpm"
                className="w-full p-2 rounded-md border border-slate-300 focus:border-[#2563EB] focus:outline-none text-xs"
              />
            </div>
            <div>
              <label htmlFor="edit-body-temperature" className="block font-semibold text-[#25364A] mb-1">Body Temperature</label>
              <input
                id="edit-body-temperature"
                name="edit-body-temperature"
                type="text"
                value={temperature}
                onChange={(e) => setTemperature(e.target.value)}
                placeholder="e.g. 99.4 °F"
                className="w-full p-2 rounded-md border border-slate-300 focus:border-[#2563EB] focus:outline-none text-xs"
              />
            </div>
            <div>
              <label htmlFor="edit-spo2" className="block font-semibold text-[#25364A] mb-1">SpO₂ Oxygen Saturation</label>
              <input
                id="edit-spo2"
                name="edit-spo2"
                type="text"
                value={spO2}
                onChange={(e) => setSpO2(e.target.value)}
                placeholder="e.g. 96%"
                className="w-full p-2 rounded-md border border-slate-300 focus:border-[#2563EB] focus:outline-none text-xs"
              />
            </div>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-3 pt-3 border-t border-[#E6ECF2]">
          <Button variant="secondary" size="md" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" size="md" onClick={handleSave} icon={<Save className="w-3.5 h-3.5" />}>
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
};
