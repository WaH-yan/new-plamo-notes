class Project {
    constructor(data) {
        this.id = data.id || null;
        this.user_id = data.user_id || null;
        this.name = data.name || '';
        this.description = data.description || '';
        this.category = data.category || '';
        this.progress = data.progress || 0;
        this.plan_to_complete = data.plan_to_complete || null;
        this.created_date = data.created_date || new Date().toISOString();
        this.images = data.images || [];
        this.criteria = data.criteria || [];
        this.criteria_ids = data.criteria_ids || [];
        this.completed_criteria = data.completed_criteria || [];
        this.tags = data.tags || [];
        this.logbook = data.logbook || [];
        // Derive status from progress
        this.status = this.progress === 100 ? 'complete' : 'active';
    }
}

class ModelKitManager {
    constructor() {
        this.projects = [];
        this.currentProject = null;
        this.currentDate = new Date();
        this.criteria = [];
        this.tags = [];
        this.events = [];
        this.uploadedImages = [];
        this.uploadedFiles = [];

        this.init();
    }

    init() {
        document.addEventListener('DOMContentLoaded', () => {
            this.checkAuthentication();
            this.loadData();
            this.setupEventListeners();
            this.showPage('portfolio'); // Calls renderPortfolio, which updates stats
            this.updateUserInfo();
        });
    }

    checkAuthentication() {
        const currentUser = localStorage.getItem('currentUser');
        if (!currentUser) {
            console.error('checkAuthentication: No currentUser in localStorage');
            window.location.href = 'index.html';
            return;
        }

        try {
            this.currentUser = JSON.parse(currentUser);
            console.log('checkAuthentication: Parsed currentUser:', this.currentUser);
            if (!this.currentUser.id) {
                console.error('checkAuthentication: currentUser lacks id:', this.currentUser);
                alert('User not authenticated. Please sign in again.');
                localStorage.removeItem('currentUser');
                window.location.href = 'index.html';
                return;
            }
            console.log('checkAuthentication: User authenticated with id:', this.currentUser.id);
        } catch (e) {
            console.error('checkAuthentication: Failed to parse currentUser:', e);
            localStorage.removeItem('currentUser');
            window.location.href = 'index.html';
        }
    }

    updateUserInfo() {
        if (this.currentUser) {
            const userDisplayName = document.getElementById('userDisplayName');
            const userEmail = document.getElementById('userEmail');
            const userBadge = document.getElementById('userBadge');
            const fullName = document.getElementById('fullName');
            const username = document.getElementById('username');
            const emailAddress = document.getElementById('emailAddress');

            if (userDisplayName) userDisplayName.textContent = this.currentUser.name || 'User';
            if (userEmail) userEmail.textContent = this.currentUser.email || '';
            if (userBadge) userBadge.textContent = 'Member';
            if (fullName) fullName.value = this.currentUser.name || '';
            if (username) username.value = this.currentUser.username || '';
            if (emailAddress) emailAddress.value = this.currentUser.email || '';
        }
    }

    setupEventListeners() {
        document.addEventListener('click', (e) => {
            const navItem = e.target.closest('.nav-item');
            if (navItem) {
                e.preventDefault();
                const page = navItem.dataset.page;
                this.showPage(page);
                this.setActiveNav(navItem);
            } else if (e.target.closest('.event-item')) {
                const eventId = e.target.closest('.event-item').dataset.eventId;
                if (eventId) {
                    this.showEventDetail(parseInt(eventId));
                }
            } else if (e.target.classList.contains('modal')) {
                this.closeProjectDetail();
                this.closeEventDetail();
            } else if (e.target.closest('.add-btn')) {
                this.addCriteria();
            } else if (e.target.closest('.remove-btn')) {
                const index = e.target.closest('.remove-btn').dataset.index;
                if (index !== undefined) {
                    this.removeCriteria(parseInt(index));
                }
            } else if (e.target.closest('.tag-remove')) {
                const index = e.target.closest('.tag-remove').data-index;
                if (index !== undefined) {
                    this.removeTag(parseInt(index));
                }
            } else if (e.target.closest('.remove-image')) {
                const index = e.target.closest('.remove-image').data-index;
                if (index !== undefined) {
                    this.removeUploadedImage(parseInt(index));
                }
            } else if (e.target.closest('.delete-project')) {
                const projectId = this.currentProject.id;
                if (projectId) {
                    if (confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
                        this.deleteProject(projectId);
                    }
                }
            } else if (e.target.closest('.delete-event')) {
                const eventId = parseInt(e.target.closest('.delete-event').dataset.eventId);
                if (eventId) {
                    if (confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
                        this.deleteEvent(eventId);
                    }
                }
            }
        });

        document.addEventListener('submit', (e) => {
            if (e.target.id === 'newProjectForm') {
                e.preventDefault();
                this.createProject();
            } else if (e.target.id === 'newEventForm') {
                e.preventDefault();
                this.createEvent();
            } else if (e.target.id === 'logbookForm') {
                e.preventDefault();
                this.addLogbookEntry();
            } else if (e.target.id === 'personalInfoForm') {
                e.preventDefault();
                this.updatePersonalInfo();
            } else if (e.target.id === 'passwordForm') {
                e.preventDefault();
                this.changePassword();
            }
        });

        document.addEventListener('change', (e) => {
            if (e.target.id === 'projectImages') {
                this.handleMultipleImageUpload(e);
            }
        });

        document.addEventListener('keypress', (e) => {
            if (e.target.id === 'tagsInput' && e.key === 'Enter') {
                this.handleTagInput(e);
            }
        });

        // Add search input listener
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                const query = e.target.value.trim().toLowerCase();
                this.filterProjects(query);
            });
        }
    }

    createDummyData() {
        // Removed to prevent conflicts with database entries
    }

    showPage(pageName) {
        let pageId = pageName;
        if (pageName === 'new-project') {
            pageId = 'newProject';
        } else if (pageName === 'new-event') {
            pageId = 'newEvent';
        }

        document.querySelectorAll('.page').forEach(page => {
            page.classList.remove('active');
        });

        const targetPage = document.getElementById(`${pageId}Page`);
        if (targetPage) {
            targetPage.classList.add('active');
            console.log(`Showing page: ${pageId}Page`);
        } else {
            console.error(`Page with ID ${pageId}Page not found`);
            return;
        }

        switch (pageName) {
            case 'portfolio':
                this.renderPortfolio();
                break;
            case 'new-project':
                this.resetProjectForm();
                break;
            case 'new-event':
                this.resetEventForm();
                break;
            case 'calendar':
                this.renderCalendar();
                break;
            case 'account':
                this.updateUserInfo();
                break;
            default:
                console.error(`Unknown page: ${pageName}`);
        }
    }

    setActiveNav(activeItem) {
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        activeItem.classList.add('active');
    }

    createProject() {
        const form = document.getElementById('newProjectForm');
        const formData = new FormData(form);
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));

        if (!currentUser || !currentUser.id) {
            console.error('createProject: No currentUser or missing id:', currentUser);
            this.showMessage('User not authenticated. Please sign in again.', 'error');
            localStorage.removeItem('currentUser');
            window.location.href = 'index.html';
            return;
        }

        const projectName = document.getElementById('projectName').value.trim();
        const projectCategory = document.getElementById('projectCategory').value;

        console.log('createProject: FormData entries:');
        for (let [key, value] of formData.entries()) {
            console.log(`${key}: ${value instanceof File ? value.name : value}`);
        }
        console.log('createProject: Uploaded files:', this.uploadedFiles.map(f => f.name));

        if (!projectName) {
            console.error('createProject: Project name is empty or missing');
            this.showMessage('Please enter a project name.', 'error');
            return;
        }
        if (!projectCategory) {
            console.error('createProject: Category is missing');
            this.showMessage('Please select a category.', 'error');
            return;
        }

        const projectData = {
            user_id: currentUser.id,
            name: projectName,
            description: formData.get('projectDescription') || '',
            category: projectCategory,
            plan_to_complete: formData.get('planToComplete') || null,
            criteria: [...this.criteria],
            completed_criteria: [],
            tags: [...this.tags],
            progress: 0,
            logbook: []
        };

        const projectFormData = new FormData();
        projectFormData.append('user_id', projectData.user_id);
        projectFormData.append('name', projectData.name);
        projectFormData.append('description', projectData.description);
        projectFormData.append('category', projectData.category);
        projectFormData.append('criteria', JSON.stringify(projectData.criteria));
        projectFormData.append('completed_criteria', JSON.stringify(projectData.completed_criteria));
        projectFormData.append('tags', JSON.stringify(projectData.tags));
        projectFormData.append('progress', projectData.progress);
        projectFormData.append('plan_to_complete', projectData.plan_to_complete || '');
        projectFormData.append('logbook', JSON.stringify(projectData.logbook));

        for (let i = 0; i < this.uploadedFiles.length; i++) {
            projectFormData.append('images[]', this.uploadedFiles[i]);
        }

        console.log('createProject: Sending projectFormData:');
        for (let [key, value] of projectFormData.entries()) {
            console.log(`${key}: ${value instanceof File ? value.name : value}`);
        }

        fetch('api/projects.php', {
            method: 'POST',
            body: projectFormData
        })
        .then(response => {
            console.log('projects.php POST response status:', response.status);
            return response.text();
        })
        .then(text => {
            console.log('projects.php POST raw response:', text);
            try {
                const data = JSON.parse(text);
                if (data.error) {
                    console.error('projects.php POST error:', data.error);
                    this.showMessage('Error creating project: ' + data.error, 'error');
                } else {
                    // Refresh projects to ensure stats are accurate
                    this.refreshProjects(() => {
                        this.updateStats();
                        this.showPage('portfolio');
                        this.showMessage('Project created successfully!', 'success');
                        this.resetProjectForm();
                    });
                }
            } catch (e) {
                console.error('projects.php POST: Failed to parse JSON:', e, 'Raw response:', text);
                this.showMessage('Error creating project: Invalid server response', 'error');
            }
        })
        .catch(error => {
            console.error('Error creating project:', error);
            this.showMessage('Error creating project: ' + error.message, 'error');
        });
    }

    resetProjectForm() {
        const form = document.getElementById('newProjectForm');
        if (form) form.reset();
        this.criteria = [];
        this.tags = [];
        this.uploadedImages = [];
        this.uploadedFiles = [];
        const criteriaList = document.getElementById('criteriaList');
        const tagsList = document.getElementById('tagsList');
        const imagePreview = document.getElementById('imagePreview');
        if (criteriaList) criteriaList.innerHTML = '';
        if (tagsList) tagsList.innerHTML = '';
        if (imagePreview) {
            imagePreview.style.display = 'none';
            imagePreview.innerHTML = '';
        }
    }

    resetEventForm() {
        const form = document.getElementById('newEventForm');
        if (form) form.reset();
        const eventDate = document.getElementById('eventDate');
        if (eventDate) eventDate.value = new Date().toISOString().split('T')[0];
    }

    addCriteria() {
        const input = document.getElementById('newCriteria');
        if (!input) return;
        const criteriaText = input.value.trim();

        if (criteriaText) {
            this.criteria.push(criteriaText);
            this.renderCriteria();
            input.value = '';
        }
    }

    renderCriteria() {
        const list = document.getElementById('criteriaList');
        if (!list) return;
        list.innerHTML = this.criteria.map((criteria, index) => `
            <div class="criteria-item">
                <span>${criteria}</span>
                <button type="button" class="remove-btn" data-index="${index}">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `).join('');
    }

    removeCriteria(index) {
        this.criteria.splice(index, 1);
        this.renderCriteria();
    }

    handleTagInput(event) {
        if (event.key === 'Enter') {
            event.preventDefault();
            const input = event.target;
            const tagText = input.value.trim();

            if (tagText && !this.tags.includes(tagText)) {
                this.tags.push(tagText);
                this.renderTags();
                input.value = '';
            }
        }
    }

    renderTags() {
        const list = document.getElementById('tagsList');
        if (!list) return;
        list.innerHTML = this.tags.map((tag, index) => `
            <div class="tag-item">
                <span>${tag}</span>
                <button type="button" class="tag-remove" data-index="${index}">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `).join('');
    }

    removeTag(index) {
        this.tags.splice(index, 1);
        this.renderTags();
    }

    handleMultipleImageUpload(event) {
        const files = event.target.files;
        if (files.length > 0) {
            const preview = document.getElementById('imagePreview');
            if (!preview) return;
            preview.style.display = 'grid';

            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                this.uploadedFiles.push(file);
                const reader = new FileReader();
                reader.onload = (e) => {
                    const newIndex = this.uploadedImages.length;
                    this.uploadedImages.push(e.target.result);
                    const imageItem = document.createElement('div');
                    imageItem.className = 'image-preview-item';
                    imageItem.innerHTML = `
                        <img src="${e.target.result}" alt="Project Image ${newIndex + 1}">
                        <button type="button" class="remove-image" data-index="${newIndex}">
                            <i class="fas fa-times"></i>
                        </button>
                    `;
                    preview.appendChild(imageItem);
                };
                reader.readAsDataURL(file);
            }
            console.log('Uploaded files:', this.uploadedFiles.map(f => f.name));
        }
    }

    removeUploadedImage(index) {
        this.uploadedImages.splice(index, 1);
        this.uploadedFiles.splice(index, 1);
        this.updateImagePreview();
    }

    updateImagePreview() {
        const preview = document.getElementById('imagePreview');
        if (!preview) return;
        preview.innerHTML = '';

        this.uploadedImages.forEach((imageSrc, index) => {
            const imageItem = document.createElement('div');
            imageItem.className = 'image-preview-item';
            imageItem.innerHTML = `
                <img src="${imageSrc}" alt="Project Image ${index + 1}">
                <button type="button" class="remove-image" data-index="${index}">
                    <i class="fas fa-times"></i>
                </button>
            `;
            preview.appendChild(imageItem);
        });
    }

    renderPortfolio() {
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        if (!currentUser || !currentUser.id) {
            console.error('renderPortfolio: No currentUser or missing id:', currentUser);
            this.showMessage('User not authenticated. Please sign in again.', 'error');
            localStorage.removeItem('currentUser');
            window.location.href = 'index.html';
            return;
        }
        console.log('renderPortfolio: Fetching projects for user_id:', currentUser.id);

        fetch(`api/projects.php?user_id=${currentUser.id}`)
            .then(response => {
                console.log('projects.php response status:', response.status);
                return response.json();
            })
            .then(projects => {
                console.log('projects.php response data:', projects);
                this.projects = projects.map(data => new Project(data));
                this.filterProjects(document.getElementById('searchInput')?.value.trim().toLowerCase() || '');
                this.updateStats();
            })
            .catch(error => {
                console.error('Error fetching projects:', error);
                this.showMessage('Failed to load projects. Please try again.', 'error');
                this.updateStats(); // Update stats even on error to reflect empty state
            });
    }

    filterProjects(query) {
        const grid = document.getElementById('portfolioGrid');
        if (!grid) {
            console.error('Portfolio grid not found');
            return;
        }

        if (!this.projects || this.projects.length === 0) {
            grid.innerHTML = `
                <div class="empty-state">
                    <p>No projects yet. <a href="#" onclick="app.showPage('new-project')">Create your first project</a></p>
                </div>
            `;
            return;
        }

        const filteredProjects = this.projects.filter(project => 
            project.name.toLowerCase().includes(query) || 
            project.tags.some(tag => tag.toLowerCase().includes(query))
        );

        if (filteredProjects.length === 0) {
            grid.innerHTML = `
                <div class="empty-state">
                    <p>No projects match your search. <a href="#" onclick="document.getElementById('searchInput').value = '';app.filterProjects('');">Clear search</a></p>
                </div>
            `;
        } else {
            grid.innerHTML = filteredProjects.map(project => `
                <div class="project-card" onclick="app.showProjectDetail(${project.id})">
                    <div class="project-card-header">
                        <div>
                            <h3>${project.name}</h3>
                            <div class="project-category">${project.category}</div>
                        </div>
                        <span class="project-status ${project.status}">${project.status}</span>
                    </div>
                    ${project.images && project.images.length > 0 ? `<img src="${project.images[0]}" alt="${project.name}" style="width: 100%; height: 150px; object-fit: cover; border-radius: 8px; margin-bottom: 16px;">` : ''}
                    <div class="project-description">${project.description || 'No description'}</div>
                    <div class="project-progress">
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${project.progress}%"></div>
                            <span class="progress-text">${project.progress}%</span>
                        </div>
                    </div>
                    <div class="project-tags">
                        ${project.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                    </div>
                </div>
            `).join('');
        }
        console.log(`Filtered portfolio with query '${query}' to ${filteredProjects.length} projects`);
    }

    showProjectDetail(projectId) {
        const project = this.projects.find(p => p.id === projectId);
        if (!project) {
            this.showMessage('Project not found.', 'error');
            return;
        }

        this.currentProject = project;

        document.getElementById('modalProjectName').textContent = project.name;
        document.getElementById('modalProjectDescription').textContent = project.description || 'No description';
        document.getElementById('modalProjectCategory').textContent = project.category;
        document.getElementById('modalProjectStatus').textContent = project.status; // Derived from progress
        document.getElementById('modalProjectDate').textContent = new Date(project.created_date).toLocaleDateString();

        document.getElementById('modalProgressFill').style.width = `${project.progress}%`;
        document.getElementById('modalProgressText').textContent = `${project.progress}%`;

        const imageContainer = document.getElementById('modalProjectImage');
        if (project.images && project.images.length > 0) {
            imageContainer.innerHTML = `
                <div class="project-images-grid">
                    ${project.images.map(img => `<img src="${img}" alt="${project.name}">`).join('')}
                </div>
            `;
        } else {
            imageContainer.innerHTML = '<div class="no-image">No images uploaded</div>';
        }

        const criteriaList = document.getElementById('modalCriteriaList');
        criteriaList.innerHTML = project.criteria.map((criteria, index) => `
            <div class="criteria-check">
                <input type="checkbox" ${project.completed_criteria.includes(project.criteria_ids[index]) ? 'checked' : ''}
                    onchange="app.toggleCriteria(${projectId}, ${project.criteria_ids[index]})">
                <label>${criteria}</label>
            </div>
        `).join('');

        const tagsContainer = document.getElementById('modalProjectTags');
        tagsContainer.innerHTML = project.tags.map(tag => `<span class="tag">${tag}</span>`).join('');

        document.getElementById('logbookDate').value = new Date().toISOString().split('T')[0];
        document.getElementById('logbookEntry').value = '';

        this.renderLogbook();

        // Add delete button
        const deleteButtonContainer = document.getElementById('modalProjectActions');
        if (deleteButtonContainer) {
            deleteButtonContainer.innerHTML = `
                <button class="delete-project btn btn-danger" style="margin-top: 10px;">Delete Project</button>
            `;
        }

        document.getElementById('projectDetailModal').classList.add('active');
    }

    showEventDetail(eventId) {
        const event = this.events.find(e => e.id === parseInt(eventId));
        if (!event) {
            console.error('Event not found:', eventId);
            this.showMessage('Event not found.', 'error');
            return;
        }

        document.getElementById('modalEventTitle').textContent = event.title || 'Untitled Event';
        document.getElementById('modalEventDate').textContent = event.date ? new Date(event.date).toLocaleDateString() : 'No date';
        document.getElementById('modalEventLocation').textContent = event.location || 'No location provided';
        document.getElementById('modalEventDescription').textContent = event.description || 'No description provided';
        document.getElementById('modalEventPlan').textContent = event.plan || 'No plan provided';

        // Add delete button
        const deleteButtonContainer = document.getElementById('modalEventActions');
        if (deleteButtonContainer) {
            deleteButtonContainer.innerHTML = `
                <button class="delete-event btn btn-danger" data-event-id="${event.id}" style="margin-top: 10px;">Delete Event</button>
            `;
        }

        document.getElementById('eventDetailModal').classList.add('active');
    }

    closeEventDetail() {
        document.getElementById('eventDetailModal').classList.remove('active');
    }

    addLogbookEntry() {
        if (!this.currentProject || !this.currentUser) {
            this.showMessage('No project or user selected.', 'error');
            return;
        }

        const date = document.getElementById('logbookDate').value;
        const entry = document.getElementById('logbookEntry').value.trim();

        if (!date || !entry) {
            this.showMessage('Please fill in both date and entry fields.', 'error');
            return;
        }

        const formData = new FormData();
        formData.append('action', 'add_logbook');
        formData.append('project_id', this.currentProject.id);
        formData.append('user_id', this.currentUser.id);
        formData.append('date', date);
        formData.append('entry', entry);

        console.log('addLogbookEntry: Sending formData:');
        for (let [key, value] of formData.entries()) {
            console.log(`${key}: ${value}`);
        }

        fetch('api/projects.php', {
            method: 'POST',
            body: formData
        })
        .then(response => {
            console.log('projects.php POST add_logbook response status:', response.status);
            return response.json();
        })
        .then(data => {
            if (data.error) {
                console.error('projects.php POST add_logbook error:', data.error);
                this.showMessage('Error adding logbook entry: ' + data.error, 'error');
            } else {
                this.currentProject.logbook.push({ date, entry });
                this.currentProject.logbook.sort((a, b) => new Date(b.date) - new Date(a.date));
                this.renderLogbook();
                document.getElementById('logbookEntry').value = '';
                document.getElementById('logbookDate').value = new Date().toISOString().split('T')[0];
                this.showMessage('Logbook entry added successfully!', 'success');
                this.refreshProject(this.currentProject.id);
            }
        })
        .catch(error => {
            console.error('Error adding logbook entry:', error);
            this.showMessage('Error adding logbook entry: ' + error.message, 'error');
        });
    }

    renderLogbook() {
        if (!this.currentProject) return;

        const logbookContainer = document.getElementById('modalLogbook');
        if (!logbookContainer) return;

        if (this.currentProject.logbook.length === 0) {
            logbookContainer.innerHTML = '<p>No logbook entries yet</p>';
            return;
        }

        logbookContainer.innerHTML = this.currentProject.logbook.map(entry => `
            <div class="logbook-entry">
                <div class="entry-date">${new Date(entry.date).toLocaleDateString()}</div>
                <div class="entry-text">${entry.entry}</div>
            </div>
        `).join('');
    }

    toggleCriteria(projectId, criteriaId) {
        const project = this.projects.find(p => p.id === projectId);
        if (!project) {
            this.showMessage('Project not found.', 'error');
            return;
        }

        if (!this.currentUser) {
            this.showMessage('User not authenticated.', 'error');
            return;
        }

        const completed_criteria = project.completed_criteria ? [...project.completed_criteria] : [];
        const index = completed_criteria.indexOf(criteriaId);
        if (index > -1) {
            completed_criteria.splice(index, 1);
        } else {
            completed_criteria.push(criteriaId);
        }

        const data = {
            project_id: projectId,
            user_id: this.currentUser.id,
            completed_criteria: completed_criteria
        };

        console.log('toggleCriteria: Sending data:', data);

        fetch('api/projects.php', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        })
        .then(response => {
            console.log('projects.php PUT response status:', response.status);
            return response.json();
        })
        .then(data => {
            if (data.error) {
                console.error('projects.php PUT error:', data.error);
                this.showMessage('Error updating criteria: ' + data.error, 'error');
            } else {
                // Update local project data with backend response
                project.completed_criteria = completed_criteria;
                project.progress = data.progress || 0;
                project.status = project.progress === 100 ? 'complete' : 'active'; // Derive status from progress

                // Refresh all projects to ensure stats are updated
                this.refreshProjects(() => {
                    // Update UI elements in the modal
                    document.getElementById('modalProgressFill').style.width = `${project.progress}%`;
                    document.getElementById('modalProgressText').textContent = `${project.progress}%`;
                    document.getElementById('modalProjectStatus').textContent = project.status;

                    // Re-render the project detail to reflect checkbox states
                    this.showProjectDetail(projectId);

                    // Update stats to reflect new complete/active counts
                    this.updateStats();
                    this.showMessage('Criteria updated successfully!', 'success');
                });
            }
        })
        .catch(error => {
            console.error('Error updating criteria:', error);
            this.showMessage('Error updating criteria: ' + error.message, 'error');
        });
    }

    refreshProjects(callback) {
        if (!this.currentUser) {
            console.error('refreshProjects: No currentUser');
            return;
        }

        fetch(`api/projects.php?user_id=${this.currentUser.id}`)
            .then(response => {
                console.log('projects.php refreshProjects response status:', response.status);
                return response.json();
            })
            .then(projects => {
                console.log('refreshProjects: Fetched projects:', projects);
                this.projects = projects.map(data => new Project(data));
                this.filterProjects(document.getElementById('searchInput')?.value.trim().toLowerCase() || '');
                if (callback) callback();
            })
            .catch(error => {
                console.error('Error refreshing projects:', error);
                this.showMessage('Error refreshing project data.', 'error');
                if (callback) callback();
            });
    }

    refreshProject(projectId) {
        if (!this.currentUser) return;

        this.refreshProjects(() => {
            const project = this.projects.find(p => p.id === projectId);
            if (project) {
                this.currentProject = project;
                this.showProjectDetail(projectId);
                this.updateStats();
            }
        });
    }

    showMessage(message, type) {
        const messageContainer = document.createElement('div');
        messageContainer.className = `form-message ${type}`;
        messageContainer.textContent = message;
        const modal = document.getElementById('projectDetailModal');
        if (modal) {
            modal.insertBefore(messageContainer, modal.firstChild);
            setTimeout(() => {
                if (messageContainer.parentNode) {
                    messageContainer.remove();
                }
            }, 3000);
        } else {
            alert(message);
        }
    }

    closeProjectDetail() {
        document.getElementById('projectDetailModal').classList.remove('active');
    }

    renderCalendar() {
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        if (!currentUser || !currentUser.id) {
            console.error('renderCalendar: No currentUser or missing id:', currentUser);
            this.showMessage('User not authenticated. Please sign in again.', 'error');
            localStorage.removeItem('currentUser');
            window.location.href = 'index.html';
            return;
        }

        fetch(`api/events.php?user_id=${currentUser.id}`)
            .then(response => {
                console.log('events.php GET response status:', response.status);
                return response.json();
            })
            .then(events => {
                console.log('events.php response data:', events);
                this.events = events.map(event => ({
                    id: event.id,
                    title: event.title,
                    date: event.date,
                    location: event.location,
                    description: event.description,
                    plan: event.plan,
                    type: event.type,
                    created_at: event.created_at
                }));

                const monthNames = [
                    'January', 'February', 'March', 'April', 'May', 'June',
                    'July', 'August', 'September', 'October', 'November', 'December'
                ];

                const monthDisplay = document.getElementById('currentMonth');
                if (!monthDisplay) {
                    console.error('Current month display not found');
                    return;
                }
                monthDisplay.textContent = `${monthNames[this.currentDate.getMonth()]} ${this.currentDate.getFullYear()}`;

                const grid = document.getElementById('calendarGrid');
                if (!grid) {
                    console.error('Calendar grid not found');
                    return;
                }

                const firstDay = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth(), 1);
                const lastDay = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + 1, 0);
                const today = new Date();

                let html = '';

                const dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                dayHeaders.forEach(day => {
                    html += `<div class="calendar-day-header">${day}</div>`;
                });

                for (let i = 0; i < firstDay.getDay(); i++) {
                    html += '<div class="calendar-day other-month"></div>';
                }

                for (let day = 1; day <= lastDay.getDate(); day++) {
                    const currentDateStr = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth(), day).toISOString().split('T')[0];
                    const isToday = today.getDate() === day &&
                                    today.getMonth() === this.currentDate.getMonth() &&
                                    today.getFullYear() === this.currentDate.getFullYear();

                    const projectDue = this.projects.find(p => p.plan_to_complete === currentDateStr);
                    const event = this.events.find(e => e.date === currentDateStr);

                    let dayClass = isToday ? 'today' : '';
                    let dayContent = `<div class="day-number">${day}</div>`;

                    if (projectDue) {
                        dayClass += ' has-project';
                        dayContent += `<div class="project-indicator">${projectDue.name.substring(0, 15)}...</div>`;
                    }

                    if (event) {
                        dayClass += ' has-event';
                        dayContent += `<div class="event-indicator" onclick="app.showEventDetail(${event.id})">${event.title.substring(0, 15)}...</div>`;
                    }

                    html += `<div class="calendar-day ${dayClass}">${dayContent}</div>`;
                }

                grid.innerHTML = html;
                this.renderUpcomingEvents();
            })
            .catch(error => {
                console.error('Error fetching events:', error);
                this.showMessage('Failed to load events. Please try again.', 'error');
            });
    }

    createEvent() {
        const form = document.getElementById('newEventForm');
        const formData = new FormData(form);
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));

        if (!currentUser || !currentUser.id) {
            console.error('createEvent: No currentUser or missing id:', currentUser);
            this.showMessage('User not authenticated. Please sign in again.', 'error');
            localStorage.removeItem('currentUser');
            window.location.href = 'index.html';
            return;
        }

        console.log('createEvent: FormData entries:');
        for (let [key, value] of formData.entries()) {
            console.log(`${key}: ${value}`);
        }

        const eventData = {
            user_id: currentUser.id,
            title: formData.get('eventName')?.trim(),
            date: formData.get('eventDate')?.trim() || null,
            location: formData.get('eventLocation')?.trim() || null,
            description: formData.get('eventDescription')?.trim() || null,
            plan: formData.get('eventPlan')?.trim() || null,
            type: 'user-created'
        };

        console.log('createEvent: eventData:', eventData);

        if (!eventData.title || !eventData.date) {
            console.error('createEvent: Missing title or date', eventData);
            this.showMessage('Please enter an event name and date.', 'error');
            return;
        }

        fetch('api/events.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(eventData)
        })
        .then(response => {
            console.log('events.php POST response status:', response.status);
            return response.json();
        })
        .then(data => {
            if (data.error) {
                console.error('events.php POST error:', data.error);
                this.showMessage('Error creating event: ' + data.error, 'error');
            } else {
                this.events.push({
                    id: data.event_id,
                    ...eventData,
                    created_at: new Date().toISOString()
                });
                this.renderCalendar();
                this.showPage('calendar');
                this.showMessage('Event created successfully!', 'success');
                this.resetEventForm();
            }
        })
        .catch(error => {
            console.error('Error creating event:', error);
            this.showMessage('Error creating event: ' + error.message, 'error');
        });
    }

    renderUpcomingEvents() {
        const eventsList = document.getElementById('upcomingEventsList');
        if (!eventsList) {
            console.error('Upcoming events list not found');
            return;
        }
        const today = new Date().toISOString().split('T')[0];

        const upcomingEvents = this.events
            .filter(e => e.date >= today)
            .sort((a, b) => new Date(a.date) - new Date(b.date))
            .slice(0, 5);

        let html = '';

        if (upcomingEvents.length > 0) {
            html += upcomingEvents.map(event => `
                <div class="event-item" data-event-id="${event.id}" onclick="app.showEventDetail(${event.id})">
                    <strong>${event.title}</strong>
                    <div>${new Date(event.date).toLocaleDateString()}</div>
                </div>
            `).join('');
        }

        if (html === '') {
            eventsList.innerHTML = '<p>No upcoming events</p>';
        } else {
            eventsList.innerHTML = html;
        }
    }

    changeMonth(direction) {
        this.currentDate.setMonth(this.currentDate.getMonth() + direction);
        this.renderCalendar();
    }

    updateStats() {
        const activeCount = this.projects.filter(p => p.progress < 100).length;
        const completeCount = this.projects.filter(p => p.progress === 100).length;

        const activeCountEl = document.getElementById('activeCount');
        const completeCountEl = document.getElementById('completeCount');

        if (activeCountEl) {
            activeCountEl.textContent = activeCount;
            console.log(`updateStats: Set activeCount to ${activeCount}`);
        } else {
            console.error('updateStats: Element with ID activeCount not found');
        }

        if (completeCountEl) {
            completeCountEl.textContent = completeCount;
            console.log(`updateStats: Set completeCount to ${completeCount}`);
        } else {
            console.error('updateStats: Element with ID completeCount not found');
        }
    }

    updatePersonalInfo() {
        if (!this.currentUser) return;

        const fullName = document.getElementById('fullName').value.trim();
        const username = document.getElementById('username').value.trim();
        const emailAddress = document.getElementById('emailAddress').value.trim();

        if (!fullName || !username || !emailAddress) {
            this.showAccountMessage('Please fill in all fields', 'error', 'personalInfoForm');
            return;
        }

        if (!this.isValidEmail(emailAddress)) {
            this.showAccountMessage('Please enter a valid email address', 'error', 'personalInfoForm');
            return;
        }

        const data = {
            user_id: this.currentUser.id,
            full_name: fullName,
            username: username,
            email: emailAddress
        };

        fetch('api/update_user.php', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                console.error('update_user.php error:', data.error);
                this.showAccountMessage('Error updating information: ' + data.error, 'error', 'personalInfoForm');
            } else {
                // Update currentUser with new data
                this.currentUser.name = fullName;
                this.currentUser.username = username;
                this.currentUser.email = emailAddress;
                localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
                this.updateUserInfo();
                this.showAccountMessage('Personal information updated successfully!', 'success', 'personalInfoForm');
            }
        })
        .catch(error => {
            console.error('Error updating user info:', error);
            this.showAccountMessage('Error updating information: ' + error.message, 'error', 'personalInfoForm');
        });
    }

    changePassword() {
        const currentPassword = document.getElementById('currentPassword').value;
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        if (!currentPassword || !newPassword || !confirmPassword) {
            this.showAccountMessage('Please fill in all password fields', 'error', 'passwordForm');
            return;
        }

        if (newPassword.length < 6) {
            this.showAccountMessage('New password must be at least 6 characters long', 'error', 'passwordForm');
            return;
        }

        if (newPassword !== confirmPassword) {
            this.showAccountMessage('New passwords do not match', 'error', 'passwordForm');
            return;
        }

        const data = {
            user_id: this.currentUser.id,
            current_password: currentPassword,
            new_password: newPassword
        };

        fetch('api/update_password.php', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                console.error('update_password.php error:', data.error);
                this.showAccountMessage('Error updating password: ' + data.error, 'error', 'passwordForm');
            } else {
                document.getElementById('passwordForm').reset();
                this.showAccountMessage('Password updated successfully!', 'success', 'passwordForm');
            }
        })
        .catch(error => {
            console.error('Error updating password:', error);
            this.showAccountMessage('Error updating password: ' + error.message, 'error', 'passwordForm');
        });
    }

    showAccountMessage(message, type, formId) {
        const form = document.getElementById(formId);
        const existingMessage = form.querySelector('.form-message');
        if (existingMessage) {
            existingMessage.remove();
        }

        const messageDiv = document.createElement('div');
        messageDiv.className = `form-message ${type}`;
        messageDiv.textContent = message;
        form.insertBefore(messageDiv, form.firstChild);

        if (type === 'success') {
            setTimeout(() => {
                if (messageDiv.parentNode) {
                    messageDiv.remove();
                }
            }, 3000);
        }
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    signOut() {
        if (confirm('Are you sure you want to sign out?')) {
            localStorage.removeItem('currentUser');
            window.location.href = 'index.html';
        }
    }

    saveData() {
        // Deprecated: Rely on database instead of localStorage
    }

    loadData() {
        // Deprecated: Rely on database instead of localStorage
    }

    deleteProject(projectId) {
        if (!this.currentUser) {
            this.showMessage('User not authenticated.', 'error');
            return;
        }

        const data = {
            project_id: projectId,
            user_id: this.currentUser.id
        };

        fetch('api/projects.php', {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        })
        .then(response => {
            console.log('projects.php DELETE response status:', response.status);
            return response.json();
        })
        .then(data => {
            if (data.error) {
                console.error('projects.php DELETE error:', data.error);
                this.showMessage('Error deleting project: ' + data.error, 'error');
            } else {
                this.projects = this.projects.filter(p => p.id !== projectId);
                this.closeProjectDetail();
                this.refreshProjects(() => {
                    this.updateStats();
                    this.showPage('portfolio');
                    this.showMessage('Project deleted successfully!', 'success');
                });
            }
        })
        .catch(error => {
            console.error('Error deleting project:', error);
            this.showMessage('Error deleting project: ' + error.message, 'error');
        });
    }

    deleteEvent(eventId) {
        if (!this.currentUser) {
            this.showMessage('User not authenticated.', 'error');
            return;
        }

        const data = {
            event_id: eventId,
            user_id: this.currentUser.id
        };

        fetch('api/events.php', {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        })
        .then(response => {
            console.log('events.php DELETE response status:', response.status);
            return response.json();
        })
        .then(data => {
            if (data.error) {
                console.error('events.php DELETE error:', data.error);
                this.showMessage('Error deleting event: ' + data.error, 'error');
            } else {
                this.events = this.events.filter(e => e.id !== eventId);
                this.closeEventDetail();
                this.renderCalendar();
                this.showMessage('Event deleted successfully!', 'success');
            }
        })
        .catch(error => {
            console.error('Error deleting event:', error);
            this.showMessage('Error deleting event: ' + error.message, 'error');
        });
    }
}

const app = new ModelKitManager();