# ExperienceLink - Supabase Setup Guide

This guide will help you set up your Supabase database for the ExperienceLink platform.

## Step 1: Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign up or log in to your account
3. Click "New Project"
4. Enter your project details:
   - **Name**: ExperienceLink
   - **Database Password**: Choose a strong password (save this!)
   - **Region**: Choose the closest to your users
5. Wait for your project to be created (~2 minutes)

## Step 2: Run the Database Migrations

You need to run the SQL migrations in order. Go to your Supabase dashboard:

1. Navigate to **SQL Editor** (left sidebar)
2. Click "New query"
3. Copy and paste each migration file in order:

### Migration 1: Initial Schema
Copy the contents of `migrations/001_initial_schema.sql` and run it.

This creates:
- All database tables (profiles, students, companies, projects, etc.)
- Indexes for performance
- Seed data for skills

### Migration 2: Row Level Security
Copy the contents of `migrations/002_row_level_security.sql` and run it.

This creates:
- RLS policies for all tables
- Ensures users can only access authorized data

### Migration 3: Functions and Triggers
Copy the contents of `migrations/003_functions_and_triggers.sql` and run it.

This creates:
- Auto-update timestamps
- Auth user creation trigger
- Search functions
- Statistics functions

## Step 3: Configure Authentication

1. Go to **Authentication** > **Providers** in your dashboard
2. Email/Password is enabled by default
3. (Optional) Enable OAuth providers:
   - **Google**: Add your Google OAuth credentials
   - **GitHub**: Add your GitHub OAuth credentials

### Configure Redirect URLs
Go to **Authentication** > **URL Configuration**:
- Add your site URL to "Site URL"
- Add redirect URLs for OAuth (e.g., `http://localhost:3000/projects.html`)

## Step 4: Get Your API Keys

1. Go to **Settings** > **API**
2. Copy the following values:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **anon/public key** (safe to use in browser)

## Step 5: Update Your Frontend Code

1. Open `js/supabase-client.js`
2. Replace the placeholder values:

```javascript
const SUPABASE_URL = 'https://your-project-id.supabase.co';
const SUPABASE_ANON_KEY = 'your-anon-key-here';
```

## Step 6: Add Supabase Script to HTML

Add the Supabase JavaScript client to your HTML files. Add this before your other scripts:

```html
<!-- In the <head> or before closing </body> -->
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>

<!-- Your ExperienceLink scripts -->
<script src="js/supabase-client.js"></script>
<script src="js/projects-api.js"></script>
<script src="js/applications-api.js"></script>
```

## Step 7: Test the Setup

Open your browser console and test:

```javascript
// Test connection
const { data, error } = await ExperienceLink.Skills.getAll();
console.log('Skills:', data);

// Test auth
await ExperienceLink.Auth.signUp('test@example.com', 'password123', 'student');
```

## Database Schema Overview

### Tables

| Table | Description |
|-------|-------------|
| `profiles` | User profiles (extends Supabase Auth) |
| `students` | Student-specific information |
| `companies` | Company-specific information |
| `skills` | Skill definitions (seeded with common skills) |
| `student_skills` | Skills that students have |
| `projects` | Company project postings |
| `project_skills` | Skills required for projects |
| `applications` | Student applications to projects |
| `messages` | Communication within applications |
| `deliverables` | Project submissions |
| `reviews` | Student reviews from companies |

### Enums

- `user_role`: 'student', 'company'
- `application_status`: 'pending', 'accepted', 'rejected', 'withdrawn'
- `project_status`: 'draft', 'active', 'in_progress', 'completed', 'cancelled'

## API Usage Examples

### Authentication

```javascript
// Sign up as student
await ExperienceLink.Auth.signUp('student@example.com', 'password', 'student', {
    full_name: 'John Doe'
});

// Sign in
await ExperienceLink.Auth.signIn('student@example.com', 'password');

// Sign out
await ExperienceLink.Auth.signOut();
```

### Students

```javascript
// Create student profile (after signup)
await ExperienceLink.Students.createStudent({
    full_name: 'John Doe',
    university: 'MIT',
    bio: 'Computer Science student...'
});

// Add skills
await ExperienceLink.Students.addSkill(skillId, 4); // proficiency 1-5
```

### Companies

```javascript
// Create company profile (after signup)
await ExperienceLink.Companies.createCompany({
    company_name: 'Tech Corp',
    industry: 'Technology',
    description: 'We build cool stuff...'
});
```

### Projects

```javascript
// Search projects
const projects = await ExperienceLink.Projects.search({
    searchText: 'React',
    skillIds: [reactSkillId],
    minReward: 100
});

// Create project (as company)
await ExperienceLink.Projects.create({
    title: 'Build a Landing Page',
    description: 'Create a modern landing page...',
    duration_weeks: 2,
    reward_amount: 200
}, [reactSkillId, tailwindSkillId]);
```

### Applications

```javascript
// Apply to project (as student)
await ExperienceLink.Applications.apply(projectId, {
    coverLetter: 'I am excited to work on this...',
    proposedApproach: 'I would start by...',
    estimatedDays: 10
});

// Accept application (as company)
await ExperienceLink.Applications.accept(applicationId);
```

## Troubleshooting

### Common Issues

1. **"relation does not exist"**: Run migrations in order
2. **"permission denied"**: Check RLS policies are enabled
3. **"JWT expired"**: User needs to sign in again
4. **CORS errors**: Check your site URL in Supabase settings

### Useful SQL Queries

Check if tables exist:
```sql
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public';
```

Check RLS is enabled:
```sql
SELECT tablename, rowsecurity FROM pg_tables
WHERE schemaname = 'public';
```

## Storage Setup (Optional)

For file uploads (resumes, avatars, deliverables):

1. Go to **Storage** in dashboard
2. Create buckets:
   - `avatars` - for profile pictures
   - `resumes` - for student resumes
   - `deliverables` - for project submissions
3. Set up appropriate RLS policies for each bucket

## Next Steps

- Implement the frontend form handlers
- Set up file upload functionality
- Configure email templates for notifications
- Set up webhook triggers for email notifications
