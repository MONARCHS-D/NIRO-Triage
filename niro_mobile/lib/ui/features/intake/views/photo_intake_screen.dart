import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:niro_mobile/ui/core/theme/app_colors.dart';
import 'package:niro_mobile/ui/features/intake/view_models/intake_view_model.dart';
import 'package:niro_mobile/ui/features/intake/views/confirmation_screen.dart';

class PhotoIntakeScreen extends StatefulWidget {
  const PhotoIntakeScreen({super.key});

  @override
  State<PhotoIntakeScreen> createState() => _PhotoIntakeScreenState();
}

class _PhotoIntakeScreenState extends State<PhotoIntakeScreen> {
  String _selectedBodyArea = 'Arm / Hand';
  bool _photoCaptured = false;

  final List<String> _bodyAreas = [
    'Arm / Hand',
    'Face / Neck',
    'Leg / Foot',
    'Torso / Back',
    'Throat / Mouth',
  ];

  @override
  Widget build(BuildContext context) {
    final viewModel = context.watch<IntakeViewModel>();

    return Scaffold(
      backgroundColor: AppColors.surface50,
      appBar: AppBar(
        title: const Text('Capture Symptom Photo'),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Photo Frame Simulation
              Container(
                height: 220,
                decoration: BoxDecoration(
                  color: AppColors.surface0,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(
                    color: _photoCaptured
                        ? AppColors.success600
                        : AppColors.surface200,
                  ),
                ),
                child: Center(
                  child: _photoCaptured
                      ? Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Container(
                              width: 54,
                              height: 54,
                              decoration: const BoxDecoration(
                                color: AppColors.success100,
                                shape: BoxShape.circle,
                              ),
                              child: const Icon(
                                Icons.check,
                                color: AppColors.success700,
                                size: 30,
                              ),
                            ),
                            const SizedBox(height: 10),
                            const Text(
                              'Visual Input Captured Successfully',
                              style: TextStyle(
                                fontSize: 13,
                                fontWeight: FontWeight.w700,
                                color: AppColors.ink950,
                              ),
                            ),
                            const SizedBox(height: 4),
                            const Text(
                              'Photo attached: sample_rash_lesion.jpg (High Clarity)',
                              style: TextStyle(
                                fontSize: 11,
                                color: AppColors.ink500,
                              ),
                            ),
                          ],
                        )
                      : Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Container(
                              width: 54,
                              height: 54,
                              decoration: const BoxDecoration(
                                color: Color(0xFFCCFBF1),
                                shape: BoxShape.circle,
                              ),
                              child: const Icon(
                                Icons.camera_alt,
                                color: Color(0xFF0F766E),
                                size: 28,
                              ),
                            ),
                            const SizedBox(height: 12),
                            const Text(
                              'Take Photo of Rash, Swelling or Injury',
                              style: TextStyle(
                                fontSize: 14,
                                fontWeight: FontWeight.w700,
                                color: AppColors.ink950,
                              ),
                            ),
                            const SizedBox(height: 4),
                            const Text(
                              'Position camera steadily under good lighting.',
                              style: TextStyle(
                                fontSize: 12,
                                color: AppColors.ink500,
                              ),
                            ),
                          ],
                        ),
                ),
              ),

              const SizedBox(height: 16),

              OutlinedButton.icon(
                onPressed: () {
                  setState(() {
                    _photoCaptured = !_photoCaptured;
                  });
                },
                icon: Icon(
                  _photoCaptured ? Icons.refresh : Icons.camera_alt_outlined,
                  size: 18,
                ),
                label: Text(
                  _photoCaptured ? 'Retake Photo' : 'Simulate Camera Capture',
                ),
              ),

              const SizedBox(height: 20),

              // Location on Body
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
                      'Where is the symptom located?',
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
                      children: _bodyAreas.map((area) {
                        final isSelected = _selectedBodyArea == area;
                        return ChoiceChip(
                          label: Text(
                            area,
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
                          onSelected: (val) {
                            if (val) {
                              setState(() {
                                _selectedBodyArea = area;
                              });
                            }
                          },
                        );
                      }).toList(),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 24),

              ElevatedButton(
                onPressed: !_photoCaptured || viewModel.isSubmitting
                    ? null
                    : () async {
                        final patient = await viewModel.submitIntake(
                          modality: 'PHOTO',
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
                    : const Text('Submit Photo for Review'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
