import 'package:flutter/foundation.dart';
import 'package:niro_mobile/domain/models/patient.dart';
import 'package:niro_mobile/domain/models/priority.dart';
import 'package:niro_mobile/domain/repositories/triage_repository.dart';

class VisitsViewModel extends ChangeNotifier {
  final ITriageRepository repository;

  VisitsViewModel({required this.repository}) {
    loadVisits();
  }

  bool _isLoading = false;
  bool get isLoading => _isLoading;

  List<Patient> _visits = [];
  List<Patient> get visits => _visits;

  String _filter = 'ALL'; // 'ALL', 'RED', 'YELLOW', 'GREEN'
  String get filter => _filter;

  void setFilter(String filter) {
    _filter = filter;
    notifyListeners();
  }

  List<Patient> get filteredVisits {
    if (_filter == 'ALL') return _visits;
    if (_filter == 'RED') {
      return _visits.where((v) => v.priority == Priority.red).toList();
    }
    if (_filter == 'YELLOW') {
      return _visits.where((v) => v.priority == Priority.yellow).toList();
    }
    if (_filter == 'GREEN') {
      return _visits.where((v) => v.priority == Priority.green).toList();
    }
    return _visits;
  }

  Future<void> loadVisits() async {
    _isLoading = true;
    notifyListeners();

    _visits = await repository.getPatients();
    _isLoading = false;
    notifyListeners();
  }
}
