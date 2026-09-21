import 'package:intl/intl.dart';
import 'package:niro_mobile/domain/models/language.dart';
import 'package:niro_mobile/domain/models/patient.dart';
import 'package:niro_mobile/domain/models/priority.dart';
import 'package:niro_mobile/domain/repositories/triage_repository.dart';
import 'package:niro_mobile/data/services/triage_mock_service.dart';

class TriageRepositoryImpl implements ITriageRepository {
  final TriageMockService _mockService;
  late final List<Patient> _patients;

  TriageRepositoryImpl({TriageMockService? mockService})
      : _mockService = mockService ?? TriageMockService() {
    _patients = List<Patient>.from(_mockService.getInitialSyntheticCases());
  }

  @override
  Future<List<Patient>> getPatients() async {
    await Future.delayed(const Duration(milliseconds: 50));
    return List.unmodifiable(_patients);
  }

  @override
  Future<Patient?> getPatientById(String id) async {
    await Future.delayed(const Duration(milliseconds: 30));
    try {
      return _patients.firstWhere((p) => p.id == id);
    } catch (_) {
      return null;
    }
  }

  @override
  Future<Patient> submitIntake(Patient patient) async {
    await Future.delayed(const Duration(milliseconds: 100));
    _patients.insert(0, patient);
    return patient;
  }

  @override
  Future<void> updatePatientStatus(
    String id,
    CaseStatus newStatus, {
    String? actorName,
    String? details,
  }) async {
    await Future.delayed(const Duration(milliseconds: 50));
    final index = _patients.indexWhere((p) => p.id == id);
    if (index != -1) {
      final current = _patients[index];
      final timeStr = DateFormat('hh:mm a').format(DateTime.now());
      final auditEntry = AuditLogItem(
        id: 'audit-${DateTime.now().millisecondsSinceEpoch}',
        timestamp: timeStr,
        actor: actorName ?? 'Reviewer',
        actorRole: 'Clinical Staff',
        action: 'STATUS_TRANSITION_${newStatus.name.toUpperCase()}',
        objectAffected: id,
        details: details ?? 'Status changed from ${current.status.name} to ${newStatus.name}',
      );

      _patients[index] = current.copyWith(
        status: newStatus,
        auditLog: [auditEntry, ...current.auditLog],
      );
    }
  }

  @override
  Future<void> answerAiQuestion(
    String patientId,
    String questionId,
    String answer,
    String actorName,
  ) async {
    await Future.delayed(const Duration(milliseconds: 50));
    final index = _patients.indexWhere((p) => p.id == patientId);
    if (index != -1) {
      final current = _patients[index];
      String? resolvedMissingId;

      final updatedQuestions = current.aiQuestions.map((q) {
        if (q.id == questionId) {
          resolvedMissingId = q.relatedMissingInfoId;
          return q.copyWith(
            selectedAnswer: answer,
            isAnswered: true,
          );
        }
        return q;
      }).toList();

      List<MissingInfoItem> updatedMissing = current.missingInfo;
      if (resolvedMissingId != null) {
        updatedMissing = current.missingInfo
            .where((m) => m.id != resolvedMissingId)
            .toList();
      }

      final timeStr = DateFormat('hh:mm a').format(DateTime.now());
      final auditEntry = AuditLogItem(
        id: 'audit-${DateTime.now().millisecondsSinceEpoch}',
        timestamp: timeStr,
        actor: actorName,
        actorRole: 'Clinical Reviewer',
        action: 'ANSWER_AI_QUESTION',
        objectAffected: questionId,
        details: 'Recorded response "$answer" to AI clinical inquiry',
      );

      _patients[index] = current.copyWith(
        aiQuestions: updatedQuestions,
        missingInfo: updatedMissing,
        auditLog: [auditEntry, ...current.auditLog],
      );
    }
  }

  @override
  Future<void> resolveMissingInfo(
    String patientId,
    String missingInfoId,
    String actorName, {
    String? resolutionNote,
  }) async {
    await Future.delayed(const Duration(milliseconds: 50));
    final index = _patients.indexWhere((p) => p.id == patientId);
    if (index != -1) {
      final current = _patients[index];
      final updatedMissing = current.missingInfo
          .where((m) => m.id != missingInfoId)
          .toList();

      final timeStr = DateFormat('hh:mm a').format(DateTime.now());
      final auditEntry = AuditLogItem(
        id: 'audit-${DateTime.now().millisecondsSinceEpoch}',
        timestamp: timeStr,
        actor: actorName,
        actorRole: 'Clinical Staff',
        action: 'RESOLVE_MISSING_DATA',
        objectAffected: missingInfoId,
        details: resolutionNote ?? 'Clinical measurement obtained and verified.',
      );

      _patients[index] = current.copyWith(
        missingInfo: updatedMissing,
        auditLog: [auditEntry, ...current.auditLog],
      );
    }
  }

  @override
  Future<void> addAuditLogEntry(String patientId, AuditLogItem item) async {
    await Future.delayed(const Duration(milliseconds: 30));
    final index = _patients.indexWhere((p) => p.id == patientId);
    if (index != -1) {
      final current = _patients[index];
      _patients[index] = current.copyWith(
        auditLog: [item, ...current.auditLog],
      );
    }
  }

  @override
  Future<List<LanguageOption>> getSupportedLanguages() async {
    return LanguageOption.supportedLanguages;
  }
}
