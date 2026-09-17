import 'package:flutter/material.dart';
import 'package:niro_mobile/domain/models/patient.dart';
import 'package:niro_mobile/ui/core/theme/app_colors.dart';
import 'package:niro_mobile/ui/core/widgets/priority_badge.dart';
import 'package:niro_mobile/ui/core/widgets/status_badge.dart';

class ConfirmationScreen extends StatelessWidget {
  final Patient patient;
  final VoidCallback onDone;

  const ConfirmationScreen({
    super.key,
    required this.patient,
    required this.onDone,
  });

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.surface50,
      appBar: AppBar(
        title: const Text('Intake Confirmation'),
        automaticallyImplyLeading: false,
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: Column(
            children: [
              const SizedBox(height: 12),
              // Success checkmark icon
              Container(
                width: 64,
                height: 64,
                decoration: const BoxDecoration(
                  color: AppColors.success100,
                  shape: BoxShape.circle,
                ),
                child: const Icon(
                  Icons.check_circle_outline,
                  color: AppColors.success700,
                  size: 38,
                ),
              ),
              const SizedBox(height: 16),
              const Text(
                'Your information has been recorded.',
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.w700,
                  color: AppColors.ink950,
                ),
              ),
              const SizedBox(height: 6),
              const Text(
                'A healthcare professional will review it upon your turn at the Community Health Center.',
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 13,
                  color: AppColors.ink600,
                  height: 1.4,
                ),
              ),
              const SizedBox(height: 20),

              // Strict Non-Diagnostic Box (Section 15)
              Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: AppColors.surface0,
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: const Color(0xFFBCE3CD), width: 1),
                ),
                child: Column(
                  children: [
                    Row(
                      children: const [
                        Icon(Icons.check, size: 18, color: AppColors.success700),
                        SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            'No diagnosis has been made.',
                            style: TextStyle(
                              fontSize: 13,
                              fontWeight: FontWeight.w600,
                              color: AppColors.success700,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Row(
                      children: const [
                        Icon(Icons.check, size: 18, color: AppColors.ink800),
                        SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            'This is an assistive triage-support tool.',
                            style: TextStyle(
                              fontSize: 13,
                              fontWeight: FontWeight.w600,
                              color: AppColors.ink800,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 16),

              // Summary Details Card
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: AppColors.surface0,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: AppColors.surface200, width: 1),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          'ID: ${patient.id}',
                          style: const TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.w700,
                            color: AppColors.primary700,
                          ),
                        ),
                        PriorityBadge(priority: patient.priority, compact: true),
                      ],
                    ),
                    const SizedBox(height: 10),
                    Text(
                      patient.chiefComplaint,
                      style: const TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                        color: AppColors.ink950,
                      ),
                    ),
                    const SizedBox(height: 10),
                    const Divider(height: 1, color: AppColors.surface200),
                    const SizedBox(height: 10),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text(
                          'Language:',
                          style: TextStyle(fontSize: 12, color: AppColors.ink500),
                        ),
                        Text(
                          patient.primaryLanguage,
                          style: const TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                            color: AppColors.ink800,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 6),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text(
                          'Status:',
                          style: TextStyle(fontSize: 12, color: AppColors.ink500),
                        ),
                        StatusBadge(status: patient.status),
                      ],
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 28),

              // Done Button
              ElevatedButton(
                onPressed: onDone,
                style: ElevatedButton.styleFrom(
                  minimumSize: const Size(double.infinity, 48), // 44px+ touch target
                ),
                child: const Text('Done / Return to Home'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
