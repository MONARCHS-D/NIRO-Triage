import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:niro_mobile/domain/models/patient.dart';
import 'package:niro_mobile/domain/models/priority.dart';
import 'package:niro_mobile/ui/core/theme/app_colors.dart';
import 'package:niro_mobile/ui/core/widgets/priority_badge.dart';
import 'package:niro_mobile/ui/core/widgets/status_badge.dart';
import 'package:niro_mobile/ui/features/reviewer/view_models/reviewer_view_model.dart';
import 'patient_workspace_screen.dart';

class TriageQueueScreen extends StatelessWidget {
  const TriageQueueScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Consumer<ReviewerViewModel>(
      builder: (context, viewModel, _) {
        final filteredCases = viewModel.filteredQueue;

        return Scaffold(
          backgroundColor: AppColors.surface50,
          appBar: AppBar(
            backgroundColor: AppColors.surface0,
            elevation: 0,
            title: const Text(
              'Triage Queue',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w800,
                color: AppColors.ink950,
              ),
            ),
            actions: [
              IconButton(
                icon: const Icon(Icons.refresh, color: AppColors.ink800),
                onPressed: () => viewModel.loadPatients(),
                tooltip: 'Refresh Queue',
              ),
            ],
          ),
          body: Column(
            children: [
              // Search input
              Container(
                color: AppColors.surface0,
                padding:
                    const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                child: TextField(
                  onChanged: viewModel.setSearchQuery,
                  decoration: InputDecoration(
                    hintText: 'Search by patient name, ID, or symptom...',
                    hintStyle: const TextStyle(
                      fontSize: 13,
                      color: AppColors.ink500,
                    ),
                    prefixIcon:
                        const Icon(Icons.search, color: AppColors.ink500, size: 20),
                    filled: true,
                    fillColor: AppColors.surface50,
                    contentPadding: const EdgeInsets.symmetric(
                        vertical: 0, horizontal: 12),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(8),
                      borderSide: const BorderSide(color: AppColors.surface200),
                    ),
                    enabledBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(8),
                      borderSide: const BorderSide(color: AppColors.surface200),
                    ),
                  ),
                ),
              ),

              // Priority Filter Tabs
              Container(
                color: AppColors.surface0,
                padding: const EdgeInsets.only(left: 16, right: 16, bottom: 10),
                child: SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  child: Row(
                    children: [
                      _buildFilterChip(
                        context,
                        label: 'All (${viewModel.patients.length})',
                        isSelected: viewModel.selectedPriorityFilter == null,
                        onTap: () => viewModel.setPriorityFilter(null),
                      ),
                      const SizedBox(width: 6),
                      _buildFilterChip(
                        context,
                        label: 'Urgent',
                        color: AppColors.danger700,
                        bgColor: AppColors.danger100,
                        isSelected:
                            viewModel.selectedPriorityFilter == Priority.red,
                        onTap: () => viewModel.setPriorityFilter(Priority.red),
                      ),
                      const SizedBox(width: 6),
                      _buildFilterChip(
                        context,
                        label: 'Prompt',
                        color: AppColors.warning700,
                        bgColor: AppColors.warning100,
                        isSelected:
                            viewModel.selectedPriorityFilter == Priority.yellow,
                        onTap: () =>
                            viewModel.setPriorityFilter(Priority.yellow),
                      ),
                      const SizedBox(width: 6),
                      _buildFilterChip(
                        context,
                        label: 'Routine',
                        color: AppColors.success700,
                        bgColor: AppColors.success100,
                        isSelected:
                            viewModel.selectedPriorityFilter == Priority.green,
                        onTap: () => viewModel.setPriorityFilter(Priority.green),
                      ),
                      const SizedBox(width: 6),
                      _buildFilterChip(
                        context,
                        label: 'Incomplete',
                        color: AppColors.ink600,
                        bgColor: AppColors.surface200,
                        isSelected:
                            viewModel.selectedPriorityFilter == Priority.grey,
                        onTap: () => viewModel.setPriorityFilter(Priority.grey),
                      ),
                    ],
                  ),
                ),
              ),

              const Divider(height: 1, color: AppColors.surface200),

              // Queue List
              Expanded(
                child: viewModel.isLoading
                    ? const Center(child: CircularProgressIndicator())
                    : filteredCases.isEmpty
                        ? Center(
                            child: Padding(
                              padding: const EdgeInsets.all(24.0),
                              child: Column(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  const Icon(Icons.inbox_outlined,
                                      size: 48, color: AppColors.ink300),
                                  const SizedBox(height: 12),
                                  const Text(
                                    'No triage cases found',
                                    style: TextStyle(
                                      fontSize: 16,
                                      fontWeight: FontWeight.w700,
                                      color: AppColors.ink800,
                                    ),
                                  ),
                                  const SizedBox(height: 4),
                                  Text(
                                    viewModel.searchQuery.isNotEmpty
                                        ? 'No records matching "${viewModel.searchQuery}"'
                                        : 'No cases in this priority filter.',
                                    style: const TextStyle(
                                      fontSize: 13,
                                      color: AppColors.ink500,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          )
                        : ListView.builder(
                            padding: const EdgeInsets.all(16),
                            itemCount: filteredCases.length,
                            itemBuilder: (context, index) {
                              final patient = filteredCases[index];
                              return _buildQueueCard(context, patient);
                            },
                          ),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildFilterChip(
    BuildContext context, {
    required String label,
    required bool isSelected,
    required VoidCallback onTap,
    Color? color,
    Color? bgColor,
  }) {
    final activeColor = color ?? AppColors.primary600;
    final activeBg = bgColor ?? AppColors.primary100;

    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(6),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
        decoration: BoxDecoration(
          color: isSelected ? activeBg : AppColors.surface100,
          borderRadius: BorderRadius.circular(6),
          border: Border.all(
            color: isSelected ? activeColor : AppColors.surface200,
          ),
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 12,
            fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
            color: isSelected ? activeColor : AppColors.ink800,
          ),
        ),
      ),
    );
  }

  Widget _buildQueueCard(BuildContext context, Patient patient) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: AppColors.surface0,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: patient.priority == Priority.red
              ? AppColors.danger700.withValues(alpha: 0.3)
              : AppColors.surface200,
          width: patient.priority == Priority.red ? 1.5 : 1.0,
        ),
      ),
      child: InkWell(
        onTap: () {
          Navigator.of(context).push(
            MaterialPageRoute(
              builder: (_) => PatientWorkspaceScreen(initialPatient: patient),
            ),
          );
        },
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(14),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header row
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Expanded(
                    child: Text(
                      '${patient.name} · ${patient.age}y · ${patient.gender}',
                      style: const TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.w800,
                        color: AppColors.ink950,
                      ),
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                  const SizedBox(width: 8),
                  PriorityBadge(priority: patient.priority),
                ],
              ),

              const SizedBox(height: 6),

              // ID & Arrival Row
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Expanded(
                    child: Text(
                      '${patient.syntheticCode} · ${patient.arrivalTime} · ${patient.primaryLanguage}',
                      style: const TextStyle(
                        fontSize: 11,
                        color: AppColors.ink500,
                        fontFeatures: [FontFeature.tabularFigures()],
                      ),
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                  const SizedBox(width: 8),
                  StatusBadge(status: patient.status),
                ],
              ),

              const SizedBox(height: 8),

              // Chief complaint excerpt
              Text(
                patient.chiefComplaint,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(
                  fontSize: 13,
                  color: AppColors.ink800,
                  height: 1.35,
                ),
              ),

              // Risk flag alert pill if present
              if (patient.riskFlags.isNotEmpty) ...[
                const SizedBox(height: 8),
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: patient.priority == Priority.red
                        ? AppColors.danger100
                        : AppColors.warning100,
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(
                        Icons.warning_amber_rounded,
                        size: 13,
                        color: patient.priority == Priority.red
                            ? AppColors.danger700
                            : AppColors.warning700,
                      ),
                      const SizedBox(width: 4),
                      Flexible(
                        child: Text(
                          patient.riskFlags.first.description,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.w700,
                            color: patient.priority == Priority.red
                                ? AppColors.danger700
                                : AppColors.warning700,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}
