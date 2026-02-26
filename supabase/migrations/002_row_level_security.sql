-- ExperienceLink Row Level Security Policies
-- Migration: 002_row_level_security
-- Description: RLS policies for secure data access

-- ============================================
-- ENABLE RLS ON ALL TABLES
-- ============================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE deliverables ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PROFILES POLICIES
-- ============================================

-- Users can view all profiles (public directory)
CREATE POLICY "Profiles are viewable by everyone"
    ON profiles FOR SELECT
    USING (true);

-- Users can only update their own profile
CREATE POLICY "Users can update own profile"
    ON profiles FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Users can insert their own profile on signup
CREATE POLICY "Users can insert own profile"
    ON profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

-- ============================================
-- STUDENTS POLICIES
-- ============================================

-- Anyone can view student profiles
CREATE POLICY "Student profiles are viewable by everyone"
    ON students FOR SELECT
    USING (true);

-- Students can update their own profile
CREATE POLICY "Students can update own profile"
    ON students FOR UPDATE
    USING (
        profile_id = auth.uid()
    )
    WITH CHECK (
        profile_id = auth.uid()
    );

-- Students can insert their own profile
CREATE POLICY "Students can insert own profile"
    ON students FOR INSERT
    WITH CHECK (
        profile_id = auth.uid()
        AND EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'student'
        )
    );

-- ============================================
-- COMPANIES POLICIES
-- ============================================

-- Anyone can view company profiles
CREATE POLICY "Company profiles are viewable by everyone"
    ON companies FOR SELECT
    USING (true);

-- Companies can update their own profile
CREATE POLICY "Companies can update own profile"
    ON companies FOR UPDATE
    USING (
        profile_id = auth.uid()
    )
    WITH CHECK (
        profile_id = auth.uid()
    );

-- Companies can insert their own profile
CREATE POLICY "Companies can insert own profile"
    ON companies FOR INSERT
    WITH CHECK (
        profile_id = auth.uid()
        AND EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'company'
        )
    );

-- ============================================
-- SKILLS POLICIES
-- ============================================

-- Skills are readable by everyone
CREATE POLICY "Skills are viewable by everyone"
    ON skills FOR SELECT
    USING (true);

-- Only authenticated users can add skills (for future extensibility)
CREATE POLICY "Authenticated users can add skills"
    ON skills FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

-- ============================================
-- STUDENT_SKILLS POLICIES
-- ============================================

-- Anyone can view student skills
CREATE POLICY "Student skills are viewable by everyone"
    ON student_skills FOR SELECT
    USING (true);

-- Students can manage their own skills
CREATE POLICY "Students can insert own skills"
    ON student_skills FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM students
            WHERE id = student_skills.student_id
            AND profile_id = auth.uid()
        )
    );

CREATE POLICY "Students can update own skills"
    ON student_skills FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM students
            WHERE id = student_skills.student_id
            AND profile_id = auth.uid()
        )
    );

CREATE POLICY "Students can delete own skills"
    ON student_skills FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM students
            WHERE id = student_skills.student_id
            AND profile_id = auth.uid()
        )
    );

-- ============================================
-- PROJECTS POLICIES
-- ============================================

-- Active projects are viewable by everyone
CREATE POLICY "Active projects are viewable by everyone"
    ON projects FOR SELECT
    USING (
        status IN ('active', 'in_progress', 'completed')
        OR EXISTS (
            SELECT 1 FROM companies
            WHERE id = projects.company_id
            AND profile_id = auth.uid()
        )
    );

-- Companies can create projects
CREATE POLICY "Companies can create projects"
    ON projects FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM companies
            WHERE id = projects.company_id
            AND profile_id = auth.uid()
        )
    );

-- Companies can update their own projects
CREATE POLICY "Companies can update own projects"
    ON projects FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM companies
            WHERE id = projects.company_id
            AND profile_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM companies
            WHERE id = projects.company_id
            AND profile_id = auth.uid()
        )
    );

-- Companies can delete their draft projects
CREATE POLICY "Companies can delete own draft projects"
    ON projects FOR DELETE
    USING (
        status = 'draft'
        AND EXISTS (
            SELECT 1 FROM companies
            WHERE id = projects.company_id
            AND profile_id = auth.uid()
        )
    );

-- ============================================
-- PROJECT_SKILLS POLICIES
-- ============================================

-- Project skills are viewable by everyone
CREATE POLICY "Project skills are viewable by everyone"
    ON project_skills FOR SELECT
    USING (true);

-- Companies can manage skills for their projects
CREATE POLICY "Companies can manage project skills"
    ON project_skills FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM projects p
            JOIN companies c ON c.id = p.company_id
            WHERE p.id = project_skills.project_id
            AND c.profile_id = auth.uid()
        )
    );

CREATE POLICY "Companies can update project skills"
    ON project_skills FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM projects p
            JOIN companies c ON c.id = p.company_id
            WHERE p.id = project_skills.project_id
            AND c.profile_id = auth.uid()
        )
    );

CREATE POLICY "Companies can delete project skills"
    ON project_skills FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM projects p
            JOIN companies c ON c.id = p.company_id
            WHERE p.id = project_skills.project_id
            AND c.profile_id = auth.uid()
        )
    );

-- ============================================
-- APPLICATIONS POLICIES
-- ============================================

-- Students can view their own applications
-- Companies can view applications to their projects
CREATE POLICY "View own applications"
    ON applications FOR SELECT
    USING (
        -- Student viewing their own application
        EXISTS (
            SELECT 1 FROM students
            WHERE id = applications.student_id
            AND profile_id = auth.uid()
        )
        OR
        -- Company viewing applications to their project
        EXISTS (
            SELECT 1 FROM projects p
            JOIN companies c ON c.id = p.company_id
            WHERE p.id = applications.project_id
            AND c.profile_id = auth.uid()
        )
    );

-- Students can create applications
CREATE POLICY "Students can create applications"
    ON applications FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM students
            WHERE id = applications.student_id
            AND profile_id = auth.uid()
        )
        AND EXISTS (
            SELECT 1 FROM projects
            WHERE id = applications.project_id
            AND status = 'active'
        )
    );

-- Students can update (withdraw) their own pending applications
CREATE POLICY "Students can update own applications"
    ON applications FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM students
            WHERE id = applications.student_id
            AND profile_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM students
            WHERE id = applications.student_id
            AND profile_id = auth.uid()
        )
    );

-- Companies can update application status (accept/reject)
CREATE POLICY "Companies can update application status"
    ON applications FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM projects p
            JOIN companies c ON c.id = p.company_id
            WHERE p.id = applications.project_id
            AND c.profile_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM projects p
            JOIN companies c ON c.id = p.company_id
            WHERE p.id = applications.project_id
            AND c.profile_id = auth.uid()
        )
    );

-- ============================================
-- MESSAGES POLICIES
-- ============================================

-- Users can view messages in their applications
CREATE POLICY "View messages in own applications"
    ON messages FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM applications a
            WHERE a.id = messages.application_id
            AND (
                -- Student's application
                EXISTS (
                    SELECT 1 FROM students s
                    WHERE s.id = a.student_id
                    AND s.profile_id = auth.uid()
                )
                OR
                -- Company's project
                EXISTS (
                    SELECT 1 FROM projects p
                    JOIN companies c ON c.id = p.company_id
                    WHERE p.id = a.project_id
                    AND c.profile_id = auth.uid()
                )
            )
        )
    );

-- Users can send messages in their applications
CREATE POLICY "Send messages in own applications"
    ON messages FOR INSERT
    WITH CHECK (
        sender_id = auth.uid()
        AND EXISTS (
            SELECT 1 FROM applications a
            WHERE a.id = messages.application_id
            AND (
                EXISTS (
                    SELECT 1 FROM students s
                    WHERE s.id = a.student_id
                    AND s.profile_id = auth.uid()
                )
                OR
                EXISTS (
                    SELECT 1 FROM projects p
                    JOIN companies c ON c.id = p.company_id
                    WHERE p.id = a.project_id
                    AND c.profile_id = auth.uid()
                )
            )
        )
    );

-- Users can mark messages as read
CREATE POLICY "Update message read status"
    ON messages FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM applications a
            WHERE a.id = messages.application_id
            AND (
                EXISTS (
                    SELECT 1 FROM students s
                    WHERE s.id = a.student_id
                    AND s.profile_id = auth.uid()
                )
                OR
                EXISTS (
                    SELECT 1 FROM projects p
                    JOIN companies c ON c.id = p.company_id
                    WHERE p.id = a.project_id
                    AND c.profile_id = auth.uid()
                )
            )
        )
    );

-- ============================================
-- DELIVERABLES POLICIES
-- ============================================

-- View deliverables for own applications
CREATE POLICY "View deliverables in own applications"
    ON deliverables FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM applications a
            WHERE a.id = deliverables.application_id
            AND (
                EXISTS (
                    SELECT 1 FROM students s
                    WHERE s.id = a.student_id
                    AND s.profile_id = auth.uid()
                )
                OR
                EXISTS (
                    SELECT 1 FROM projects p
                    JOIN companies c ON c.id = p.company_id
                    WHERE p.id = a.project_id
                    AND c.profile_id = auth.uid()
                )
            )
        )
    );

-- Students can submit deliverables
CREATE POLICY "Students can submit deliverables"
    ON deliverables FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM applications a
            JOIN students s ON s.id = a.student_id
            WHERE a.id = deliverables.application_id
            AND s.profile_id = auth.uid()
            AND a.status = 'accepted'
        )
    );

-- Companies can update deliverable feedback
CREATE POLICY "Companies can review deliverables"
    ON deliverables FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM applications a
            JOIN projects p ON p.id = a.project_id
            JOIN companies c ON c.id = p.company_id
            WHERE a.id = deliverables.application_id
            AND c.profile_id = auth.uid()
        )
    );

-- ============================================
-- REVIEWS POLICIES
-- ============================================

-- Reviews are public
CREATE POLICY "Reviews are viewable by everyone"
    ON reviews FOR SELECT
    USING (true);

-- Companies can create reviews for completed projects
CREATE POLICY "Companies can create reviews"
    ON reviews FOR INSERT
    WITH CHECK (
        reviewer_id = auth.uid()
        AND EXISTS (
            SELECT 1 FROM applications a
            JOIN projects p ON p.id = a.project_id
            JOIN companies c ON c.id = p.company_id
            WHERE a.id = reviews.application_id
            AND c.profile_id = auth.uid()
            AND a.status = 'accepted'
        )
    );
