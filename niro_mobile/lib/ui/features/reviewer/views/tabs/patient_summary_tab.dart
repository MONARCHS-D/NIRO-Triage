import 'package:flutter/material.dart';
import 'package:niro_mobile/domain/models/patient.dart';
import 'package:niro_mobile/domain/models/priority.dart';
import 'package:niro_mobile/ui/core/theme/app_colors.dart';

class PatientSummaryTab extends StatelessWidget {
  final Patient patient;

  const PatientSummaryTab({super.key, required this.patient});

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        // Non-Diagnostic Advisory Banner (Specification Section 0 & 1)
        Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: AppColors.info100,
            borderRadius: BorderRadius.circular(10),
            border: Border.all(color: AppColors.info700.withValues(alpha: 0.3)),
          ),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Icon(Icons.info_outline, color: AppColors.info700, size: 20),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'AI Triage-Support Note (Advisory Only)',
                      style: TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w700,
                        color: AppColors.info700,
                      ),
                    ),
                    const SizedBox(height: 3),
                    Text(
                      'Non-diagnostic synthesis of patient inputs. Clinical evaluation and human judgment are required before treatment or discharge.',
                      style: TextStyle(
                        fontSize: 12,
                        color: AppColors.ink800.withValues(alpha: 0.9),
                        height: 1.35,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),

        const SizedBox(height: 16),

        // Urgency Signal Card (if urgent or needs info)
        if (patient.urgencyRationale.isNotEmpty) ...[
          Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: patient.priority == Priority.red
                  ? AppColors.danger100
                  : patient.priority == Priority.yellow
                      ? AppColors.warning100
                      : AppColors.surface0,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(
                color: patient.priority == Priority.red
                    ? AppColors.danger700.withValues(alpha: 0.4)
                    : patient.priority == Priority.yellow
                        ? AppColors.warning700.withValues(alpha: 0.4)
                        : AppColors.surface200,
              ),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Icon(
                      patient.priority == Priority.red
                          ? Icons.warning_amber_rounded
                          : Icons.flag_outlined,
                      color: patient.priority == Priority.red
                          ? AppColors.danger700
                          : AppColors.warning700,
                      size: 20,
                    ),
                    const SizedBox(width: 8),
                    Text(
                      patient.priority == Priority.red
                          ? 'POTENTIAL URGENCY FLAGGED'
                          : 'TRIAGE ATTENTION SIGNAL',
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w800,
                        letterSpacing: 0.5,
                        color: patient.priority == Priority.red
                            ? AppColors.danger700
                            : AppColors.warning700,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 6),
                Text(
                  patient.urgencyRationale,
                  style: const TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                    color: AppColors.ink950,
                    height: 1.35,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
        ],

        // Structured Clinical Summary Card
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
                'Clinical Synthesis',
                style: TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.w700,
                  color: AppColors.ink950,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                patient.clinicalSummary.isNotEmpty
                    ? patient.clinicalSummary
                    : patient.chiefComplaint,
                style: const TextStyle(
                  fontSize: 14,
                  color: AppColors.ink800,
                  height: 1.45,
                ),
              ),
              if (patient.routingRecommendation.isNotEmpty) ...[
                const Divider(height: 24, color: AppColors.surface200),
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Icon(
                      Icons.room_outlined,
                      color: AppColors.primary600,
                      size: 18,
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'Routing Recommendation',
                            style: TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.w600,
                              color: AppColors.ink600,
                            ),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            patient.routingRecommendation,
                            style: const TextStyle(
                              fontSize: 13,
                              fontWeight: FontWeight.w700,
                              color: AppColors.primary700,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ],
            ],
          ),
        ),

        const SizedBox(height: 16),

        // Chief Complaint & Recorded Symptoms
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
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    'Recorded Symptoms',
                    style: TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.w700,
                      color: AppColors.ink950,
                    ),
                  ),
                  Text(
                    '${patient.symptoms.length} identified',
                    style: const TextStyle(
                      fontSize: 12,
                      color: AppColors.ink500,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              if (patient.symptoms.isEmpty)
                const Text(
                  'No symptoms formally tagged.',
                  style: TextStyle(color: AppColors.ink500, fontSize: 13),
                )
              else
                ...patient.symptoms.map((sym) => _buildSymptomRow(sym)),
            ],
          ),
        ),

        const SizedBox(height: 16),

        // Relevant Medical History
        if (patient.relevantHistory.isNotEmpty)
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
                  'Reported Medical History',
                  style: TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.w700,
                    color: AppColors.ink950,
                  ),
                ),
                const SizedBox(height: 10),
                ...patient.relevantHistory.map(
                  (h) => Padding(
                    padding: const EdgeInsets.only(bottom: 6),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text('• ',
                            style: TextStyle(
                                color: AppColors.primary600,
                                fontWeight: FontWeight.bold)),
                        Expanded(
                          child: Text(
                            h,
                            style: const TextStyle(
                              fontSize: 13,
                              color: AppColors.ink800,
                              height: 1.35,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
      ],
    );
  }

  Widget _buildSymptomRow(Symptom sym) {
    Color severityColor;
    Color severityBg;
    switch (sym.severity.toUpperCase()) {
      case 'SEVERE':
        severityColor = AppColors.danger700;
        severityBg = AppColors.danger100;
        break;
      case 'MODERATE':
        severityColor = AppColors.warning700;
        severityBg = AppColors.warning100;
        break;
      default:
        severityColor = AppColors.success700;
        severityBg = AppColors.success100;
    }

    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: AppColors.surface50,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: AppColors.surface200),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  sym.name,
                  style: const TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                    color: AppColors.ink950,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  'Duration: ${sym.duration} · Source: ${sym.source}',
                  style: const TextStyle(
                    fontSize: 11,
                    color: AppColors.ink500,
                  ),
                ),
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
            decoration: BoxDecoration(
              color: severityBg,
              borderRadius: BorderRadius.circular(6),
            ),
            child: Text(
              sym.severity,
              style: TextStyle(
                fontSize: 10,
                fontWeight: FontWeight.w800,
                color: severityColor,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
