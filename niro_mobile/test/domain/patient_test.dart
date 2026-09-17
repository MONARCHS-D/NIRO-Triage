import 'package:flutter_test/flutter_test.dart';
import 'package:niro_mobile/domain/models/language.dart';
import 'package:niro_mobile/domain/models/patient.dart';
import 'package:niro_mobile/domain/models/priority.dart';

void main() {
  group('Domain Models & Priority Tests', () {
    test('Priority enum provides correct labels and codes', () {
      expect(Priority.green.label, equals('Routine'));
      expect(Priority.green.code, equals('GREEN'));

      expect(Priority.yellow.label, equals('Prompt Review'));
      expect(Priority.yellow.code, equals('YELLOW'));

      expect(Priority.red.label, equals('Potential Urgency'));
      expect(Priority.red.code, equals('RED'));

      expect(Priority.grey.label, equals('Insufficient Info'));
      expect(Priority.grey.code, equals('GREY'));
    });

    test('CaseStatus enum provides correct clinical status codes', () {
      expect(CaseStatus.created.code, equals('CREATED'));
      expect(CaseStatus.pendingReview.code, equals('PENDING_REVIEW'));
      expect(CaseStatus.approved.code, equals('APPROVED'));
      expect(CaseStatus.escalated.code, equals('ESCALATED'));
    });

    test('Supported languages include Indic regional scripts', () {
      final languages = LanguageOption.supportedLanguages;
      expect(languages.length, greaterThanOrEqualTo(5));

      final odia = languages.firstWhere((l) => l.code == 'or');
      expect(odia.name, equals('Odia'));
      expect(odia.nativeName, equals('ଓଡ଼ିଆ'));

      final hindi = languages.firstWhere((l) => l.code == 'hi');
      expect(hindi.name, equals('Hindi'));
      expect(hindi.nativeName, equals('हिन्दी'));
    });

    test('Patient copyWith updates status without mutating original', () {
      const original = Patient(
        id: 'P-1001',
        syntheticCode: 'SYN-2026-001',
        name: 'Test Patient',
        age: 30,
        gender: 'Female',
        primaryLanguage: 'Odia',
        contactMasked: '+91 98*** **123',
        visitId: 'VST-2026-1001',
        arrivalTime: '10:00 AM',
        chiefComplaint: 'Fever and headache',
        status: CaseStatus.pendingReview,
        priority: Priority.yellow,
      );

      final updated = original.copyWith(status: CaseStatus.approved);

      expect(original.status, equals(CaseStatus.pendingReview));
      expect(updated.status, equals(CaseStatus.approved));
      expect(updated.id, equals(original.id));
      expect(updated.name, equals(original.name));
    });
  });
}
