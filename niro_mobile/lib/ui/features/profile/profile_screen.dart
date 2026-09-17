import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:niro_mobile/ui/core/theme/app_colors.dart';
import 'package:niro_mobile/ui/features/intake/view_models/intake_view_model.dart';

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final viewModel = context.watch<IntakeViewModel>();

    return Scaffold(
      backgroundColor: AppColors.surface50,
      appBar: AppBar(
        title: const Text('Citizen Profile & Privacy'),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // User Identity Card
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: AppColors.surface0,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: AppColors.surface200),
                ),
                child: Row(
                  children: [
                    Container(
                      width: 52,
                      height: 52,
                      decoration: const BoxDecoration(
                        color: AppColors.primary100,
                        shape: BoxShape.circle,
                      ),
                      child: const Center(
                        child: Text(
                          'AJ',
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.w700,
                            color: AppColors.primary700,
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: const [
                          Text(
                            'Ananya Jena',
                            style: TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.w700,
                              color: AppColors.ink950,
                            ),
                          ),
                          SizedBox(height: 2),
                          Text(
                            'Synthetic ID: SYN-2026-042 · 29 yrs',
                            style: TextStyle(
                              fontSize: 12,
                              color: AppColors.ink500,
                            ),
                          ),
                          SizedBox(height: 2),
                          Text(
                            'Phone: +91 94*** **902 (Masked)',
                            style: TextStyle(
                              fontSize: 12,
                              color: AppColors.ink600,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 16),

              // Facility & Settings
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: AppColors.surface0,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: AppColors.surface200),
                ),
                child: Column(
                  children: [
                    _buildSettingsRow(
                      icon: Icons.local_hospital_outlined,
                      title: 'Assigned Health Facility',
                      subtitle: 'City Community Health Center (PHC/CHC Tier)',
                    ),
                    const Divider(height: 24, color: AppColors.surface200),
                    _buildSettingsRow(
                      icon: Icons.language,
                      title: 'Preferred Indic Language',
                      subtitle:
                          '${viewModel.selectedLanguage.name} (${viewModel.selectedLanguage.nativeName})',
                    ),
                    const Divider(height: 24, color: AppColors.surface200),
                    _buildSettingsRow(
                      icon: Icons.verified_user_outlined,
                      title: 'Role-Based Access',
                      subtitle: 'Citizen / Patient (Self-Intake Mode)',
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 16),

              // Privacy & Responsible AI (Section 21)
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: AppColors.surface0,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: AppColors.surface200),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: const [
                    Row(
                      children: [
                        Icon(Icons.shield_outlined,
                            size: 18, color: AppColors.primary600),
                        SizedBox(width: 8),
                        Text(
                          'Privacy & Responsible AI Policy',
                          style: TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.w700,
                            color: AppColors.ink950,
                          ),
                        ),
                      ],
                    ),
                    SizedBox(height: 10),
                    Text(
                      '• Data Retention: Session-scoped for this evaluation prototype.\n'
                      '• Anonymization: Patient identifiers are masked and synthetically generated.\n'
                      '• Human-in-the-Loop: AI drafts advisory facts only; licensed Medical Officers retain sole authority for diagnosis and prescription.\n'
                      '• Multilingual Privacy: Regional voice and OCR audio inputs are processed securely.',
                      style: TextStyle(
                        fontSize: 12,
                        color: AppColors.ink600,
                        height: 1.5,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildSettingsRow({
    required IconData icon,
    required String title,
    required String subtitle,
  }) {
    return Row(
      children: [
        Container(
          width: 36,
          height: 36,
          decoration: BoxDecoration(
            color: AppColors.surface100,
            borderRadius: BorderRadius.circular(8),
          ),
          child: Icon(icon, size: 18, color: AppColors.ink800),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                style: const TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                  color: AppColors.ink950,
                ),
              ),
              const SizedBox(height: 2),
              Text(
                subtitle,
                style: const TextStyle(
                  fontSize: 11,
                  color: AppColors.ink500,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}
