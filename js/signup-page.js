/**
 * Signup Page Handler for ExperienceLink
 * Handles signup form submission, validation, and social signup
 */

(function() {
    'use strict';

    // Track current account type
    let currentAccountType = 'student';

    /**
     * Initialize signup page functionality
     */
    async function init() {
        const Auth = window.ExperienceLink?.Auth;
        const AuthGuard = window.ExperienceLink?.AuthGuard;

        if (!Auth) {
            console.error('Auth module not loaded');
            return;
        }

        // Redirect if already authenticated
        if (AuthGuard) {
            const redirected = await AuthGuard.redirectIfAuthenticated();
            if (redirected) return;
        }

        // Setup tab switching
        setupTabSwitching();

        // Setup form handler
        setupSignupForm();

        // Setup social signup buttons
        setupSocialSignup();
    }

    /**
     * Setup account type tab switching
     */
    function setupTabSwitching() {
        const studentTab = document.querySelector('[data-tab="student"]');
        const companyTab = document.querySelector('[data-tab="company"]');
        const accountTypeInput = document.getElementById('accountType');

        if (studentTab) {
            studentTab.addEventListener('click', () => {
                currentAccountType = 'student';
                if (accountTypeInput) {
                    accountTypeInput.value = 'student';
                }
            });
        }

        if (companyTab) {
            companyTab.addEventListener('click', () => {
                currentAccountType = 'company';
                if (accountTypeInput) {
                    accountTypeInput.value = 'company';
                }
            });
        }
    }

    /**
     * Setup signup form submission
     */
    function setupSignupForm() {
        const form = document.getElementById('signupForm');
        if (!form) return;

        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            // Gather form data
            const name = document.getElementById('name')?.value?.trim();
            const email = document.getElementById('email')?.value?.trim();
            const password = document.getElementById('password')?.value;
            const confirmPassword = document.getElementById('confirmPassword')?.value;
            const termsChecked = document.getElementById('terms')?.checked;
            const university = document.getElementById('university')?.value?.trim();
            const industry = document.getElementById('industry')?.value?.trim();

            // Validate inputs
            const validation = validateForm({
                name,
                email,
                password,
                confirmPassword,
                termsChecked,
                accountType: currentAccountType,
                university,
                industry
            });

            if (!validation.valid) {
                showError(validation.message);
                return;
            }

            // Show loading state
            const submitBtn = form.querySelector('button[type="submit"]');
            const originalText = submitBtn?.textContent;
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = `
                    <svg class="animate-spin h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating account...
                `;
            }

            try {
                const Auth = window.ExperienceLink.Auth;

                const userData = {
                    email,
                    password,
                    role: currentAccountType,
                    fullName: name,
                    university: currentAccountType === 'student' ? university : undefined,
                    industry: currentAccountType === 'company' ? industry : undefined
                };

                const { data, error } = await Auth.signUp(userData);

                if (error) {
                    showError(getErrorMessage(error));
                    resetButton(submitBtn, originalText);
                    return;
                }

                // Check if email confirmation is required
                if (data?.user?.identities?.length === 0) {
                    showError('An account with this email already exists.');
                    resetButton(submitBtn, originalText);
                    return;
                }

                if (data?.user && !data?.session) {
                    // Email confirmation required
                    showSuccess('Account created! Please check your email to confirm your account.');
                    resetButton(submitBtn, originalText);
                    return;
                }

                // Success - redirect to dashboard
                showSuccess('Account created successfully! Redirecting...');

                const AuthGuard = window.ExperienceLink.AuthGuard;
                if (AuthGuard) {
                    await AuthGuard.redirectToDashboard();
                } else {
                    window.location.href = currentAccountType === 'company' ? 'companies.html' : 'projects.html';
                }
            } catch (error) {
                console.error('Signup error:', error);
                showError('An unexpected error occurred. Please try again.');
                resetButton(submitBtn, originalText);
            }
        });
    }

    /**
     * Validate signup form
     * @param {Object} data - Form data
     * @returns {{valid: boolean, message: string}}
     */
    function validateForm(data) {
        const { name, email, password, confirmPassword, termsChecked, accountType, university, industry } = data;

        if (!name) {
            return { valid: false, message: 'Please enter your name' };
        }

        if (!email) {
            return { valid: false, message: 'Please enter your email address' };
        }

        // Email format validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return { valid: false, message: 'Please enter a valid email address' };
        }

        if (accountType === 'student' && !university) {
            return { valid: false, message: 'Please enter your university' };
        }

        if (accountType === 'company' && !industry) {
            return { valid: false, message: 'Please enter your industry' };
        }

        if (!password) {
            return { valid: false, message: 'Please enter a password' };
        }

        if (password.length < 8) {
            return { valid: false, message: 'Password must be at least 8 characters' };
        }

        if (password !== confirmPassword) {
            return { valid: false, message: 'Passwords do not match' };
        }

        if (!termsChecked) {
            return { valid: false, message: 'Please accept the Terms of Service and Privacy Policy' };
        }

        return { valid: true, message: '' };
    }

    /**
     * Setup social signup buttons
     */
    function setupSocialSignup() {
        const socialButtons = document.querySelectorAll('.social-btn');

        socialButtons.forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.preventDefault();

                const buttonText = btn.textContent?.trim().toLowerCase();
                let provider = null;

                if (buttonText?.includes('google')) {
                    provider = 'google';
                } else if (buttonText?.includes('apple')) {
                    provider = 'apple';
                }

                if (!provider) return;

                // Store the selected account type for after OAuth
                localStorage.setItem('el_pending_account_type', currentAccountType);

                // Disable button
                btn.disabled = true;
                btn.classList.add('opacity-50', 'cursor-not-allowed');

                try {
                    const Auth = window.ExperienceLink.Auth;
                    const { error } = await Auth.signInWithOAuth(provider);

                    if (error) {
                        showError(getErrorMessage(error));
                        btn.disabled = false;
                        btn.classList.remove('opacity-50', 'cursor-not-allowed');
                    }
                    // If successful, the page will redirect to OAuth provider
                } catch (error) {
                    console.error('OAuth error:', error);
                    showError('Failed to initialize OAuth signup');
                    btn.disabled = false;
                    btn.classList.remove('opacity-50', 'cursor-not-allowed');
                }
            });
        });
    }

    /**
     * Show error message
     * @param {string} message - Error message to display
     */
    function showError(message) {
        let errorDiv = document.getElementById('authError');

        if (!errorDiv) {
            errorDiv = document.createElement('div');
            errorDiv.id = 'authError';
            errorDiv.className = 'mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm';

            const form = document.getElementById('signupForm');
            if (form) {
                form.insertBefore(errorDiv, form.firstChild);
            }
        }

        errorDiv.textContent = message;
        errorDiv.classList.remove('hidden');

        // Scroll to error
        errorDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });

        // Auto-hide after 5 seconds
        setTimeout(() => {
            errorDiv.classList.add('hidden');
        }, 5000);
    }

    /**
     * Show success message
     * @param {string} message - Success message to display
     */
    function showSuccess(message) {
        let successDiv = document.getElementById('authSuccess');

        if (!successDiv) {
            successDiv = document.createElement('div');
            successDiv.id = 'authSuccess';
            successDiv.className = 'mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-600 text-sm';

            const form = document.getElementById('signupForm');
            if (form) {
                form.insertBefore(successDiv, form.firstChild);
            }
        }

        successDiv.textContent = message;
        successDiv.classList.remove('hidden');

        // Hide error if showing
        const errorDiv = document.getElementById('authError');
        if (errorDiv) {
            errorDiv.classList.add('hidden');
        }
    }

    /**
     * Reset button to original state
     * @param {HTMLElement} button - Button element
     * @param {string} originalText - Original button text
     */
    function resetButton(button, originalText) {
        if (button) {
            button.disabled = false;
            button.textContent = originalText || 'Create Account';
        }
    }

    /**
     * Get user-friendly error message
     * @param {Object} error - Error object
     * @returns {string}
     */
    function getErrorMessage(error) {
        const message = error?.message?.toLowerCase() || '';

        if (message.includes('user already registered')) {
            return 'An account with this email already exists. Please sign in instead.';
        }
        if (message.includes('password')) {
            return 'Password is too weak. Please use at least 8 characters with a mix of letters and numbers.';
        }
        if (message.includes('email')) {
            return 'Please enter a valid email address.';
        }

        return error?.message || 'An error occurred. Please try again.';
    }

    // Initialize on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
