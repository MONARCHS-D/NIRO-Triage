import 'dart:async';
import 'dart:math';
import 'package:flutter/foundation.dart';
import 'package:niro_mobile/domain/models/language.dart';
import 'package:niro_mobile/domain/models/patient.dart';
import 'package:niro_mobile/domain/models/priority.dart';
import 'package:niro_mobile/domain/repositories/triage_repository.dart';

enum VoiceState { idle, listening, processing, transcribing, success, error }

class IntakeViewModel extends ChangeNotifier {
  final ITriageRepository repository;

  IntakeViewModel({required this.repository}) {
    _selectedLanguage = LanguageOption.supportedLanguages.first;
  }

  late LanguageOption _selectedLanguage;
  LanguageOption get selectedLanguage => _selectedLanguage;

  void selectLanguage(LanguageOption language) {
    _selectedLanguage = language;
    notifyListeners();
  }

  // --- Voice Intake State ---
  VoiceState _voiceState = VoiceState.idle;
  VoiceState get voiceState => _voiceState;

  int _recordingSeconds = 0;
  int get recordingSeconds => _recordingSeconds;

  Timer? _timer;
  List<double> _waveforms = List.generate(24, (_) => 0.2);
  List<double> get waveforms => _waveforms;

  String _currentTranscript = '';
  String get currentTranscript => _currentTranscript;

  String _currentTranslation = '';
  String get currentTranslation => _currentTranslation;

  List<String> _extractedSymptoms = [];
  List<String> get extractedSymptoms => _extractedSymptoms;

  void startVoiceRecording() {
    _voiceState = VoiceState.listening;
    _recordingSeconds = 0;
    _currentTranscript = '';
    _currentTranslation = '';
    _extractedSymptoms = [];
    notifyListeners();

    _timer?.cancel();
    _timer = Timer.periodic(const Duration(milliseconds: 150), (timer) {
      if (timer.tick % 7 == 0) {
        _recordingSeconds++;
      }

      // Simulate dynamic audio amplitude fluctuations
      final random = Random();
      _waveforms = List.generate(24, (_) => 0.15 + random.nextDouble() * 0.85);

      // Simulate partial transcription streaming
      if (_recordingSeconds >= 2 && _currentTranscript.isEmpty) {
        _currentTranscript = _selectedLanguage.scriptSnippet;
      }

      notifyListeners();
    });
  }

  Future<void> stopVoiceRecording() async {
    _timer?.cancel();
    _voiceState = VoiceState.processing;
    notifyListeners();

    await Future.delayed(const Duration(milliseconds: 600));
    _voiceState = VoiceState.transcribing;
    notifyListeners();

    await Future.delayed(const Duration(milliseconds: 500));
    _voiceState = VoiceState.success;
    _currentTranscript = _selectedLanguage.sampleTranscript;
    _currentTranslation = _selectedLanguage.sampleTranslation;
    _extractedSymptoms = List.from(_selectedLanguage.sampleSymptoms);
    _waveforms = List.generate(24, (_) => 0.2);
    notifyListeners();
  }

  void resetVoice() {
    _timer?.cancel();
    _voiceState = VoiceState.idle;
    _recordingSeconds = 0;
    _currentTranscript = '';
    _currentTranslation = '';
    _extractedSymptoms = [];
    _waveforms = List.generate(24, (_) => 0.2);
    notifyListeners();
  }

  // --- Type Intake State ---
  String _typedComplaint = '';
  String get typedComplaint => _typedComplaint;

  String _typedDuration = '1-2 days';
  String get typedDuration => _typedDuration;

  void setTypedComplaint(String value) {
    _typedComplaint = value;
    notifyListeners();
  }

  void setTypedDuration(String duration) {
    _typedDuration = duration;
    notifyListeners();
  }

  // --- Report Upload / OCR State ---
  bool _isExtractingReport = false;
  bool get isExtractingReport => _isExtractingReport;

  List<ExtractedFact> _reportFacts = [];
  List<ExtractedFact> get reportFacts => _reportFacts;

  Future<void> processSampleReport() async {
    _isExtractingReport = true;
    _reportFacts = [];
    notifyListeners();

    await Future.delayed(const Duration(milliseconds: 800));

    _reportFacts = const [
      ExtractedFact(
        id: 'ocr-rep-1',
        metric: 'Hemoglobin (Hb)',
        value: '11.2',
        unit: 'g/dL',
        sourceProvenance: 'CBC Report Page 1 · Table Row 1',
        confidence: 'High (98%)',
        referenceRange: '12.0 - 15.5 g/dL',
      ),
      ExtractedFact(
        id: 'ocr-rep-2',
        metric: 'Total Leukocyte Count (WBC)',
        value: '8,400',
        unit: '/µL',
        sourceProvenance: 'CBC Report Page 1 · Table Row 2',
        confidence: 'High (96%)',
        referenceRange: '4,000 - 11,000 /µL',
      ),
      ExtractedFact(
        id: 'ocr-rep-3',
        metric: 'Platelet Count',
        value: '1.9',
        unit: 'lakh/µL',
        sourceProvenance: 'CBC Report Page 1 · Table Row 3',
        confidence: 'High (95%)',
        referenceRange: '1.5 - 4.5 lakh/µL',
      ),
      ExtractedFact(
        id: 'ocr-rep-4',
        metric: 'Random Blood Glucose',
        value: '118',
        unit: 'mg/dL',
        sourceProvenance: 'Biochemistry Slip · OCR Extracted',
        confidence: 'High (94%)',
        referenceRange: '70 - 140 mg/dL',
      ),
    ];

    _isExtractingReport = false;
    notifyListeners();
  }

  // --- Final Intake Submission ---
  Patient? _submittedPatient;
  Patient? get submittedPatient => _submittedPatient;

  bool _isSubmitting = false;
  bool get isSubmitting => _isSubmitting;

  Future<Patient> submitIntake({
    required String modality, // 'VOICE', 'MANUAL', 'REPORT', 'PHOTO'
    String patientName = 'Ananya Jena',
    int patientAge = 29,
    String gender = 'Female',
  }) async {
    _isSubmitting = true;
    notifyListeners();

    final randomId = 'P-${1000 + Random().nextInt(9000)}';
    final randomVisit = 'VST-2026-${1000 + Random().nextInt(9000)}';
    final randomSyn = 'SYN-2026-${100 + Random().nextInt(900)}';

    String complaint = '';
    List<Symptom> symptoms = [];
    Priority priority = Priority.green;

    if (modality == 'VOICE') {
      complaint = _currentTranslation.isNotEmpty
          ? _currentTranslation
          : 'Voice intake recorded in ${_selectedLanguage.name}';
      symptoms = _extractedSymptoms
          .map(
            (s) => Symptom(
              id: 'sym-${Random().nextInt(9999)}',
              name: s,
              duration: 'Recent',
              severity: 'MODERATE',
              source: 'VOICE',
              confidence: 0.96,
            ),
          )
          .toList();
      priority = Priority.yellow;
    } else if (modality == 'MANUAL') {
      complaint = _typedComplaint.isNotEmpty
          ? _typedComplaint
          : 'Symptom report submitted via text';
      symptoms = [
        Symptom(
          id: 'sym-${Random().nextInt(9999)}',
          name: complaint,
          duration: _typedDuration,
          severity: 'MILD',
          source: 'MANUAL',
          confidence: 0.95,
        ),
      ];
      priority = Priority.green;
    } else if (modality == 'REPORT') {
      complaint = 'Uploaded CBC & biochemistry lab reports for routine check.';
      symptoms = [
        Symptom(
          id: 'sym-${Random().nextInt(9999)}',
          name: 'Routine Lab Evaluation',
          duration: 'Current',
          severity: 'MILD',
          source: 'REPORT',
          confidence: 0.98,
        ),
      ];
      priority = Priority.green;
    } else {
      complaint = 'Photo of localized skin lesion / symptom uploaded.';
      symptoms = [
        Symptom(
          id: 'sym-${Random().nextInt(9999)}',
          name: 'Localized Cutaneous Lesion',
          duration: '3 days',
          severity: 'MILD',
          source: 'PHOTO',
          confidence: 0.92,
        ),
      ];
      priority = Priority.green;
    }

    final newPatient = Patient(
      id: randomId,
      syntheticCode: randomSyn,
      name: patientName,
      age: patientAge,
      gender: gender,
      primaryLanguage: _selectedLanguage.name,
      translatedToEnglish: true,
      contactMasked: '+91 94*** **902',
      visitId: randomVisit,
      arrivalTime: 'Today · Just now',
      chiefComplaint: complaint,
      symptoms: symptoms,
      relevantHistory: ['Citizen self-intake via NIRO Triage Mobile'],
      facts: List.from(_reportFacts),
      missingInfo: const [
        MissingInfoItem(
          id: 'miss-auto-1',
          field: 'vitals_check',
          label: 'In-person clinic vitals confirmation',
          category: 'VITALS',
          status: 'NOT_PROVIDED',
          reason: 'Mobile intake completed. Clinical staff must record in-person vitals.',
          askPrompt: 'Measure blood pressure and SpO2 at triage station.',
        ),
      ],
      timeline: [
        TimelineEvent(
          id: 'tl-1',
          timestamp: 'Just now',
          title: 'Citizen Mobile Intake Submitted ($modality)',
          description: complaint,
          source: modality,
          actor: patientName,
        ),
      ],
      auditLog: [
        AuditLogItem(
          id: 'aud-1',
          timestamp: 'Just now',
          actor: patientName,
          actorRole: 'Citizen / Patient',
          action: 'SUBMIT_CITIZEN_INTAKE_$modality',
          objectAffected: randomId,
          details: 'Submitted intake via NIRO Triage Mobile ($modality mode)',
        ),
      ],
      status: CaseStatus.pendingReview,
      priority: priority,
    );

    _submittedPatient = await repository.submitIntake(newPatient);
    _isSubmitting = false;
    notifyListeners();

    return _submittedPatient!;
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }
}
