import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:niro_mobile/main.dart';

void main() {
  testWidgets('NIRO Triage Mobile dual-mode gateway and navigation smoke test',
      (WidgetTester tester) async {
    // Set phone viewport (400 x 850)
    tester.view.physicalSize = const Size(400, 850);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(tester.view.resetPhysicalSize);

    // Build app
    await tester.pumpWidget(const NiroTriageApp());
    await tester.pump(const Duration(milliseconds: 100));
    await tester.pumpAndSettle();

    // 1. App starts in Clinical Reviewer Mode (Default Staff Persona)
    expect(find.text('City Community Health Center'), findsOneWidget);
    expect(find.text('Total Registered'), findsOneWidget);
    expect(find.text('Awaiting Review'), findsOneWidget);
    expect(find.text('Urgent Cases'), findsOneWidget);
    expect(find.text('Avg Review Time'), findsOneWidget);

    // 2. Navigate to Triage Queue tab
    await tester.tap(find.text('Queue'));
    await tester.pump(const Duration(milliseconds: 100));
    await tester.pumpAndSettle();

    expect(find.text('Triage Queue'), findsOneWidget);
    expect(find.textContaining('All ('), findsOneWidget);
    expect(find.text('Urgent'), findsWidgets);
    expect(find.textContaining('Sunita Majhi'), findsWidgets);

    // 3. Navigate to Staff Profile tab
    await tester.tap(find.text('Profile'));
    await tester.pumpAndSettle();

    expect(find.text('Staff Profile & Facility'), findsOneWidget);
    expect(find.text('Switch Active Role / Persona'), findsOneWidget);
    expect(find.text('Citizen / Patient Mode'), findsOneWidget);

    // 4. Switch Persona to Citizen / Patient Mode
    await tester.tap(find.text('Citizen / Patient Mode'));
    await tester.pumpAndSettle();

    // 5. Verify Citizen Portal is now displayed
    expect(find.text('Citizen Portal'), findsOneWidget);
    expect(find.text('How are you feeling today?'), findsOneWidget);
    expect(find.text('Speak in your language'), findsOneWidget);
    expect(find.text('Type symptoms'), findsOneWidget);
    expect(find.text('Upload report'), findsOneWidget);
    expect(find.text('Take photo'), findsOneWidget);

    // 6. Navigate to Citizen Visits tab
    await tester.tap(find.text('My Visits'));
    await tester.pump(const Duration(milliseconds: 100));
    await tester.pumpAndSettle();

    expect(find.text('My Triage Visits'), findsOneWidget);
    expect(find.textContaining('Sunita Majhi'), findsOneWidget);

    // 7. Navigate to Citizen Profile and Log Out
    await tester.tap(find.text('Profile'));
    await tester.pumpAndSettle();

    expect(find.text('Citizen Profile & Privacy'), findsOneWidget);
    expect(find.text('Log Out Session'), findsOneWidget);

    // Tap Log Out Session button in AppBar
    await tester.tap(find.byTooltip('Log Out Session'));
    await tester.pumpAndSettle();

    // Verify confirmation dialog
    expect(find.textContaining('Are you sure you want to log out of NIRO Triage?'), findsOneWidget);
    await tester.tap(find.widgetWithText(ElevatedButton, 'Log Out'));
    await tester.pumpAndSettle();

    // 8. Verify Full-Fledged Auth Screen is displayed
    expect(find.text('NIRO Triage'), findsOneWidget);
    expect(find.text('People First. Care Faster.'), findsOneWidget);
    expect(find.text('Sign In'), findsOneWidget);
    expect(find.text('Create Account'), findsOneWidget);
    expect(find.text('Sign In to Workspace'), findsOneWidget);

    // Tap Sign In to return to workspace
    await tester.tap(find.text('Sign In to Workspace'));
    await tester.pump(const Duration(milliseconds: 400));
    await tester.pumpAndSettle();

    expect(find.text('Total Registered'), findsOneWidget);
  });
}
