import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:niro_mobile/domain/models/patient.dart';
import 'package:niro_mobile/ui/core/theme/app_colors.dart';
import 'package:niro_mobile/ui/core/widgets/priority_badge.dart';
import 'package:niro_mobile/ui/core/widgets/status_badge.dart';
import 'package:niro_mobile/ui/features/visits/view_models/visits_view_model.dart';

class VisitsScreen extends StatelessWidget {
  const VisitsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final viewModel = context.watch<VisitsViewModel>();

    return Scaffold(
      backgroundColor: AppColors.surface50,
      appBar: AppBar(
        title: const Text('My Triage Visits'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh, size: 20),
            onPressed: () => viewModel.loadVisits(),
            tooltip: 'Refresh visits',
          ),
        ],
      ),
      body: SafeArea(
        child: Column(
          children: [
            // Filter Pills Header
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
              color: AppColors.surface0,
              child: SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                child: Row(
                  children: [
                    _buildFilterChip(context, 'ALL', 'All Cases', viewModel),
                    const SizedBox(width: 8),
                    _buildFilterChip(
                        context, 'RED', 'Urgent / Red', viewModel),
                    const SizedBox(width: 8),
                    _buildFilterChip(
                        context, 'YELLOW', 'Prompt / Yellow', viewModel),
                    const SizedBox(width: 8),
                    _buildFilterChip(
                        context, 'GREEN', 'Routine / Green', viewModel),
                  ],
                ),
              ),
            ),
            const Divider(height: 1, color: AppColors.surface200),

            // Visits List
            Expanded(
              child: viewModel.isLoading
                  ? const Center(
                      child: CircularProgressIndicator(
                        strokeWidth: 2.5,
                        color: AppColors.primary600,
                      ),
                    )
                  : viewModel.filteredVisits.isEmpty
                      ? Center(
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: const [
                              Icon(
                                Icons.folder_open,
                                size: 48,
                                color: AppColors.ink300,
                              ),
                              SizedBox(height: 12),
                              Text(
                                'No triage cases found in this filter.',
                                style: TextStyle(
                                  fontSize: 14,
                                  fontWeight: FontWeight.w600,
                                  color: AppColors.ink600,
                                ),
                              ),
                            ],
                          ),
                        )
                      : ListView.separated(
                          padding: const EdgeInsets.all(16),
                          itemCount: viewModel.filteredVisits.length,
                          separatorBuilder: (_, _) =>
                              const SizedBox(height: 12),
                          itemBuilder: (context, index) {
                            final patient = viewModel.filteredVisits[index];
                            return _buildVisitCard(context, patient);
                          },
                        ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildFilterChip(
    BuildContext context,
    String filterCode,
    String label,
    VisitsViewModel viewModel,
  ) {
    final isSelected = viewModel.filter == filterCode;
    return ChoiceChip(
      label: Text(
        label,
        style: TextStyle(
          fontSize: 12,
          fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
          color: isSelected ? AppColors.primary700 : AppColors.ink800,
        ),
      ),
      selected: isSelected,
      selectedColor: AppColors.primary100,
      backgroundColor: AppColors.surface0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(8),
        side: BorderSide(
          color: isSelected ? AppColors.primary600 : AppColors.surface200,
        ),
      ),
      onSelected: (_) => viewModel.setFilter(filterCode),
    );
  }

  Widget _buildVisitCard(BuildContext context, Patient patient) {
    return Container(
      decoration: BoxDecoration(
        color: AppColors.surface0,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.surface200),
      ),
      child: InkWell(
        borderRadius: BorderRadius.circular(12),
        onTap: () => _showVisitDetailModal(context, patient),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Expanded(
                    child: Text(
                      '${patient.name} (${patient.id})',
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w700,
                        color: AppColors.ink950,
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  PriorityBadge(priority: patient.priority, compact: true),
                ],
              ),
              const SizedBox(height: 6),
              Text(
                '${patient.age} yrs · ${patient.gender} · ${patient.primaryLanguage}',
                style: const TextStyle(
                  fontSize: 12,
                  color: AppColors.ink500,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                patient.chiefComplaint,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w500,
                  color: AppColors.ink800,
                  height: 1.35,
                ),
              ),
              const SizedBox(height: 12),
              const Divider(height: 1, color: AppColors.surface200),
              const SizedBox(height: 10),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Expanded(
                    child: Text(
                      patient.arrivalTime,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        fontSize: 11,
                        color: AppColors.ink500,
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  StatusBadge(status: patient.status),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _showVisitDetailModal(BuildContext context, Patient patient) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) {
        return Container(
          height: MediaQuery.of(context).size.height * 0.85,
          decoration: const BoxDecoration(
            color: AppColors.surface0,
            borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
          ),
          child: Column(
            children: [
              Container(
                width: 36,
                height: 4,
                margin: const EdgeInsets.symmetric(vertical: 10),
                decoration: BoxDecoration(
                  color: AppColors.ink300,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'Visit ${patient.id}',
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w700,
                        color: AppColors.ink950,
                      ),
                    ),
                    IconButton(
                      icon: const Icon(Icons.close, size: 20),
                      onPressed: () => Navigator.pop(ctx),
                    ),
                  ],
                ),
              ),
              const Divider(height: 1, color: AppColors.surface200),
              Expanded(
                child: SingleChildScrollView(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          PriorityBadge(priority: patient.priority),
                          StatusBadge(status: patient.status),
                        ],
                      ),
                      const SizedBox(height: 14),
                      const Text(
                        'Chief Complaint & Reported Symptoms',
                        style: TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w700,
                          color: AppColors.ink950,
                        ),
                      ),
                      const SizedBox(height: 6),
                      Text(
                        patient.chiefComplaint,
                        style: const TextStyle(
                          fontSize: 13,
                          color: AppColors.ink800,
                          height: 1.4,
                        ),
                      ),
                      if (patient.symptoms.isNotEmpty) ...[
                        const SizedBox(height: 12),
                        Wrap(
                          spacing: 6,
                          runSpacing: 6,
                          children: patient.symptoms.map((s) {
                            return Chip(
                              label: Text('${s.name} (${s.duration})'),
                              backgroundColor: AppColors.surface100,
                              labelStyle: const TextStyle(
                                fontSize: 11,
                                color: AppColors.ink800,
                              ),
                              padding: EdgeInsets.zero,
                              visualDensity: VisualDensity.compact,
                            );
                          }).toList(),
                        ),
                      ],
                      if (patient.facts.isNotEmpty) ...[
                        const SizedBox(height: 16),
                        const Text(
                          'Extracted Facts & Vitals',
                          style: TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.w700,
                            color: AppColors.ink950,
                          ),
                        ),
                        const SizedBox(height: 8),
                        ...patient.facts.map((f) => Padding(
                              padding: const EdgeInsets.only(bottom: 6),
                              child: Row(
                                mainAxisAlignment:
                                    MainAxisAlignment.spaceBetween,
                                children: [
                                  Expanded(
                                    child: Text(
                                      f.metric,
                                      style: const TextStyle(
                                        fontSize: 12,
                                        color: AppColors.ink600,
                                      ),
                                    ),
                                  ),
                                  const SizedBox(width: 8),
                                  Text(
                                    '${f.value} ${f.unit}',
                                    style: const TextStyle(
                                      fontSize: 12,
                                      fontWeight: FontWeight.w700,
                                      color: AppColors.ink950,
                                    ),
                                  ),
                                ],
                              ),
                            )),
                      ],
                      if (patient.timeline.isNotEmpty) ...[
                        const SizedBox(height: 16),
                        const Text(
                          'Provenance Timeline',
                          style: TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.w700,
                            color: AppColors.ink950,
                          ),
                        ),
                        const SizedBox(height: 8),
                        ...patient.timeline.map((t) => Padding(
                              padding: const EdgeInsets.only(bottom: 10),
                              child: Row(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Container(
                                    margin: const EdgeInsets.only(top: 3),
                                    width: 8,
                                    height: 8,
                                    decoration: const BoxDecoration(
                                      color: AppColors.primary600,
                                      shape: BoxShape.circle,
                                    ),
                                  ),
                                  const SizedBox(width: 10),
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment:
                                          CrossAxisAlignment.start,
                                      children: [
                                        Text(
                                          '${t.timestamp} — ${t.title}',
                                          style: const TextStyle(
                                            fontSize: 12,
                                            fontWeight: FontWeight.w600,
                                            color: AppColors.ink950,
                                          ),
                                        ),
                                        Text(
                                          t.description,
                                          style: const TextStyle(
                                            fontSize: 11,
                                            color: AppColors.ink500,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                ],
                              ),
                            )),
                      ],
                      const SizedBox(height: 20),
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: AppColors.surface100,
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: const Text(
                          '✓ Clinical Boundary: Non-diagnostic triage support. Treatment decisions are made exclusively by registered medical staff.',
                          style: TextStyle(
                            fontSize: 11,
                            color: AppColors.ink600,
                            fontStyle: FontStyle.italic,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}
