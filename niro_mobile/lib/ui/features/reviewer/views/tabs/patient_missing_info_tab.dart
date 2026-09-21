import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:niro_mobile/domain/models/patient.dart';
import 'package:niro_mobile/ui/core/theme/app_colors.dart';
import 'package:niro_mobile/ui/features/auth/view_models/auth_view_model.dart';
import 'package:niro_mobile/ui/features/reviewer/view_models/reviewer_view_model.dart';

class PatientMissingInfoTab extends StatelessWidget {
  final Patient patient;

  const PatientMissingInfoTab({super.key, required this.patient});

  @override
  Widget build(BuildContext context) {
    if (patient.missingInfo.isEmpty) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                padding: const EdgeInsets.all(12),
                decoration: const BoxDecoration(
                  color: AppColors.success100,
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.check_circle_outline,
                    color: AppColors.success700, size: 36),
              ),
              const SizedBox(height: 12),
              const Text(
                'Complete Clinical Baseline',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w700,
                  color: AppColors.ink950,
                ),
              ),
              const SizedBox(height: 6),
              const Text(
                'All required core triage parameters and vitals have been captured for this patient.',
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 13,
                  color: AppColors.ink600,
                  height: 1.35,
                ),
              ),
            ],
          ),
        ),
      );
    }

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: AppColors.warning100,
            borderRadius: BorderRadius.circular(8),
            border: Border.all(color: AppColors.warning700.withValues(alpha: 0.3)),
          ),
          child: Row(
            children: [
              const Icon(Icons.help_outline,
                  color: AppColors.warning700, size: 20),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  '${patient.missingInfo.length} missing data items required for safe triage closure.',
                  style: const TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w700,
                    color: AppColors.warning700,
                  ),
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),
        ...patient.missingInfo.map((item) => _buildMissingItemCard(context, item)),
      ],
    );
  }

  Widget _buildMissingItemCard(BuildContext context, MissingInfoItem item) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.surface0,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: AppColors.surface200),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: AppColors.warning100,
                  borderRadius: BorderRadius.circular(4),
                ),
                child: Text(
                  item.category,
                  style: const TextStyle(
                    fontSize: 10,
                    fontWeight: FontWeight.w800,
                    color: AppColors.warning700,
                  ),
                ),
              ),
              Text(
                item.status,
                style: const TextStyle(
                  fontSize: 10,
                  fontWeight: FontWeight.w700,
                  color: AppColors.danger700,
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            item.label,
            style: const TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w700,
              color: AppColors.ink950,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            item.reason,
            style: const TextStyle(
              fontSize: 12,
              color: AppColors.ink600,
              height: 1.35,
            ),
          ),
          const SizedBox(height: 8),
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: AppColors.surface50,
              borderRadius: BorderRadius.circular(6),
              border: Border.all(color: AppColors.surface200),
            ),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Icon(Icons.arrow_forward_outlined,
                    size: 14, color: AppColors.primary600),
                const SizedBox(width: 6),
                Expanded(
                  child: Text(
                    item.askPrompt,
                    style: const TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                      color: AppColors.primary700,
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 10),
          Align(
            alignment: Alignment.centerRight,
            child: OutlinedButton.icon(
              onPressed: () {
                final auth = context.read<AuthViewModel>();
                final reviewer = context.read<ReviewerViewModel>();
                reviewer.resolveMissingInfo(
                  patient.id,
                  item.id,
                  actorName: auth.currentUserOrDesignation,
                  note: 'Recorded and validated at triage point.',
                );
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text('Resolved: ${item.label}'),
                    backgroundColor: AppColors.success700,
                    duration: const Duration(seconds: 2),
                  ),
                );
              },
              icon: const Icon(Icons.check, size: 16),
              label: const Text('Mark Collected / Verified'),
              style: OutlinedButton.styleFrom(
                foregroundColor: AppColors.success700,
                side: const BorderSide(color: AppColors.success700),
                visualDensity: VisualDensity.compact,
                padding:
                    const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

extension on AuthViewModel {
  String get currentUserOrDesignation {
    if (isStaff) {
      return currentStaffUser.name;
    }
    return 'Clinical Reviewer';
  }
}
