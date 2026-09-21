import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:niro_mobile/domain/models/auth.dart';
import 'package:niro_mobile/domain/models/patient.dart';
import 'package:niro_mobile/domain/models/priority.dart';
import 'package:niro_mobile/ui/core/theme/app_colors.dart';
import 'package:niro_mobile/ui/core/widgets/priority_badge.dart';
import 'package:niro_mobile/ui/core/widgets/status_badge.dart';
import 'package:niro_mobile/ui/features/auth/view_models/auth_view_model.dart';
import 'package:niro_mobile/ui/features/reviewer/view_models/reviewer_view_model.dart';
import 'patient_workspace_screen.dart';

class DashboardScreen extends StatelessWidget {
  final VoidCallback onNavigateToQueue;

  const DashboardScreen({super.key, required this.onNavigateToQueue});

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthViewModel>();
    final reviewer = context.watch<ReviewerViewModel>();

    return Scaffold(
      backgroundColor: AppColors.surface50,
      appBar: AppBar(
        backgroundColor: AppColors.surface0,
        elevation: 0,
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const Icon(Icons.local_hospital,
                    size: 16, color: AppColors.primary600),
                const SizedBox(width: 6),
                Flexible(
                  child: Text(
                    auth.selectedFacility,
                    style: const TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.w800,
                      color: AppColors.ink950,
                    ),
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 2),
            Text(
              '${auth.currentStaffUser.name} · ${auth.currentStaffUser.role == UserRole.medicalOfficer ? "Medical Officer" : "Triage Nurse"}',
              style: const TextStyle(fontSize: 11, color: AppColors.ink500),
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.notifications_none, color: AppColors.ink800),
            onPressed: () {},
            tooltip: 'Alerts',
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: reviewer.loadPatients,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            // KPI Grid (Section 33 MVP: 4 Key Metrics)
            _buildKpiSection(reviewer),

            const SizedBox(height: 20),

            // Urgent Attention Section
            if (reviewer.urgentCount > 0) ...[
              _buildUrgentAttentionBanner(context, reviewer),
              const SizedBox(height: 20),
            ],

            // Active Queue Preview Section
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Expanded(
                  child: Text(
                    'Active Review Queue',
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w800,
                      color: AppColors.ink950,
                    ),
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
                TextButton(
                  onPressed: onNavigateToQueue,
                  child: const Text('View Full Queue →'),
                ),
              ],
            ),
            const SizedBox(height: 8),

            ...reviewer.patients
                .where((p) =>
                    p.status == CaseStatus.pendingReview ||
                    p.status == CaseStatus.aiDraft ||
                    p.status == CaseStatus.needsMoreInfo)
                .take(3)
                .map((patient) => _buildPreviewCard(context, patient)),

            const SizedBox(height: 16),

            // Facility Quick Info Card
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: AppColors.surface0,
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: AppColors.surface200),
              ),
              child: Row(
                children: [
                  const Icon(Icons.info_outline,
                      size: 20, color: AppColors.primary600),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Human-in-the-Loop Protocol Active',
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w700,
                            color: AppColors.ink950,
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          'All AI-generated summaries and priority indicators require qualified medical staff verification before admission or discharge.',
                          style: TextStyle(
                            fontSize: 11,
                            color: AppColors.ink600,
                            height: 1.3,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildKpiSection(ReviewerViewModel reviewer) {
    return Column(
      children: [
        Row(
          children: [
            Expanded(
              child: _buildMetricCard(
                title: 'Total Registered',
                value: '${reviewer.totalRegisteredToday + 44}',
                subtitle: 'Today in OPD',
                icon: Icons.people_outline,
                iconColor: AppColors.primary600,
                bgColor: AppColors.primary100,
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: _buildMetricCard(
                title: 'Awaiting Review',
                value: '${reviewer.awaitingReviewCount}',
                subtitle: 'Pending staff action',
                icon: Icons.pending_actions_outlined,
                iconColor: AppColors.warning700,
                bgColor: AppColors.warning100,
              ),
            ),
          ],
        ),
        const SizedBox(height: 10),
        Row(
          children: [
            Expanded(
              child: _buildMetricCard(
                title: 'Urgent Cases',
                value: '${reviewer.urgentCount}',
                subtitle: 'Potential escalation',
                icon: Icons.emergency_outlined,
                iconColor: AppColors.danger700,
                bgColor: AppColors.danger100,
                isUrgent: true,
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: _buildMetricCard(
                title: 'Avg Review Time',
                value: reviewer.avgReviewTimeMinutes,
                subtitle: 'Per patient review',
                icon: Icons.timer_outlined,
                iconColor: AppColors.success700,
                bgColor: AppColors.success100,
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildMetricCard({
    required String title,
    required String value,
    required String subtitle,
    required IconData icon,
    required Color iconColor,
    required Color bgColor,
    bool isUrgent = false,
  }) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.surface0,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: isUrgent
              ? AppColors.danger700.withValues(alpha: 0.3)
              : AppColors.surface200,
          width: isUrgent ? 1.5 : 1.0,
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
                  title,
                  style: const TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                    color: AppColors.ink600,
                  ),
                  overflow: TextOverflow.ellipsis,
                ),
              ),
              const SizedBox(width: 4),
              Container(
                padding: const EdgeInsets.all(6),
                decoration: BoxDecoration(
                  color: bgColor,
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Icon(icon, size: 16, color: iconColor),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            value,
            style: TextStyle(
              fontSize: 22,
              fontWeight: FontWeight.w800,
              color: isUrgent ? AppColors.danger700 : AppColors.ink950,
              fontFeatures: const [FontFeature.tabularFigures()],
            ),
          ),
          const SizedBox(height: 2),
          Text(
            subtitle,
            style: const TextStyle(
              fontSize: 11,
              color: AppColors.ink500,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildUrgentAttentionBanner(
      BuildContext context, ReviewerViewModel reviewer) {
    final urgentCase = reviewer.patients.firstWhere(
      (p) => p.priority == Priority.red,
      orElse: () => reviewer.patients.first,
    );

    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.danger100,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.danger700.withValues(alpha: 0.4)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.warning_amber_rounded,
                  color: AppColors.danger700, size: 20),
              const SizedBox(width: 8),
              const Expanded(
                child: Text(
                  'Immediate Medical Attention Required',
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w800,
                    color: AppColors.danger700,
                  ),
                ),
              ),
              PriorityBadge(priority: Priority.red),
            ],
          ),
          const SizedBox(height: 6),
          Text(
            '${urgentCase.name} (${urgentCase.syntheticCode}) · ${urgentCase.urgencyRationale.isNotEmpty ? urgentCase.urgencyRationale : urgentCase.chiefComplaint}',
            style: const TextStyle(
              fontSize: 12,
              color: AppColors.ink950,
              fontWeight: FontWeight.w600,
              height: 1.35,
            ),
          ),
          const SizedBox(height: 10),
          SizedBox(
            width: double.infinity,
            height: 38,
            child: ElevatedButton(
              onPressed: () {
                Navigator.of(context).push(
                  MaterialPageRoute(
                    builder: (_) =>
                        PatientWorkspaceScreen(initialPatient: urgentCase),
                  ),
                );
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.danger700,
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(8),
                ),
              ),
              child: const Text(
                'Open Urgent Case Workspace →',
                style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPreviewCard(BuildContext context, Patient patient) {
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      decoration: BoxDecoration(
        color: AppColors.surface0,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: AppColors.surface200),
      ),
      child: InkWell(
        onTap: () {
          Navigator.of(context).push(
            MaterialPageRoute(
              builder: (_) => PatientWorkspaceScreen(initialPatient: patient),
            ),
          );
        },
        borderRadius: BorderRadius.circular(10),
        child: Padding(
          padding: const EdgeInsets.all(14),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Expanded(
                    child: Text(
                      patient.name,
                      style: const TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w700,
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
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Expanded(
                    child: Text(
                      '${patient.syntheticCode} · ${patient.arrivalTime}',
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
              const SizedBox(height: 4),
              Text(
                patient.chiefComplaint,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(fontSize: 12, color: AppColors.ink800),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
