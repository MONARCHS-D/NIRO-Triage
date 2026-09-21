import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:niro_mobile/ui/core/theme/app_colors.dart';
import 'package:niro_mobile/ui/features/auth/view_models/auth_view_model.dart';

Future<bool?> showLogoutConfirmationDialog(BuildContext context) {
  return showDialog<bool>(
    context: context,
    builder: (ctx) => AlertDialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      title: const Row(
        children: [
          Icon(Icons.logout, color: AppColors.danger600),
          SizedBox(width: 8),
          Text(
            'Log Out Session',
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w700,
              color: AppColors.ink950,
            ),
          ),
        ],
      ),
      content: const Text(
        'Are you sure you want to log out of NIRO Triage? You will be returned to the session login screen.',
        style: TextStyle(
          fontSize: 13,
          color: AppColors.ink600,
          height: 1.4,
        ),
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.of(ctx).pop(false),
          child: const Text(
            'Cancel',
            style: TextStyle(
              color: AppColors.ink600,
              fontWeight: FontWeight.w600,
            ),
          ),
        ),
        ElevatedButton.icon(
          onPressed: () {
            Navigator.of(ctx).pop(true);
            context.read<AuthViewModel>().logout();
          },
          icon: const Icon(Icons.logout, size: 16),
          label: const Text('Log Out'),
          style: ElevatedButton.styleFrom(
            backgroundColor: AppColors.danger600,
            foregroundColor: Colors.white,
            elevation: 0,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(8),
            ),
          ),
        ),
      ],
    ),
  );
}
