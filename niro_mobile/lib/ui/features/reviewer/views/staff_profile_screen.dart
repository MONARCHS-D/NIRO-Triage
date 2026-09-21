import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:niro_mobile/domain/models/auth.dart';
import 'package:niro_mobile/ui/core/theme/app_colors.dart';
import 'package:niro_mobile/ui/core/widgets/logout_dialog.dart';
import 'package:niro_mobile/ui/features/auth/view_models/auth_view_model.dart';

class StaffProfileScreen extends StatelessWidget {
  const StaffProfileScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthViewModel>();

    return Scaffold(
      backgroundColor: AppColors.surface50,
      appBar: AppBar(
        backgroundColor: AppColors.surface0,
        elevation: 0,
        title: const Text(
          'Staff Profile & Facility',
          style: TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.w800,
            color: AppColors.ink950,
          ),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.logout, color: AppColors.danger600),
            tooltip: 'Log Out Session',
            onPressed: () => showLogoutConfirmationDialog(context),
          ),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // User Card
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: AppColors.surface0,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: AppColors.surface200),
            ),
            child: Row(
              children: [
                CircleAvatar(
                  radius: 28,
                  backgroundColor: AppColors.primary100,
                  child: Text(
                    auth.isStaff
                        ? auth.currentStaffUser.name
                            .split(' ')
                            .map((e) => e.isNotEmpty ? e[0] : '')
                            .take(2)
                            .join()
                        : 'CZ',
                    style: const TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.w800,
                      color: AppColors.primary700,
                    ),
                  ),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        auth.currentStaffUser.name,
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w800,
                          color: AppColors.ink950,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        auth.currentStaffUser.qualification,
                        style: const TextStyle(
                          fontSize: 12,
                          color: AppColors.ink600,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 8, vertical: 2),
                        decoration: BoxDecoration(
                          color: AppColors.primary100,
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: Text(
                          auth.currentRole.displayName,
                          style: const TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.w700,
                            color: AppColors.primary700,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),

          const SizedBox(height: 20),

          // Role Switcher Section (Allows evaluators/testers to switch persona)
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: AppColors.surface0,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: AppColors.surface200),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Switch Active Role / Persona',
                  style: TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.w700,
                    color: AppColors.ink950,
                  ),
                ),
                const SizedBox(height: 4),
                const Text(
                  'Select a staff persona or switch to Citizen self-intake mode to test both journeys.',
                  style: TextStyle(fontSize: 12, color: AppColors.ink600),
                ),
                const SizedBox(height: 12),
                _buildRoleCard(
                  context,
                  title: 'Dr. A. Sharma (Medical Officer)',
                  subtitle: 'Full review, escalation, and note approval authority',
                  role: UserRole.medicalOfficer,
                  currentRole: auth.currentRole,
                  onTap: () => auth.setRole(UserRole.medicalOfficer),
                ),
                _buildRoleCard(
                  context,
                  title: 'Sunita B. (Triage Staff Nurse)',
                  subtitle: 'Vital sign acquisition and queue management',
                  role: UserRole.staffNurse,
                  currentRole: auth.currentRole,
                  onTap: () => auth.setRole(UserRole.staffNurse),
                ),
                _buildRoleCard(
                  context,
                  title: 'Citizen / Patient Mode',
                  subtitle: 'Multimodal regional intake (Voice, Text, Report, Photo)',
                  role: UserRole.citizen,
                  currentRole: auth.currentRole,
                  onTap: () => auth.setRole(UserRole.citizen),
                ),
              ],
            ),
          ),

          const SizedBox(height: 20),

          // Active Facility Selector
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: AppColors.surface0,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: AppColors.surface200),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Assigned Health Facility',
                  style: TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.w700,
                    color: AppColors.ink950,
                  ),
                ),
                const SizedBox(height: 12),
                DropdownButtonFormField<String>(
                  initialValue: auth.selectedFacility,
                  isExpanded: true,
                  decoration: InputDecoration(
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(8),
                      borderSide: const BorderSide(color: AppColors.surface200),
                    ),
                    contentPadding:
                        const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                  ),
                  items: auth.availableFacilities.map((facility) {
                    return DropdownMenuItem<String>(
                      value: facility,
                      child: Text(
                        facility,
                        style: const TextStyle(fontSize: 13),
                        overflow: TextOverflow.ellipsis,
                      ),
                    );
                  }).toList(),
                  onChanged: (val) {
                    if (val != null) auth.setFacility(val);
                  },
                ),
              ],
            ),
          ),

          const SizedBox(height: 20),

          // Protocol Disclaimer
          Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: AppColors.surface100,
              borderRadius: BorderRadius.circular(10),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: const [
                Text(
                  'NIRO Triage Protocol v2.4 (MoHFW India Alignment)',
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w700,
                    color: AppColors.ink800,
                  ),
                ),
                SizedBox(height: 4),
                Text(
                  'All digital triage records adhere to DISHA and ABDM interoperability guidelines. Data stored in this prototype is synthetically generated for demonstration.',
                  style: TextStyle(
                    fontSize: 11,
                    color: AppColors.ink500,
                    height: 1.35,
                  ),
                ),
              ],
            ),
          ),

          const SizedBox(height: 24),

          // Log Out Session Button
          SizedBox(
            width: double.infinity,
            height: 48,
            child: OutlinedButton.icon(
              onPressed: () => showLogoutConfirmationDialog(context),
              icon: const Icon(Icons.logout, size: 18, color: AppColors.danger600),
              label: const Text(
                'Log Out Session',
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w700,
                  color: AppColors.danger600,
                ),
              ),
              style: OutlinedButton.styleFrom(
                side: const BorderSide(color: AppColors.danger600, width: 1.2),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(8),
                ),
                backgroundColor: AppColors.surface0,
              ),
            ),
          ),
          const SizedBox(height: 16),
        ],
      ),
    );
  }

  Widget _buildRoleCard(
    BuildContext context, {
    required String title,
    required String subtitle,
    required UserRole role,
    required UserRole currentRole,
    required VoidCallback onTap,
  }) {
    final isSelected = role == currentRole;
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(8),
      child: Container(
        margin: const EdgeInsets.only(bottom: 8),
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: isSelected ? AppColors.primary100 : AppColors.surface50,
          borderRadius: BorderRadius.circular(8),
          border: Border.all(
            color: isSelected ? AppColors.primary600 : AppColors.surface200,
            width: isSelected ? 1.5 : 1.0,
          ),
        ),
        child: Row(
          children: [
            Icon(
              isSelected ? Icons.radio_button_checked : Icons.radio_button_off,
              color: isSelected ? AppColors.primary600 : AppColors.ink500,
              size: 20,
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: TextStyle(
                      fontSize: 13,
                      fontWeight:
                          isSelected ? FontWeight.w700 : FontWeight.w600,
                      color:
                          isSelected ? AppColors.primary700 : AppColors.ink950,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    subtitle,
                    style:
                        const TextStyle(fontSize: 11, color: AppColors.ink500),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
