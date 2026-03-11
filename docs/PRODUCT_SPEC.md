# Product Specification: Mini-Internship Platform MVP

## Document Info
- **Version:** 1.0
- **Last Updated:** March 2026
- **Status:** Draft

---

## Core Action (MVP Focus)

**The ONE thing users must be able to do:**
> Complete a mini-internship project and receive a verified credential to add to their resume/LinkedIn.

Everything else is secondary.

---

## User Stories (MoSCoW Prioritized)

### MUST HAVE (MVP fails without these)

#### US-1: Browse Available Mini-Internships
> **As a** student seeking internship experience,
> **I want to** browse available mini-internship projects,
> **So that** I can find one that matches my career interests.

**Acceptance Criteria:**
- [ ] User can view a list of available mini-internships
- [ ] Each listing shows: title, industry/field, estimated hours, skills gained
- [ ] User can filter by field (e.g., Digital Marketing, Software Dev)
- [ ] Works on mobile and desktop

---

#### US-2: Enroll in a Mini-Internship
> **As a** student who found a relevant project,
> **I want to** enroll in a mini-internship,
> **So that** I can start building real experience.

**Acceptance Criteria:**
- [ ] User can click "Enroll" on a project
- [ ] User must create account or log in to enroll
- [ ] User receives confirmation with project details and timeline
- [ ] User can access project materials after enrollment

---

#### US-3: Complete and Submit Project Work
> **As an** enrolled student,
> **I want to** complete the project tasks and submit my work,
> **So that** I can earn my credential.

**Acceptance Criteria:**
- [ ] User can view project brief, requirements, and deliverables
- [ ] User can upload/submit their completed work (files, links, or text)
- [ ] User receives confirmation that submission was received
- [ ] User can see submission status (pending review, approved, needs revision)

---

### SHOULD HAVE (Important but MVP works without)

#### US-4: Receive Verified Credential
> **As a** student who completed a mini-internship,
> **I want to** receive a shareable credential,
> **So that** I can add it to my resume and LinkedIn profile.

**Acceptance Criteria:**
- [ ] User receives credential after work is approved
- [ ] Credential includes: project title, skills demonstrated, completion date, verification link
- [ ] User can download credential as PDF
- [ ] User can share credential via unique URL

---

### COULD HAVE (Nice if time permits)

#### US-5: Track Progress Across Multiple Projects
> **As a** returning student,
> **I want to** see my dashboard of completed and in-progress mini-internships,
> **So that** I can track my experience-building journey.

**Acceptance Criteria:**
- [ ] User has a personal dashboard
- [ ] Dashboard shows: enrolled projects, completed projects, earned credentials
- [ ] User can resume in-progress projects from dashboard

---

## Functional Requirements

### Authentication & Accounts
| ID | Requirement | Priority |
|----|-------------|----------|
| FR-1 | Users can create account with email/password | Must |
| FR-2 | Users can log in and maintain session | Must |
| FR-3 | Users can reset forgotten password | Should |

### Project Discovery
| ID | Requirement | Priority |
|----|-------------|----------|
| FR-4 | System displays list of available mini-internships | Must |
| FR-5 | Each project has: title, description, field, time estimate, skills | Must |
| FR-6 | Users can filter projects by field/industry | Must |
| FR-7 | Projects show enrollment count or social proof | Could |

### Enrollment & Access
| ID | Requirement | Priority |
|----|-------------|----------|
| FR-8 | Authenticated users can enroll in projects | Must |
| FR-9 | Enrolled users can access project materials | Must |
| FR-10 | System limits concurrent enrollments (e.g., max 2) | Should |

### Project Completion
| ID | Requirement | Priority |
|----|-------------|----------|
| FR-11 | Users can view project brief and requirements | Must |
| FR-12 | Users can submit deliverables (file upload or link) | Must |
| FR-13 | System confirms submission receipt | Must |
| FR-14 | Admin can review and approve/reject submissions | Must |

### Credentials
| ID | Requirement | Priority |
|----|-------------|----------|
| FR-15 | Approved submissions generate a credential | Should |
| FR-16 | Credentials have unique verification URL | Should |
| FR-17 | Users can download credential as PDF | Could |

---

## Success Metrics

### Primary Metrics (North Star)
| Metric | Definition | Target (MVP) |
|--------|------------|--------------|
| **Completion Rate** | % of enrolled users who submit work | > 40% |
| **Time to First Completion** | Days from signup to first submission | < 14 days |

### Secondary Metrics
| Metric | Definition | Target (MVP) |
|--------|------------|--------------|
| Enrollment Rate | % of visitors who enroll in a project | > 15% |
| Credential Share Rate | % of completers who share their credential | > 25% |
| Return User Rate | % of completers who start a second project | > 20% |

### Guardrail Metrics (Don't let these break)
| Metric | Definition | Threshold |
|--------|------------|-----------|
| Submission Rejection Rate | % of submissions marked "needs revision" | < 30% |
| Support Ticket Volume | Tickets per 100 users | < 5 |

---

## Out of Scope (NOT building in MVP)

### Won't Have — Explicitly Excluded

| Feature | Why Not |
|---------|---------|
| **Company/employer portal** | MVP focuses on student experience; companies provide projects manually |
| **Payment/subscription system** | Validate value before monetizing; MVP is free or single price point |
| **Real-time mentorship/chat** | Adds complexity; async feedback via submission review is sufficient |
| **Job board / internship listings** | Stay focused on mini-internships, not competing with LinkedIn/Handshake |
| **Mobile native apps** | Responsive web is sufficient for MVP |
| **Social features** | No profiles, following, or community features |
| **AI-powered matching** | Simple category filtering is enough for MVP catalog size |
| **Gamification** | No badges, points, or leaderboards beyond the credential |
| **Integration with LinkedIn/ATS** | Manual credential sharing is fine for MVP |
| **Multi-language support** | English only |
| **Company verification/vetting** | Curated projects added manually by team |

### Deferred to V2
- Employer dashboard to post and review projects
- Stripe integration for paid tiers
- Skill assessments before/after projects
- Peer review system
- University/institution partnerships with SSO

---

## MVP Scope Summary

**Build:**
1. Landing page explaining value prop
2. Project catalog with filtering
3. User signup/login
4. Project enrollment flow
5. Project detail page with brief & requirements
6. Submission upload
7. Admin review interface (can be basic)
8. Credential generation (basic — shareable link)

**Don't Build:**
- Anything that doesn't directly serve: Browse → Enroll → Complete → Credential

---

## Open Questions

1. **Pricing model:** Free MVP? One-time fee per project? Subscription?
2. **Project sourcing:** Who creates the initial mini-internship projects? (Internal team? Partner companies?)
3. **Review process:** Who reviews submissions? How fast is turnaround?
4. **Legal:** Any liability concerns with calling it an "internship"?

---

## Appendix: User Persona Reference

**Michael Jergonsen** (Primary Persona)
- 22-year-old college sophomore
- Seeking Digital Marketing internships
- Applied to several positions, rejected for lack of experience
- Feels pressure from peers, parents, teachers
- Willing to pay for career development (sees it as investment)
- Currently trying: networking, mass applications, considering career pivot
