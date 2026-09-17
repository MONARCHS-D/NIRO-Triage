import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:niro_mobile/ui/core/theme/app_colors.dart';
import 'package:niro_mobile/ui/features/intake/view_models/intake_view_model.dart';
import 'package:niro_mobile/ui/features/intake/views/confirmation_screen.dart';

class ReportIntakeScreen extends StatelessWidget {
  const ReportIntakeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final viewModel = context.watch<IntakeViewModel>();

    return Scaffold(
      backgroundColor: AppColors.surface50,
      appBar: AppBar(
        title: const Text('Upload Medical Report'),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Document Upload Zone
              Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: AppColors.surface0,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(
                    color: viewModel.reportFacts.isNotEmpty
                        ? AppColors.primary600
                        : AppColors.surface200,
                  ),
                ),
                child: Column(
                  children: [
                    Container(
                      width: 54,
                      height: 54,
                      decoration: const BoxDecoration(
                        color: Color(0xFFF3E8FF),
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(
                        Icons.upload_file,
                        color: Color(0xFF7E22CE),
                        size: 28,
                      ),
                    ),
                    const SizedBox(height: 12),
                    const Text(
                      'Attach Blood Test / Lab Slip / Prescription',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w700,
                        color: AppColors.ink950,
                      ),
                    ),
                    const SizedBox(height: 4),
                    const Text(
                      'Supports CBC, biochemistry reports, ECG slips or doctor prescription photos.',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        fontSize: 12,
                        color: AppColors.ink500,
                        height: 1.4,
                      ),
                    ),
                    const SizedBox(height: 16),
                    OutlinedButton.icon(
                      onPressed: viewModel.isExtractingReport
                          ? null
                          : () => viewModel.processSampleReport(),
                      icon: const Icon(Icons.document_scanner, size: 18),
                      label: Text(
                        viewModel.reportFacts.isNotEmpty
                            ? 'Re-scan Sample CBC Report'
                            : 'Select Sample CBC Report Photo',
                      ),
                    ),
                  ],
                ),
              ),

              if (viewModel.isExtractingReport) ...[
                const SizedBox(height: 24),
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: AppColors.surface0,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: AppColors.surface200),
                  ),
                  child: Column(
                    children: const [
                      SizedBox(
                        width: 24,
                        height: 24,
                        child: CircularProgressIndicator(
                          strokeWidth: 2.5,
                          color: AppColors.primary600,
                        ),
                      ),
                      SizedBox(height: 12),
                      Text(
                        'AI OCR Extracting Lab Values & Provenance...',
                        style: TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w600,
                          color: AppColors.ink800,
                        ),
                      ),
                      SizedBox(height: 4),
                      Text(
                        'Mapping table cells and source reference ranges.',
                        style: TextStyle(fontSize: 11, color: AppColors.ink500),
                      ),
                    ],
                  ),
                ),
              ],

              // Extracted Facts Table
              if (viewModel.reportFacts.isNotEmpty) ...[
                const SizedBox(height: 20),
                const Text(
                  'Extracted Information (AI OCR)',
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w700,
                    color: AppColors.ink950,
                  ),
                ),
                const SizedBox(height: 8),
                Container(
                  decoration: BoxDecoration(
                    color: AppColors.surface0,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: AppColors.surface200),
                  ),
                  child: ListView.separated(
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    itemCount: viewModel.reportFacts.length,
                    separatorBuilder: (_, _) =>
                        const Divider(height: 1, color: AppColors.surface200),
                    itemBuilder: (context, index) {
                      final fact = viewModel.reportFacts[index];
                      return Padding(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 14,
                          vertical: 12,
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Text(
                                  fact.metric,
                                  style: const TextStyle(
                                    fontSize: 13,
                                    fontWeight: FontWeight.w600,
                                    color: AppColors.ink950,
                                  ),
                                ),
                                Text(
                                  '${fact.value} ${fact.unit}',
                                  style: const TextStyle(
                                    fontSize: 13,
                                    fontWeight: FontWeight.w700,
                                    color: AppColors.primary700,
                                    fontFeatures: [FontFeature.tabularFigures()],
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 4),
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Text(
                                  fact.sourceProvenance,
                                  style: const TextStyle(
                                    fontSize: 11,
                                    color: AppColors.ink500,
                                  ),
                                ),
                                Container(
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: 6,
                                    vertical: 2,
                                  ),
                                  decoration: BoxDecoration(
                                    color: AppColors.surface100,
                                    borderRadius: BorderRadius.circular(4),
                                  ),
                                  child: Text(
                                    fact.confidence,
                                    style: const TextStyle(
                                      fontSize: 10,
                                      fontWeight: FontWeight.w500,
                                      color: AppColors.ink600,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                      );
                    },
                  ),
                ),

                const SizedBox(height: 24),

                ElevatedButton(
                  onPressed: viewModel.isSubmitting
                      ? null
                      : () async {
                          final patient = await viewModel.submitIntake(
                            modality: 'REPORT',
                          );
                          if (context.mounted) {
                            Navigator.pushReplacement(
                              context,
                              MaterialPageRoute(
                                builder: (_) => ConfirmationScreen(
                                  patient: patient,
                                  onDone: () => Navigator.pop(context),
                                ),
                              ),
                            );
                          }
                        },
                  child: viewModel.isSubmitting
                      ? const SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            color: Colors.white,
                          ),
                        )
                      : const Text('Confirm & Submit Lab Report for Review'),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}
