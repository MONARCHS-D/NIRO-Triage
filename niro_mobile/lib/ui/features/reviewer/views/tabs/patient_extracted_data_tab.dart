import 'package:flutter/material.dart';
import 'package:niro_mobile/domain/models/patient.dart';
import 'package:niro_mobile/ui/core/theme/app_colors.dart';

class PatientExtractedDataTab extends StatelessWidget {
  final Patient patient;

  const PatientExtractedDataTab({super.key, required this.patient});

  @override
  Widget build(BuildContext context) {
    final hasVitals = patient.vitals.isNotEmpty;
    final hasFacts = patient.facts.isNotEmpty;

    if (!hasVitals && !hasFacts) {
      return const Center(
        child: Padding(
          padding: EdgeInsets.all(24.0),
          child: Text(
            'No physical vitals or lab report facts recorded yet.\nCheck "Missing Information" tab.',
            textAlign: TextAlign.center,
            style: TextStyle(color: AppColors.ink500, fontSize: 13, height: 1.4),
          ),
        ),
      );
    }

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        // Vitals Section
        if (hasVitals) ...[
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'Clinical Vital Signs',
                style: TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.w700,
                  color: AppColors.ink950,
                ),
              ),
              Text(
                '${patient.vitals.length} recorded',
                style: const TextStyle(fontSize: 12, color: AppColors.ink500),
              ),
            ],
          ),
          const SizedBox(height: 10),
          ...patient.vitals.values.map((v) => _buildVitalCard(v)),
          const SizedBox(height: 16),
        ],

        // Lab Extracted Facts Section
        if (hasFacts) ...[
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'Extracted Lab Findings & OCR',
                style: TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.w700,
                  color: AppColors.ink950,
                ),
              ),
              Text(
                '${patient.facts.length} extracted',
                style: const TextStyle(fontSize: 12, color: AppColors.ink500),
              ),
            ],
          ),
          const SizedBox(height: 10),
          ...patient.facts.map((fact) => _buildFactCard(fact)),
        ],
      ],
    );
  }

  Widget _buildVitalCard(VitalSign v) {
    final isAbnormal = v.isAbnormal;

    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: AppColors.surface0,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(
          color: isAbnormal
              ? AppColors.danger700.withValues(alpha: 0.3)
              : AppColors.surface200,
        ),
      ),
      child: Row(
        children: [
          Container(
            width: 8,
            height: 36,
            decoration: BoxDecoration(
              color: isAbnormal ? AppColors.danger700 : AppColors.success700,
              borderRadius: BorderRadius.circular(4),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  v.label,
                  style: const TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                    color: AppColors.ink950,
                  ),
                ),
                if (v.referenceRange.isNotEmpty)
                  Text(
                    'Ref: ${v.referenceRange}',
                    style: const TextStyle(
                      fontSize: 11,
                      color: AppColors.ink500,
                    ),
                  ),
              ],
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Row(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.baseline,
                textBaseline: TextBaseline.alphabetic,
                children: [
                  Text(
                    v.value,
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w800,
                      color:
                          isAbnormal ? AppColors.danger700 : AppColors.ink950,
                      fontFeatures: const [FontFeature.tabularFigures()],
                    ),
                  ),
                  Text(
                    ' ${v.unit}',
                    style: const TextStyle(
                      fontSize: 12,
                      color: AppColors.ink600,
                    ),
                  ),
                ],
              ),
              if (isAbnormal)
                Container(
                  margin: const EdgeInsets.only(top: 2),
                  padding:
                      const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                  decoration: BoxDecoration(
                    color: AppColors.danger100,
                    borderRadius: BorderRadius.circular(4),
                  ),
                  child: const Text(
                    'Abnormal',
                    style: TextStyle(
                      fontSize: 9,
                      fontWeight: FontWeight.w800,
                      color: AppColors.danger700,
                    ),
                  ),
                ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildFactCard(ExtractedFact fact) {
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.surface0,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(
          color: fact.isFlagged
              ? AppColors.warning700.withValues(alpha: 0.3)
              : AppColors.surface200,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: Text(
                  fact.metric,
                  style: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w700,
                    color: AppColors.ink950,
                  ),
                ),
              ),
              Row(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.baseline,
                textBaseline: TextBaseline.alphabetic,
                children: [
                  Text(
                    fact.value,
                    style: TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.w800,
                      color: fact.isFlagged
                          ? AppColors.warning700
                          : AppColors.ink950,
                      fontFeatures: const [FontFeature.tabularFigures()],
                    ),
                  ),
                  Text(
                    ' ${fact.unit}',
                    style: const TextStyle(
                      fontSize: 12,
                      color: AppColors.ink600,
                    ),
                  ),
                ],
              ),
            ],
          ),
          const SizedBox(height: 6),
          if (fact.referenceRange.isNotEmpty)
            Padding(
              padding: const EdgeInsets.only(bottom: 6),
              child: Text(
                'Normal Range: ${fact.referenceRange}',
                style: const TextStyle(
                  fontSize: 11,
                  color: AppColors.ink500,
                ),
              ),
            ),
          Row(
            children: [
              const Icon(Icons.verified_outlined,
                  size: 13, color: AppColors.primary600),
              const SizedBox(width: 4),
              Expanded(
                child: Text(
                  fact.sourceProvenance,
                  style: const TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w600,
                    color: AppColors.ink600,
                  ),
                  overflow: TextOverflow.ellipsis,
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                decoration: BoxDecoration(
                  color: AppColors.surface100,
                  borderRadius: BorderRadius.circular(4),
                ),
                child: Text(
                  'Conf: ${fact.confidence}',
                  style: const TextStyle(
                    fontSize: 10,
                    fontWeight: FontWeight.w600,
                    color: AppColors.ink600,
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
