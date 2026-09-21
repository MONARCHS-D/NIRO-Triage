import 'package:niro_mobile/domain/models/patient.dart';
import 'package:niro_mobile/domain/models/priority.dart';
import 'package:niro_mobile/domain/models/language.dart';

abstract class ITriageRepository {
  /// Fetches all active and historical triage cases
  Future<List<Patient>> getPatients();

  /// Fetches a specific patient case by ID
  Future<Patient?> getPatientById(String id);

  /// Submits a new citizen intake case
  Future<Patient> submitIntake(Patient patient);

  /// Updates status of a triage case (e.g. from PENDING_REVIEW to APPROVED or ESCALATED)
  Future<void> updatePatientStatus(String id, CaseStatus newStatus, {String? actorName, String? details});

  /// Answers an interactive AI follow-up question and updates the case
  Future<void> answerAiQuestion(String patientId, String questionId, String answer, String actorName);

  /// Resolves a missing information item
  Future<void> resolveMissingInfo(String patientId, String missingInfoId, String actorName, {String? resolutionNote});

  /// Adds a new audit log entry
  Future<void> addAuditLogEntry(String patientId, AuditLogItem item);

  /// Retrieves list of supported regional Indic languages
  Future<List<LanguageOption>> getSupportedLanguages();
}
