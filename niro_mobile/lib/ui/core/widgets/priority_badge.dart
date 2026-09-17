import 'package:flutter/material.dart';
import 'package:niro_mobile/domain/models/priority.dart';
import 'package:niro_mobile/ui/core/theme/app_colors.dart';

class PriorityBadge extends StatelessWidget {
  final Priority priority;
  final bool compact;

  const PriorityBadge({
    super.key,
    required this.priority,
    this.compact = false,
  });

  @override
  Widget build(BuildContext context) {
    Color bg;
    Color border;
    Color text;

    switch (priority) {
      case Priority.green:
        bg = AppColors.success100;
        border = const Color(0xFFBCE3CD);
        text = AppColors.success700;
        break;
      case Priority.yellow:
        bg = AppColors.warning100;
        border = const Color(0xFFFDE1A3);
        text = AppColors.warning700;
        break;
      case Priority.red:
        bg = AppColors.danger100;
        border = const Color(0xFFF9C8C8);
        text = AppColors.danger700;
        break;
      case Priority.grey:
        bg = AppColors.surface100;
        border = AppColors.surface200;
        text = AppColors.ink600;
        break;
    }

    return Container(
      padding: EdgeInsets.symmetric(
        horizontal: compact ? 6 : 8,
        vertical: compact ? 2 : 4,
      ),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(6),
        border: Border.all(color: border, width: 1),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 6,
            height: 6,
            decoration: BoxDecoration(
              color: text,
              shape: BoxShape.circle,
            ),
          ),
          const SizedBox(width: 5),
          Text(
            priority.label,
            style: TextStyle(
              color: text,
              fontSize: compact ? 10 : 11,
              fontWeight: FontWeight.w600,
              fontFamily: 'Inter',
            ),
          ),
        ],
      ),
    );
  }
}
