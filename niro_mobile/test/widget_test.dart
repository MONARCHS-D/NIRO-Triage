import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:niro_mobile/main.dart';

void main() {
  testWidgets('NIRO Triage Mobile smoke test and navigation verification',
      (WidgetTester tester) async {
    // Set a phone screen surface size (400 x 850)
    tester.view.physicalSize = const Size(400, 850);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(tester.view.resetPhysicalSize);

    // Build our app and trigger a frame.
    await tester.pumpWidget(const NiroTriageApp());
    await tester.pumpAndSettle();

    // Verify App Bar Title
    expect(find.text('NIRO Triage'), findsOneWidget);
    expect(find.text('Citizen Portal'), findsOneWidget);

    // Verify Greeting Banner
    expect(find.text('How are you feeling today?'), findsOneWidget);

    // Verify Non-diagnostic disclaimer
    expect(
      find.text(
          'Educational prototype — triage-support only. Not a medical diagnosis or treatment system.'),
      findsOneWidget,
    );

    // Verify All 4 Intake Modality Cards are displayed
    expect(find.text('Speak in your language'), findsOneWidget);
    expect(find.text('Type symptoms'), findsOneWidget);
    expect(find.text('Upload report'), findsOneWidget);
    expect(find.text('Take photo'), findsOneWidget);

    // Verify Bottom Navigation Bar Destinations
    expect(find.text('Home'), findsOneWidget);
    expect(find.text('My Visits'), findsOneWidget);
    expect(find.text('Messages'), findsOneWidget);
    expect(find.text('Profile'), findsOneWidget);

    // Tap on 'My Visits' tab
    await tester.tap(find.text('My Visits'));
    await tester.pumpAndSettle();

    // Verify that Visits Screen is displayed with benchmark cases
    expect(find.text('My Triage Visits'), findsOneWidget);
    expect(find.text('All Cases'), findsOneWidget);
    expect(find.textContaining('Sunita Majhi'), findsOneWidget);
    expect(find.textContaining('Rajesh Verma'), findsOneWidget);
  });
}
