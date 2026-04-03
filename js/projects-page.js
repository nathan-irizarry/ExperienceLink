/**
 * ExperienceLink - Projects Page Controller
 *
 * Dynamically loads and displays projects from the database
 * for the student-facing projects page.
 */

(function () {
    'use strict';

    const projectsGrid = document.getElementById('projectsGrid');
    const modal = document.getElementById('projectModal');
    const modalTitle = document.getElementById('modalProjectTitle');
    const modalCompany = document.getElementById('modalCompanyName');
    const searchInput = document.querySelector('.form-input[placeholder="Search projects..."]');
    const filterPills = document.querySelectorAll('.filter-pill');

    // Store loaded projects for filtering
    let allProjects = [];

    /**
     * Escape HTML to prevent XSS
     */
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text || '';
        return div.innerHTML;
    }

    /**
     * Truncate text with ellipsis
     */
    function truncate(text, maxLength) {
        if (!text || text.length <= maxLength) return text || '';
        return text.substring(0, maxLength).trim() + '...';
    }

    /**
     * Format reward display
     */
    function formatReward(project) {
        if (project.reward_amount) {
            return `$${project.reward_amount.toLocaleString()}`;
        }
        if (project.reward_type === 'credit') {
            return 'Course Credit';
        }
        return 'TBD';
    }

    /**
     * Get company initial for avatar
     */
    function getCompanyInitial(project) {
        const name = project.company?.company_name || 'Company';
        return name.charAt(0).toUpperCase();
    }

    /**
     * Extract skills from project
     */
    function getSkills(project) {
        if (!project.skills || !Array.isArray(project.skills)) return [];
        return project.skills.map(s => s.skill?.name).filter(Boolean);
    }

    /**
     * Render a featured project card (large, 8-col)
     */
    function renderFeaturedCard(project, delay = 100) {
        const skills = getSkills(project);
        const skillsHtml = skills.map(s => `<span class="tag">${escapeHtml(s)}</span>`).join('');

        return `
            <div class="lg:col-span-8 bento-card bento-card-lg card-hover hover-lift relative overflow-hidden cursor-pointer project-card"
                data-animate="fadeUp" style="--delay: ${delay}ms;"
                data-project-id="${project.id}"
                data-project-title="${escapeHtml(project.title)}"
                data-company-name="${escapeHtml(project.company?.company_name || 'Company')}">
                <div class="absolute top-4 right-4">
                    <span class="px-3 py-1 bg-amber text-ink text-xs font-mono font-semibold rounded-full">Featured</span>
                </div>
                <div class="flex items-center gap-4 mb-6">
                    <div class="avatar" style="background: rgba(59, 130, 246, 0.2); color: var(--color-coral);">
                        ${getCompanyInitial(project)}
                    </div>
                    <div>
                        <p class="label">${escapeHtml(project.company?.company_name || 'Company')}</p>
                        <h3 class="text-xl font-display font-semibold text-stone-900">${escapeHtml(project.title)}</h3>
                    </div>
                </div>
                <p class="text-stone-600 mb-6 text-lg leading-relaxed">
                    ${escapeHtml(truncate(project.description, 200))}
                </p>
                <div class="flex flex-wrap gap-2 mb-6">
                    ${skillsHtml}
                </div>
                <div class="flex items-center justify-between pt-6 border-t border-stone-200">
                    <div class="flex items-center gap-6">
                        <span class="flex items-center gap-2 text-stone-500 font-mono text-sm">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            ${escapeHtml(project.duration || 'Flexible')}
                        </span>
                        <span class="flex items-center gap-2 text-amber font-mono text-sm font-semibold">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            ${formatReward(project)}
                        </span>
                    </div>
                    <span class="btn btn-primary btn-sm arrow-right">
                        Apply
                        <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>
                    </span>
                </div>
            </div>
        `;
    }

    /**
     * Render a compact project card
     */
    function renderCompactCard(project, delay = 200, dark = false) {
        const skills = getSkills(project);
        const skillsHtml = skills.slice(0, 3).map(s => `<span class="tag">${escapeHtml(s)}</span>`).join('');

        const cardClass = dark ? 'bento-card card-dark card-hover hover-lift' : 'bento-card card-hover hover-lift';
        const titleClass = dark ? 'font-display font-semibold text-cream' : 'font-display font-semibold text-stone-900';
        const labelClass = dark ? 'label text-xs text-stone-400' : 'label text-xs';
        const durationClass = dark ? 'font-mono text-stone-400' : 'font-mono text-stone-500';

        return `
            <div class="${cardClass} cursor-pointer project-card"
                data-animate="fadeUp" style="--delay: ${delay}ms;"
                data-project-id="${project.id}"
                data-project-title="${escapeHtml(project.title)}"
                data-company-name="${escapeHtml(project.company?.company_name || 'Company')}">
                <div class="flex items-center gap-3 mb-4">
                    <div class="avatar avatar-sm" style="background: rgba(59, 130, 246, 0.2); color: var(--color-coral);">
                        ${getCompanyInitial(project)}
                    </div>
                    <div>
                        <p class="${labelClass}">${escapeHtml(project.company?.company_name || 'Company')}</p>
                        <h3 class="${titleClass}">${escapeHtml(project.title)}</h3>
                    </div>
                </div>
                <div class="flex flex-wrap gap-2 mb-4">
                    ${skillsHtml}
                </div>
                <div class="flex items-center justify-between text-sm">
                    <span class="${durationClass}">${escapeHtml(project.duration || 'Flexible')}</span>
                    <span class="font-mono text-amber font-semibold">${formatReward(project)}</span>
                </div>
            </div>
        `;
    }

    /**
     * Render a standard project card with description
     */
    function renderStandardCard(project, delay = 400) {
        const skills = getSkills(project);
        const skillsHtml = skills.slice(0, 3).map(s => `<span class="tag">${escapeHtml(s)}</span>`).join('');

        return `
            <div class="lg:col-span-4 bento-card card-hover hover-lift cursor-pointer project-card"
                data-animate="fadeUp" style="--delay: ${delay}ms;"
                data-project-id="${project.id}"
                data-project-title="${escapeHtml(project.title)}"
                data-company-name="${escapeHtml(project.company?.company_name || 'Company')}">
                <div class="flex items-center gap-3 mb-4">
                    <div class="avatar avatar-sm" style="background: rgba(59, 130, 246, 0.2); color: var(--color-coral);">
                        ${getCompanyInitial(project)}
                    </div>
                    <div>
                        <p class="label text-xs">${escapeHtml(project.company?.company_name || 'Company')}</p>
                        <h3 class="font-display font-semibold text-stone-900">${escapeHtml(project.title)}</h3>
                    </div>
                </div>
                <p class="text-stone-600 text-sm mb-4">${escapeHtml(truncate(project.description, 80))}</p>
                <div class="flex flex-wrap gap-2 mb-4">
                    ${skillsHtml}
                </div>
                <div class="flex items-center justify-between text-sm">
                    <span class="font-mono text-stone-500">${escapeHtml(project.duration || 'Flexible')}</span>
                    <span class="font-mono text-amber font-semibold">${formatReward(project)}</span>
                </div>
            </div>
        `;
    }

    /**
     * Render all projects in the grid
     */
    function renderProjects(projects) {
        if (!projectsGrid) return;

        if (projects.length === 0) {
            projectsGrid.innerHTML = `
                <div class="lg:col-span-12 text-center py-16">
                    <div class="icon-box mx-auto mb-4 w-16 h-16">
                        <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <h3 class="font-display text-xl font-semibold text-stone-900 mb-2">No projects found</h3>
                    <p class="text-stone-600">Try adjusting your search or filters.</p>
                </div>
            `;
            return;
        }

        let html = '';
        let delay = 100;

        // First project is featured (large card)
        if (projects.length > 0) {
            html += renderFeaturedCard(projects[0], delay);
            delay += 100;
        }

        // Next 2 projects in compact stack (right column)
        if (projects.length > 1) {
            html += '<div class="lg:col-span-4 flex flex-col gap-6">';
            if (projects[1]) {
                html += renderCompactCard(projects[1], delay, false);
                delay += 100;
            }
            if (projects[2]) {
                html += renderCompactCard(projects[2], delay, true);
                delay += 100;
            }
            html += '</div>';
        }

        // Remaining projects in standard grid
        for (let i = 3; i < projects.length; i++) {
            html += renderStandardCard(projects[i], delay);
            delay += 100;
        }

        projectsGrid.innerHTML = html;

        // Bind click handlers to new cards
        bindCardClickHandlers();

        // Re-initialize animations
        if (window.ExperienceLink?.Animations) {
            window.ExperienceLink.Animations.initAnimations();
        }
    }

    /**
     * Bind click handlers to project cards
     */
    function bindCardClickHandlers() {
        const cards = projectsGrid.querySelectorAll('.project-card');

        cards.forEach(card => {
            card.addEventListener('click', (e) => {
                e.preventDefault();
                const title = card.dataset.projectTitle;
                const company = card.dataset.companyName;

                if (modalTitle) modalTitle.textContent = title;
                if (modalCompany) modalCompany.textContent = company;
                if (modal) {
                    modal.classList.remove('hidden');
                    document.body.style.overflow = 'hidden';
                }
            });
        });
    }

    /**
     * Filter projects based on search and active filters
     */
    function filterProjects() {
        const searchTerm = searchInput?.value.toLowerCase().trim() || '';
        const activeFilters = Array.from(filterPills)
            .filter(pill => pill.classList.contains('active'))
            .map(pill => pill.textContent.toLowerCase().trim());

        const filtered = allProjects.filter(project => {
            // Search filter
            const title = (project.title || '').toLowerCase();
            const company = (project.company?.company_name || '').toLowerCase();
            const description = (project.description || '').toLowerCase();
            const skills = getSkills(project).map(s => s.toLowerCase());

            const matchesSearch = !searchTerm ||
                title.includes(searchTerm) ||
                company.includes(searchTerm) ||
                description.includes(searchTerm) ||
                skills.some(s => s.includes(searchTerm));

            // Skill filter
            const matchesFilters = activeFilters.length === 0 ||
                activeFilters.some(filter => skills.some(s => s.includes(filter)));

            return matchesSearch && matchesFilters;
        });

        renderProjects(filtered);
    }

    /**
     * Load projects from the database
     */
    async function loadProjects() {
        if (!projectsGrid) return;

        // Show loading state
        projectsGrid.innerHTML = `
            <div class="lg:col-span-12 text-center py-16">
                <div class="animate-spin w-8 h-8 mx-auto mb-4 border-2 border-coral border-t-transparent rounded-full"></div>
                <p class="text-stone-600">Loading projects...</p>
            </div>
        `;

        try {
            const Projects = window.ExperienceLink?.Projects || window.Projects;
            if (!Projects) {
                throw new Error('Projects API not available');
            }

            allProjects = await Projects.getActive();
            renderProjects(allProjects);

        } catch (error) {
            console.error('Error loading projects:', error);
            projectsGrid.innerHTML = `
                <div class="lg:col-span-12 text-center py-16">
                    <div class="icon-box mx-auto mb-4 w-16 h-16 bg-red-100">
                        <svg class="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <h3 class="font-display text-xl font-semibold text-stone-900 mb-2">Unable to load projects</h3>
                    <p class="text-stone-600 mb-4">There was an error loading projects. Please try refreshing the page.</p>
                    <button onclick="location.reload()" class="btn btn-secondary">Refresh Page</button>
                </div>
            `;
        }
    }

    /**
     * Initialize the page
     */
    function init() {
        // Load projects on page load
        loadProjects();

        // Set up search handler
        if (searchInput) {
            searchInput.addEventListener('input', filterProjects);
        }

        // Set up filter handlers
        filterPills.forEach(pill => {
            pill.addEventListener('click', () => {
                pill.classList.toggle('active');
                filterProjects();
            });
        });
    }

    // Start when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
