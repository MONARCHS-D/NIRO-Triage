import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:niro_mobile/ui/core/theme/app_colors.dart';
import 'package:niro_mobile/ui/features/intake/view_models/intake_view_model.dart';
import 'package:niro_mobile/ui/features/intake/views/confirmation_screen.dart';

class TypeIntakeScreen extends StatefulWidget {
  const TypeIntakeScreen({super.key});

  @override
  State<TypeIntakeScreen> createState() => _TypeIntakeScreenState();
}

class _TypeIntakeScreenState extends State<TypeIntakeScreen> {
  final TextEditingController _complaintController = TextEditingController();
  final TextEditingController _nameController =
      TextEditingController(text: 'Ananya Jena');
  final TextEditingController _ageController =
      TextEditingController(text: '29');

  final List<String> _durations = [
    'Today',
    '1-2 days',
    '3-5 days',
    'More than a week',
  ];

  @override
  void dispose() {
    _complaintController.dispose();
    _nameController.dispose();
    _ageController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final viewModel = context.watch<IntakeViewModel>();

    return Scaffold(
      backgroundColor: AppColors.surface50,
      appBar: AppBar(
        title: const Text('Type Your Symptoms'),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Patient Demographics Card
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
                      'Patient Details',
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w700,
                        color: AppColors.ink950,
                      ),
                    ),
                    const SizedBox(height: 12),
                    TextField(
                      controller: _nameController,
                      decoration: const InputDecoration(
                        labelText: 'Full Name',
                        hintText: 'Enter patient name',
                      ),
                    ),
                    const SizedBox(height: 12),
                    TextField(
                      controller: _ageController,
                      keyboardType: TextInputType.number,
                      decoration: const InputDecoration(
                        labelText: 'Age (Years)',
                        hintText: 'e.g. 29',
                      ),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 16),

              // Symptom Description Card
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
                      'What symptoms are you experiencing?',
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w700,
                        color: AppColors.ink950,
                      ),
                    ),
                    const SizedBox(height: 4),
                    const Text(
                      'Describe your main health issue in your own words.',
                      style: TextStyle(
                        fontSize: 12,
                        color: AppColors.ink500,
                      ),
                    ),
                    const SizedBox(height: 12),
                    TextField(
                      controller: _complaintController,
                      maxLines: 4,
                      onChanged: (text) => viewModel.setTypedComplaint(text),
                      decoration: const InputDecoration(
                        hintText:
                            'e.g. High fever for two days with severe body ache and loss of appetite...',
                      ),
                    ),
                    const SizedBox(height: 16),
                    const Text(
                      'How long have you had this problem?',
                      style: TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                        color: AppColors.ink800,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: _durations.map((d) {
                        final isSelected = viewModel.typedDuration == d;
                        return ChoiceChip(
                          label: Text(
                            d,
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
                            if (val) viewModel.setTypedDuration(d);
                          },
                        );
                      }).toList(),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 24),

              // Submit Button
              ElevatedButton(
                onPressed: _complaintController.text.trim().isEmpty ||
                        viewModel.isSubmitting
                    ? null
                    : () async {
                        final patient = await viewModel.submitIntake(
                          modality: 'MANUAL',
                          patientName: _nameController.text.trim().isNotEmpty
                              ? _nameController.text.trim()
                              : 'Ananya Jena',
                          patientAge: int.tryParse(_ageController.text) ?? 29,
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
                    : const Text('Submit Symptoms for Review'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
