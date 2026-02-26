/**
 * ExperienceLink - Projects API
 *
 * This file contains all project-related API functions.
 * Requires supabase-client.js to be loaded first.
 */

const Projects = {
    /**
     * Get all active projects
     * @param {object} options - Query options (limit, offset)
     */
    async getActive(options = {}) {
        const { limit = 20, offset = 0 } = options;

        const { data, error } = await supabaseClient
            .from('projects')
            .select(`
                *,
                company:companies(
                    id,
                    company_name,
                    logo_url,
                    industry
                ),
                skills:project_skills(
                    is_required,
                    skill:skills(id, name, category)
                )
            `)
            .eq('status', 'active')
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) throw error;
        return data;
    },

    /**
     * Get project by ID
     * @param {string} projectId - Project UUID
     */
    async getById(projectId) {
        const { data, error } = await supabaseClient
            .from('projects')
            .select(`
                *,
                company:companies(
                    id,
                    company_name,
                    logo_url,
                    industry,
                    description,
                    website_url,
                    location
                ),
                skills:project_skills(
                    is_required,
                    skill:skills(id, name, category)
                )
            `)
            .eq('id', projectId)
            .single();

        if (error) throw error;
        return data;
    },

    /**
     * Search projects with filters
     * @param {object} filters - Search filters
     */
    async search(filters = {}) {
        const { data, error } = await supabaseClient.rpc('search_projects', {
            p_search_text: filters.searchText || null,
            p_skill_ids: filters.skillIds || null,
            p_min_reward: filters.minReward || null,
            p_max_reward: filters.maxReward || null,
            p_max_duration: filters.maxDuration || null,
            p_limit: filters.limit || 20,
            p_offset: filters.offset || 0
        });

        if (error) throw error;
        return data;
    },

    /**
     * Create a new project (company only)
     * @param {object} projectData - Project data
     * @param {array} skillIds - Array of skill UUIDs
     */
    async create(projectData, skillIds = []) {
        const company = await Companies.getCurrentCompany();
        if (!company) throw new Error('Company profile not found');

        // Insert project
        const { data: project, error: projectError } = await supabaseClient
            .from('projects')
            .insert({
                company_id: company.id,
                ...projectData
            })
            .select()
            .single();

        if (projectError) throw projectError;

        // Insert project skills if provided
        if (skillIds.length > 0) {
            const skillsData = skillIds.map(skillId => ({
                project_id: project.id,
                skill_id: skillId,
                is_required: true
            }));

            const { error: skillsError } = await supabaseClient
                .from('project_skills')
                .insert(skillsData);

            if (skillsError) throw skillsError;
        }

        return project;
    },

    /**
     * Update a project (company only)
     * @param {string} projectId - Project UUID
     * @param {object} updates - Project fields to update
     */
    async update(projectId, updates) {
        const { data, error } = await supabaseClient
            .from('projects')
            .update(updates)
            .eq('id', projectId)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    /**
     * Update project skills
     * @param {string} projectId - Project UUID
     * @param {array} skillIds - Array of skill UUIDs
     */
    async updateSkills(projectId, skillIds) {
        // Delete existing skills
        const { error: deleteError } = await supabaseClient
            .from('project_skills')
            .delete()
            .eq('project_id', projectId);

        if (deleteError) throw deleteError;

        // Insert new skills
        if (skillIds.length > 0) {
            const skillsData = skillIds.map(skillId => ({
                project_id: projectId,
                skill_id: skillId,
                is_required: true
            }));

            const { error: insertError } = await supabaseClient
                .from('project_skills')
                .insert(skillsData);

            if (insertError) throw insertError;
        }
    },

    /**
     * Publish a project (change from draft to active)
     * @param {string} projectId - Project UUID
     */
    async publish(projectId) {
        return this.update(projectId, { status: 'active' });
    },

    /**
     * Cancel a project
     * @param {string} projectId - Project UUID
     */
    async cancel(projectId) {
        return this.update(projectId, { status: 'cancelled' });
    },

    /**
     * Complete a project
     * @param {string} projectId - Project UUID
     */
    async complete(projectId) {
        return this.update(projectId, {
            status: 'completed',
            end_date: new Date().toISOString()
        });
    },

    /**
     * Get company's projects
     * @param {string} status - Optional status filter
     */
    async getMyProjects(status = null) {
        const company = await Companies.getCurrentCompany();
        if (!company) throw new Error('Company profile not found');

        let query = supabaseClient
            .from('projects')
            .select(`
                *,
                skills:project_skills(
                    skill:skills(id, name)
                ),
                applications:applications(count)
            `)
            .eq('company_id', company.id)
            .order('created_at', { ascending: false });

        if (status) {
            query = query.eq('status', status);
        }

        const { data, error } = await query;
        if (error) throw error;
        return data;
    },

    /**
     * Get applicants for a project
     * @param {string} projectId - Project UUID
     */
    async getApplicants(projectId) {
        const { data, error } = await supabaseClient
            .from('applications')
            .select(`
                *,
                student:students(
                    id,
                    full_name,
                    university,
                    bio,
                    portfolio_url,
                    profile:profiles(avatar_url),
                    skills:student_skills(
                        skill:skills(id, name)
                    )
                )
            `)
            .eq('project_id', projectId)
            .neq('status', 'withdrawn')
            .order('submitted_at', { ascending: false });

        if (error) throw error;
        return data;
    },

    /**
     * Subscribe to project updates
     * @param {function} callback - Callback function
     */
    subscribeToUpdates(callback) {
        return supabaseClient
            .channel('projects')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'projects'
            }, callback)
            .subscribe();
    }
};

// Add to ExperienceLink namespace
window.ExperienceLink.Projects = Projects;
