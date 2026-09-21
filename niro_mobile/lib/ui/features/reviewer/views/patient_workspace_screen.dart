import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:niro_mobile/domain/models/patient.dart';
import 'package:niro_mobile/ui/core/theme/app_colors.dart';
import 'package:niro_mobile/ui/core/widgets/priority_badge.dart';
import 'package:niro_mobile/ui/core/widgets/status_badge.dart';
import 'package:niro_mobile/ui/features/auth/view_models/auth_view_model.dart';
import 'package:niro_mobile/ui/features/reviewer/view_models/reviewer_view_model.dart';
import 'tabs/patient_summary_tab.dart';
import 'tabs/patient_timeline_tab.dart';
import 'tabs/patient_extracted_data_tab.dart';
import 'tabs/patient_missing_info_tab.dart';
import 'tabs/patient_ai_questions_tab.dart';
import 'tabs/patient_audit_log_tab.dart';

class PatientWorkspaceScreen extends StatefulWidget {
  final Patient initialPatient;

  const PatientWorkspaceScreen({super.key, required this.initialPatient});

  @override
  State<PatientWorkspaceScreen> createState() => _PatientWorkspaceScreenState();
}

class _PatientWorkspaceScreenState extends State<PatientWorkspaceScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 6, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Consumer<ReviewerViewModel>(
      builder: (context, reviewer, _) {
        // Retrieve fresh patient state from the reviewer model if present
        final patient = reviewer.patients.firstWhere(
          (p) => p.id == widget.initialPatient.id,
          orElse: () => widget.initialPatient,
        );

        final auth = context.watch<AuthViewModel>();

        return Scaffold(
          backgroundColor: AppColors.surface50,
          appBar: AppBar(
            backgroundColor: AppColors.surface0,
            elevation: 0,
            titleSpacing: 0,
            leading: IconButton(
              icon: const Icon(Icons.arrow_back, color: AppColors.ink950),
              onPressed: () => Navigator.of(context).pop(),
            ),
            title: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Flexible(
                      child: Text(
                        patient.name,
                        style: const TextStyle(
                          fontSize: 16,
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
                Text(
                  '${patient.age}y · ${patient.gender} · ${patient.primaryLanguage} · ${patient.syntheticCode}',
                  style: const TextStyle(
                    fontSize: 11,
                    color: AppColors.ink500,
                    fontFeatures: [FontFeature.tabularFigures()],
                  ),
                ),
              ],
            ),
            actions: [
              Padding(
                padding: const EdgeInsets.only(right: 12),
                child: Center(
                  child: StatusBadge(status: patient.status),
                ),
              ),
            ],
            bottom: PreferredSize(
              preferredSize: const Size.fromHeight(48),
              child: Container(
                decoration: const BoxDecoration(
                  border: Border(
                    top: BorderSide(color: AppColors.surface200),
                    bottom: BorderSide(color: AppColors.surface200),
                  ),
                ),
                child: TabBar(
                  controller: _tabController,
                  isScrollable: true,
                  tabAlignment: TabAlignment.start,
                  labelColor: AppColors.primary600,
                  unselectedLabelColor: AppColors.ink600,
                  indicatorColor: AppColors.primary600,
                  indicatorWeight: 2.5,
                  labelStyle: const TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w700,
                  ),
                  tabs: [
                    const Tab(text: 'Summary'),
                    const Tab(text: 'Timeline'),
                    const Tab(text: 'Extracted Data'),
                    Tab(
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Text('Missing Info'),
                          if (patient.missingInfo.isNotEmpty) ...[
                            const SizedBox(width: 4),
                            Container(
                              padding: const EdgeInsets.all(4),
                              decoration: const BoxDecoration(
                                color: AppColors.warning700,
                                shape: BoxShape.circle,
                              ),
                              child: Text(
                                '${patient.missingInfo.length}',
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontSize: 9,
                                  fontWeight: FontWeight.w800,
                                ),
                              ),
                            ),
                          ],
                        ],
                      ),
                    ),
                    Tab(
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Text('AI Questions'),
                          if (patient.aiQuestions.any((q) => !q.isAnswered)) ...[
                            const SizedBox(width: 4),
                            Container(
                              padding: const EdgeInsets.all(4),
                              decoration: const BoxDecoration(
                                color: AppColors.primary600,
                                shape: BoxShape.circle,
                              ),
                              child: Text(
                                '${patient.aiQuestions.where((q) => !q.isAnswered).length}',
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontSize: 9,
                                  fontWeight: FontWeight.w800,
                                ),
                              ),
                            ),
                          ],
                        ],
                      ),
                    ),
                    const Tab(text: 'Audit Log'),
                  ],
                ),
              ),
            ),
          ),
          body: TabBarView(
            controller: _tabController,
            children: [
              PatientSummaryTab(patient: patient),
              PatientTimelineTab(patient: patient),
              PatientExtractedDataTab(patient: patient),
              PatientMissingInfoTab(patient: patient),
              PatientAiQuestionsTab(patient: patient),
              PatientAuditLogTab(patient: patient),
            ],
          ),
          bottomNavigationBar: _buildClinicalActionBar(context, patient, auth, reviewer),
        );
      },
    );
  }

  Widget _buildClinicalActionBar(
    BuildContext context,
    Patient patient,
    AuthViewModel auth,
    ReviewerViewModel reviewer,
  ) {
    final actorName = auth.isStaff ? auth.currentStaffUser.name : 'Reviewer';

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: const BoxDecoration(
        color: AppColors.surface0,
        border: Border(
          top: BorderSide(color: AppColors.surface200),
        ),
      ),
      child: SafeArea(
        top: false,
        child: Row(
          children: [
            // Request More Info button
            Expanded(
              child: SizedBox(
                height: 44,
                child: OutlinedButton(
                  onPressed: () {
                    reviewer.requestMoreInfo(
                      patient.id,
                      actorName: actorName,
                      details: 'Clinical review requested missing vitals/diagnostics.',
                    );
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(
                        content: Text('Case marked: Needs More Information'),
                        backgroundColor: AppColors.warning700,
                      ),
                    );
                  },
                  style: OutlinedButton.styleFrom(
                    foregroundColor: AppColors.warning700,
                    side: const BorderSide(color: AppColors.warning700),
                    padding: const EdgeInsets.symmetric(horizontal: 8),
                  ),
                  child: const FittedBox(
                    fit: BoxFit.scaleDown,
                    child: Text(
                      'Request Info',
                      style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700),
                    ),
                  ),
                ),
              ),
            ),
            const SizedBox(width: 8),

            // Escalate to Specialist button
            Expanded(
              child: SizedBox(
                height: 44,
                child: OutlinedButton(
                  onPressed: () {
                    reviewer.escalateCase(
                      patient.id,
                      actorName: actorName,
                      rationale: 'Urgent referral to Medical Officer / Specialist OPD.',
                    );
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(
                        content: Text('Case Escalated for Medical Officer Evaluation'),
                        backgroundColor: AppColors.danger700,
                      ),
                    );
                  },
                  style: OutlinedButton.styleFrom(
                    foregroundColor: AppColors.danger700,
                    side: const BorderSide(color: AppColors.danger700),
                    padding: const EdgeInsets.symmetric(horizontal: 8),
                  ),
                  child: const FittedBox(
                    fit: BoxFit.scaleDown,
                    child: Text(
                      'Escalate',
                      style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700),
                    ),
                  ),
                ),
              ),
            ),
            const SizedBox(width: 8),

            // Approve Triage Note button
            Expanded(
              flex: 2,
              child: SizedBox(
                height: 44,
                child: ElevatedButton.icon(
                  onPressed: () {
                    reviewer.approveTriageNote(
                      patient.id,
                      actorName: actorName,
                    );
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(
                        content: Text('Triage Note Approved & Verified by Clinician'),
                        backgroundColor: AppColors.success700,
                      ),
                    );
                  },
                  icon: const Icon(Icons.check, size: 16, color: Colors.white),
                  label: const FittedBox(
                    fit: BoxFit.scaleDown,
                    child: Text(
                      'Approve Note',
                      style: TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w700,
                        color: Colors.white,
                      ),
                    ),
                  ),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primary600,
                    padding: const EdgeInsets.symmetric(horizontal: 10),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
