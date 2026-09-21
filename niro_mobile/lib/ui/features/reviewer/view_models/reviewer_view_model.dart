import 'package:flutter/foundation.dart';
import 'package:niro_mobile/domain/models/patient.dart';
import 'package:niro_mobile/domain/models/priority.dart';
import 'package:niro_mobile/domain/repositories/triage_repository.dart';

class ReviewerViewModel extends ChangeNotifier {
  final ITriageRepository repository;

  ReviewerViewModel({required this.repository}) {
    loadPatients();
  }

  List<Patient> _patients = [];
  bool _isLoading = false;
  String? _errorMessage;
  Priority? _selectedPriorityFilter; // null means 'All'
  String _searchQuery = '';
  Patient? _activePatient;

  List<Patient> get patients => _patients;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;
  Priority? get selectedPriorityFilter => _selectedPriorityFilter;
  String get searchQuery => _searchQuery;
  Patient? get activePatient => _activePatient;

  // KPI Calculations
  int get totalRegisteredToday => _patients.length;
  int get awaitingReviewCount => _patients
      .where((p) =>
          p.status == CaseStatus.pendingReview ||
          p.status == CaseStatus.aiDraft ||
          p.status == CaseStatus.needsMoreInfo)
      .length;
  int get urgentCount =>
      _patients.where((p) => p.priority == Priority.red).length;
  String get avgReviewTimeMinutes => '4.5m';

  // Filtered Queue
  List<Patient> get filteredQueue {
    return _patients.where((p) {
      if (_selectedPriorityFilter != null &&
          p.priority != _selectedPriorityFilter) {
        return false;
      }
      if (_searchQuery.isNotEmpty) {
        final query = _searchQuery.toLowerCase();
        final nameMatch = p.name.toLowerCase().contains(query);
        final codeMatch = p.syntheticCode.toLowerCase().contains(query);
        final idMatch = p.id.toLowerCase().contains(query);
        final complaintMatch = p.chiefComplaint.toLowerCase().contains(query);
        final symptomMatch = p.symptoms
            .any((s) => s.name.toLowerCase().contains(query));

        if (!nameMatch &&
            !codeMatch &&
            !idMatch &&
            !complaintMatch &&
            !symptomMatch) {
          return false;
        }
      }
      return true;
    }).toList();
  }

  Future<void> loadPatients() async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      _patients = await repository.getPatients();
      if (_activePatient != null) {
        _activePatient = await repository.getPatientById(_activePatient!.id);
      }
    } catch (e) {
      _errorMessage = 'Failed to load triage queue: $e';
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  void setPriorityFilter(Priority? priority) {
    _selectedPriorityFilter = priority;
    notifyListeners();
  }

  void setSearchQuery(String query) {
    _searchQuery = query;
    notifyListeners();
  }

  Future<void> selectPatient(Patient patient) async {
    _activePatient = patient;
    notifyListeners();
    // Refresh patient details from repository
    final refreshed = await repository.getPatientById(patient.id);
    if (refreshed != null) {
      _activePatient = refreshed;
      notifyListeners();
    }
  }

  Future<void> approveTriageNote(
    String patientId, {
    String actorName = 'Dr. A. Sharma',
  }) async {
    await repository.updatePatientStatus(
      patientId,
      CaseStatus.approved,
      actorName: actorName,
      details: 'Human Medical Officer verified and approved AI triage draft.',
    );
    await loadPatients();
  }

  Future<void> escalateCase(
    String patientId, {
    String actorName = 'Dr. A. Sharma',
    String rationale = 'Escalated for immediate specialist evaluation.',
  }) async {
    await repository.updatePatientStatus(
      patientId,
      CaseStatus.escalated,
      actorName: actorName,
      details: rationale,
    );
    await loadPatients();
  }

  Future<void> requestMoreInfo(
    String patientId, {
    String actorName = 'Dr. A. Sharma',
    String details = 'Clinical evaluation requires additional diagnostics.',
  }) async {
    await repository.updatePatientStatus(
      patientId,
      CaseStatus.needsMoreInfo,
      actorName: actorName,
      details: details,
    );
    await loadPatients();
  }

  Future<void> answerAiQuestion(
    String patientId,
    String questionId,
    String answer, {
    String actorName = 'Dr. A. Sharma',
  }) async {
    await repository.answerAiQuestion(
      patientId,
      questionId,
      answer,
      actorName,
    );
    await loadPatients();
  }

  Future<void> resolveMissingInfo(
    String patientId,
    String missingInfoId, {
    String actorName = 'Dr. A. Sharma',
    String? note,
  }) async {
    await repository.resolveMissingInfo(
      patientId,
      missingInfoId,
      actorName,
      resolutionNote: note,
    );
    await loadPatients();
  }
}
