import 'package:flutter/foundation.dart';
import 'package:niro_mobile/domain/models/auth.dart';

class AuthViewModel extends ChangeNotifier {
  bool _isAuthenticated = true;
  UserRole _currentRole = UserRole.medicalOfficer;
  StaffUser _currentStaffUser = StaffUser.mockStaffUsers.first;
  String _selectedFacility = 'City Community Health Center';
  bool _isLoading = false;
  String? _authError;

  final List<String> availableFacilities = const [
    'City Community Health Center',
    'Taluk Hospital Kendrapara',
    'District Headquarters Hospital',
    'Sub-Divisional Hospital Jagatsinghpur',
  ];

  bool get isAuthenticated => _isAuthenticated;
  UserRole get currentRole => _currentRole;
  StaffUser get currentStaffUser => _currentStaffUser;
  String get selectedFacility => _selectedFacility;
  bool get isLoading => _isLoading;
  String? get authError => _authError;

  bool get isStaff => _currentRole.isStaff;
  bool get isMedicalOfficer => _currentRole == UserRole.medicalOfficer;
  bool get isNurse => _currentRole == UserRole.staffNurse;
  bool get isCitizen => _currentRole == UserRole.citizen;

  void clearError() {
    if (_authError != null) {
      _authError = null;
      notifyListeners();
    }
  }

  Future<bool> loginWithCredentials({
    required String identifier,
    required String password,
    String? facility,
  }) async {
    _isLoading = true;
    _authError = null;
    notifyListeners();

    await Future.microtask(() {});

    final cleanId = identifier.trim().toLowerCase();
    if (cleanId.isEmpty || password.isEmpty) {
      _authError = 'Please enter both your identifier and password.';
      _isLoading = false;
      notifyListeners();
      return false;
    }

    // Determine role from input or demo accounts
    if (cleanId.contains('nurse') || cleanId.contains('sunita')) {
      _currentRole = UserRole.staffNurse;
      _currentStaffUser = StaffUser.mockStaffUsers[1];
    } else if (cleanId.contains('citizen') || cleanId.contains('patient') || cleanId.contains('ananya')) {
      _currentRole = UserRole.citizen;
    } else {
      _currentRole = UserRole.medicalOfficer;
      _currentStaffUser = StaffUser.mockStaffUsers.first;
    }

    if (facility != null) {
      _selectedFacility = facility;
    }

    _isAuthenticated = true;
    _isLoading = false;
    notifyListeners();
    return true;
  }

  Future<bool> register({
    required String name,
    required UserRole role,
    required String identifier,
    required String facility,
    required String password,
  }) async {
    _isLoading = true;
    _authError = null;
    notifyListeners();

    await Future.microtask(() {});

    if (name.trim().isEmpty || identifier.trim().isEmpty || password.isEmpty) {
      _authError = 'Please fill out all required fields.';
      _isLoading = false;
      notifyListeners();
      return false;
    }

    _currentRole = role;
    _selectedFacility = facility;
    if (role == UserRole.medicalOfficer) {
      _currentStaffUser = StaffUser(
        id: 'staff-mo-${DateTime.now().millisecondsSinceEpoch}',
        name: name,
        role: UserRole.medicalOfficer,
        facilityName: facility,
        facilityId: 'fac-custom',
        qualification: 'MBBS (Registered Practitioner)',
      );
    } else if (role == UserRole.staffNurse) {
      _currentStaffUser = StaffUser(
        id: 'staff-nurse-${DateTime.now().millisecondsSinceEpoch}',
        name: name,
        role: UserRole.staffNurse,
        facilityName: facility,
        facilityId: 'fac-custom',
        qualification: 'B.Sc. Nursing (Triage Registered)',
      );
    }

    _isAuthenticated = true;
    _isLoading = false;
    notifyListeners();
    return true;
  }

  void login({UserRole? role, String? facility}) {
    _isAuthenticated = true;
    _authError = null;
    if (role != null) setRole(role);
    if (facility != null) setFacility(facility);
    notifyListeners();
  }

  void logout() {
    _isAuthenticated = false;
    _authError = null;
    notifyListeners();
  }

  void setRole(UserRole role) {
    if (_currentRole == role) return;
    _currentRole = role;
    if (role == UserRole.medicalOfficer) {
      _currentStaffUser = StaffUser.mockStaffUsers.first;
    } else if (role == UserRole.staffNurse) {
      _currentStaffUser = StaffUser.mockStaffUsers[1];
    }
    notifyListeners();
  }

  void setStaffUser(StaffUser staffUser) {
    _currentStaffUser = staffUser;
    _currentRole = staffUser.role;
    _selectedFacility = staffUser.facilityName;
    notifyListeners();
  }

  void setFacility(String facility) {
    if (_selectedFacility == facility) return;
    _selectedFacility = facility;
    notifyListeners();
  }

  void toggleMode() {
    if (isStaff) {
      setRole(UserRole.citizen);
    } else {
      setRole(UserRole.medicalOfficer);
    }
  }
}
