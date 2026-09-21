import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:niro_mobile/ui/core/theme/app_colors.dart';
import 'package:niro_mobile/ui/features/reviewer/view_models/reviewer_view_model.dart';
import 'dashboard_screen.dart';
import 'triage_queue_screen.dart';
import 'staff_profile_screen.dart';

class ReviewerShellScreen extends StatefulWidget {
  const ReviewerShellScreen({super.key});

  @override
  State<ReviewerShellScreen> createState() => _ReviewerShellScreenState();
}

class _ReviewerShellScreenState extends State<ReviewerShellScreen> {
  int _currentIndex = 0;

  @override
  Widget build(BuildContext context) {
    final reviewer = context.watch<ReviewerViewModel>();
    final awaitingCount = reviewer.awaitingReviewCount;

    final pages = [
      DashboardScreen(
        onNavigateToQueue: () => setState(() => _currentIndex = 1),
      ),
      const TriageQueueScreen(),
      const StaffProfileScreen(),
    ];

    return Scaffold(
      body: IndexedStack(
        index: _currentIndex,
        children: pages,
      ),
      bottomNavigationBar: Container(
        decoration: const BoxDecoration(
          color: AppColors.surface0,
          border: Border(
            top: BorderSide(color: AppColors.surface200),
          ),
        ),
        child: BottomNavigationBar(
          currentIndex: _currentIndex,
          onTap: (index) => setState(() => _currentIndex = index),
          backgroundColor: AppColors.surface0,
          selectedItemColor: AppColors.primary600,
          unselectedItemColor: AppColors.ink500,
          selectedLabelStyle: const TextStyle(
            fontSize: 11,
            fontWeight: FontWeight.w700,
          ),
          unselectedLabelStyle: const TextStyle(
            fontSize: 11,
            fontWeight: FontWeight.w500,
          ),
          type: BottomNavigationBarType.fixed,
          elevation: 0,
          items: [
            const BottomNavigationBarItem(
              icon: Icon(Icons.dashboard_outlined),
              activeIcon: Icon(Icons.dashboard),
              label: 'Dashboard',
            ),
            BottomNavigationBarItem(
              icon: Badge(
                isLabelVisible: awaitingCount > 0,
                label: Text(
                  '$awaitingCount',
                  style: const TextStyle(
                    fontSize: 10,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                backgroundColor: AppColors.warning700,
                child: const Icon(Icons.format_list_bulleted_outlined),
              ),
              activeIcon: Badge(
                isLabelVisible: awaitingCount > 0,
                label: Text(
                  '$awaitingCount',
                  style: const TextStyle(
                    fontSize: 10,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                backgroundColor: AppColors.warning700,
                child: const Icon(Icons.format_list_bulleted),
              ),
              label: 'Queue',
            ),
            const BottomNavigationBarItem(
              icon: Icon(Icons.person_outline),
              activeIcon: Icon(Icons.person),
              label: 'Profile',
            ),
          ],
        ),
      ),
    );
  }
}
