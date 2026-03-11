/**
 * Profiles API Module for ExperienceLink
 * Handles CRUD operations for profiles, students, and companies
 */

(function() {
    'use strict';

    const supabase = window.ExperienceLink?.supabase;

    if (!supabase) {
        console.error('Supabase client not initialized. Make sure supabase-client.js is loaded first.');
        return;
    }

    // =====================
    // Profile Operations
    // =====================

    /**
     * Get a profile by user ID
     * @param {string} userId - User's UUID
     * @returns {Promise<{data: Object|null, error: Object|null}>}
     */
    async function getProfile(userId) {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*, students(*), companies(*)')
                .eq('id', userId)
                .single();

            return { data, error };
        } catch (error) {
            console.error('Get profile error:', error);
            return { data: null, error };
        }
    }

    /**
     * Update a profile
     * @param {string} userId - User's UUID
     * @param {Object} updates - Fields to update
     * @returns {Promise<{data: Object|null, error: Object|null}>}
     */
    async function updateProfile(userId, updates) {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .update(updates)
                .eq('id', userId)
                .select()
                .single();

            return { data, error };
        } catch (error) {
            console.error('Update profile error:', error);
            return { data: null, error };
        }
    }

    // =====================
    // Student Operations
    // =====================

    /**
     * Get student details by profile ID
     * @param {string} profileId - Profile UUID
     * @returns {Promise<{data: Object|null, error: Object|null}>}
     */
    async function getStudent(profileId) {
        try {
            const { data, error } = await supabase
                .from('students')
                .select('*, profiles(*)')
                .eq('profile_id', profileId)
                .single();

            return { data, error };
        } catch (error) {
            console.error('Get student error:', error);
            return { data: null, error };
        }
    }

    /**
     * Update student details
     * @param {string} profileId - Profile UUID
     * @param {Object} updates - Fields to update
     * @returns {Promise<{data: Object|null, error: Object|null}>}
     */
    async function updateStudent(profileId, updates) {
        try {
            const { data, error } = await supabase
                .from('students')
                .update(updates)
                .eq('profile_id', profileId)
                .select()
                .single();

            return { data, error };
        } catch (error) {
            console.error('Update student error:', error);
            return { data: null, error };
        }
    }

    /**
     * Get all students (for company views)
     * @param {Object} [options] - Query options
     * @param {number} [options.limit] - Number of results to return
     * @param {number} [options.offset] - Number of results to skip
     * @returns {Promise<{data: Array|null, error: Object|null}>}
     */
    async function getAllStudents(options = {}) {
        try {
            let query = supabase
                .from('students')
                .select('*, profiles(*)');

            if (options.limit) {
                query = query.limit(options.limit);
            }

            if (options.offset) {
                query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
            }

            const { data, error } = await query;

            return { data, error };
        } catch (error) {
            console.error('Get all students error:', error);
            return { data: null, error };
        }
    }

    // =====================
    // Company Operations
    // =====================

    /**
     * Get company details by profile ID
     * @param {string} profileId - Profile UUID
     * @returns {Promise<{data: Object|null, error: Object|null}>}
     */
    async function getCompany(profileId) {
        try {
            const { data, error } = await supabase
                .from('companies')
                .select('*, profiles(*)')
                .eq('profile_id', profileId)
                .single();

            return { data, error };
        } catch (error) {
            console.error('Get company error:', error);
            return { data: null, error };
        }
    }

    /**
     * Update company details
     * @param {string} profileId - Profile UUID
     * @param {Object} updates - Fields to update
     * @returns {Promise<{data: Object|null, error: Object|null}>}
     */
    async function updateCompany(profileId, updates) {
        try {
            const { data, error } = await supabase
                .from('companies')
                .update(updates)
                .eq('profile_id', profileId)
                .select()
                .single();

            return { data, error };
        } catch (error) {
            console.error('Update company error:', error);
            return { data: null, error };
        }
    }

    /**
     * Get all companies (for browsing)
     * @param {Object} [options] - Query options
     * @param {number} [options.limit] - Number of results to return
     * @param {number} [options.offset] - Number of results to skip
     * @param {string} [options.industry] - Filter by industry
     * @returns {Promise<{data: Array|null, error: Object|null}>}
     */
    async function getAllCompanies(options = {}) {
        try {
            let query = supabase
                .from('companies')
                .select('*, profiles(*)');

            if (options.industry) {
                query = query.eq('industry', options.industry);
            }

            if (options.limit) {
                query = query.limit(options.limit);
            }

            if (options.offset) {
                query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
            }

            const { data, error } = await query;

            return { data, error };
        } catch (error) {
            console.error('Get all companies error:', error);
            return { data: null, error };
        }
    }

    /**
     * Create a student record for an OAuth user
     * @param {string} profileId - Profile UUID
     * @param {string} university - University name
     * @returns {Promise<{data: Object|null, error: Object|null}>}
     */
    async function createStudent(profileId, university) {
        try {
            const { data, error } = await supabase
                .from('students')
                .insert({
                    profile_id: profileId,
                    university
                })
                .select()
                .single();

            return { data, error };
        } catch (error) {
            console.error('Create student error:', error);
            return { data: null, error };
        }
    }

    /**
     * Create a company record for an OAuth user
     * @param {string} profileId - Profile UUID
     * @param {string} companyName - Company name
     * @param {string} industry - Industry
     * @returns {Promise<{data: Object|null, error: Object|null}>}
     */
    async function createCompany(profileId, companyName, industry) {
        try {
            const { data, error } = await supabase
                .from('companies')
                .insert({
                    profile_id: profileId,
                    company_name: companyName,
                    industry
                })
                .select()
                .single();

            return { data, error };
        } catch (error) {
            console.error('Create company error:', error);
            return { data: null, error };
        }
    }

    // Export Profiles module
    window.ExperienceLink.Profiles = {
        // Profile operations
        getProfile,
        updateProfile,

        // Student operations
        getStudent,
        updateStudent,
        getAllStudents,
        createStudent,

        // Company operations
        getCompany,
        updateCompany,
        getAllCompanies,
        createCompany
    };

})();
