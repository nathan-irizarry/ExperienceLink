/**
 * ExperienceLink - Companies Page Controller
 *
 * Handles the companies dashboard functionality:
 * - Project creation form submission
 * - Loading and displaying company's projects
 * - Character counter for description
 * - Toast notifications
 */

(function () {
    'use strict';

    // DOM Elements
    const projectForm = document.querySelector('[data-tab-panel="post"] form');
    const descriptionField = document.getElementById('description');
    const charCountDisplay = document.getElementById('charCount');
    const activeProjectsPanel = document.querySelector('[data-tab-panel="active"]');
    const projectsGrid = activeProjectsPanel?.querySelector('.grid');

    /**
     * Show a toast notification
     */
    function showToast(message, type = 'success') {
        // Remove existing toasts
        document.querySelectorAll('.toast').forEach(t => t.remove());

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <div class="flex items-center gap-3">
                ${type === 'success'
                ? '<svg class="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>'
                : '<svg class="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>'
            }
                <span>${message}</span>
            </div>
        `;

        // Toast styles
        Object.assign(toast.style, {
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            padding: '16px 24px',
            backgroundColor: type === 'success' ? '#ecfdf5' : '#fef2f2',
            border: `1px solid ${type === 'success' ? '#a7f3d0' : '#fecaca'}`,
            borderRadius: '8px',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
            zIndex: '9999',
            animation: 'fadeIn 0.3s ease'
        });

        document.body.appendChild(toast);

        // Auto-remove after 4 seconds
        setTimeout(() => {
            toast.style.animation = 'fadeOut 0.3s ease forwards';
            setTimeout(() => toast.remove(), 300);
        }, 4000);
    }

    /**
     * Initialize character counter for description field
     */
    function initCharCounter() {
        if (!descriptionField || !charCountDisplay) return;

        function updateCount() {
            charCountDisplay.textContent = descriptionField.value.length;
        }

        descriptionField.addEventListener('input', updateCount);
        updateCount(); // Initial count
    }

    /**
     * Render a project card for the Active Projects tab
     */
    function renderProjectCard(project, delay = 0) {
        const statusLabels = {
            'active': 'Active',
            'draft': 'Draft',
            'in_progress': 'In Progress',
            'completed': 'Completed',
            'cancelled': 'Cancelled'
        };

        const statusColors = {
            'active': 'bg-coral/20 text-coral',
            'draft': 'bg-stone-200 text-stone-600',
            'in_progress': 'bg-amber/20 text-amber',
            'completed': 'bg-green-100 text-green-700',
            'cancelled': 'bg-stone-200 text-stone-500'
        };

        const applicantCount = project.applications?.[0]?.count || 0;

        const card = document.createElement('div');
        card.className = 'bento-card card-hover hover-lift';
        card.setAttribute('data-animate', 'fadeUp');
        card.style.setProperty('--delay', `${delay}ms`);
        card.dataset.projectId = project.id;

        card.innerHTML = `
            <div class="flex justify-between items-start mb-4">
                <h3 class="font-display font-semibold text-stone-900">${escapeHtml(project.title)}</h3>
                <span class="px-2 py-1 ${statusColors[project.status] || 'bg-stone-200 text-stone-600'} text-xs font-mono rounded-full">
                    ${statusLabels[project.status] || project.status}
                </span>
            </div>
            <p class="text-stone-600 text-sm mb-4">${escapeHtml(truncate(project.description || '', 100))}</p>
            <div class="flex items-center justify-between text-sm">
                <span class="font-mono text-stone-500">${applicantCount} applicant${applicantCount !== 1 ? 's' : ''}</span>
                <button class="text-amber hover:text-amber/80 font-medium link-underline view-details-btn">View Details</button>
            </div>
        `;

        return card;
    }

    /**
     * Load and display company's projects
     */
    async function loadCompanyProjects() {
        if (!projectsGrid) return;

        try {
            const Projects = window.ExperienceLink?.Projects || window.Projects;
            if (!Projects) {
                console.error('Projects API not available');
                return;
            }

            const projects = await Projects.getMyProjects();

            // Clear existing static content
            projectsGrid.innerHTML = '';

            if (projects.length === 0) {
                projectsGrid.innerHTML = `
                    <div class="lg:col-span-3 text-center py-12">
                        <div class="icon-box mx-auto mb-4 w-16 h-16">
                            <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                        </div>
                        <h3 class="font-display text-xl font-semibold text-stone-900 mb-2">No projects yet</h3>
                        <p class="text-stone-600">Post your first project to start finding talented students!</p>
                    </div>
                `;
                return;
            }

            projects.forEach((project, index) => {
                const card = renderProjectCard(project, index * 100);
                projectsGrid.appendChild(card);
            });

            // Re-initialize animations for new cards
            if (window.ExperienceLink?.Animations) {
                window.ExperienceLink.Animations.initAnimations();
            }

        } catch (error) {
            console.error('Error loading projects:', error);
            projectsGrid.innerHTML = `
                <div class="lg:col-span-3 text-center py-12">
                    <p class="text-red-600">Error loading projects. Please try refreshing the page.</p>
                </div>
            `;
        }
    }

    /**
     * Handle project form submission
     */
    async function handleFormSubmit(e) {
        e.preventDefault();

        const submitBtn = projectForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;

        try {
            // Show loading state
            submitBtn.disabled = true;
            submitBtn.innerHTML = `
                <svg class="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Posting...
            `;

            // Gather form data
            const title = document.getElementById('projectTitle').value.trim();
            const description = document.getElementById('description').value.trim();
            const skills = document.getElementById('skills').value.trim();
            const duration = document.getElementById('duration').value.trim();
            const reward = document.getElementById('reward').value.trim();

            // Validate required fields
            if (!title) {
                throw new Error('Project title is required');
            }
            if (!description) {
                throw new Error('Description is required');
            }

            // Parse reward amount (extract number if present)
            let rewardAmount = null;
            const rewardMatch = reward.match(/\$?(\d+(?:,\d{3})*(?:\.\d{2})?)/);
            if (rewardMatch) {
                rewardAmount = parseFloat(rewardMatch[1].replace(/,/g, ''));
            }

            // Create project data
            const projectData = {
                title,
                description,
                duration,
                reward_amount: rewardAmount,
                reward_type: reward.toLowerCase().includes('credit') ? 'credit' : 'monetary',
                status: 'active'
            };

            // Get Projects API
            const Projects = window.ExperienceLink?.Projects || window.Projects;
            if (!Projects) {
                throw new Error('Projects API not available');
            }

            // Create the project (skills are stored as text for now, can be enhanced later)
            const project = await Projects.create(projectData);

            // Success - show toast and reset form
            showToast('Project posted successfully!', 'success');
            projectForm.reset();
            if (charCountDisplay) charCountDisplay.textContent = '0';

            // Reload projects list
            await loadCompanyProjects();

            // Switch to Active Projects tab
            const activeTab = document.querySelector('[data-tab="active"]');
            if (activeTab) {
                activeTab.click();
            }

        } catch (error) {
            console.error('Error creating project:', error);
            showToast(error.message || 'Failed to post project. Please try again.', 'error');
        } finally {
            // Restore button
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
        }
    }

    /**
     * Utility: Escape HTML to prevent XSS
     */
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Utility: Truncate text with ellipsis
     */
    function truncate(text, maxLength) {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength).trim() + '...';
    }

    /**
     * Check if user is a company and redirect if not
     */
    async function requireCompanyRole() {
        const Companies = window.Companies || window.ExperienceLink?.Companies;
        if (!Companies) {
            console.error('Companies API not loaded');
            return false;
        }

        try {
            const company = await Companies.getCurrentCompany();
            if (!company) {
                // User is logged in but not a company - redirect to student page
                showToast('This page is for company accounts only.', 'error');
                setTimeout(() => {
                    window.location.href = 'projects.html';
                }, 1500);
                return false;
            }
            return true;
        } catch (error) {
            console.error('Error checking company role:', error);
            return false;
        }
    }

    /**
     * Initialize the page
     */
    async function init() {
        // Wait for DOM and auth to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', init);
            return;
        }

        // Check company role after a short delay to ensure auth is loaded
        setTimeout(async () => {
            const isCompany = await requireCompanyRole();
            if (!isCompany) return;

            // Initialize components
            initCharCounter();

            // Set up form submission
            if (projectForm) {
                projectForm.addEventListener('submit', handleFormSubmit);
            }

            // Load company's existing projects
            await loadCompanyProjects();
        }, 500);
    }

    // Start initialization
    init();
})();
