import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:niro_mobile/domain/models/language.dart';
import 'package:niro_mobile/ui/core/theme/app_colors.dart';
import 'package:niro_mobile/ui/core/widgets/disclaimer_banner.dart';
import 'package:niro_mobile/ui/core/widgets/modality_card.dart';
import 'package:niro_mobile/ui/features/intake/view_models/intake_view_model.dart';
import 'package:niro_mobile/ui/features/intake/views/voice_intake_screen.dart';
import 'package:niro_mobile/ui/features/intake/views/type_intake_screen.dart';
import 'package:niro_mobile/ui/features/intake/views/report_intake_screen.dart';
import 'package:niro_mobile/ui/features/intake/views/photo_intake_screen.dart';

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final viewModel = context.watch<IntakeViewModel>();

    return Scaffold(
      backgroundColor: AppColors.surface50,
      appBar: AppBar(
        title: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 3),
              decoration: BoxDecoration(
                color: AppColors.primary600,
                borderRadius: BorderRadius.circular(6),
              ),
              child: const Text(
                'NIRO',
                style: TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.w800,
                  fontSize: 11,
                  letterSpacing: 0.5,
                ),
              ),
            ),
            const SizedBox(width: 8),
            const Flexible(
              child: Text(
                'NIRO Triage',
                overflow: TextOverflow.ellipsis,
              ),
            ),
          ],
        ),
        actions: [
          Container(
            margin: const EdgeInsets.only(right: 14),
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
            decoration: BoxDecoration(
              color: AppColors.success100,
              borderRadius: BorderRadius.circular(6),
              border: Border.all(color: const Color(0xFFBCE3CD)),
            ),
            child: const Text(
              'Citizen Portal',
              style: TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.w600,
                color: AppColors.success700,
              ),
            ),
          ),
        ],
      ),
      body: SafeArea(
        child: Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 600), // Responsive constraint
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  // Non-diagnostic boundary disclaimer
                  const DisclaimerBanner(),

                  const SizedBox(height: 16),

                  // Warm Greeting Banner
                  Container(
                    padding: const EdgeInsets.all(18),
                    decoration: BoxDecoration(
                      color: AppColors.surface0,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: AppColors.surface200),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: const [
                        Text(
                          'How are you feeling today?',
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.w700,
                            color: AppColors.ink950,
                            letterSpacing: -0.3,
                          ),
                        ),
                        SizedBox(height: 4),
                        Text(
                          'ଆଜି ଆପଣଙ୍କୁ କିପରି ଲାଗୁଛି? / आज आप कैसा महसूस कर रहे हैं?',
                          style: TextStyle(
                            fontSize: 12,
                            color: AppColors.ink600,
                          ),
                        ),
                        SizedBox(height: 8),
                        Text(
                          'Provide your health symptoms below. We organize them for medical review by a doctor at your local Community Health Center.',
                          style: TextStyle(
                            fontSize: 12,
                            color: AppColors.ink500,
                            height: 1.45,
                          ),
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 16),

                  // Language Quick Selector
                  Container(
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: AppColors.surface0,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: AppColors.surface200),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Choose Intake Language / ଭାଷା:',
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                            color: AppColors.ink800,
                          ),
                        ),
                        const SizedBox(height: 8),
                        SingleChildScrollView(
                          scrollDirection: Axis.horizontal,
                          child: Row(
                            children: LanguageOption.supportedLanguages.map((lang) {
                              final isSelected =
                                  viewModel.selectedLanguage.code == lang.code;
                              return Padding(
                                padding: const EdgeInsets.only(right: 8),
                                child: ChoiceChip(
                                  label: Text(
                                    '${lang.name} (${lang.nativeName})',
                                    style: TextStyle(
                                      fontSize: 11,
                                      fontWeight: isSelected
                                          ? FontWeight.w700
                                          : FontWeight.w500,
                                      color: isSelected
                                          ? AppColors.primary700
                                          : AppColors.ink800,
                                    ),
                                  ),
                                  selected: isSelected,
                                  selectedColor: AppColors.primary100,
                                  backgroundColor: AppColors.surface0,
                                  shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(8),
                                    side: BorderSide(
                                      color: isSelected
                                          ? AppColors.primary600
                                          : AppColors.surface200,
                                    ),
                                  ),
                                  onSelected: (selected) {
                                    if (selected) {
                                      viewModel.selectLanguage(lang);
                                    }
                                  },
                                ),
                              );
                            }).toList(),
                          ),
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 16),

                  const Text(
                    'How would you like to provide information?',
                    style: TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w700,
                      color: AppColors.ink950,
                    ),
                  ),

                  const SizedBox(height: 10),

                  // 4 Primary Multimodal Input Cards (Section 15, Touch target 44px+ min)
                  ModalityCard(
                    icon: Icons.mic,
                    iconBgColor: AppColors.primary100,
                    iconColor: AppColors.primary600,
                    title: 'Speak in your language',
                    subtitle:
                        'Record symptoms in ${viewModel.selectedLanguage.name} with real-time translation',
                    onTap: () {
                      viewModel.resetVoice();
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (_) => const VoiceIntakeScreen(),
                        ),
                      );
                    },
                  ),

                  const SizedBox(height: 10),

                  ModalityCard(
                    icon: Icons.edit_note,
                    iconBgColor: AppColors.surface100,
                    iconColor: AppColors.ink800,
                    title: 'Type symptoms',
                    subtitle: 'Enter health complaint and duration manually',
                    onTap: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (_) => const TypeIntakeScreen(),
                        ),
                      );
                    },
                  ),

                  const SizedBox(height: 10),

                  ModalityCard(
                    icon: Icons.upload_file,
                    iconBgColor: const Color(0xFFF3E8FF),
                    iconColor: const Color(0xFF7E22CE),
                    title: 'Upload report',
                    subtitle:
                        'Attach blood test (CBC), lab slip, or prescription photo',
                    onTap: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (_) => const ReportIntakeScreen(),
                        ),
                      );
                    },
                  ),

                  const SizedBox(height: 10),

                  ModalityCard(
                    icon: Icons.camera_alt,
                    iconBgColor: const Color(0xFFCCFBF1),
                    iconColor: const Color(0xFF0F766E),
                    title: 'Take photo',
                    subtitle: 'Capture visible rash, swelling, or localized symptom',
                    onTap: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (_) => const PhotoIntakeScreen(),
                        ),
                      );
                    },
                  ),

                  const SizedBox(height: 20),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
