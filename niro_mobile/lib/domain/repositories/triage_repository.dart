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
  Future<void> updatePatientStatus(String id, CaseStatus newStatus);

  /// Retrieves list of supported regional Indic languages
  Future<List<LanguageOption>> getSupportedLanguages();
}
