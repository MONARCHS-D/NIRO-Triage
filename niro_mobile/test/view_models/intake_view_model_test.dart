import 'package:flutter_test/flutter_test.dart';
import 'package:niro_mobile/data/repositories/triage_repository_impl.dart';
import 'package:niro_mobile/domain/models/language.dart';
import 'package:niro_mobile/ui/features/intake/view_models/intake_view_model.dart';

void main() {
  group('IntakeViewModel Tests', () {
    late TriageRepositoryImpl repository;
    late IntakeViewModel viewModel;

    setUp(() {
      repository = TriageRepositoryImpl();
      viewModel = IntakeViewModel(repository: repository);
    });

    tearDown(() {
      viewModel.dispose();
    });

    test('Initial state has default language and idle voice state', () {
      expect(viewModel.selectedLanguage.name, equals('Odia'));
      expect(viewModel.voiceState, equals(VoiceState.idle));
      expect(viewModel.recordingSeconds, equals(0));
      expect(viewModel.reportFacts, isEmpty);
    });

    test('selectLanguage updates active language', () {
      final hindi = LanguageOption.supportedLanguages.firstWhere(
        (l) => l.code == 'hi',
      );
      viewModel.selectLanguage(hindi);
      expect(viewModel.selectedLanguage.name, equals('Hindi'));
    });

    test('startVoiceRecording and stopVoiceRecording transition states', () async {
      viewModel.startVoiceRecording();
      expect(viewModel.voiceState, equals(VoiceState.listening));

      await viewModel.stopVoiceRecording();
      expect(viewModel.voiceState, equals(VoiceState.success));
      expect(viewModel.currentTranscript, isNotEmpty);
      expect(viewModel.currentTranslation, isNotEmpty);
      expect(viewModel.extractedSymptoms, isNotEmpty);
    });

    test('processSampleReport extracts OCR lab facts', () async {
      await viewModel.processSampleReport();
      expect(viewModel.reportFacts.length, greaterThanOrEqualTo(4));
      expect(viewModel.reportFacts.any((f) => f.metric.contains('Hemoglobin')), isTrue);
    });

    test('submitIntake persists patient in repository', () async {
      viewModel.setTypedComplaint('Severe cough and mild fever');
      final patient = await viewModel.submitIntake(
        modality: 'MANUAL',
        patientName: 'Test Citizen',
      );

      expect(patient.name, equals('Test Citizen'));
      expect(patient.chiefComplaint, equals('Severe cough and mild fever'));

      final allPatients = await repository.getPatients();
      expect(allPatients.any((p) => p.id == patient.id), isTrue);
    });
  });
}
