/**
 * ExperienceLink - Supabase Client Configuration
 *
 * This file initializes the Supabase client and exports it for use
 * throughout the application.
 *
 * SETUP INSTRUCTIONS:
 * 1. Create a Supabase project at https://supabase.com
 * 2. Get your project URL and anon key from Settings > API
 * 3. Replace the placeholders below with your actual values
 */

// Supabase Configuration - Replace with your actual values
const SUPABASE_URL = 'YOUR_SUPABASE_URL'; // e.g., 'https://xxxxx.supabase.co'
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY'; // Your anon/public key

// Initialize the Supabase client
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Export for use in other modules
window.supabaseClient = supabase;

// ============================================
// AUTHENTICATION HELPERS
// ============================================

const Auth = {
    /**
     * Sign up a new user
     * @param {string} email - User email
     * @param {string} password - User password
     * @param {string} role - 'student' or 'company'
     * @param {object} metadata - Additional user metadata
     */
    async signUp(email, password, role, metadata = {}) {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    role,
                    ...metadata
                }
            }
        });

        if (error) throw error;
        return data;
    },

    /**
     * Sign in an existing user
     * @param {string} email - User email
     * @param {string} password - User password
     */
    async signIn(email, password) {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (error) throw error;
        return data;
    },

    /**
     * Sign in with OAuth provider
     * @param {string} provider - 'google' or 'github'
     */
    async signInWithOAuth(provider) {
        const { data, error } = await supabase.auth.signInWithOAuth({
            provider,
            options: {
                redirectTo: window.location.origin + '/projects.html'
            }
        });

        if (error) throw error;
        return data;
    },

    /**
     * Sign out the current user
     */
    async signOut() {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        window.location.href = '/login.html';
    },

    /**
     * Get current user
     */
    async getCurrentUser() {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error) throw error;
        return user;
    },

    /**
     * Get current session
     */
    async getSession() {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        return session;
    },

    /**
     * Listen to auth state changes
     * @param {function} callback - Function to call on auth state change
     */
    onAuthStateChange(callback) {
        return supabase.auth.onAuthStateChange(callback);
    },

    /**
     * Send password reset email
     * @param {string} email - User email
     */
    async resetPassword(email) {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: window.location.origin + '/reset-password.html'
        });
        if (error) throw error;
    },

    /**
     * Update user password
     * @param {string} newPassword - New password
     */
    async updatePassword(newPassword) {
        const { error } = await supabase.auth.updateUser({
            password: newPassword
        });
        if (error) throw error;
    }
};

// ============================================
// PROFILE HELPERS
// ============================================

const Profiles = {
    /**
     * Get current user's profile
     */
    async getCurrentProfile() {
        const user = await Auth.getCurrentUser();
        if (!user) return null;

        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

        if (error) throw error;
        return data;
    },

    /**
     * Get profile by ID
     * @param {string} profileId - Profile UUID
     */
    async getProfile(profileId) {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', profileId)
            .single();

        if (error) throw error;
        return data;
    },

    /**
     * Update current user's profile
     * @param {object} updates - Profile fields to update
     */
    async updateProfile(updates) {
        const user = await Auth.getCurrentUser();
        if (!user) throw new Error('Not authenticated');

        const { data, error } = await supabase
            .from('profiles')
            .update(updates)
            .eq('id', user.id)
            .select()
            .single();

        if (error) throw error;
        return data;
    }
};

// ============================================
// STUDENT HELPERS
// ============================================

const Students = {
    /**
     * Get current student profile
     */
    async getCurrentStudent() {
        const user = await Auth.getCurrentUser();
        if (!user) return null;

        const { data, error } = await supabase
            .from('students')
            .select(`
                *,
                profile:profiles(*),
                skills:student_skills(
                    proficiency_level,
                    skill:skills(*)
                )
            `)
            .eq('profile_id', user.id)
            .single();

        if (error && error.code !== 'PGRST116') throw error;
        return data;
    },

    /**
     * Create student profile
     * @param {object} studentData - Student profile data
     */
    async createStudent(studentData) {
        const user = await Auth.getCurrentUser();
        if (!user) throw new Error('Not authenticated');

        const { data, error } = await supabase
            .from('students')
            .insert({
                profile_id: user.id,
                ...studentData
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    /**
     * Update student profile
     * @param {object} updates - Student fields to update
     */
    async updateStudent(updates) {
        const user = await Auth.getCurrentUser();
        if (!user) throw new Error('Not authenticated');

        const { data, error } = await supabase
            .from('students')
            .update(updates)
            .eq('profile_id', user.id)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    /**
     * Add skill to student
     * @param {string} skillId - Skill UUID
     * @param {number} proficiencyLevel - 1-5 proficiency level
     */
    async addSkill(skillId, proficiencyLevel = 3) {
        const student = await this.getCurrentStudent();
        if (!student) throw new Error('Student profile not found');

        const { data, error } = await supabase
            .from('student_skills')
            .insert({
                student_id: student.id,
                skill_id: skillId,
                proficiency_level: proficiencyLevel
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    /**
     * Remove skill from student
     * @param {string} skillId - Skill UUID
     */
    async removeSkill(skillId) {
        const student = await this.getCurrentStudent();
        if (!student) throw new Error('Student profile not found');

        const { error } = await supabase
            .from('student_skills')
            .delete()
            .eq('student_id', student.id)
            .eq('skill_id', skillId);

        if (error) throw error;
    },

    /**
     * Get student statistics
     */
    async getStats() {
        const student = await this.getCurrentStudent();
        if (!student) throw new Error('Student profile not found');

        const { data, error } = await supabase
            .rpc('get_student_stats', { p_student_id: student.id });

        if (error) throw error;
        return data[0];
    },

    /**
     * Search students
     * @param {object} filters - Search filters
     */
    async search(filters = {}) {
        const { data, error } = await supabase.rpc('search_students', {
            p_search_text: filters.searchText || null,
            p_skill_ids: filters.skillIds || null,
            p_university: filters.university || null,
            p_limit: filters.limit || 20,
            p_offset: filters.offset || 0
        });

        if (error) throw error;
        return data;
    }
};

// ============================================
// COMPANY HELPERS
// ============================================

const Companies = {
    /**
     * Get current company profile
     */
    async getCurrentCompany() {
        const user = await Auth.getCurrentUser();
        if (!user) return null;

        const { data, error } = await supabase
            .from('companies')
            .select(`
                *,
                profile:profiles(*)
            `)
            .eq('profile_id', user.id)
            .single();

        if (error && error.code !== 'PGRST116') throw error;
        return data;
    },

    /**
     * Create company profile
     * @param {object} companyData - Company profile data
     */
    async createCompany(companyData) {
        const user = await Auth.getCurrentUser();
        if (!user) throw new Error('Not authenticated');

        const { data, error } = await supabase
            .from('companies')
            .insert({
                profile_id: user.id,
                ...companyData
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    /**
     * Update company profile
     * @param {object} updates - Company fields to update
     */
    async updateCompany(updates) {
        const user = await Auth.getCurrentUser();
        if (!user) throw new Error('Not authenticated');

        const { data, error } = await supabase
            .from('companies')
            .update(updates)
            .eq('profile_id', user.id)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    /**
     * Get company statistics
     */
    async getStats() {
        const company = await this.getCurrentCompany();
        if (!company) throw new Error('Company profile not found');

        const { data, error } = await supabase
            .rpc('get_company_stats', { p_company_id: company.id });

        if (error) throw error;
        return data[0];
    },

    /**
     * Get all companies
     */
    async getAll() {
        const { data, error } = await supabase
            .from('companies')
            .select(`
                *,
                profile:profiles(avatar_url)
            `)
            .order('company_name');

        if (error) throw error;
        return data;
    }
};

// ============================================
// SKILLS HELPERS
// ============================================

const Skills = {
    /**
     * Get all skills
     */
    async getAll() {
        const { data, error } = await supabase
            .from('skills')
            .select('*')
            .order('category')
            .order('name');

        if (error) throw error;
        return data;
    },

    /**
     * Get skills by category
     * @param {string} category - Skill category
     */
    async getByCategory(category) {
        const { data, error } = await supabase
            .from('skills')
            .select('*')
            .eq('category', category)
            .order('name');

        if (error) throw error;
        return data;
    },

    /**
     * Search skills by name
     * @param {string} searchText - Search text
     */
    async search(searchText) {
        const { data, error } = await supabase
            .from('skills')
            .select('*')
            .ilike('name', `%${searchText}%`)
            .order('name')
            .limit(10);

        if (error) throw error;
        return data;
    }
};

// Export all helpers
window.ExperienceLink = {
    supabase,
    Auth,
    Profiles,
    Students,
    Companies,
    Skills
};
