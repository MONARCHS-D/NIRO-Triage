import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:niro_mobile/domain/models/language.dart';
import 'package:niro_mobile/ui/core/theme/app_colors.dart';
import 'package:niro_mobile/ui/features/intake/view_models/intake_view_model.dart';
import 'package:niro_mobile/ui/features/intake/views/confirmation_screen.dart';

class VoiceIntakeScreen extends StatelessWidget {
  const VoiceIntakeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final viewModel = context.watch<IntakeViewModel>();

    return Scaffold(
      backgroundColor: AppColors.surface50,
      appBar: AppBar(
        title: const Text('Voice Symptom Intake'),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Indic Language Selector Card
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
                      'Preferred Language / ଭାଷା ବାଛନ୍ତୁ:',
                      style: TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                        color: AppColors.ink800,
                      ),
                    ),
                    const SizedBox(height: 10),
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: LanguageOption.supportedLanguages.map((lang) {
                        final isSelected =
                            viewModel.selectedLanguage.code == lang.code;
                        return ChoiceChip(
                          label: Text(
                            '${lang.name} (${lang.nativeName})',
                            style: TextStyle(
                              fontSize: 12,
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
                        );
                      }).toList(),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 16),

              // Waveform & Recording Studio Card
              Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: AppColors.surface0,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: AppColors.surface200),
                ),
                child: Column(
                  children: [
                    // Timer & State Label
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          viewModel.voiceState == VoiceState.listening
                              ? 'Listening...'
                              : viewModel.voiceState == VoiceState.processing
                                  ? 'Processing audio...'
                                  : viewModel.voiceState == VoiceState.transcribing
                                      ? 'Transcribing regional speech...'
                                      : viewModel.voiceState == VoiceState.success
                                          ? 'Recording Completed'
                                          : 'Tap to Record',
                          style: TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.w600,
                            color: viewModel.voiceState == VoiceState.listening
                                ? AppColors.danger700
                                : AppColors.ink800,
                          ),
                        ),
                        Text(
                          '00:${viewModel.recordingSeconds.toString().padLeft(2, '0')}',
                          style: const TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.w700,
                            fontFeatures: [FontFeature.tabularFigures()],
                            color: AppColors.primary700,
                          ),
                        ),
                      ],
                    ),

                    const SizedBox(height: 24),

                    // Waveform visualizer bars (24 animated bars)
                    SizedBox(
                      height: 50,
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                        crossAxisAlignment: CrossAxisAlignment.center,
                        children: viewModel.waveforms.map((h) {
                          return AnimatedContainer(
                            duration: const Duration(milliseconds: 150),
                            width: 6,
                            height: (50 * h).clamp(6.0, 50.0),
                            decoration: BoxDecoration(
                              color: viewModel.voiceState == VoiceState.listening
                                  ? AppColors.primary600
                                  : viewModel.voiceState == VoiceState.success
                                      ? AppColors.success600
                                      : AppColors.surface200,
                              borderRadius: BorderRadius.circular(3),
                            ),
                          );
                        }).toList(),
                      ),
                    ),

                    const SizedBox(height: 24),

                    // Mic Button (Large 64x64 touch target)
                    Center(
                      child: GestureDetector(
                        onTap: () {
                          if (viewModel.voiceState == VoiceState.listening) {
                            viewModel.stopVoiceRecording();
                          } else {
                            viewModel.startVoiceRecording();
                          }
                        },
                        child: AnimatedContainer(
                          duration: const Duration(milliseconds: 200),
                          width: 64,
                          height: 64,
                          decoration: BoxDecoration(
                            color: viewModel.voiceState == VoiceState.listening
                                ? AppColors.danger700
                                : AppColors.primary600,
                            shape: BoxShape.circle,
                            boxShadow: [
                              BoxShadow(
                                color: (viewModel.voiceState == VoiceState.listening
                                        ? AppColors.danger700
                                        : AppColors.primary600)
                                    .withValues(alpha: 0.3),
                                blurRadius: 12,
                                offset: const Offset(0, 4),
                              ),
                            ],
                          ),
                          child: Icon(
                            viewModel.voiceState == VoiceState.listening
                                ? Icons.stop
                                : Icons.mic,
                            color: Colors.white,
                            size: 32,
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(height: 10),
                    Text(
                      viewModel.voiceState == VoiceState.listening
                          ? 'Tap stop when finished speaking'
                          : 'Speak naturally in ${viewModel.selectedLanguage.name}',
                      style: const TextStyle(
                        fontSize: 12,
                        color: AppColors.ink500,
                      ),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 16),

              // Live Transcription & English Translation Panel
              if (viewModel.currentTranscript.isNotEmpty) ...[
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
                          Text(
                            'Live Transcription (${viewModel.selectedLanguage.nativeName})',
                            style: const TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.w700,
                              color: AppColors.ink800,
                            ),
                          ),
                          const Icon(
                            Icons.graphic_eq,
                            size: 16,
                            color: AppColors.primary600,
                          ),
                        ],
                      ),
                      const SizedBox(height: 8),
                      Text(
                        viewModel.currentTranscript,
                        style: const TextStyle(
                          fontSize: 14,
                          color: AppColors.ink950,
                          height: 1.4,
                        ),
                      ),
                      const SizedBox(height: 14),
                      const Divider(height: 1, color: AppColors.surface200),
                      const SizedBox(height: 12),
                      const Text(
                        'English Translation (AI Triage Support)',
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w700,
                          color: AppColors.primary700,
                        ),
                      ),
                      const SizedBox(height: 6),
                      Text(
                        viewModel.currentTranslation,
                        style: const TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w500,
                          color: AppColors.ink800,
                          height: 1.4,
                        ),
                      ),
                      if (viewModel.extractedSymptoms.isNotEmpty) ...[
                        const SizedBox(height: 14),
                        const Text(
                          'Detected Clinical Signals:',
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                            color: AppColors.ink600,
                          ),
                        ),
                        const SizedBox(height: 6),
                        Wrap(
                          spacing: 6,
                          runSpacing: 6,
                          children: viewModel.extractedSymptoms.map((sym) {
                            return Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 8,
                                vertical: 4,
                              ),
                              decoration: BoxDecoration(
                                color: AppColors.primary100,
                                borderRadius: BorderRadius.circular(6),
                                border: Border.all(
                                  color: const Color(0xFFC7DCFF),
                                ),
                              ),
                              child: Text(
                                sym,
                                style: const TextStyle(
                                  fontSize: 11,
                                  fontWeight: FontWeight.w600,
                                  color: AppColors.primary700,
                                ),
                              ),
                            );
                          }).toList(),
                        ),
                      ],
                    ],
                  ),
                ),
                const SizedBox(height: 20),

                // Submit Voice Intake Button
                ElevatedButton(
                  onPressed: viewModel.isSubmitting
                      ? null
                      : () async {
                          final patient = await viewModel.submitIntake(
                            modality: 'VOICE',
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
                      : const Text('Submit Voice Intake for Review'),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}
