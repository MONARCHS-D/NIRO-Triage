import 'package:flutter/material.dart';
import '../theme/app_colors.dart';

class DisclaimerBanner extends StatelessWidget {
  final bool compact;

  const DisclaimerBanner({
    super.key,
    this.compact = false,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.symmetric(
        horizontal: compact ? 10 : 12,
        vertical: compact ? 8 : 10,
      ),
      decoration: BoxDecoration(
        color: AppColors.surface100,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: AppColors.surface200, width: 1),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Icon(
            Icons.info_outline,
            size: 16,
            color: AppColors.ink600,
          ),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              'Educational prototype — triage-support only. Not a medical diagnosis or treatment system.',
              style: TextStyle(
                fontSize: compact ? 10 : 11,
                color: AppColors.ink600,
                height: 1.35,
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
