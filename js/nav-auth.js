/**
 * Navigation Auth Handler for ExperienceLink
 * Updates navigation UI based on authentication state
 */

(function() {
    'use strict';

    /**
     * Initialize navigation auth state
     * Updates the navigation to show appropriate links based on auth status
     */
    async function initNavAuth() {
        const Auth = window.ExperienceLink?.Auth;

        if (!Auth) {
            console.error('Auth module not loaded');
            return;
        }

        const isAuth = await Auth.isAuthenticated();

        if (isAuth) {
            await showAuthenticatedNav();
        } else {
            showUnauthenticatedNav();
        }

        // Listen for auth state changes
        Auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_IN' && session) {
                showAuthenticatedNav();
            } else if (event === 'SIGNED_OUT') {
                showUnauthenticatedNav();
            }
        });
    }

    /**
     * Show navigation for authenticated users
     */
    async function showAuthenticatedNav() {
        const Auth = window.ExperienceLink?.Auth;
        const profile = Auth ? (await Auth.getCurrentProfile()).data : null;
        const user = Auth ? (await Auth.getCurrentUser()).data : null;

        // Add email and full_name from auth user to profile for display purposes
        if (profile) {
            if (user?.email) {
                profile.email = user.email;
            }
            // Use auth user metadata full_name if profile doesn't have one
            if (!profile.full_name && user?.user_metadata?.full_name) {
                profile.full_name = user.user_metadata.full_name;
            }
        }

        // Get nav elements
        const loginLinks = document.querySelectorAll('a[href="login.html"]');
        const signupLinks = document.querySelectorAll('a[href="signup.html"]');
        const navActions = document.querySelector('.nav-actions');

        // Hide login/signup links
        loginLinks.forEach(link => {
            link.style.display = 'none';
        });
        signupLinks.forEach(link => {
            link.style.display = 'none';
        });

        // Add user menu if it doesn't exist
        if (navActions && !document.getElementById('userMenu')) {
            const userMenu = createUserMenu(profile);

            // Insert before the mobile menu button
            const mobileMenuBtn = navActions.querySelector('[data-mobile-menu-btn]');
            if (mobileMenuBtn) {
                navActions.insertBefore(userMenu, mobileMenuBtn);
            } else {
                navActions.appendChild(userMenu);
            }
        }

        // Update mobile menu
        updateMobileMenu(profile);

        // Update role-based navigation links
        updateRoleBasedLinks(profile);
    }

    /**
     * Show navigation for unauthenticated users
     */
    function showUnauthenticatedNav() {
        // Show login/signup links
        const loginLinks = document.querySelectorAll('a[href="login.html"]');
        const signupLinks = document.querySelectorAll('a[href="signup.html"]');

        loginLinks.forEach(link => {
            link.style.display = '';
        });
        signupLinks.forEach(link => {
            link.style.display = '';
        });

        // Remove user menu if it exists
        const userMenu = document.getElementById('userMenu');
        if (userMenu) {
            userMenu.remove();
        }

        // Reset mobile menu
        resetMobileMenu();

        // Reset role-based navigation links
        resetRoleBasedLinks();
    }

    /**
     * Create the user menu dropdown
     * @param {Object} profile - User profile data
     * @returns {HTMLElement}
     */
    function createUserMenu(profile) {
        const container = document.createElement('div');
        container.id = 'userMenu';
        container.className = 'relative hidden md:block';

        // Get first name for display and initials for avatar
        const fullName = profile?.full_name || '';
        const firstName = fullName.split(' ')[0] || 'User';
        const initials = fullName
            ? fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
            : 'U';

        container.innerHTML = `
            <button id="userMenuBtn" class="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-stone-100 transition-colors">
                <div class="avatar avatar-sm bg-amber/20 text-amber">${initials}</div>
                <span class="text-stone-700 text-sm font-medium max-w-[100px] truncate">${firstName}</span>
                <svg class="w-4 h-4 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                </svg>
            </button>
            <div id="userMenuDropdown" class="absolute right-0 top-full mt-2 w-48 py-2 bg-cream rounded-xl shadow-lg border border-stone-200 opacity-0 invisible transition-all duration-200 z-50">
                <div class="px-4 py-2 border-b border-stone-200">
                    <p class="text-xs text-stone-500 uppercase tracking-wider">Signed in as</p>
                    <p class="text-sm text-stone-900 font-medium truncate">${profile?.email || ''}</p>
                </div>
                <a href="${profile?.role === 'company' ? 'companies.html' : 'projects.html'}" class="flex items-center gap-3 px-4 py-2 text-sm text-stone-700 hover:bg-stone-100 transition-colors">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"/>
                    </svg>
                    Dashboard
                </a>
                <button id="logoutBtn" class="flex items-center gap-3 w-full px-4 py-2 text-sm text-red-600 hover:bg-stone-100 transition-colors">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
                    </svg>
                    Sign Out
                </button>
            </div>
        `;

        // Setup dropdown toggle
        setTimeout(() => {
            const btn = document.getElementById('userMenuBtn');
            const dropdown = document.getElementById('userMenuDropdown');
            const logoutBtn = document.getElementById('logoutBtn');

            if (btn && dropdown) {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const isVisible = !dropdown.classList.contains('invisible');
                    if (isVisible) {
                        dropdown.classList.add('invisible', 'opacity-0');
                    } else {
                        dropdown.classList.remove('invisible', 'opacity-0');
                    }
                });

                // Close on outside click
                document.addEventListener('click', () => {
                    dropdown.classList.add('invisible', 'opacity-0');
                });

                dropdown.addEventListener('click', (e) => {
                    e.stopPropagation();
                });
            }

            if (logoutBtn) {
                logoutBtn.addEventListener('click', handleLogout);
            }
        }, 0);

        return container;
    }

    /**
     * Update mobile menu for authenticated users
     * @param {Object} profile - User profile data
     */
    function updateMobileMenu(profile) {
        const mobileMenu = document.querySelector('[data-mobile-menu]');
        if (!mobileMenu) return;

        // Find the buttons container in mobile menu
        const btnContainer = mobileMenu.querySelector('.flex.flex-col');
        if (!btnContainer) return;

        // Update buttons
        btnContainer.innerHTML = `
            <a href="${profile?.role === 'company' ? 'companies.html' : 'projects.html'}" class="btn btn-secondary w-full">Dashboard</a>
            <button id="mobileLogoutBtn" class="btn btn-primary w-full bg-red-600 hover:bg-red-700 border-red-600">Sign Out</button>
        `;

        // Add logout handler
        const mobileLogoutBtn = document.getElementById('mobileLogoutBtn');
        if (mobileLogoutBtn) {
            mobileLogoutBtn.addEventListener('click', handleLogout);
        }
    }

    /**
     * Reset mobile menu for unauthenticated users
     */
    function resetMobileMenu() {
        const mobileMenu = document.querySelector('[data-mobile-menu]');
        if (!mobileMenu) return;

        const btnContainer = mobileMenu.querySelector('.flex.flex-col');
        if (!btnContainer) return;

        btnContainer.innerHTML = `
            <a href="login.html" class="btn btn-secondary w-full">Login</a>
            <a href="signup.html" class="btn btn-primary w-full">Get Started</a>
        `;
    }

    /**
     * Update role-based navigation links visibility
     * Hides "For Students" for companies and "For Companies" for students
     * @param {Object} profile - User profile data
     */
    function updateRoleBasedLinks(profile) {
        const role = profile?.role;

        // Find the role-specific links
        const forStudentsLinks = document.querySelectorAll('a.nav-link[href="projects.html"]');
        const forCompaniesLinks = document.querySelectorAll('a.nav-link[href="companies.html"]');

        // Filter to only get the "For Students" and "For Companies" text links
        forStudentsLinks.forEach(link => {
            if (link.textContent.trim() === 'For Students') {
                link.style.display = role === 'company' ? 'none' : '';
            }
        });

        forCompaniesLinks.forEach(link => {
            if (link.textContent.trim() === 'For Companies') {
                link.style.display = role === 'student' ? 'none' : '';
            }
        });
    }

    /**
     * Reset role-based navigation links visibility
     * Restores both "For Students" and "For Companies" links
     */
    function resetRoleBasedLinks() {
        const forStudentsLinks = document.querySelectorAll('a.nav-link[href="projects.html"]');
        const forCompaniesLinks = document.querySelectorAll('a.nav-link[href="companies.html"]');

        forStudentsLinks.forEach(link => {
            if (link.textContent.trim() === 'For Students') {
                link.style.display = '';
            }
        });

        forCompaniesLinks.forEach(link => {
            if (link.textContent.trim() === 'For Companies') {
                link.style.display = '';
            }
        });
    }

    /**
     * Handle logout button click
     */
    async function handleLogout() {
        const Auth = window.ExperienceLink?.Auth;
        if (Auth) {
            await Auth.signOut('index.html');
        }
    }

    // Initialize on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initNavAuth);
    } else {
        initNavAuth();
    }

    // Export for manual use
    window.ExperienceLink.NavAuth = {
        init: initNavAuth,
        showAuthenticatedNav,
        showUnauthenticatedNav
    };

})();
