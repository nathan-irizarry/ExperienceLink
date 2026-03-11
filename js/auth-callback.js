/**
 * Auth Callback Handler for ExperienceLink
 * Handles OAuth redirects and profile completion for new users
 */

(function() {
    'use strict';

    /**
     * Initialize callback handler
     */
    async function init() {
        const supabase = window.ExperienceLink?.supabase;
        const Auth = window.ExperienceLink?.Auth;

        if (!supabase || !Auth) {
            showError('Authentication system not available. Please try again.');
            return;
        }

        try {
            // Get session from URL hash (OAuth callback)
            const { data: { session }, error } = await supabase.auth.getSession();

            if (error) {
                console.error('Session error:', error);
                showError(error.message);
                return;
            }

            if (!session) {
                showError('No session found. Please try signing in again.');
                return;
            }

            // Check if user has a profile
            const { data: profile } = await Auth.getCurrentProfile();

            if (profile && profile.role) {
                // User has a complete profile, redirect to dashboard
                redirectToDashboard(profile.role);
            } else {
                // New OAuth user - show role selection
                showRoleSelection(session.user);
            }
        } catch (error) {
            console.error('Callback error:', error);
            showError('An unexpected error occurred. Please try again.');
        }
    }

    /**
     * Show role selection modal for new OAuth users
     * @param {Object} user - Supabase user object
     */
    function showRoleSelection(user) {
        const loadingState = document.getElementById('loadingState');
        const roleModal = document.getElementById('roleSelectionModal');

        if (loadingState) loadingState.classList.add('hidden');
        if (roleModal) roleModal.classList.remove('hidden');

        // Check for pending account type from signup page
        const pendingAccountType = localStorage.getItem('el_pending_account_type');
        if (pendingAccountType) {
            const radioInput = document.querySelector(`input[name="role"][value="${pendingAccountType}"]`);
            if (radioInput) {
                radioInput.checked = true;
                updateFieldVisibility(pendingAccountType);
            }
            localStorage.removeItem('el_pending_account_type');
        }

        setupRoleSelection(user);
    }

    /**
     * Setup role selection form handlers
     * @param {Object} user - Supabase user object
     */
    function setupRoleSelection(user) {
        const form = document.getElementById('roleSelectionForm');
        const roleInputs = document.querySelectorAll('input[name="role"]');
        const studentField = document.getElementById('studentField');
        const companyFields = document.getElementById('companyFields');

        // Handle role radio changes
        roleInputs.forEach(input => {
            input.addEventListener('change', () => {
                updateFieldVisibility(input.value);
            });
        });

        // Handle form submission
        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();

                const role = document.querySelector('input[name="role"]:checked')?.value;
                const university = document.getElementById('university')?.value?.trim();
                const companyName = document.getElementById('companyName')?.value?.trim();
                const industry = document.getElementById('industry')?.value?.trim();

                // Validate
                if (role === 'student' && !university) {
                    showRoleError('Please enter your university');
                    return;
                }

                if (role === 'company') {
                    if (!companyName) {
                        showRoleError('Please enter your company name');
                        return;
                    }
                    if (!industry) {
                        showRoleError('Please enter your industry');
                        return;
                    }
                }

                // Show loading
                const submitBtn = form.querySelector('button[type="submit"]');
                if (submitBtn) {
                    submitBtn.disabled = true;
                    submitBtn.innerHTML = `
                        <svg class="animate-spin h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Creating profile...
                    `;
                }

                try {
                    await completeProfile(user, {
                        role,
                        fullName: role === 'company' ? companyName : (user.user_metadata?.full_name || user.email?.split('@')[0] || 'User'),
                        university,
                        companyName,
                        industry
                    });
                } catch (error) {
                    console.error('Profile creation error:', error);
                    showRoleError('Failed to create profile. Please try again.');
                    if (submitBtn) {
                        submitBtn.disabled = false;
                        submitBtn.textContent = 'Complete Registration';
                    }
                }
            });
        }
    }

    /**
     * Update field visibility based on selected role
     * @param {string} role - Selected role
     */
    function updateFieldVisibility(role) {
        const studentField = document.getElementById('studentField');
        const companyFields = document.getElementById('companyFields');

        if (role === 'student') {
            if (studentField) studentField.classList.remove('hidden');
            if (companyFields) companyFields.classList.add('hidden');
        } else {
            if (studentField) studentField.classList.add('hidden');
            if (companyFields) companyFields.classList.remove('hidden');
        }
    }

    /**
     * Complete the user's profile
     * @param {Object} user - Supabase user object
     * @param {Object} data - Profile data
     */
    async function completeProfile(user, data) {
        const supabase = window.ExperienceLink.supabase;
        const Profiles = window.ExperienceLink.Profiles;

        // Create profile record
        const { error: profileError } = await supabase
            .from('profiles')
            .insert({
                id: user.id,
                email: user.email,
                role: data.role,
                full_name: data.fullName
            });

        if (profileError) {
            // Profile might already exist, try to update
            if (profileError.code === '23505') { // Unique violation
                await supabase
                    .from('profiles')
                    .update({
                        role: data.role,
                        full_name: data.fullName
                    })
                    .eq('id', user.id);
            } else {
                throw profileError;
            }
        }

        // Create role-specific record
        if (data.role === 'student') {
            const { error } = await supabase
                .from('students')
                .insert({
                    profile_id: user.id,
                    university: data.university
                });

            if (error && error.code !== '23505') {
                throw error;
            }
        } else if (data.role === 'company') {
            const { error } = await supabase
                .from('companies')
                .insert({
                    profile_id: user.id,
                    company_name: data.companyName,
                    industry: data.industry
                });

            if (error && error.code !== '23505') {
                throw error;
            }
        }

        // Redirect to dashboard
        redirectToDashboard(data.role);
    }

    /**
     * Redirect user to their dashboard
     * @param {string} role - User's role
     */
    function redirectToDashboard(role) {
        const AuthGuard = window.ExperienceLink?.AuthGuard;

        if (AuthGuard) {
            AuthGuard.redirectToDashboard();
        } else {
            window.location.href = role === 'company' ? 'companies.html' : 'projects.html';
        }
    }

    /**
     * Show error in role selection form
     * @param {string} message - Error message
     */
    function showRoleError(message) {
        const errorDiv = document.getElementById('roleError');
        if (errorDiv) {
            errorDiv.textContent = message;
            errorDiv.classList.remove('hidden');
        }
    }

    /**
     * Show error state
     * @param {string} message - Error message
     */
    function showError(message) {
        const loadingState = document.getElementById('loadingState');
        const errorState = document.getElementById('errorState');
        const errorMessage = document.getElementById('errorMessage');

        if (loadingState) loadingState.classList.add('hidden');
        if (errorState) errorState.classList.remove('hidden');
        if (errorMessage) errorMessage.textContent = message;
    }

    // Initialize on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
