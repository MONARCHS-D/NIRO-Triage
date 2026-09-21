import 'package:flutter_test/flutter_test.dart';
import 'package:niro_mobile/data/repositories/triage_repository_impl.dart';
import 'package:niro_mobile/domain/models/priority.dart';
import 'package:niro_mobile/ui/features/reviewer/view_models/reviewer_view_model.dart';

void main() {
  group('ReviewerViewModel Unit Tests', () {
    late TriageRepositoryImpl repository;
    late ReviewerViewModel viewModel;

    setUp(() async {
      repository = TriageRepositoryImpl();
      viewModel = ReviewerViewModel(repository: repository);
      // Wait for initial load
      await Future.delayed(const Duration(milliseconds: 150));
    });

    test('Initial state loads benchmark cases and calculates KPIs correctly', () {
      expect(viewModel.patients.length, greaterThanOrEqualTo(3));
      expect(viewModel.totalRegisteredToday, viewModel.patients.length);
      expect(viewModel.urgentCount, greaterThanOrEqualTo(1));
      expect(viewModel.awaitingReviewCount, greaterThanOrEqualTo(1));
      expect(viewModel.avgReviewTimeMinutes, '4.5m');
    });

    test('Priority filtering isolates specific clinical urgency categories', () {
      viewModel.setPriorityFilter(Priority.red);
      expect(viewModel.filteredQueue.every((p) => p.priority == Priority.red), isTrue);

      viewModel.setPriorityFilter(Priority.yellow);
      expect(viewModel.filteredQueue.every((p) => p.priority == Priority.yellow), isTrue);

      viewModel.setPriorityFilter(Priority.green);
      expect(viewModel.filteredQueue.every((p) => p.priority == Priority.green), isTrue);

      viewModel.setPriorityFilter(null);
      expect(viewModel.filteredQueue.length, viewModel.patients.length);
    });

    test('Search query matches patient name, synthetic ID, and complaints', () {
      viewModel.setSearchQuery('Sunita');
      expect(viewModel.filteredQueue.length, 1);
      expect(viewModel.filteredQueue.first.id, 'P-1042');

      viewModel.setSearchQuery('SYN-2026-002');
      expect(viewModel.filteredQueue.length, 1);
      expect(viewModel.filteredQueue.first.name, 'Rajesh Verma');

      viewModel.setSearchQuery('dyspnea');
      expect(viewModel.filteredQueue.length, 1);
      expect(viewModel.filteredQueue.first.id, 'P-1042');

      viewModel.setSearchQuery('nonexistent query xyz');
      expect(viewModel.filteredQueue.isEmpty, isTrue);
    });

    test('approveTriageNote updates case status and appends audit log entry', () async {
      final patientId = 'P-1042';
      await viewModel.approveTriageNote(patientId, actorName: 'Dr. A. Sharma');

      final updated = viewModel.patients.firstWhere((p) => p.id == patientId);
      expect(updated.status, CaseStatus.approved);
      expect(updated.auditLog.first.action, 'STATUS_TRANSITION_APPROVED');
      expect(updated.auditLog.first.actor, 'Dr. A. Sharma');
    });

    test('escalateCase updates case status to escalated and records rationale in audit log', () async {
      final patientId = 'P-1035';
      await viewModel.escalateCase(
        patientId,
        actorName: 'Dr. A. Sharma',
        rationale: 'Suspected acute pancreatitis - refer to GI unit',
      );

      final updated = viewModel.patients.firstWhere((p) => p.id == patientId);
      expect(updated.status, CaseStatus.escalated);
      expect(updated.auditLog.first.action, 'STATUS_TRANSITION_ESCALATED');
      expect(updated.auditLog.first.details, contains('pancreatitis'));
    });

    test('answerAiQuestion records selected answer and resolves linked missing info item', () async {
      final patientId = 'P-1042';
      final questionId = 'q-101'; // Linked to missing info m-1
      final initialPatient = viewModel.patients.firstWhere((p) => p.id == patientId);
      expect(initialPatient.missingInfo.any((m) => m.id == 'm-1'), isTrue);

      await viewModel.answerAiQuestion(
        patientId,
        questionId,
        'Yes',
        actorName: 'Dr. A. Sharma',
      );

      final updated = viewModel.patients.firstWhere((p) => p.id == patientId);
      final question = updated.aiQuestions.firstWhere((q) => q.id == questionId);
      expect(question.isAnswered, isTrue);
      expect(question.selectedAnswer, 'Yes');
      // Linked missing info m-1 should now be resolved
      expect(updated.missingInfo.any((m) => m.id == 'm-1'), isFalse);
      expect(updated.auditLog.first.action, 'ANSWER_AI_QUESTION');
    });

    test('resolveMissingInfo removes item from checklist and appends audit log', () async {
      final patientId = 'P-1035';
      final missingId = 'm-2';
      final initialPatient = viewModel.patients.firstWhere((p) => p.id == patientId);
      expect(initialPatient.missingInfo.any((m) => m.id == missingId), isTrue);

      await viewModel.resolveMissingInfo(
        patientId,
        missingId,
        actorName: 'Sunita B.',
        note: 'BP measured: 138/86 mmHg',
      );

      final updated = viewModel.patients.firstWhere((p) => p.id == patientId);
      expect(updated.missingInfo.any((m) => m.id == missingId), isFalse);
      expect(updated.auditLog.first.action, 'RESOLVE_MISSING_DATA');
      expect(updated.auditLog.first.details, contains('138/86'));
    });
  });
}
