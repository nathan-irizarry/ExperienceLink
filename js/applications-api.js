/**
 * ExperienceLink - Applications API
 *
 * This file contains all application-related API functions.
 * Requires supabase-client.js to be loaded first.
 */

const Applications = {
    /**
     * Apply to a project
     * @param {string} projectId - Project UUID
     * @param {object} applicationData - Application data
     */
    async apply(projectId, applicationData = {}) {
        const student = await Students.getCurrentStudent();
        if (!student) throw new Error('Student profile not found');

        // Check if can apply
        const { data: canApply, error: checkError } = await supabaseClient
            .rpc('can_apply_to_project', {
                p_student_id: student.id,
                p_project_id: projectId
            });

        if (checkError) throw checkError;
        if (!canApply) throw new Error('Cannot apply to this project');

        // Submit application
        const { data, error } = await supabaseClient
            .from('applications')
            .insert({
                project_id: projectId,
                student_id: student.id,
                cover_letter: applicationData.coverLetter || null,
                proposed_approach: applicationData.proposedApproach || null,
                estimated_completion_days: applicationData.estimatedDays || null
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    /**
     * Get application by ID
     * @param {string} applicationId - Application UUID
     */
    async getById(applicationId) {
        const { data, error } = await supabaseClient
            .from('applications')
            .select(`
                *,
                project:projects(
                    *,
                    company:companies(
                        company_name,
                        logo_url
                    )
                ),
                student:students(
                    *,
                    profile:profiles(avatar_url),
                    skills:student_skills(
                        skill:skills(id, name)
                    )
                )
            `)
            .eq('id', applicationId)
            .single();

        if (error) throw error;
        return data;
    },

    /**
     * Get my applications (student)
     * @param {string} status - Optional status filter
     */
    async getMyApplications(status = null) {
        const student = await Students.getCurrentStudent();
        if (!student) throw new Error('Student profile not found');

        let query = supabaseClient
            .from('applications')
            .select(`
                *,
                project:projects(
                    id,
                    title,
                    description,
                    duration_weeks,
                    reward_amount,
                    status,
                    company:companies(
                        company_name,
                        logo_url
                    ),
                    skills:project_skills(
                        skill:skills(id, name)
                    )
                )
            `)
            .eq('student_id', student.id)
            .order('submitted_at', { ascending: false });

        if (status) {
            query = query.eq('status', status);
        }

        const { data, error } = await query;
        if (error) throw error;
        return data;
    },

    /**
     * Withdraw an application
     * @param {string} applicationId - Application UUID
     */
    async withdraw(applicationId) {
        const { data, error } = await supabaseClient
            .from('applications')
            .update({ status: 'withdrawn' })
            .eq('id', applicationId)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    /**
     * Accept an application (company only)
     * @param {string} applicationId - Application UUID
     */
    async accept(applicationId) {
        const { data, error } = await supabaseClient
            .from('applications')
            .update({
                status: 'accepted',
                reviewed_at: new Date().toISOString()
            })
            .eq('id', applicationId)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    /**
     * Reject an application (company only)
     * @param {string} applicationId - Application UUID
     */
    async reject(applicationId) {
        const { data, error } = await supabaseClient
            .from('applications')
            .update({
                status: 'rejected',
                reviewed_at: new Date().toISOString()
            })
            .eq('id', applicationId)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    /**
     * Subscribe to application updates
     * @param {function} callback - Callback function
     */
    subscribeToUpdates(callback) {
        return supabaseClient
            .channel('applications')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'applications'
            }, callback)
            .subscribe();
    }
};

// ============================================
// MESSAGES API
// ============================================

const Messages = {
    /**
     * Get messages for an application
     * @param {string} applicationId - Application UUID
     */
    async getByApplication(applicationId) {
        const { data, error } = await supabaseClient
            .from('messages')
            .select(`
                *,
                sender:profiles(
                    id,
                    email,
                    avatar_url,
                    role
                )
            `)
            .eq('application_id', applicationId)
            .order('created_at', { ascending: true });

        if (error) throw error;
        return data;
    },

    /**
     * Send a message
     * @param {string} applicationId - Application UUID
     * @param {string} content - Message content
     */
    async send(applicationId, content) {
        const user = await Auth.getCurrentUser();
        if (!user) throw new Error('Not authenticated');

        const { data, error } = await supabaseClient
            .from('messages')
            .insert({
                application_id: applicationId,
                sender_id: user.id,
                content
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    /**
     * Mark messages as read
     * @param {string} applicationId - Application UUID
     */
    async markAsRead(applicationId) {
        const user = await Auth.getCurrentUser();
        if (!user) throw new Error('Not authenticated');

        const { error } = await supabaseClient
            .from('messages')
            .update({ is_read: true })
            .eq('application_id', applicationId)
            .neq('sender_id', user.id);

        if (error) throw error;
    },

    /**
     * Subscribe to new messages
     * @param {string} applicationId - Application UUID
     * @param {function} callback - Callback function
     */
    subscribe(applicationId, callback) {
        return supabaseClient
            .channel(`messages:${applicationId}`)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'messages',
                filter: `application_id=eq.${applicationId}`
            }, callback)
            .subscribe();
    }
};

// ============================================
// DELIVERABLES API
// ============================================

const Deliverables = {
    /**
     * Get deliverables for an application
     * @param {string} applicationId - Application UUID
     */
    async getByApplication(applicationId) {
        const { data, error } = await supabaseClient
            .from('deliverables')
            .select('*')
            .eq('application_id', applicationId)
            .order('submitted_at', { ascending: false });

        if (error) throw error;
        return data;
    },

    /**
     * Submit a deliverable (student only)
     * @param {string} applicationId - Application UUID
     * @param {object} deliverableData - Deliverable data
     */
    async submit(applicationId, deliverableData) {
        const { data, error } = await supabaseClient
            .from('deliverables')
            .insert({
                application_id: applicationId,
                title: deliverableData.title,
                description: deliverableData.description || null,
                file_url: deliverableData.fileUrl || null
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    /**
     * Review a deliverable (company only)
     * @param {string} deliverableId - Deliverable UUID
     * @param {object} reviewData - Review data
     */
    async review(deliverableId, reviewData) {
        const { data, error } = await supabaseClient
            .from('deliverables')
            .update({
                feedback: reviewData.feedback,
                is_approved: reviewData.isApproved,
                reviewed_at: new Date().toISOString()
            })
            .eq('id', deliverableId)
            .select()
            .single();

        if (error) throw error;
        return data;
    }
};

// ============================================
// REVIEWS API
// ============================================

const Reviews = {
    /**
     * Get reviews for a student
     * @param {string} studentId - Student UUID
     */
    async getByStudent(studentId) {
        const { data, error } = await supabaseClient
            .from('reviews')
            .select(`
                *,
                application:applications(
                    project:projects(
                        title,
                        company:companies(company_name)
                    )
                )
            `)
            .eq('application.student_id', studentId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data;
    },

    /**
     * Create a review (company only)
     * @param {string} applicationId - Application UUID
     * @param {object} reviewData - Review data
     */
    async create(applicationId, reviewData) {
        const user = await Auth.getCurrentUser();
        if (!user) throw new Error('Not authenticated');

        const { data, error } = await supabaseClient
            .from('reviews')
            .insert({
                application_id: applicationId,
                reviewer_id: user.id,
                rating: reviewData.rating,
                comment: reviewData.comment || null
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    }
};

// Add to ExperienceLink namespace
window.ExperienceLink.Applications = Applications;
window.ExperienceLink.Messages = Messages;
window.ExperienceLink.Deliverables = Deliverables;
window.ExperienceLink.Reviews = Reviews;
