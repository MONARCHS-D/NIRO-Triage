import 'package:flutter/material.dart';
import 'package:niro_mobile/domain/models/priority.dart';
import 'package:niro_mobile/ui/core/theme/app_colors.dart';

class StatusBadge extends StatelessWidget {
  final CaseStatus status;

  const StatusBadge({
    super.key,
    required this.status,
  });

  @override
  Widget build(BuildContext context) {
    Color bg = AppColors.surface100;
    Color border = AppColors.surface200;
    Color text = AppColors.ink600;

    switch (status) {
      case CaseStatus.approved:
        bg = AppColors.success100;
        border = const Color(0xFFBCE3CD);
        text = AppColors.success700;
        break;
      case CaseStatus.pendingReview:
        bg = AppColors.primary100;
        border = const Color(0xFFC7DCFF);
        text = AppColors.primary700;
        break;
      case CaseStatus.needsMoreInfo:
        bg = AppColors.warning100;
        border = const Color(0xFFFDE1A3);
        text = AppColors.warning700;
        break;
      case CaseStatus.escalated:
        bg = AppColors.danger100;
        border = const Color(0xFFF9C8C8);
        text = AppColors.danger700;
        break;
      case CaseStatus.aiDraft:
      case CaseStatus.processing:
      case CaseStatus.created:
      case CaseStatus.reviewed:
        bg = AppColors.surface100;
        border = AppColors.surface200;
        text = AppColors.ink800;
        break;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(6),
        border: Border.all(color: border, width: 1),
      ),
      child: Text(
        status.label,
        style: TextStyle(
          color: text,
          fontSize: 11,
          fontWeight: FontWeight.w600,
          fontFamily: 'Inter',
        ),
      ),
    );
  }
}
