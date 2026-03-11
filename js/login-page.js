/**
 * Login Page Handler for ExperienceLink
 * Handles login form submission and social login
 */

(function() {
    'use strict';

    /**
     * Initialize login page functionality
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

        // Setup form handler
        setupLoginForm();

        // Setup social login buttons
        setupSocialLogin();

        // Setup forgot password
        setupForgotPassword();

        // Check for password reset success
        checkPasswordReset();
    }

    /**
     * Setup login form submission
     */
    function setupLoginForm() {
        const form = document.getElementById('loginForm');
        if (!form) return;

        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const email = document.getElementById('email')?.value?.trim();
            const password = document.getElementById('password')?.value;

            // Validate inputs
            if (!email || !password) {
                showError('Please enter both email and password');
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
                    Signing in...
                `;
            }

            try {
                const Auth = window.ExperienceLink.Auth;
                const { data, error } = await Auth.signIn(email, password);

                if (error) {
                    showError(getErrorMessage(error));
                    resetButton(submitBtn, originalText);
                    return;
                }

                // Success - redirect to dashboard
                showSuccess('Login successful! Redirecting...');

                const AuthGuard = window.ExperienceLink.AuthGuard;
                if (AuthGuard) {
                    await AuthGuard.redirectToDashboard();
                } else {
                    window.location.href = 'projects.html';
                }
            } catch (error) {
                console.error('Login error:', error);
                showError('An unexpected error occurred. Please try again.');
                resetButton(submitBtn, originalText);
            }
        });
    }

    /**
     * Setup social login buttons
     */
    function setupSocialLogin() {
        const socialButtons = document.querySelectorAll('.social-btn');

        socialButtons.forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.preventDefault();

                const buttonText = btn.textContent?.trim().toLowerCase();
                let provider = null;

                if (buttonText?.includes('google')) {
                    provider = 'google';
                } else if (buttonText?.includes('github')) {
                    provider = 'github';
                }

                if (!provider) return;

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
                    showError('Failed to initialize OAuth login');
                    btn.disabled = false;
                    btn.classList.remove('opacity-50', 'cursor-not-allowed');
                }
            });
        });
    }

    /**
     * Setup forgot password link
     */
    function setupForgotPassword() {
        const forgotLink = document.querySelector('a[href="#"]');
        if (!forgotLink || !forgotLink.textContent?.includes('Forgot')) return;

        forgotLink.addEventListener('click', async (e) => {
            e.preventDefault();

            const email = document.getElementById('email')?.value?.trim();

            if (!email) {
                showError('Please enter your email address first');
                return;
            }

            // Validate email format
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                showError('Please enter a valid email address');
                return;
            }

            try {
                const Auth = window.ExperienceLink.Auth;
                const { error } = await Auth.resetPassword(email);

                if (error) {
                    showError(getErrorMessage(error));
                    return;
                }

                showSuccess('Password reset email sent! Check your inbox.');
            } catch (error) {
                console.error('Reset password error:', error);
                showError('Failed to send reset email. Please try again.');
            }
        });
    }

    /**
     * Check for password reset success message
     */
    function checkPasswordReset() {
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('reset') === 'true') {
            showSuccess('Password has been reset. Please sign in with your new password.');
            // Clean up URL
            window.history.replaceState({}, document.title, window.location.pathname);
        }
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
            errorDiv.className = 'mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm';

            const form = document.getElementById('loginForm');
            if (form) {
                form.insertBefore(errorDiv, form.firstChild);
            }
        }

        errorDiv.textContent = message;
        errorDiv.classList.remove('hidden');

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
            successDiv.className = 'mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-green-600 dark:text-green-400 text-sm';

            const form = document.getElementById('loginForm');
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
            button.textContent = originalText || 'Sign In';
        }
    }

    /**
     * Get user-friendly error message
     * @param {Object} error - Error object
     * @returns {string}
     */
    function getErrorMessage(error) {
        const message = error?.message?.toLowerCase() || '';

        if (message.includes('invalid login credentials')) {
            return 'Invalid email or password. Please try again.';
        }
        if (message.includes('email not confirmed')) {
            return 'Please confirm your email before signing in.';
        }
        if (message.includes('too many requests')) {
            return 'Too many login attempts. Please wait a moment and try again.';
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
