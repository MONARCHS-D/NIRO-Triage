import 'package:niro_mobile/domain/models/ai_question.dart';
import 'package:niro_mobile/domain/models/patient.dart';
import 'package:niro_mobile/domain/models/priority.dart';

class TriageMockService {
  /// Benchmark synthetic clinical records matching Section 29 of design.md
  List<Patient> getInitialSyntheticCases() {
    return [
      // 1. Potentially Urgent Benchmark Case: P-1042 (Respiratory Concern)
      const Patient(
        id: 'P-1042',
        syntheticCode: 'SYN-2026-001',
        name: 'Sunita Majhi',
        age: 28,
        gender: 'Female',
        primaryLanguage: 'Odia',
        translatedToEnglish: true,
        contactMasked: '+91 98*** **412',
        visitId: 'VST-2026-8801',
        arrivalTime: 'Today · 09:15 AM',
        chiefComplaint:
            'Acute shortness of breath, high fever for 3 days, worsening upon recumbency.',
        symptoms: [
          Symptom(
            id: 'sym-1',
            name: 'Dyspnea / Difficulty Breathing',
            duration: '3 days',
            severity: 'SEVERE',
            source: 'VOICE',
            confidence: 0.98,
          ),
          Symptom(
            id: 'sym-2',
            name: 'High Fever (102.4°F)',
            duration: '3 days',
            severity: 'MODERATE',
            source: 'VOICE',
            confidence: 0.95,
          ),
          Symptom(
            id: 'sym-3',
            name: 'Chest Heaviness / Tightness',
            duration: '1 day',
            severity: 'SEVERE',
            source: 'VOICE',
            confidence: 0.92,
          ),
        ],
        relevantHistory: [
          'Known mild bronchial asthma',
          'No prior hospitalizations',
          'Non-smoker',
        ],
        vitals: {
          'temp': VitalSign(
            field: 'temp',
            label: 'Body Temperature',
            value: '102.4',
            unit: '°F',
            isAbnormal: true,
            referenceRange: '97.5 - 98.6 °F',
          ),
          'pulse': VitalSign(
            field: 'pulse',
            label: 'Pulse Rate',
            value: '108',
            unit: 'bpm',
            isAbnormal: true,
            referenceRange: '60 - 100 bpm',
          ),
          'spo2': VitalSign(
            field: 'spo2',
            label: 'Oxygen Saturation (SpO2)',
            value: '91',
            unit: '%',
            isAbnormal: true,
            referenceRange: '95 - 100 %',
          ),
        },
        facts: [
          ExtractedFact(
            id: 'f-1',
            metric: 'Oxygen Saturation (SpO2)',
            value: '91',
            unit: '%',
            sourceProvenance: 'Triage Nurse Pulse Oximeter · Verified',
            confidence: 'High',
            referenceRange: '95 - 100 %',
            isFlagged: true,
          ),
          ExtractedFact(
            id: 'f-2',
            metric: 'Reported Orthopnea',
            value: 'Present',
            unit: 'clinical observation',
            sourceProvenance: 'Voice Intake · Odia transcription',
            confidence: 'High',
            referenceRange: 'Absent',
            isFlagged: true,
          ),
        ],
        missingInfo: [
          MissingInfoItem(
            id: 'm-1',
            field: 'auscultation',
            label: 'Chest Auscultation (Wheeze/Crepitations)',
            category: 'VITALS',
            status: 'NOT_PROVIDED',
            reason: 'Requires medical officer stethoscope examination.',
            askPrompt: 'Perform immediate bilateral chest auscultation.',
          ),
        ],
        riskFlags: [
          RiskFlag(
            id: 'rf-1',
            type: 'RESPIRATORY_CONCERN',
            severity: 'POTENTIAL_URGENCY',
            description:
                'Hypoxia (SpO2 91%) with tachycardia and worsening dyspnea.',
            evidenceIds: ['f-1', 'f-2'],
          ),
        ],
        timeline: [
          TimelineEvent(
            id: 't-1',
            timestamp: '09:15 AM',
            title: 'Patient registered at CHC Reception',
            description: 'Initiated mobile triage session in Odia.',
            source: 'VOICE',
            actor: 'Sunita Majhi',
          ),
          TimelineEvent(
            id: 't-2',
            timestamp: '09:18 AM',
            title: 'Indic Speech Transcribed & Translated',
            description:
                'Odia speech recognized with high confidence; translated to English.',
            source: 'VOICE',
            actor: 'NIRO Speech Engine',
          ),
          TimelineEvent(
            id: 't-3',
            timestamp: '09:20 AM',
            title: 'Nurse recorded preliminary vitals',
            description: 'SpO2 91%, Pulse 108 bpm, Temp 102.4°F.',
            source: 'REVIEWER',
            actor: 'Staff Nurse Sunita B.',
          ),
          TimelineEvent(
            id: 't-4',
            timestamp: '09:22 AM',
            title: 'Potential Urgency Flagged (Respiratory Concern)',
            description:
                'Advisory signal triggered for immediate Medical Officer review.',
            source: 'AI',
            actor: 'NIRO Triage AI Draft',
          ),
        ],
        auditLog: [
          AuditLogItem(
            id: 'a-1',
            timestamp: '09:15 AM',
            actor: 'Sunita Majhi',
            actorRole: 'Citizen / Patient',
            action: 'SUBMIT_CITIZEN_VOICE_INTAKE',
            objectAffected: 'P-1042',
            details: 'Voice intake recorded in Odia (34s duration)',
          ),
        ],
        aiQuestions: [
          AiFollowUpQuestion(
            id: 'q-101',
            question:
                'Does the patient present with audible inspiratory stridor or severe wheezing?',
            clinicalRationale:
                'Distinguishes between upper airway obstruction and acute lower bronchospasm.',
            relatedMissingInfoId: 'm-1',
            options: ['Yes', 'No', 'Not sure'],
          ),
          AiFollowUpQuestion(
            id: 'q-102',
            question:
                'Has the patient used their prescribed inhaler within the last 4 hours without symptom relief?',
            clinicalRationale:
                'Assesses bronchodilator responsiveness in known asthma.',
            options: ['Yes', 'No', 'Not sure'],
          ),
        ],
        clinicalSummary:
            '28-year-old female presents with acute shortness of breath (orthopnea), chest tightness, and high fever (102.4°F) for 3 days. Triage nurse verified SpO2 at 91% and tachycardia (108 bpm). History of mild asthma. High risk for respiratory compromise requiring prompt physician evaluation.',
        urgencyRationale:
            'Critical Hypoxia (SpO2 91% on room air) with tachycardia (108 bpm) and severe dyspnea.',
        routingRecommendation:
            'Room 4 — Acute Respiratory Care & Oxygenation',
        status: CaseStatus.pendingReview,
        priority: Priority.red,
        facilityId: 'fac-chc-1',
      ),

      // 2. Incomplete Benchmark Case: P-1035 (Epigastric Pain, Missing Vitals)
      const Patient(
        id: 'P-1035',
        syntheticCode: 'SYN-2026-002',
        name: 'Rajesh Verma',
        age: 45,
        gender: 'Male',
        primaryLanguage: 'Hindi',
        translatedToEnglish: true,
        contactMasked: '+91 94*** **188',
        visitId: 'VST-2026-8802',
        arrivalTime: 'Today · 10:04 AM',
        chiefComplaint:
            'Severe epigastric discomfort radiating to back for two days, nausea after eating.',
        symptoms: [
          Symptom(
            id: 'sym-4',
            name: 'Epigastric Pain',
            duration: '2 days',
            severity: 'MODERATE',
            source: 'MANUAL',
            confidence: 0.94,
          ),
          Symptom(
            id: 'sym-5',
            name: 'Postprandial Nausea',
            duration: '2 days',
            severity: 'MILD',
            source: 'MANUAL',
            confidence: 0.90,
          ),
        ],
        relevantHistory: [
          'Occasional antacid self-medication',
          'No history of gallstones or pancreatitis',
        ],
        vitals: {},
        facts: [],
        missingInfo: [
          MissingInfoItem(
            id: 'm-2',
            field: 'blood_pressure',
            label: 'Blood Pressure & Vitals Measurement',
            category: 'VITALS',
            status: 'NOT_PROVIDED',
            reason: 'Patient submitted remote mobile intake prior to triage desk arrival.',
            askPrompt: 'Record sitting blood pressure and pulse rate.',
          ),
          MissingInfoItem(
            id: 'm-3',
            field: 'radiation_trigger',
            label: 'Pain radiation trigger / meal relationship',
            category: 'HISTORY',
            status: 'PARTIAL',
            reason: 'Need to differentiate acid peptic disease vs cardiac referred pain.',
            askPrompt: 'Ask if pain worsens with exertion or fatty meals.',
          ),
        ],
        riskFlags: [
          RiskFlag(
            id: 'rf-2',
            type: 'INCOMPLETE_INFORMATION',
            severity: 'INCOMPLETE',
            description:
                'Upper abdominal pain in adult male requires prompt BP check and ECG consideration.',
            evidenceIds: [],
          ),
        ],
        timeline: [
          TimelineEvent(
            id: 't-5',
            timestamp: '10:04 AM',
            title: 'Patient submitted manual text intake',
            description: 'Entered symptoms in Hindi mobile interface.',
            source: 'MANUAL',
            actor: 'Rajesh Verma',
          ),
        ],
        auditLog: [
          AuditLogItem(
            id: 'a-2',
            timestamp: '10:04 AM',
            actor: 'Rajesh Verma',
            actorRole: 'Citizen / Patient',
            action: 'SUBMIT_CITIZEN_MANUAL_INTAKE',
            objectAffected: 'P-1035',
            details: 'Entered symptom text in Hindi',
          ),
        ],
        aiQuestions: [
          AiFollowUpQuestion(
            id: 'q-201',
            question:
                'Does the epigastric pain radiate towards the left shoulder, neck, or jaw?',
            clinicalRationale:
                'Assesses potential atypical acute coronary syndrome presentation in an adult male.',
            relatedMissingInfoId: 'm-3',
            options: ['Yes', 'No', 'Not sure'],
          ),
          AiFollowUpQuestion(
            id: 'q-202',
            question:
                'Is the pain alleviated by leaning forward or worsened after heavy meals?',
            clinicalRationale:
                'Assists in differentiating acute pancreatitis from acid peptic or biliary disorder.',
            relatedMissingInfoId: 'm-3',
            options: ['Yes', 'No', 'Not sure'],
          ),
        ],
        clinicalSummary:
            '45-year-old male reporting 2-day history of moderate epigastric pain radiating to back and nausea after meals. Submitted remote Hindi text intake. Missing essential triage vitals (Blood Pressure & Auscultation). Needs prompt in-person clinical workup to rule out acute pancreatitis, peptic ulcer, or atypical cardiac ischemia.',
        urgencyRationale:
            'Incomplete data: Upper abdominal discomfort radiating to back requires blood pressure check and clinical evaluation.',
        routingRecommendation:
            'Room 2 — Internal Medicine & Acute Evaluation',
        status: CaseStatus.needsMoreInfo,
        priority: Priority.yellow,
        facilityId: 'fac-chc-1',
      ),

      // 3. Routine Benchmark Case: P-1018 (Mild Viral Symptoms)
      const Patient(
        id: 'P-1018',
        syntheticCode: 'SYN-2026-003',
        name: 'Priyanka Das',
        age: 19,
        gender: 'Female',
        primaryLanguage: 'Bengali',
        translatedToEnglish: true,
        contactMasked: '+91 97*** **339',
        visitId: 'VST-2026-8803',
        arrivalTime: 'Today · 11:20 AM',
        chiefComplaint:
            'Mild running nose, throat tickle, and low fever since yesterday.',
        symptoms: [
          Symptom(
            id: 'sym-6',
            name: 'Coryza / Rhinitis',
            duration: '1 day',
            severity: 'MILD',
            source: 'REPORT',
            confidence: 0.96,
          ),
          Symptom(
            id: 'sym-7',
            name: 'Low-grade Fever',
            duration: '1 day',
            severity: 'MILD',
            source: 'REPORT',
            confidence: 0.94,
          ),
        ],
        relevantHistory: [
          'Seasonal allergies',
          'Fully vaccinated',
        ],
        vitals: {
          'temp': VitalSign(
            field: 'temp',
            label: 'Body Temperature',
            value: '99.1',
            unit: '°F',
            isAbnormal: false,
            referenceRange: '97.5 - 98.6 °F',
          ),
          'spo2': VitalSign(
            field: 'spo2',
            label: 'Oxygen Saturation',
            value: '98',
            unit: '%',
            isAbnormal: false,
            referenceRange: '95 - 100 %',
          ),
        },
        facts: [
          ExtractedFact(
            id: 'f-3',
            metric: 'Hemoglobin',
            value: '12.4',
            unit: 'g/dL',
            sourceProvenance: 'CBC Report Page 1 · OCR Extracted',
            confidence: 'High',
            referenceRange: '12.0 - 15.5 g/dL',
          ),
          ExtractedFact(
            id: 'f-4',
            metric: 'Total Leukocyte Count (WBC)',
            value: '6,800',
            unit: '/µL',
            sourceProvenance: 'CBC Report Page 1 · OCR Extracted',
            confidence: 'High',
            referenceRange: '4,000 - 11,000 /µL',
          ),
        ],
        missingInfo: [],
        riskFlags: [],
        timeline: [
          TimelineEvent(
            id: 't-6',
            timestamp: '11:20 AM',
            title: 'Patient uploaded recent CBC report photo',
            description: 'Document OCR extracted normal hemogram values.',
            source: 'REPORT',
            actor: 'Priyanka Das',
          ),
        ],
        auditLog: [
          AuditLogItem(
            id: 'a-3',
            timestamp: '11:20 AM',
            actor: 'Priyanka Das',
            actorRole: 'Citizen / Patient',
            action: 'SUBMIT_CITIZEN_REPORT_INTAKE',
            objectAffected: 'P-1018',
            details: 'Uploaded CBC report JPEG',
          ),
        ],
        aiQuestions: [
          AiFollowUpQuestion(
            id: 'q-301',
            question:
                'Does the patient report severe unilateral throat pain or inability to swallow saliva?',
            clinicalRationale:
                'Screens for acute peritonsillar abscess or epiglottitis.',
            options: ['Yes', 'No', 'Not sure'],
          ),
        ],
        clinicalSummary:
            '19-year-old female presenting with 1-day history of mild rhinorrhea, throat tickle, and low fever (99.1°F). Normal CBC lab parameters verified via OCR. Stable hemodynamics with 98% SpO2.',
        urgencyRationale:
            'Mild viral upper respiratory symptoms with normal hemodynamics and lab parameters.',
        routingRecommendation:
            'Room 1 — General Outpatient Department (OPD)',
        status: CaseStatus.approved,
        priority: Priority.green,
        facilityId: 'fac-chc-1',
      ),

      // 4. Insufficient Information Benchmark Case: P-1055 (Sudden Dizziness, Unchecked Vitals)
      const Patient(
        id: 'P-1055',
        syntheticCode: 'SYN-2026-004',
        name: 'Deepak Mohanty',
        age: 62,
        gender: 'Male',
        primaryLanguage: 'Odia',
        translatedToEnglish: true,
        contactMasked: '+91 91*** **562',
        visitId: 'VST-2026-8804',
        arrivalTime: 'Today · 11:45 AM',
        chiefComplaint:
            'Sudden episode of postural dizziness and lightheadedness when standing up this morning.',
        symptoms: [
          Symptom(
            id: 'sym-8',
            name: 'Orthostatic Dizziness',
            duration: '4 hours',
            severity: 'MODERATE',
            source: 'VOICE',
            confidence: 0.91,
          ),
        ],
        relevantHistory: [
          'History of hypertension on medication',
          'Missed morning dosage',
        ],
        vitals: {},
        facts: [],
        missingInfo: [
          MissingInfoItem(
            id: 'm-4',
            field: 'postural_bp',
            label: 'Supine and Standing Blood Pressure',
            category: 'VITALS',
            status: 'NOT_PROVIDED',
            reason:
                'Mandatory to assess orthostatic hypotension in an elderly hypertensive patient.',
            askPrompt: 'Measure supine BP followed by standing BP at 1 and 3 minutes.',
          ),
          MissingInfoItem(
            id: 'm-5',
            field: 'fingerstick_glucose',
            label: 'Point-of-Care Capillary Glucose',
            category: 'VITALS',
            status: 'NOT_PROVIDED',
            reason: 'Rule out acute hypoglycemic episode.',
            askPrompt: 'Perform quick fingerstick random blood glucose check.',
          ),
        ],
        riskFlags: [
          RiskFlag(
            id: 'rf-3',
            type: 'INSUFFICIENT_INFORMATION',
            severity: 'INCOMPLETE',
            description:
                'Elderly patient with new acute lightheadedness requires vital signs before safe triage priority can be finalized.',
            evidenceIds: [],
          ),
        ],
        timeline: [
          TimelineEvent(
            id: 't-7',
            timestamp: '11:45 AM',
            title: 'Patient registered at triage desk',
            description: 'Assisted voice intake completed in Odia.',
            source: 'VOICE',
            actor: 'Deepak Mohanty',
          ),
        ],
        auditLog: [
          AuditLogItem(
            id: 'a-4',
            timestamp: '11:45 AM',
            actor: 'Deepak Mohanty',
            actorRole: 'Citizen / Patient',
            action: 'SUBMIT_CITIZEN_VOICE_INTAKE',
            objectAffected: 'P-1055',
            details: 'Voice intake recorded in Odia (22s duration)',
          ),
        ],
        aiQuestions: [
          AiFollowUpQuestion(
            id: 'q-401',
            question:
                'Did the patient experience true loss of consciousness (syncope) or fall?',
            clinicalRationale:
                'Differentiates presyncope/lightheadedness from completed syncopal attack or head trauma.',
            relatedMissingInfoId: 'm-4',
            options: ['Yes', 'No', 'Not sure'],
          ),
        ],
        clinicalSummary:
            '62-year-old male with hypertension presenting with acute onset postural lightheadedness. Vitals and capillary glucose pending. Critical baseline measurements needed before final clinical assignment.',
        urgencyRationale:
            'Insufficient information: Missing orthostatic BP and point-of-care glucose in an elderly symptomatic patient.',
        routingRecommendation:
            'Triage Nursing Station — Immediate Vital Sign Acquisition',
        status: CaseStatus.pendingReview,
        priority: Priority.grey,
        facilityId: 'fac-chc-1',
      ),
    ];
  }

  /// Sample lab OCR extraction fact templates
  List<ExtractedFact> getSampleOcrFacts() {
    return const [
      ExtractedFact(
        id: 'ocr-1',
        metric: 'Hemoglobin (Hb)',
        value: '11.4',
        unit: 'g/dL',
        sourceProvenance: 'Lab Report Page 1 · Table Row 2',
        confidence: 'High (97%)',
        referenceRange: '12.0 - 15.5 g/dL',
      ),
      ExtractedFact(
        id: 'ocr-2',
        metric: 'Total WBC Count',
        value: '7,200',
        unit: '/µL',
        sourceProvenance: 'Lab Report Page 1 · Table Row 3',
        confidence: 'High (95%)',
        referenceRange: '4,000 - 11,000 /µL',
      ),
      ExtractedFact(
        id: 'ocr-3',
        metric: 'Platelet Count',
        value: '2.4',
        unit: 'lakh/µL',
        sourceProvenance: 'Lab Report Page 1 · Table Row 4',
        confidence: 'High (96%)',
        referenceRange: '1.5 - 4.5 lakh/µL',
      ),
      ExtractedFact(
        id: 'ocr-4',
        metric: 'Fasting Blood Sugar',
        value: '108',
        unit: 'mg/dL',
        sourceProvenance: 'Lab Report Page 1 · Table Row 6',
        confidence: 'High (92%)',
        referenceRange: '70 - 100 mg/dL',
        isFlagged: true,
      ),
    ];
  }
}
