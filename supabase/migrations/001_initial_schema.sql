-- ExperienceLink Database Schema
-- Migration: 001_initial_schema
-- Description: Initial database schema for ExperienceLink platform

-- ============================================
-- ENUMS
-- ============================================

-- User role enum
CREATE TYPE user_role AS ENUM ('student', 'company');

-- Application status enum
CREATE TYPE application_status AS ENUM ('pending', 'accepted', 'rejected', 'withdrawn');

-- Project status enum
CREATE TYPE project_status AS ENUM ('draft', 'active', 'in_progress', 'completed', 'cancelled');

-- ============================================
-- TABLES
-- ============================================

-- Profiles table (extends Supabase Auth users)
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    role user_role NOT NULL,
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Students table
CREATE TABLE students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    university TEXT,
    bio TEXT,
    portfolio_url TEXT,
    resume_url TEXT,
    linkedin_url TEXT,
    github_url TEXT,
    graduation_year INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Companies table
CREATE TABLE companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
    company_name TEXT NOT NULL,
    industry TEXT,
    description TEXT,
    website_url TEXT,
    logo_url TEXT,
    location TEXT,
    company_size TEXT,
    founded_year INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Skills reference table
CREATE TABLE skills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    category TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Student skills junction table
CREATE TABLE student_skills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
    proficiency_level INTEGER CHECK (proficiency_level BETWEEN 1 AND 5),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(student_id, skill_id)
);

-- Projects table
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    detailed_requirements TEXT,
    duration_weeks INTEGER NOT NULL,
    reward_amount DECIMAL(10, 2) NOT NULL CHECK (reward_amount >= 0),
    max_applicants INTEGER DEFAULT 10,
    status project_status NOT NULL DEFAULT 'draft',
    deadline TIMESTAMPTZ,
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Project required skills junction table
CREATE TABLE project_skills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
    is_required BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(project_id, skill_id)
);

-- Applications table
CREATE TABLE applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    status application_status NOT NULL DEFAULT 'pending',
    cover_letter TEXT,
    proposed_approach TEXT,
    estimated_completion_days INTEGER,
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(project_id, student_id)
);

-- Messages table (for communication between students and companies)
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Project deliverables table
CREATE TABLE deliverables (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    file_url TEXT,
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    feedback TEXT,
    is_approved BOOLEAN,
    reviewed_at TIMESTAMPTZ
);

-- Reviews table (companies review students after project completion)
CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL UNIQUE REFERENCES applications(id) ON DELETE CASCADE,
    reviewer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================

-- Profiles indexes
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_email ON profiles(email);

-- Students indexes
CREATE INDEX idx_students_profile_id ON students(profile_id);
CREATE INDEX idx_students_university ON students(university);

-- Companies indexes
CREATE INDEX idx_companies_profile_id ON companies(profile_id);
CREATE INDEX idx_companies_industry ON companies(industry);

-- Projects indexes
CREATE INDEX idx_projects_company_id ON projects(company_id);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_created_at ON projects(created_at DESC);
CREATE INDEX idx_projects_reward ON projects(reward_amount);

-- Applications indexes
CREATE INDEX idx_applications_project_id ON applications(project_id);
CREATE INDEX idx_applications_student_id ON applications(student_id);
CREATE INDEX idx_applications_status ON applications(status);
CREATE INDEX idx_applications_submitted_at ON applications(submitted_at DESC);

-- Student skills indexes
CREATE INDEX idx_student_skills_student_id ON student_skills(student_id);
CREATE INDEX idx_student_skills_skill_id ON student_skills(skill_id);

-- Project skills indexes
CREATE INDEX idx_project_skills_project_id ON project_skills(project_id);
CREATE INDEX idx_project_skills_skill_id ON project_skills(skill_id);

-- Messages indexes
CREATE INDEX idx_messages_application_id ON messages(application_id);
CREATE INDEX idx_messages_sender_id ON messages(sender_id);
CREATE INDEX idx_messages_created_at ON messages(created_at DESC);

-- ============================================
-- SEED DATA: Common Skills
-- ============================================

INSERT INTO skills (name, category) VALUES
    -- Programming Languages
    ('JavaScript', 'Programming'),
    ('TypeScript', 'Programming'),
    ('Python', 'Programming'),
    ('Java', 'Programming'),
    ('C++', 'Programming'),
    ('Go', 'Programming'),
    ('Rust', 'Programming'),
    ('Ruby', 'Programming'),
    ('PHP', 'Programming'),
    ('Swift', 'Programming'),
    ('Kotlin', 'Programming'),

    -- Frontend
    ('React', 'Frontend'),
    ('Vue.js', 'Frontend'),
    ('Angular', 'Frontend'),
    ('Next.js', 'Frontend'),
    ('HTML/CSS', 'Frontend'),
    ('Tailwind CSS', 'Frontend'),
    ('Svelte', 'Frontend'),

    -- Backend
    ('Node.js', 'Backend'),
    ('Express.js', 'Backend'),
    ('Django', 'Backend'),
    ('Flask', 'Backend'),
    ('FastAPI', 'Backend'),
    ('Spring Boot', 'Backend'),
    ('Ruby on Rails', 'Backend'),
    ('GraphQL', 'Backend'),
    ('REST APIs', 'Backend'),

    -- Databases
    ('PostgreSQL', 'Database'),
    ('MySQL', 'Database'),
    ('MongoDB', 'Database'),
    ('Redis', 'Database'),
    ('Supabase', 'Database'),
    ('Firebase', 'Database'),

    -- DevOps & Cloud
    ('AWS', 'Cloud'),
    ('Google Cloud', 'Cloud'),
    ('Azure', 'Cloud'),
    ('Docker', 'DevOps'),
    ('Kubernetes', 'DevOps'),
    ('CI/CD', 'DevOps'),
    ('Git', 'DevOps'),

    -- Design
    ('UI/UX Design', 'Design'),
    ('Figma', 'Design'),
    ('Adobe XD', 'Design'),
    ('Photoshop', 'Design'),
    ('Illustrator', 'Design'),

    -- Data & ML
    ('Data Analysis', 'Data'),
    ('Machine Learning', 'Data'),
    ('TensorFlow', 'Data'),
    ('PyTorch', 'Data'),
    ('SQL', 'Data'),
    ('Pandas', 'Data'),
    ('Data Visualization', 'Data'),

    -- Mobile
    ('React Native', 'Mobile'),
    ('Flutter', 'Mobile'),
    ('iOS Development', 'Mobile'),
    ('Android Development', 'Mobile'),

    -- Other
    ('Technical Writing', 'Other'),
    ('Marketing', 'Other'),
    ('SEO', 'Other'),
    ('Content Creation', 'Other'),
    ('Project Management', 'Other'),
    ('Agile/Scrum', 'Other');
