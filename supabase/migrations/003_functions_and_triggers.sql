-- ExperienceLink Functions and Triggers
-- Migration: 003_functions_and_triggers
-- Description: Database functions, triggers, and stored procedures

-- ============================================
-- UTILITY FUNCTIONS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to all relevant tables
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_students_updated_at
    BEFORE UPDATE ON students
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_companies_updated_at
    BEFORE UPDATE ON companies
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at
    BEFORE UPDATE ON projects
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_applications_updated_at
    BEFORE UPDATE ON applications
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- AUTH TRIGGER: Create profile on signup
-- ============================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO profiles (id, email, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(
            (NEW.raw_user_meta_data->>'role')::user_role,
            'student'::user_role
        )
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on auth.users
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();

-- ============================================
-- APPLICATION FUNCTIONS
-- ============================================

-- Function to check if student can apply to a project
CREATE OR REPLACE FUNCTION can_apply_to_project(
    p_student_id UUID,
    p_project_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
    v_existing_application_count INTEGER;
    v_project_status project_status;
    v_max_applicants INTEGER;
    v_current_applicants INTEGER;
BEGIN
    -- Check if project is active
    SELECT status, max_applicants INTO v_project_status, v_max_applicants
    FROM projects WHERE id = p_project_id;

    IF v_project_status != 'active' THEN
        RETURN FALSE;
    END IF;

    -- Check if student already applied
    SELECT COUNT(*) INTO v_existing_application_count
    FROM applications
    WHERE student_id = p_student_id AND project_id = p_project_id;

    IF v_existing_application_count > 0 THEN
        RETURN FALSE;
    END IF;

    -- Check if max applicants reached
    SELECT COUNT(*) INTO v_current_applicants
    FROM applications
    WHERE project_id = p_project_id AND status != 'withdrawn';

    IF v_current_applicants >= v_max_applicants THEN
        RETURN FALSE;
    END IF;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get student statistics
CREATE OR REPLACE FUNCTION get_student_stats(p_student_id UUID)
RETURNS TABLE (
    total_applications BIGINT,
    pending_applications BIGINT,
    accepted_applications BIGINT,
    completed_projects BIGINT,
    average_rating NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COUNT(*)::BIGINT AS total_applications,
        COUNT(*) FILTER (WHERE a.status = 'pending')::BIGINT AS pending_applications,
        COUNT(*) FILTER (WHERE a.status = 'accepted')::BIGINT AS accepted_applications,
        COUNT(*) FILTER (WHERE a.status = 'accepted' AND p.status = 'completed')::BIGINT AS completed_projects,
        COALESCE(AVG(r.rating), 0)::NUMERIC AS average_rating
    FROM applications a
    JOIN projects p ON p.id = a.project_id
    LEFT JOIN reviews r ON r.application_id = a.id
    WHERE a.student_id = p_student_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get company statistics
CREATE OR REPLACE FUNCTION get_company_stats(p_company_id UUID)
RETURNS TABLE (
    total_projects BIGINT,
    active_projects BIGINT,
    completed_projects BIGINT,
    total_applicants BIGINT,
    accepted_applicants BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COUNT(DISTINCT p.id)::BIGINT AS total_projects,
        COUNT(DISTINCT p.id) FILTER (WHERE p.status = 'active')::BIGINT AS active_projects,
        COUNT(DISTINCT p.id) FILTER (WHERE p.status = 'completed')::BIGINT AS completed_projects,
        COUNT(a.id)::BIGINT AS total_applicants,
        COUNT(a.id) FILTER (WHERE a.status = 'accepted')::BIGINT AS accepted_applicants
    FROM projects p
    LEFT JOIN applications a ON a.project_id = p.id
    WHERE p.company_id = p_company_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- SEARCH FUNCTIONS
-- ============================================

-- Function to search projects with filters
CREATE OR REPLACE FUNCTION search_projects(
    p_search_text TEXT DEFAULT NULL,
    p_skill_ids UUID[] DEFAULT NULL,
    p_min_reward DECIMAL DEFAULT NULL,
    p_max_reward DECIMAL DEFAULT NULL,
    p_max_duration INTEGER DEFAULT NULL,
    p_limit INTEGER DEFAULT 20,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
    id UUID,
    title TEXT,
    description TEXT,
    duration_weeks INTEGER,
    reward_amount DECIMAL,
    status project_status,
    company_name TEXT,
    company_logo TEXT,
    skills JSON,
    applicant_count BIGINT,
    created_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        p.id,
        p.title,
        p.description,
        p.duration_weeks,
        p.reward_amount,
        p.status,
        c.company_name,
        c.logo_url AS company_logo,
        (
            SELECT json_agg(json_build_object('id', s.id, 'name', s.name))
            FROM project_skills ps
            JOIN skills s ON s.id = ps.skill_id
            WHERE ps.project_id = p.id
        ) AS skills,
        (
            SELECT COUNT(*)
            FROM applications a
            WHERE a.project_id = p.id AND a.status != 'withdrawn'
        ) AS applicant_count,
        p.created_at
    FROM projects p
    JOIN companies c ON c.id = p.company_id
    WHERE
        p.status = 'active'
        AND (p_search_text IS NULL OR p.title ILIKE '%' || p_search_text || '%' OR p.description ILIKE '%' || p_search_text || '%')
        AND (p_min_reward IS NULL OR p.reward_amount >= p_min_reward)
        AND (p_max_reward IS NULL OR p.reward_amount <= p_max_reward)
        AND (p_max_duration IS NULL OR p.duration_weeks <= p_max_duration)
        AND (
            p_skill_ids IS NULL
            OR EXISTS (
                SELECT 1 FROM project_skills ps
                WHERE ps.project_id = p.id AND ps.skill_id = ANY(p_skill_ids)
            )
        )
    ORDER BY p.created_at DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to search students (for companies)
CREATE OR REPLACE FUNCTION search_students(
    p_search_text TEXT DEFAULT NULL,
    p_skill_ids UUID[] DEFAULT NULL,
    p_university TEXT DEFAULT NULL,
    p_limit INTEGER DEFAULT 20,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
    id UUID,
    full_name TEXT,
    university TEXT,
    bio TEXT,
    avatar_url TEXT,
    skills JSON,
    completed_projects BIGINT,
    average_rating NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        s.id,
        s.full_name,
        s.university,
        s.bio,
        pr.avatar_url,
        (
            SELECT json_agg(json_build_object('id', sk.id, 'name', sk.name, 'proficiency', ss.proficiency_level))
            FROM student_skills ss
            JOIN skills sk ON sk.id = ss.skill_id
            WHERE ss.student_id = s.id
        ) AS skills,
        (
            SELECT COUNT(*)
            FROM applications a
            JOIN projects p ON p.id = a.project_id
            WHERE a.student_id = s.id AND a.status = 'accepted' AND p.status = 'completed'
        ) AS completed_projects,
        (
            SELECT COALESCE(AVG(r.rating), 0)
            FROM applications a
            JOIN reviews r ON r.application_id = a.id
            WHERE a.student_id = s.id
        ) AS average_rating
    FROM students s
    JOIN profiles pr ON pr.id = s.profile_id
    WHERE
        (p_search_text IS NULL OR s.full_name ILIKE '%' || p_search_text || '%')
        AND (p_university IS NULL OR s.university ILIKE '%' || p_university || '%')
        AND (
            p_skill_ids IS NULL
            OR EXISTS (
                SELECT 1 FROM student_skills ss
                WHERE ss.student_id = s.id AND ss.skill_id = ANY(p_skill_ids)
            )
        )
    ORDER BY completed_projects DESC, average_rating DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- APPLICATION STATUS TRIGGER
-- ============================================

-- Update project status when application is accepted
CREATE OR REPLACE FUNCTION on_application_accepted()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'accepted' AND OLD.status = 'pending' THEN
        -- Update the reviewed_at timestamp
        NEW.reviewed_at = NOW();

        -- Optionally update project to in_progress if first acceptance
        UPDATE projects
        SET status = 'in_progress'
        WHERE id = NEW.project_id
        AND status = 'active'
        AND NOT EXISTS (
            SELECT 1 FROM applications
            WHERE project_id = NEW.project_id
            AND status = 'accepted'
            AND id != NEW.id
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_application_status_change
    BEFORE UPDATE OF status ON applications
    FOR EACH ROW
    EXECUTE FUNCTION on_application_accepted();

-- ============================================
-- REAL-TIME SUBSCRIPTIONS SETUP
-- ============================================

-- Enable real-time for specific tables
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE applications;
ALTER PUBLICATION supabase_realtime ADD TABLE projects;
