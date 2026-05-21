document.addEventListener('DOMContentLoaded', () => {
    const projectGrid = document.getElementById('projectGrid');
    const projectForm = document.getElementById('projectForm');
    const modal = document.getElementById('modalOverlay');
    const showFormBtn = document.getElementById('showFormBtn');
    const closeModal = document.getElementById('closeModal');
    const loginBtn = document.getElementById('loginbtn');
    const userToken = localStorage.getItem('userToken');
    const currentUserName = localStorage.getItem('userName');
    const currentUserId = localStorage.getItem('userId') ? Number(localStorage.getItem('userId')) : null;

    let projects = [];

    async function fetchProjects() {
        try {
            const response = await fetch('/api/projects');
            projects = await response.json();
            renderProjects();
        } catch (error) {
            console.error("Gagal mengambil data dari database:", error);
            projectGrid.innerHTML = '<p>Gagal memuat proyek. Pastikan server sudah jalan.</p>';
        }
    }

    async function loginUser(username, password) {
        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            const data = await response.json();
            if (data.token) {
                localStorage.setItem('userToken', data.token);
                localStorage.setItem('userName', data.username);
                localStorage.setItem('userId', data.id);
                location.reload();
            } else {
                alert('Login gagal: ' + (data.error || 'Unknown error'));
            }
        } catch (error) {
            console.error('Login error:', error);
            alert('Login error: ' + error.message);
        }
    }

    function renderProjects() {
        projectGrid.innerHTML = '';
        projects.forEach((proj) => {
            const card = document.createElement('div');
            card.className = 'project-card';
            
            const imgPath = `/uploads/${proj.image_path}`;
            const codePath = proj.code_zip_path ? `/uploads/${proj.code_zip_path}` : null;
            const isOwner = currentUserId !== null && proj.user_id == currentUserId;
            const authorName = proj.username || 'Unknown';
            proj.imageUrl = imgPath;
            proj.codeUrl = codePath;
            proj.tech = proj.tech_use || proj.tech || '';
            proj.description = proj.text_desc || proj.description || '';
            
            card.innerHTML = `
                <img src="${imgPath}" class="card-img" onerror="this.src='https://via.placeholder.com/400x250'">
                <div class="card-info">
                    <h3>${proj.title}</h3>
                    <p class="project-author">By ${authorName}</p>
                    <div class="card-actions">
                        <span class="view-btn" onclick="viewProject(${proj.id})">View Project Files <i class="fas fa-arrow-right"></i></span>
                        ${isOwner ? `<button class="delete-btn" onclick="deleteProject(event, ${proj.id})"><i class="fas fa-trash"></i></button>` : ''}
                    </div>
                </div>
            `;
            projectGrid.appendChild(card);
        });
    }

    window.viewProject = (id) => {
        const selectedProject = projects.find(p => p.id === id);
        localStorage.setItem('currentProject', JSON.stringify(selectedProject));
        window.location.href = 'Project.html';
    };

    window.deleteProject = async (event, id) => {
        event.stopPropagation();
        if (confirm('Are you sure you want to delete this project?')) {
            try {
                await fetch(`/api/projects/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${localStorage.getItem('userToken')}` } });
                fetchProjects();
            } catch (error) {
                alert("Failed to delete project");
            }
        }
    };

    if (loginBtn) {
        if (currentUserName) {
            loginBtn.textContent = `Hello ${currentUserName}`;
            loginBtn.onclick = () => {
                localStorage.removeItem('userToken');
                localStorage.removeItem('userName');
                localStorage.removeItem('userId');
                location.reload();
            };
        } else {
            loginBtn.onclick = () => window.location.href = './login.html';
        }
    }

    showFormBtn.onclick = () => modal.style.display = 'flex';
    closeModal.onclick = () => modal.style.display = 'none';

    projectForm.onsubmit = async (e) => {
        e.preventDefault();

        const token = localStorage.getItem('userToken');
        if (!token) {
            alert('Please log in before uploading a project.');
            return;
        }
        
        const formData = new FormData();
        formData.append('title', document.getElementById('title').value);
        formData.append('description', document.getElementById('description').value);
        formData.append('image', document.getElementById('imageInput').files[0]);
        formData.append('tech', document.getElementById('technology').value);
        const codeFile = document.getElementById('codeInput').files[0];
        
        if (codeFile) formData.append('code', codeFile);

        try {
            const response = await fetch('/api/projects', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            if (response.ok) {
                fetchProjects();
                modal.style.display = 'none';
                projectForm.reset();
            } else {
                const errorData = await response.json();
                console.error('Server error:', errorData);
                alert('Failed to create project: ' + (errorData.error || 'Please try again.'));
            }
        } catch (error) {
            console.error("Failed to upload:", error);
            alert("An error occurred while uploading: " + error.message);
        }
    };

    fetchProjects();
});