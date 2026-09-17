import 'package:niro_mobile/domain/models/patient.dart';
import 'package:niro_mobile/domain/models/priority.dart';
import 'package:niro_mobile/domain/models/language.dart';
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
    // Return simulated asynchronous copy
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
  Future<void> updatePatientStatus(String id, CaseStatus newStatus) async {
    await Future.delayed(const Duration(milliseconds: 50));
    final index = _patients.indexWhere((p) => p.id == id);
    if (index != -1) {
      _patients[index] = _patients[index].copyWith(status: newStatus);
    }
  }

  @override
  Future<List<LanguageOption>> getSupportedLanguages() async {
    return LanguageOption.supportedLanguages;
  }
}
