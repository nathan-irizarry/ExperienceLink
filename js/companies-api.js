/**
 * ExperienceLink - Companies API
 *
 * This file contains company-related API functions.
 * Requires supabase-client.js to be loaded first.
 */

const Companies = {
    /**
     * Get the current user's company profile
     * @returns {object|null} Company data or null if not a company user
     */
    async getCurrentCompany() {
        const { data: authData } = await supabaseClient.auth.getUser();
        if (!authData?.user) return null;

        const { data, error } = await supabaseClient
            .from('companies')
            .select('*')
            .eq('profile_id', authData.user.id)
            .single();

        if (error) {
            // PGRST116 = no rows found (not an error, just means user isn't a company)
            if (error.code === 'PGRST116') return null;
            throw error;
        }
        return data;
    },

    /**
     * Get company by ID
     * @param {string} companyId - Company UUID
     */
    async getById(companyId) {
        const { data, error } = await supabaseClient
            .from('companies')
            .select('*')
            .eq('id', companyId)
            .single();

        if (error) throw error;
        return data;
    },

    /**
     * Update company profile
     * @param {object} updates - Fields to update
     */
    async updateProfile(updates) {
        const company = await this.getCurrentCompany();
        if (!company) throw new Error('Company profile not found');

        const { data, error } = await supabaseClient
            .from('companies')
            .update(updates)
            .eq('id', company.id)
            .select()
            .single();

        if (error) throw error;
        return data;
    }
};

// Add to global scope and ExperienceLink namespace
window.Companies = Companies;
if (window.ExperienceLink) {
    window.ExperienceLink.Companies = Companies;
}
