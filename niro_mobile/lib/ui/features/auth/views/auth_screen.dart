import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:niro_mobile/domain/models/auth.dart';
import 'package:niro_mobile/ui/core/theme/app_colors.dart';
import 'package:niro_mobile/ui/features/auth/view_models/auth_view_model.dart';
import 'package:niro_mobile/ui/features/auth/views/forgot_password_screen.dart';

class AuthScreen extends StatefulWidget {
  const AuthScreen({super.key});

  @override
  State<AuthScreen> createState() => _AuthScreenState();
}

class _AuthScreenState extends State<AuthScreen> {
  bool _isSignInTab = true;

  // Sign In Form Controllers
  final _signInIdController =
      TextEditingController(text: 'dr.sharma@health.odisha.gov.in');
  final _signInPasswordController = TextEditingController(text: 'demo123');
  bool _showSignInPassword = false;
  bool _rememberDevice = true;
  late String _signInFacility;

  // Sign Up Form Controllers
  final _signUpNameController = TextEditingController();
  final _signUpIdController = TextEditingController();
  final _signUpRegNoController = TextEditingController();
  final _signUpPasswordController = TextEditingController();
  final _signUpConfirmPasswordController = TextEditingController();
  bool _showSignUpPassword = false;
  bool _agreeToTerms = true;
  UserRole _signUpRole = UserRole.medicalOfficer;
  late String _signUpFacility;

  @override
  void initState() {
    super.initState();
    final defaultFacility = context.read<AuthViewModel>().selectedFacility;
    _signInFacility = defaultFacility;
    _signUpFacility = defaultFacility;
  }

  @override
  void dispose() {
    _signInIdController.dispose();
    _signInPasswordController.dispose();
    _signUpNameController.dispose();
    _signUpIdController.dispose();
    _signUpRegNoController.dispose();
    _signUpPasswordController.dispose();
    _signUpConfirmPasswordController.dispose();
    super.dispose();
  }

  void _handleSignIn() {
    final auth = context.read<AuthViewModel>();
    auth.loginWithCredentials(
      identifier: _signInIdController.text,
      password: _signInPasswordController.text,
      facility: _signInFacility,
    );
  }

  void _handleSignUp() {
    final auth = context.read<AuthViewModel>();
    if (_signUpPasswordController.text !=
        _signUpConfirmPasswordController.text) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Passwords do not match. Please verify and try again.'),
          backgroundColor: AppColors.danger600,
        ),
      );
      return;
    }
    if (!_agreeToTerms) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please accept the Terms of Service & Privacy Policy.'),
          backgroundColor: AppColors.warning700,
        ),
      );
      return;
    }

    auth.register(
      name: _signUpNameController.text.trim().isEmpty
          ? 'Dr. User'
          : _signUpNameController.text.trim(),
      role: _signUpRole,
      identifier: _signUpIdController.text.trim(),
      facility: _signUpFacility,
      password: _signUpPasswordController.text,
    );
  }

  void _handleQuickDemoLogin(UserRole role) {
    final auth = context.read<AuthViewModel>();
    auth.login(role: role);
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthViewModel>();

    return Scaffold(
      backgroundColor: AppColors.surface50,
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 20),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 440),
              child: Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 20, vertical: 24),
                decoration: BoxDecoration(
                  color: AppColors.surface0,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: AppColors.surface200),
                  boxShadow: [
                    BoxShadow(
                      color: AppColors.ink950.withValues(alpha: 0.04),
                      blurRadius: 18,
                      offset: const Offset(0, 4),
                    ),
                  ],
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    // Brand Header
                    Center(
                      child: Container(
                        width: 44,
                        height: 44,
                        decoration: BoxDecoration(
                          color: AppColors.primary600,
                          borderRadius: BorderRadius.circular(12),
                          boxShadow: [
                            BoxShadow(
                              color: AppColors.primary600.withValues(alpha: 0.25),
                              blurRadius: 8,
                              offset: const Offset(0, 3),
                            ),
                          ],
                        ),
                        child: const Center(
                          child: Text(
                            'NIRO',
                            style: TextStyle(
                              color: Colors.white,
                              fontSize: 13,
                              fontWeight: FontWeight.w800,
                              letterSpacing: 0.5,
                            ),
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(height: 10),
                    const Text(
                      'NIRO Triage',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        fontSize: 22,
                        fontWeight: FontWeight.w800,
                        color: AppColors.ink950,
                        letterSpacing: -0.5,
                      ),
                    ),
                    const SizedBox(height: 2),
                    const Text(
                      'People First. Care Faster.',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w500,
                        color: AppColors.ink500,
                      ),
                    ),
                    const SizedBox(height: 20),

                    // Tab Selector: Sign In vs Create Account
                    Container(
                      height: 42,
                      padding: const EdgeInsets.all(3),
                      decoration: BoxDecoration(
                        color: AppColors.surface100,
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: Row(
                        children: [
                          Expanded(
                            child: _buildTabButton(
                              title: 'Sign In',
                              isSelected: _isSignInTab,
                              onTap: () {
                                setState(() => _isSignInTab = true);
                                auth.clearError();
                              },
                            ),
                          ),
                          Expanded(
                            child: _buildTabButton(
                              title: 'Create Account',
                              isSelected: !_isSignInTab,
                              onTap: () {
                                setState(() => _isSignInTab = false);
                                auth.clearError();
                              },
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 18),

                    // Error Alert (if present)
                    if (auth.authError != null) ...[
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: AppColors.danger100,
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(
                              color:
                                  AppColors.danger600.withValues(alpha: 0.3)),
                        ),
                        child: Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Icon(Icons.error_outline,
                                size: 18, color: AppColors.danger700),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Text(
                                auth.authError!,
                                style: const TextStyle(
                                  fontSize: 12,
                                  color: AppColors.danger700,
                                  height: 1.35,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 14),
                    ],

                    // Tab Body
                    if (_isSignInTab)
                      _buildSignInForm(auth)
                    else
                      _buildSignUpForm(auth),

                    const SizedBox(height: 16),
                    const Divider(color: AppColors.surface200),
                    const SizedBox(height: 8),

                    // Prototype Disclaimer Footer
                    Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: const [
                        Icon(Icons.shield_outlined,
                            size: 14, color: AppColors.success600),
                        SizedBox(width: 6),
                        Flexible(
                          child: Text(
                            'Educational prototype · Triage-support only',
                            overflow: TextOverflow.ellipsis,
                            style: TextStyle(
                                fontSize: 11, color: AppColors.ink500),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildTabButton({
    required String title,
    required bool isSelected,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 150),
        decoration: BoxDecoration(
          color: isSelected ? AppColors.surface0 : Colors.transparent,
          borderRadius: BorderRadius.circular(8),
          boxShadow: isSelected
              ? [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.05),
                    blurRadius: 4,
                    offset: const Offset(0, 1),
                  ),
                ]
              : null,
        ),
        child: Center(
          child: Text(
            title,
            style: TextStyle(
              fontSize: 13,
              fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
              color: isSelected ? AppColors.primary700 : AppColors.ink600,
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildSignInForm(AuthViewModel auth) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        const Text(
          'Welcome back',
          style: TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.w700,
            color: AppColors.ink950,
          ),
        ),
        const SizedBox(height: 2),
        const Text(
          'Sign in to continue to your health facility workspace.',
          style: TextStyle(fontSize: 12, color: AppColors.ink600),
        ),
        const SizedBox(height: 16),

        // Identifier input
        _buildTextField(
          label: 'Work email / Staff ID / Mobile',
          controller: _signInIdController,
          hintText: 'e.g. dr.sharma@health.odisha.gov.in',
          prefixIcon: Icons.badge_outlined,
        ),
        const SizedBox(height: 12),

        // Password input
        _buildTextField(
          label: 'Password',
          controller: _signInPasswordController,
          hintText: '••••••••',
          prefixIcon: Icons.lock_outline,
          isObscured: !_showSignInPassword,
          suffixIcon: IconButton(
            icon: Icon(
              _showSignInPassword ? Icons.visibility_off : Icons.visibility,
              size: 18,
              color: AppColors.ink500,
            ),
            onPressed: () =>
                setState(() => _showSignInPassword = !_showSignInPassword),
          ),
        ),
        const SizedBox(height: 12),

        // Facility selector
        _buildFacilitySelector(
          selectedValue: _signInFacility,
          onChanged: (val) {
            if (val != null) setState(() => _signInFacility = val);
          },
          availableFacilities: auth.availableFacilities,
        ),
        const SizedBox(height: 10),

        // Remember Me & Forgot Password
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Flexible(
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  SizedBox(
                    height: 24,
                    width: 24,
                    child: Checkbox(
                      value: _rememberDevice,
                      activeColor: AppColors.primary600,
                      onChanged: (val) =>
                          setState(() => _rememberDevice = val ?? true),
                    ),
                  ),
                  const SizedBox(width: 4),
                  const Flexible(
                    child: Text(
                      'Remember device',
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(fontSize: 11, color: AppColors.ink600),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(width: 8),
            GestureDetector(
              onTap: () {
                Navigator.of(context).push(
                  MaterialPageRoute(
                    builder: (_) => const ForgotPasswordScreen(),
                  ),
                );
              },
              child: const Text(
                'Forgot password?',
                style: TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w600,
                  color: AppColors.primary600,
                  decoration: TextDecoration.underline,
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 16),

        // Submit Button
        SizedBox(
          height: 46,
          child: ElevatedButton(
            onPressed: auth.isLoading ? null : _handleSignIn,
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.primary600,
              foregroundColor: Colors.white,
              elevation: 0,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(8),
              ),
            ),
            child: auth.isLoading
                ? const SizedBox(
                    height: 20,
                    width: 20,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                    ),
                  )
                : const Text(
                    'Sign In to Workspace',
                    style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700),
                  ),
          ),
        ),
        const SizedBox(height: 20),

        // Quick Demo Accounts Section (Section 34 Alignment)
        Container(
          padding: const EdgeInsets.only(top: 14),
          decoration: const BoxDecoration(
            border: Border(top: BorderSide(color: AppColors.surface200)),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'ONE-CLICK DEMO CREDENTIALS',
                style: TextStyle(
                  fontSize: 10,
                  fontWeight: FontWeight.w800,
                  color: AppColors.ink500,
                  letterSpacing: 0.6,
                ),
              ),
              const SizedBox(height: 8),
              Row(
                children: [
                  Expanded(
                    child: _buildDemoCard(
                      name: 'Dr. Sharma',
                      role: 'Medical Officer',
                      onTap: () =>
                          _handleQuickDemoLogin(UserRole.medicalOfficer),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: _buildDemoCard(
                      name: 'Sunita B.',
                      role: 'Staff Nurse',
                      onTap: () => _handleQuickDemoLogin(UserRole.staffNurse),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: _buildDemoCard(
                      name: 'Citizen',
                      role: 'Patient Portal',
                      onTap: () => _handleQuickDemoLogin(UserRole.citizen),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildSignUpForm(AuthViewModel auth) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        const Text(
          'Create your account',
          style: TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.w700,
            color: AppColors.ink950,
          ),
        ),
        const SizedBox(height: 2),
        const Text(
          'Register to access clinical triage or citizen self-intake.',
          style: TextStyle(fontSize: 12, color: AppColors.ink600),
        ),
        const SizedBox(height: 14),

        // Role Selector Chips
        const Text(
          'Account Type',
          style: TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.w600,
            color: AppColors.ink800,
          ),
        ),
        const SizedBox(height: 6),
        Row(
          children: [
            _buildRoleChip(
              title: 'Doctor (MO)',
              role: UserRole.medicalOfficer,
            ),
            const SizedBox(width: 6),
            _buildRoleChip(
              title: 'Staff Nurse',
              role: UserRole.staffNurse,
            ),
            const SizedBox(width: 6),
            _buildRoleChip(
              title: 'Citizen',
              role: UserRole.citizen,
            ),
          ],
        ),
        const SizedBox(height: 12),

        // Full Name
        _buildTextField(
          label: 'Full Name',
          controller: _signUpNameController,
          hintText: _signUpRole == UserRole.medicalOfficer
              ? 'Dr. Rajesh Patel'
              : 'Priya Sharma',
          prefixIcon: Icons.person_outline,
        ),
        const SizedBox(height: 12),

        // Work Email / Mobile
        _buildTextField(
          label: 'Email / Mobile Number',
          controller: _signUpIdController,
          hintText: 'e.g. rajesh.patel@health.gov.in',
          prefixIcon: Icons.mail_outline,
        ),
        const SizedBox(height: 12),

        // Registration ID / ABHA ID
        _buildTextField(
          label: _signUpRole.isStaff
              ? 'Medical / Nursing Registration No.'
              : 'ABHA ID / Mobile (Optional)',
          controller: _signUpRegNoController,
          hintText: _signUpRole.isStaff ? 'e.g. SMC-2024-8921' : '14-digit ABHA ID',
          prefixIcon: Icons.verified_user_outlined,
        ),
        const SizedBox(height: 12),

        // Assigned Facility
        _buildFacilitySelector(
          selectedValue: _signUpFacility,
          onChanged: (val) {
            if (val != null) setState(() => _signUpFacility = val);
          },
          availableFacilities: auth.availableFacilities,
        ),
        const SizedBox(height: 12),

        // Password
        _buildTextField(
          label: 'Password',
          controller: _signUpPasswordController,
          hintText: 'At least 8 characters',
          prefixIcon: Icons.lock_outline,
          isObscured: !_showSignUpPassword,
        ),
        const SizedBox(height: 12),

        // Confirm Password
        _buildTextField(
          label: 'Confirm Password',
          controller: _signUpConfirmPasswordController,
          hintText: 'Re-enter password',
          prefixIcon: Icons.lock_outline,
          isObscured: !_showSignUpPassword,
          suffixIcon: IconButton(
            icon: Icon(
              _showSignUpPassword ? Icons.visibility_off : Icons.visibility,
              size: 18,
              color: AppColors.ink500,
            ),
            onPressed: () =>
                setState(() => _showSignUpPassword = !_showSignUpPassword),
          ),
        ),
        const SizedBox(height: 12),

        // Terms Checkbox
        Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            SizedBox(
              height: 24,
              width: 24,
              child: Checkbox(
                value: _agreeToTerms,
                activeColor: AppColors.primary600,
                onChanged: (val) =>
                    setState(() => _agreeToTerms = val ?? true),
              ),
            ),
            const SizedBox(width: 4),
            const Expanded(
              child: Text(
                'I acknowledge that NIRO Triage is a clinical decision-support prototype and does not replace licensed medical judgment.',
                style: TextStyle(fontSize: 10, color: AppColors.ink600, height: 1.35),
              ),
            ),
          ],
        ),
        const SizedBox(height: 16),

        // Register Button
        SizedBox(
          height: 46,
          child: ElevatedButton(
            onPressed: auth.isLoading ? null : _handleSignUp,
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.primary600,
              foregroundColor: Colors.white,
              elevation: 0,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(8),
              ),
            ),
            child: auth.isLoading
                ? const SizedBox(
                    height: 20,
                    width: 20,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                    ),
                  )
                : const Text(
                    'Create Account & Enter',
                    style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700),
                  ),
          ),
        ),
      ],
    );
  }

  Widget _buildRoleChip({required String title, required UserRole role}) {
    final isSelected = _signUpRole == role;
    return Expanded(
      child: GestureDetector(
        onTap: () => setState(() => _signUpRole = role),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 8),
          decoration: BoxDecoration(
            color: isSelected ? AppColors.primary100 : AppColors.surface50,
            borderRadius: BorderRadius.circular(6),
            border: Border.all(
              color: isSelected ? AppColors.primary600 : AppColors.surface200,
              width: isSelected ? 1.5 : 1.0,
            ),
          ),
          child: Center(
            child: Text(
              title,
              style: TextStyle(
                fontSize: 11,
                fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
                color: isSelected ? AppColors.primary700 : AppColors.ink800,
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildTextField({
    required String label,
    required TextEditingController controller,
    required String hintText,
    required IconData prefixIcon,
    bool isObscured = false,
    Widget? suffixIcon,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: const TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.w600,
            color: AppColors.ink800,
          ),
        ),
        const SizedBox(height: 4),
        TextField(
          controller: controller,
          obscureText: isObscured,
          style: const TextStyle(fontSize: 13, color: AppColors.ink950),
          decoration: InputDecoration(
            hintText: hintText,
            hintStyle: const TextStyle(fontSize: 12, color: AppColors.ink500),
            prefixIcon: Icon(prefixIcon, size: 18, color: AppColors.ink500),
            suffixIcon: suffixIcon,
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(8),
              borderSide: const BorderSide(color: AppColors.surface200),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(8),
              borderSide: const BorderSide(color: AppColors.surface200),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(8),
              borderSide: const BorderSide(color: AppColors.primary600, width: 1.5),
            ),
            contentPadding:
                const EdgeInsets.symmetric(horizontal: 12, vertical: 11),
            fillColor: AppColors.surface50,
            filled: true,
          ),
        ),
      ],
    );
  }

  Widget _buildFacilitySelector({
    required String selectedValue,
    required ValueChanged<String?> onChanged,
    required List<String> availableFacilities,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Health Facility',
          style: TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.w600,
            color: AppColors.ink800,
          ),
        ),
        const SizedBox(height: 4),
        DropdownButtonFormField<String>(
          initialValue: selectedValue,
          isExpanded: true,
          decoration: InputDecoration(
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(8),
              borderSide: const BorderSide(color: AppColors.surface200),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(8),
              borderSide: const BorderSide(color: AppColors.surface200),
            ),
            contentPadding:
                const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
            fillColor: AppColors.surface50,
            filled: true,
          ),
          items: availableFacilities.map((facility) {
            return DropdownMenuItem<String>(
              value: facility,
              child: Text(
                facility,
                style: const TextStyle(fontSize: 12, color: AppColors.ink950),
                overflow: TextOverflow.ellipsis,
              ),
            );
          }).toList(),
          onChanged: onChanged,
        ),
      ],
    );
  }

  Widget _buildDemoCard({
    required String name,
    required String role,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(8),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 8),
        decoration: BoxDecoration(
          color: AppColors.surface50,
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: AppColors.surface200),
        ),
        child: Column(
          children: [
            Text(
              name,
              style: const TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.w700,
                color: AppColors.ink950,
              ),
              overflow: TextOverflow.ellipsis,
            ),
            const SizedBox(height: 2),
            Text(
              role,
              style: const TextStyle(
                fontSize: 9,
                color: AppColors.ink500,
              ),
              overflow: TextOverflow.ellipsis,
            ),
          ],
        ),
      ),
    );
  }
}
