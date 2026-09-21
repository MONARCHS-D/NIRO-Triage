import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:niro_mobile/ui/features/auth/view_models/auth_view_model.dart';
import 'package:niro_mobile/ui/features/auth/views/login_screen.dart';
import 'package:niro_mobile/ui/features/reviewer/views/reviewer_shell_screen.dart';
import 'package:niro_mobile/ui/features/shell/main_shell_screen.dart';

class AppGatewayScreen extends StatelessWidget {
  const AppGatewayScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthViewModel>();

    if (!auth.isAuthenticated) {
      return const LoginScreen();
    }

    if (auth.isStaff) {
      return const ReviewerShellScreen();
    } else {
      return const MainShellScreen();
    }
  }
}
