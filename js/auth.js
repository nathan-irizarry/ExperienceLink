/**
 * Authentication Module for ExperienceLink
 * Handles user signup, login, logout, and session management
 */

(function() {
    'use strict';

    const supabase = window.ExperienceLink?.supabase;

    if (!supabase) {
        console.error('Supabase client not initialized. Make sure supabase-client.js is loaded first.');
        return;
    }

    /**
     * Sign up a new user with email and password
     * @param {Object} userData - User registration data
     * @param {string} userData.email - User's email
     * @param {string} userData.password - User's password
     * @param {string} userData.role - User role ('student' or 'company')
     * @param {string} userData.fullName - Full name (for students) or company name (for companies)
     * @param {string} [userData.university] - University (required for students)
     * @param {string} [userData.industry] - Industry (required for companies)
     * @returns {Promise<{data: Object|null, error: Object|null}>}
     */
    async function signUp(userData) {
        const { email, password, role, fullName, university, industry } = userData;

        try {
            // Create the auth user
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        role,
                        full_name: fullName
                    },
                    emailRedirectTo: window.ExperienceLink.config.redirectUrl
                }
            });

            if (authError) {
                return { data: null, error: authError };
            }

            // If user was created successfully, create the profile
            if (authData.user) {
                const profileResult = await createProfile({
                    userId: authData.user.id,
                    email,
                    role,
                    fullName,
                    university,
                    industry
                });

                if (profileResult.error) {
                    console.error('Profile creation error:', profileResult.error);
                    // User is created but profile failed - they can complete it later
                }
            }

            return { data: authData, error: null };
        } catch (error) {
            console.error('Sign up error:', error);
            return { data: null, error };
        }
    }

    /**
     * Create user profile in the database
     * @param {Object} profileData - Profile data
     * @returns {Promise<{data: Object|null, error: Object|null}>}
     */
    async function createProfile(profileData) {
        const { userId, email, role, fullName, university, industry } = profileData;

        try {
            // Insert into profiles table
            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .insert({
                    id: userId,
                    email,
                    role,
                    full_name: fullName
                })
                .select()
                .single();

            if (profileError) {
                return { data: null, error: profileError };
            }

            // Insert into role-specific table
            if (role === 'student') {
                const { error: studentError } = await supabase
                    .from('students')
                    .insert({
                        profile_id: userId,
                        university: university || ''
                    });

                if (studentError) {
                    return { data: profile, error: studentError };
                }
            } else if (role === 'company') {
                const { error: companyError } = await supabase
                    .from('companies')
                    .insert({
                        profile_id: userId,
                        company_name: fullName,
                        industry: industry || ''
                    });

                if (companyError) {
                    return { data: profile, error: companyError };
                }
            }

            return { data: profile, error: null };
        } catch (error) {
            console.error('Create profile error:', error);
            return { data: null, error };
        }
    }

    /**
     * Sign in with email and password
     * @param {string} email - User's email
     * @param {string} password - User's password
     * @returns {Promise<{data: Object|null, error: Object|null}>}
     */
    async function signIn(email, password) {
        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password
            });

            return { data, error };
        } catch (error) {
            console.error('Sign in error:', error);
            return { data: null, error };
        }
    }

    /**
     * Sign in with OAuth provider (Google or GitHub)
     * @param {string} provider - OAuth provider ('google' or 'github')
     * @returns {Promise<{data: Object|null, error: Object|null}>}
     */
    async function signInWithOAuth(provider) {
        try {
            const { data, error } = await supabase.auth.signInWithOAuth({
                provider,
                options: {
                    redirectTo: window.ExperienceLink.config.redirectUrl
                }
            });

            return { data, error };
        } catch (error) {
            console.error('OAuth sign in error:', error);
            return { data: null, error };
        }
    }

    /**
     * Sign out the current user
     * @param {string} [redirectTo] - URL to redirect after logout
     * @returns {Promise<{error: Object|null}>}
     */
    async function signOut(redirectTo = 'index.html') {
        try {
            const { error } = await supabase.auth.signOut();

            if (!error) {
                // Clear any stored auth data
                localStorage.removeItem('el_intended_destination');

                // Redirect to specified page
                window.location.href = redirectTo;
            }

            return { error };
        } catch (error) {
            console.error('Sign out error:', error);
            return { error };
        }
    }

    /**
     * Get the current authenticated user
     * @returns {Promise<{data: Object|null, error: Object|null}>}
     */
    async function getCurrentUser() {
        try {
            const { data: { user }, error } = await supabase.auth.getUser();
            return { data: user, error };
        } catch (error) {
            console.error('Get current user error:', error);
            return { data: null, error };
        }
    }

    /**
     * Get the current session
     * @returns {Promise<{data: Object|null, error: Object|null}>}
     */
    async function getSession() {
        try {
            const { data: { session }, error } = await supabase.auth.getSession();
            return { data: session, error };
        } catch (error) {
            console.error('Get session error:', error);
            return { data: null, error };
        }
    }

    /**
     * Get the current user's profile from the database
     * @returns {Promise<{data: Object|null, error: Object|null}>}
     */
    async function getCurrentProfile() {
        try {
            const { data: user, error: userError } = await getCurrentUser();

            if (userError || !user) {
                return { data: null, error: userError || new Error('No user logged in') };
            }

            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('*, students(*), companies(*)')
                .eq('id', user.id)
                .single();

            return { data: profile, error: profileError };
        } catch (error) {
            console.error('Get current profile error:', error);
            return { data: null, error };
        }
    }

    /**
     * Send a password reset email
     * @param {string} email - User's email address
     * @returns {Promise<{data: Object|null, error: Object|null}>}
     */
    async function resetPassword(email) {
        try {
            const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: window.location.origin + '/login.html?reset=true'
            });

            return { data, error };
        } catch (error) {
            console.error('Reset password error:', error);
            return { data: null, error };
        }
    }

    /**
     * Update user password
     * @param {string} newPassword - New password
     * @returns {Promise<{data: Object|null, error: Object|null}>}
     */
    async function updatePassword(newPassword) {
        try {
            const { data, error } = await supabase.auth.updateUser({
                password: newPassword
            });

            return { data, error };
        } catch (error) {
            console.error('Update password error:', error);
            return { data: null, error };
        }
    }

    /**
     * Listen for auth state changes
     * @param {Function} callback - Callback function(event, session)
     * @returns {Object} - Subscription object with unsubscribe method
     */
    function onAuthStateChange(callback) {
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            callback(event, session);
        });

        return subscription;
    }

    /**
     * Check if user is authenticated
     * @returns {Promise<boolean>}
     */
    async function isAuthenticated() {
        const { data: session } = await getSession();
        return !!session;
    }

    /**
     * Get the user's role from their profile
     * @returns {Promise<string|null>}
     */
    async function getUserRole() {
        const { data: profile } = await getCurrentProfile();
        return profile?.role || null;
    }

    // Export Auth module
    window.ExperienceLink.Auth = {
        signUp,
        signIn,
        signInWithOAuth,
        signOut,
        getCurrentUser,
        getSession,
        getCurrentProfile,
        resetPassword,
        updatePassword,
        onAuthStateChange,
        isAuthenticated,
        getUserRole,
        createProfile
    };

})();
