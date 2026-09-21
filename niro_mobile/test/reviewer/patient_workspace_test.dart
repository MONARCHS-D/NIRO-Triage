import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';
import 'package:niro_mobile/data/repositories/triage_repository_impl.dart';
import 'package:niro_mobile/data/services/triage_mock_service.dart';
import 'package:niro_mobile/domain/repositories/triage_repository.dart';
import 'package:niro_mobile/ui/features/auth/view_models/auth_view_model.dart';
import 'package:niro_mobile/ui/features/reviewer/view_models/reviewer_view_model.dart';
import 'package:niro_mobile/ui/features/reviewer/views/patient_workspace_screen.dart';

void main() {
  testWidgets(
      'PatientWorkspaceScreen renders header, 6 tabs, AI questions, and approval action bar',
      (WidgetTester tester) async {
    tester.view.physicalSize = const Size(800, 1000);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(tester.view.resetPhysicalSize);

    final mockService = TriageMockService();
    final repository = TriageRepositoryImpl(mockService: mockService);
    final authViewModel = AuthViewModel();
    final reviewerViewModel = ReviewerViewModel(repository: repository);

    // Synchronous initial case lookup from mock service
    final patientP1042 = mockService
        .getInitialSyntheticCases()
        .firstWhere((p) => p.id == 'P-1042');

    await tester.pumpWidget(
      MultiProvider(
        providers: [
          Provider<ITriageRepository>.value(value: repository),
          ChangeNotifierProvider<AuthViewModel>.value(value: authViewModel),
          ChangeNotifierProvider<ReviewerViewModel>.value(
              value: reviewerViewModel),
        ],
        child: MaterialApp(
          home: PatientWorkspaceScreen(initialPatient: patientP1042),
        ),
      ),
    );
    await tester.pumpAndSettle();

    // 1. Verify Patient Header
    expect(find.text('Sunita Majhi'), findsOneWidget);
    expect(find.textContaining('SYN-2026-001'), findsWidgets);
    expect(find.text('Potential Urgency'), findsOneWidget);

    // 2. Verify all 6 tabs exist
    expect(find.text('Summary'), findsOneWidget);
    expect(find.text('Timeline'), findsOneWidget);
    expect(find.text('Extracted Data'), findsOneWidget);
    expect(find.textContaining('Missing Info'), findsWidgets);
    expect(find.textContaining('AI Questions'), findsWidgets);
    expect(find.text('Audit Log'), findsOneWidget);

    // 3. Verify Non-Diagnostic Advisory Banner on Summary Tab
    expect(find.text('AI Triage-Support Note (Advisory Only)'), findsOneWidget);
    expect(find.text('POTENTIAL URGENCY FLAGGED'), findsOneWidget);

    // 4. Verify Clinical Action Bar buttons
    expect(find.text('Request Info'), findsOneWidget);
    expect(find.text('Escalate'), findsOneWidget);
    expect(find.text('Approve Note'), findsOneWidget);

    // 5. Switch to Timeline Tab
    await tester.tap(find.text('Timeline'));
    await tester.pumpAndSettle();
    expect(find.text('Indic Speech Transcribed & Translated'), findsOneWidget);

    // 6. Switch to Extracted Data Tab
    await tester.tap(find.text('Extracted Data'));
    await tester.pumpAndSettle();
    expect(find.text('Oxygen Saturation (SpO2)'), findsWidgets);
    expect(find.text('91'), findsWidgets);

    // 7. Switch to AI Questions Tab
    await tester.tap(find.textContaining('AI Questions').first);
    await tester.pumpAndSettle();
    expect(find.textContaining('audible inspiratory stridor'), findsOneWidget);
    expect(find.text('Yes'), findsWidgets);
    expect(find.text('No'), findsWidgets);

    // 8. Answer AI question
    await tester.tap(find.text('Yes').first);
    await tester.pumpAndSettle();
    expect(find.text('Recorded'), findsWidgets);

    // 9. Approve Triage Note
    await tester.tap(find.text('Approve Note'));
    await tester.pumpAndSettle();
    expect(find.text('Approved'), findsWidgets);
  });
}
