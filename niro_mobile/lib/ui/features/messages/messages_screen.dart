import 'package:flutter/material.dart';
import 'package:niro_mobile/ui/core/theme/app_colors.dart';

class MessagesScreen extends StatelessWidget {
  const MessagesScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final messages = [
      {
        'title': 'Intake Received & Queued',
        'time': '10 mins ago',
        'body':
            'Your symptom submission has been received by City Community Health Center. Medical Officer Dr. A. Sharma will review it shortly.',
        'unread': true,
        'type': 'INFO',
      },
      {
        'title': 'Vitals Measurement Requested',
        'time': '1 hour ago',
        'body':
            'Staff Nurse Sunita B. requested that you proceed directly to Triage Station 2 for blood pressure and oxygen saturation check.',
        'unread': false,
        'type': 'ALERT',
      },
      {
        'title': 'Welcome to NIRO Triage',
        'time': 'Yesterday',
        'body':
            'NIRO Triage enables fast, multimodal intake in your regional Indic language. No diagnostic decisions are made by AI.',
        'unread': false,
        'type': 'WELCOME',
      },
    ];

    return Scaffold(
      backgroundColor: AppColors.surface50,
      appBar: AppBar(
        title: const Text('Clinic Notifications'),
      ),
      body: SafeArea(
        child: ListView.separated(
          padding: const EdgeInsets.all(16),
          itemCount: messages.length,
          separatorBuilder: (_, _) => const SizedBox(height: 12),
          itemBuilder: (context, index) {
            final msg = messages[index];
            final unread = msg['unread'] as bool;

            return Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: AppColors.surface0,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(
                  color: unread ? AppColors.primary600 : AppColors.surface200,
                  width: unread ? 1.5 : 1,
                ),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Row(
                        children: [
                          if (unread) ...[
                            Container(
                              width: 8,
                              height: 8,
                              decoration: const BoxDecoration(
                                color: AppColors.primary600,
                                shape: BoxShape.circle,
                              ),
                            ),
                            const SizedBox(width: 8),
                          ],
                          Text(
                            msg['title'] as String,
                            style: TextStyle(
                              fontSize: 14,
                              fontWeight:
                                  unread ? FontWeight.w700 : FontWeight.w600,
                              color: AppColors.ink950,
                            ),
                          ),
                        ],
                      ),
                      Text(
                        msg['time'] as String,
                        style: const TextStyle(
                          fontSize: 11,
                          color: AppColors.ink500,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Text(
                    msg['body'] as String,
                    style: const TextStyle(
                      fontSize: 12,
                      color: AppColors.ink600,
                      height: 1.4,
                    ),
                  ),
                ],
              ),
            );
          },
        ),
      ),
    );
  }
}
