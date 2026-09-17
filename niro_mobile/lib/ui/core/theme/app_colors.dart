import 'package:flutter/material.dart';

/// Section 3.1 Design Tokens for NIRO Triage
class AppColors {
  AppColors._();

  // Ink Scale
  static const Color ink950 = Color(0xFF102033); // Headings, primary text
  static const Color ink800 = Color(0xFF25364A); // Subheadings, strong text
  static const Color ink600 = Color(0xFF526276); // Secondary body text, form labels
  static const Color ink500 = Color(0xFF6B7B8F); // Metadata, helper text
  static const Color ink300 = Color(0xFFB8C2CF); // Dividers, disabled icons

  // Surface Scale
  static const Color surface0 = Color(0xFFFFFFFF); // Primary card, modal surface
  static const Color surface50 = Color(0xFFF8FAFC); // Screen canvas background
  static const Color surface100 = Color(0xFFF1F5F9); // Input fields, active chips
  static const Color surface200 = Color(0xFFE6ECF2); // Precision 1px borders

  // Primary Blue
  static const Color primary700 = Color(0xFF164FD6); // Pressed button state
  static const Color primary600 = Color(0xFF2563EB); // Interactive buttons & brand accent
  static const Color primary500 = Color(0xFF3B82F6); // Highlights, focus outlines
  static const Color primary100 = Color(0xFFE8F0FF); // Light blue tint / selected cards

  // Success / Routine Green
  static const Color success700 = Color(0xFF087443);
  static const Color success600 = Color(0xFF16A36A);
  static const Color success100 = Color(0xFFEAF8F1);

  // Warning / Incomplete Amber
  static const Color warning700 = Color(0xFF996500);
  static const Color warning600 = Color(0xFFD99A18);
  static const Color warning100 = Color(0xFFFFF6DD);

  // Danger / Urgency Red (Strictly reserved for urgency, never decorative)
  static const Color danger700 = Color(0xFFB3261E);
  static const Color danger600 = Color(0xFFE5484D);
  static const Color danger100 = Color(0xFFFDECEC);

  // Info Blue
  static const Color info700 = Color(0xFF1769AA);
  static const Color info100 = Color(0xFFE9F4FF);
}
