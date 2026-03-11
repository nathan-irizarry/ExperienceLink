/**
 * Auth Guard Module for ExperienceLink
 * Handles route protection and access control
 */

(function() {
    'use strict';

    const STORAGE_KEY = 'el_intended_destination';

    /**
     * Require authentication to access the current page
     * Redirects to login if not authenticated
     * @param {string} [redirectTo='login.html'] - URL to redirect if not authenticated
     * @returns {Promise<boolean>} - True if authenticated, false otherwise
     */
    async function requireAuth(redirectTo = 'login.html') {
        const Auth = window.ExperienceLink?.Auth;

        if (!Auth) {
            console.error('Auth module not loaded');
            return false;
        }

        const isAuth = await Auth.isAuthenticated();

        if (!isAuth) {
            // Store the intended destination
            storeIntendedDestination(window.location.href);
            // Redirect to login
            window.location.href = redirectTo;
            return false;
        }

        return true;
    }

    /**
     * Require a specific role to access the current page
     * @param {string|string[]} allowedRoles - Role(s) allowed to access ('student', 'company')
     * @param {string} [redirectTo='index.html'] - URL to redirect if role doesn't match
     * @returns {Promise<boolean>} - True if role matches, false otherwise
     */
    async function requireRole(allowedRoles, redirectTo = 'index.html') {
        const Auth = window.ExperienceLink?.Auth;

        if (!Auth) {
            console.error('Auth module not loaded');
            return false;
        }

        // First check authentication
        const isAuth = await Auth.isAuthenticated();
        if (!isAuth) {
            storeIntendedDestination(window.location.href);
            window.location.href = 'login.html';
            return false;
        }

        // Get user's role
        const userRole = await Auth.getUserRole();

        // Normalize allowedRoles to an array
        const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

        if (!userRole || !roles.includes(userRole)) {
            // Redirect to appropriate page
            window.location.href = redirectTo;
            return false;
        }

        return true;
    }

    /**
     * Redirect authenticated users away from login/signup pages
     * @param {string} [redirectTo] - URL to redirect to (defaults to role-based dashboard)
     * @returns {Promise<boolean>} - True if redirected, false if not authenticated
     */
    async function redirectIfAuthenticated(redirectTo) {
        const Auth = window.ExperienceLink?.Auth;

        if (!Auth) {
            console.error('Auth module not loaded');
            return false;
        }

        const isAuth = await Auth.isAuthenticated();

        if (isAuth) {
            if (redirectTo) {
                window.location.href = redirectTo;
            } else {
                // Redirect based on role
                await redirectToDashboard();
            }
            return true;
        }

        return false;
    }

    /**
     * Redirect user to their appropriate dashboard based on role
     * @returns {Promise<void>}
     */
    async function redirectToDashboard() {
        const Auth = window.ExperienceLink?.Auth;

        if (!Auth) {
            window.location.href = 'index.html';
            return;
        }

        // Check for stored intended destination first
        const intendedDestination = getIntendedDestination();
        if (intendedDestination) {
            clearIntendedDestination();
            window.location.href = intendedDestination;
            return;
        }

        // Otherwise redirect based on role
        const role = await Auth.getUserRole();

        switch (role) {
            case 'student':
                window.location.href = 'projects.html';
                break;
            case 'company':
                window.location.href = 'companies.html';
                break;
            default:
                window.location.href = 'index.html';
        }
    }

    /**
     * Store the intended destination for post-login redirect
     * @param {string} url - The URL to store
     */
    function storeIntendedDestination(url) {
        try {
            localStorage.setItem(STORAGE_KEY, url);
        } catch (e) {
            console.warn('Could not store intended destination:', e);
        }
    }

    /**
     * Get the stored intended destination
     * @returns {string|null}
     */
    function getIntendedDestination() {
        try {
            return localStorage.getItem(STORAGE_KEY);
        } catch (e) {
            return null;
        }
    }

    /**
     * Clear the stored intended destination
     */
    function clearIntendedDestination() {
        try {
            localStorage.removeItem(STORAGE_KEY);
        } catch (e) {
            console.warn('Could not clear intended destination:', e);
        }
    }

    /**
     * Initialize auth guard for a protected page
     * Call this on pages that require authentication
     * @param {Object} [options] - Guard options
     * @param {string} [options.requiredRole] - Required role to access page
     * @param {string} [options.redirectTo] - Custom redirect URL
     * @returns {Promise<boolean>}
     */
    async function initGuard(options = {}) {
        if (options.requiredRole) {
            return await requireRole(options.requiredRole, options.redirectTo);
        }
        return await requireAuth(options.redirectTo);
    }

    // Export AuthGuard module
    window.ExperienceLink.AuthGuard = {
        requireAuth,
        requireRole,
        redirectIfAuthenticated,
        redirectToDashboard,
        storeIntendedDestination,
        getIntendedDestination,
        clearIntendedDestination,
        initGuard
    };

})();
