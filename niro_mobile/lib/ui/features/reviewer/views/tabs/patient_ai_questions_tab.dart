import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:niro_mobile/domain/models/ai_question.dart';
import 'package:niro_mobile/domain/models/patient.dart';
import 'package:niro_mobile/ui/core/theme/app_colors.dart';
import 'package:niro_mobile/ui/features/auth/view_models/auth_view_model.dart';
import 'package:niro_mobile/ui/features/reviewer/view_models/reviewer_view_model.dart';

class PatientAiQuestionsTab extends StatelessWidget {
  final Patient patient;

  const PatientAiQuestionsTab({super.key, required this.patient});

  @override
  Widget build(BuildContext context) {
    if (patient.aiQuestions.isEmpty) {
      return const Center(
        child: Padding(
          padding: EdgeInsets.all(24.0),
          child: Text(
            'No automated follow-up questions generated for this presentation.',
            textAlign: TextAlign.center,
            style: TextStyle(color: AppColors.ink500, fontSize: 13),
          ),
        ),
      );
    }

    final answeredCount =
        patient.aiQuestions.where((q) => q.isAnswered).length;

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        // Header explanation
        Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: AppColors.primary100,
            borderRadius: BorderRadius.circular(8),
            border: Border.all(
                color: AppColors.primary600.withValues(alpha: 0.2)),
          ),
          child: Row(
            children: [
              const Icon(Icons.auto_awesome,
                  color: AppColors.primary600, size: 20),
              const SizedBox(width: 10),
              Expanded(
                child: Text(
                  'Interactive Triage Questions ($answeredCount/${patient.aiQuestions.length} answered)\nAnswers clarify clinical ambiguity and update risk assessment.',
                  style: const TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                    color: AppColors.primary700,
                    height: 1.35,
                  ),
                ),
              ),
            ],
          ),
        ),

        const SizedBox(height: 16),

        ...patient.aiQuestions.map((q) => _buildQuestionCard(context, q)),
      ],
    );
  }

  Widget _buildQuestionCard(BuildContext context, AiFollowUpQuestion q) {
    final isAnswered = q.isAnswered;

    return Container(
      margin: const EdgeInsets.only(bottom: 14),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.surface0,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: isAnswered ? AppColors.success700.withValues(alpha: 0.3) : AppColors.surface200,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Text(
                  q.question,
                  style: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w700,
                    color: AppColors.ink950,
                    height: 1.35,
                  ),
                ),
              ),
              if (isAnswered)
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                  decoration: BoxDecoration(
                    color: AppColors.success100,
                    borderRadius: BorderRadius.circular(4),
                  ),
                  child: const Text(
                    'Recorded',
                    style: TextStyle(
                      fontSize: 10,
                      fontWeight: FontWeight.w800,
                      color: AppColors.success700,
                    ),
                  ),
                ),
            ],
          ),
          const SizedBox(height: 6),
          Text(
            'Clinical Rationale: ${q.clinicalRationale}',
            style: const TextStyle(
              fontSize: 12,
              color: AppColors.ink600,
              height: 1.35,
            ),
          ),
          const SizedBox(height: 12),

          // Option selection buttons (touch targets >= 44px)
          Row(
            children: q.options.map((opt) {
              final isSelected = q.selectedAnswer == opt;
              return Expanded(
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 4),
                  child: SizedBox(
                    height: 44,
                    child: OutlinedButton(
                      onPressed: () {
                        final auth = context.read<AuthViewModel>();
                        final reviewer = context.read<ReviewerViewModel>();
                        reviewer.answerAiQuestion(
                          patient.id,
                          q.id,
                          opt,
                          actorName: auth.isStaff
                              ? auth.currentStaffUser.name
                              : 'Medical Officer',
                        );
                      },
                      style: OutlinedButton.styleFrom(
                        backgroundColor: isSelected
                            ? AppColors.primary600
                            : AppColors.surface50,
                        foregroundColor: isSelected
                            ? Colors.white
                            : AppColors.ink800,
                        side: BorderSide(
                          color: isSelected
                              ? AppColors.primary600
                              : AppColors.surface200,
                          width: isSelected ? 1.5 : 1.0,
                        ),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(8),
                        ),
                      ),
                      child: Text(
                        opt,
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight:
                              isSelected ? FontWeight.w700 : FontWeight.w500,
                        ),
                      ),
                    ),
                  ),
                ),
              );
            }).toList(),
          ),
        ],
      ),
    );
  }
}
