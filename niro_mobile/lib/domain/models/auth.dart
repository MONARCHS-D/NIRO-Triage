enum UserRole {
  medicalOfficer,
  staffNurse,
  citizen,
}

extension UserRoleExtension on UserRole {
  String get displayName {
    switch (this) {
      case UserRole.medicalOfficer:
        return 'Medical Officer (MO)';
      case UserRole.staffNurse:
        return 'Triage Staff Nurse';
      case UserRole.citizen:
        return 'Citizen / Patient';
    }
  }

  bool get isStaff => this == UserRole.medicalOfficer || this == UserRole.staffNurse;
}

class StaffUser {
  final String id;
  final String name;
  final UserRole role;
  final String facilityName;
  final String facilityId;
  final String qualification;

  const StaffUser({
    required this.id,
    required this.name,
    required this.role,
    required this.facilityName,
    required this.facilityId,
    required this.qualification,
  });

  static const List<StaffUser> mockStaffUsers = [
    StaffUser(
      id: 'staff-mo-1',
      name: 'Dr. A. Sharma',
      role: UserRole.medicalOfficer,
      facilityName: 'City Community Health Center',
      facilityId: 'fac-chc-1',
      qualification: 'MBBS, MD (Emergency Medicine)',
    ),
    StaffUser(
      id: 'staff-nurse-1',
      name: 'Sunita B.',
      role: UserRole.staffNurse,
      facilityName: 'City Community Health Center',
      facilityId: 'fac-chc-1',
      qualification: 'B.Sc. Nursing (Triage Certified)',
    ),
  ];
}
