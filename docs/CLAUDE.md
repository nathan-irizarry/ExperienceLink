# CLAUDE.md - Mini-Internship Platform

## Product Overview

A platform that bridges the experience gap for college students seeking internships by offering "mini-internships" — short, structured project-based work experiences that students can complete to build real portfolio pieces and resume-worthy experience.

**Core Problem:** Students can't get internships because they lack experience, but they can't get experience without internships. This catch-22 affects ~4.6 million students annually.

**Solution:** Provide bite-sized, real-world projects (mini-internships) that students complete to gain demonstrable skills and experience they can showcase to employers.

## Target User

**Primary User: The Inexperienced Job Seeker**
- College sophomores/juniors (ages 19-23)
- Actively seeking their first internship
- Have applied to positions but rejected due to lack of experience
- Feeling pressure from peers, parents, and professors
- Willing to invest in their career development

**Key Context:**
- Peak usage during internship seasons (Fall for summer roles, Winter for spring)
- High emotional stakes — rejection feels personal
- Currently relying on networking, luck, or pivoting career paths

## Value Proposition

> "We help students get internships by filling the experience gap through mini-internships."

**Why it works:**
- Transforms "no experience" into "completed 3 marketing projects for real companies"
- Provides portfolio pieces, not just certificates
- Lower barrier than traditional internships (shorter commitment, remote-friendly)
- Students view this as career investment, not expense

## Tech Stack

**Frontend:**
- React with TypeScript
- Tailwind CSS for styling
- Vite for build tooling

**Backend:**
- Node.js with Express
- PostgreSQL database
- Prisma ORM

**Infrastructure:**
- Vercel (frontend hosting)
- Railway or Render (backend hosting)
- Cloudflare (CDN/security)

**Auth & Payments:**
- Clerk or Auth0 (authentication)
- Stripe (payments)

**Why this stack:**
- Fast to prototype and iterate
- Strong ecosystem and hiring pool
- Cost-effective for MVP scale
- Easy to scale when needed

## Development Guidelines

- Focus on the core flow: Student signs up → Browses projects → Enrolls → Completes → Gets verified credential
- Keep scope minimal — every feature should directly serve the core value prop
- Mobile-responsive from day one (students browse on phones)
- Prioritize speed over perfection in MVP phase
