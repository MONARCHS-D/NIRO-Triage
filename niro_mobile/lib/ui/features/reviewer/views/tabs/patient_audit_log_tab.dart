import 'package:flutter/material.dart';
import 'package:niro_mobile/domain/models/patient.dart';
import 'package:niro_mobile/ui/core/theme/app_colors.dart';

class PatientAuditLogTab extends StatelessWidget {
  final Patient patient;

  const PatientAuditLogTab({super.key, required this.patient});

  @override
  Widget build(BuildContext context) {
    if (patient.auditLog.isEmpty) {
      return const Center(
        child: Text(
          'No audit entries recorded for this case.',
          style: TextStyle(color: AppColors.ink500),
        ),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: patient.auditLog.length,
      itemBuilder: (context, index) {
        final entry = patient.auditLog[index];

        return Container(
          margin: const EdgeInsets.only(bottom: 10),
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
                    padding: const EdgeInsets.symmetric(
                        horizontal: 8, vertical: 3),
                    decoration: BoxDecoration(
                      color: AppColors.surface100,
                      borderRadius: BorderRadius.circular(4),
                    ),
                    child: Text(
                      entry.action,
                      style: const TextStyle(
                        fontSize: 10,
                        fontWeight: FontWeight.w800,
                        color: AppColors.ink800,
                        letterSpacing: 0.3,
                      ),
                    ),
                  ),
                  Text(
                    entry.timestamp,
                    style: const TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w600,
                      color: AppColors.ink500,
                      fontFeatures: [FontFeature.tabularFigures()],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              Text(
                entry.details,
                style: const TextStyle(
                  fontSize: 13,
                  color: AppColors.ink950,
                  height: 1.35,
                ),
              ),
              const SizedBox(height: 8),
              Row(
                children: [
                  const Icon(Icons.badge_outlined,
                      size: 13, color: AppColors.ink500),
                  const SizedBox(width: 4),
                  Text(
                    '${entry.actor} (${entry.actorRole})',
                    style: const TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w600,
                      color: AppColors.ink600,
                    ),
                  ),
                  const Spacer(),
                  Text(
                    'Target: ${entry.objectAffected}',
                    style: const TextStyle(
                      fontSize: 10,
                      color: AppColors.ink500,
                      fontFeatures: [FontFeature.tabularFigures()],
                    ),
                  ),
                ],
              ),
            ],
          ),
        );
      },
    );
  }
}
