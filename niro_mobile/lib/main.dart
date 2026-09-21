import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import 'data/repositories/triage_repository_impl.dart';
import 'domain/repositories/triage_repository.dart';
import 'ui/core/theme/app_theme.dart';
import 'ui/features/auth/view_models/auth_view_model.dart';
import 'ui/features/intake/view_models/intake_view_model.dart';
import 'ui/features/reviewer/view_models/reviewer_view_model.dart';
import 'ui/features/shell/app_gateway_screen.dart';
import 'ui/features/visits/view_models/visits_view_model.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const NiroTriageApp());
}

class NiroTriageApp extends StatelessWidget {
  const NiroTriageApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        // Repository Injection (Clean Architecture)
        Provider<ITriageRepository>(
          create: (_) => TriageRepositoryImpl(),
        ),
        // ViewModels
        ChangeNotifierProvider<AuthViewModel>(
          create: (_) => AuthViewModel(),
        ),
        ChangeNotifierProvider<ReviewerViewModel>(
          create: (ctx) => ReviewerViewModel(
            repository: ctx.read<ITriageRepository>(),
          ),
        ),
        ChangeNotifierProvider<IntakeViewModel>(
          create: (ctx) => IntakeViewModel(
            repository: ctx.read<ITriageRepository>(),
          ),
        ),
        ChangeNotifierProvider<VisitsViewModel>(
          create: (ctx) => VisitsViewModel(
            repository: ctx.read<ITriageRepository>(),
          ),
        ),
      ],
      child: MaterialApp(
        title: 'NIRO Triage',
        debugShowCheckedModeBanner: false,
        theme: AppTheme.lightTheme,
        home: const AppGatewayScreen(),
      ),
    );
  }
}
