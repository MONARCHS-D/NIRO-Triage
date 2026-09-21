import 'package:flutter/material.dart';
import 'package:niro_mobile/domain/models/patient.dart';
import 'package:niro_mobile/ui/core/theme/app_colors.dart';

class PatientTimelineTab extends StatelessWidget {
  final Patient patient;

  const PatientTimelineTab({super.key, required this.patient});

  @override
  Widget build(BuildContext context) {
    if (patient.timeline.isEmpty) {
      return const Center(
        child: Text(
          'No timeline events recorded yet.',
          style: TextStyle(color: AppColors.ink500),
        ),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: patient.timeline.length,
      itemBuilder: (context, index) {
        final event = patient.timeline[index];
        final isLast = index == patient.timeline.length - 1;

        return Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Timestamp column
            SizedBox(
              width: 65,
              child: Text(
                event.timestamp,
                style: const TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w700,
                  color: AppColors.ink500,
                  fontFeatures: [FontFeature.tabularFigures()],
                ),
              ),
            ),

            // Timeline line & icon
            Column(
              children: [
                _buildEventIcon(event.source),
                if (!isLast)
                  Container(
                    width: 2,
                    height: 54,
                    color: AppColors.surface200,
                  ),
              ],
            ),

            const SizedBox(width: 12),

            // Event Details Card
            Expanded(
              child: Container(
                margin: const EdgeInsets.only(bottom: 16),
                padding: const EdgeInsets.all(12),
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
                        Expanded(
                          child: Text(
                            event.title,
                            style: const TextStyle(
                              fontSize: 13,
                              fontWeight: FontWeight.w700,
                              color: AppColors.ink950,
                            ),
                          ),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 6, vertical: 2),
                          decoration: BoxDecoration(
                            color: AppColors.surface100,
                            borderRadius: BorderRadius.circular(4),
                          ),
                          child: Text(
                            event.source,
                            style: const TextStyle(
                              fontSize: 9,
                              fontWeight: FontWeight.w800,
                              color: AppColors.ink600,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Text(
                      event.description,
                      style: const TextStyle(
                        fontSize: 12,
                        color: AppColors.ink800,
                        height: 1.35,
                      ),
                    ),
                    const SizedBox(height: 6),
                    Row(
                      children: [
                        const Icon(Icons.person_outline,
                            size: 13, color: AppColors.ink500),
                        const SizedBox(width: 4),
                        Text(
                          event.actor,
                          style: const TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.w600,
                            color: AppColors.ink500,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
          ],
        );
      },
    );
  }

  Widget _buildEventIcon(String source) {
    IconData icon;
    Color iconColor;
    Color bg;

    switch (source.toUpperCase()) {
      case 'VOICE':
        icon = Icons.mic;
        iconColor = AppColors.primary600;
        bg = AppColors.primary100;
        break;
      case 'REPORT':
        icon = Icons.description;
        iconColor = AppColors.info700;
        bg = AppColors.info100;
        break;
      case 'REVIEWER':
        icon = Icons.health_and_safety;
        iconColor = AppColors.success700;
        bg = AppColors.success100;
        break;
      case 'AI':
        icon = Icons.auto_awesome;
        iconColor = AppColors.warning700;
        bg = AppColors.warning100;
        break;
      default:
        icon = Icons.circle;
        iconColor = AppColors.ink500;
        bg = AppColors.surface100;
    }

    return Container(
      width: 28,
      height: 28,
      decoration: BoxDecoration(
        color: bg,
        shape: BoxShape.circle,
        border: Border.all(color: iconColor.withValues(alpha: 0.3)),
      ),
      child: Center(
        child: Icon(icon, size: 14, color: iconColor),
      ),
    );
  }
}
