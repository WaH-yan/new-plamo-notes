class LandingPageManager {
    constructor() {
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.checkExistingSession();
    }

    setupEventListeners() {
        // Sign-in form submission
        document.getElementById('signInForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSignIn();
        });

        // Sign-up form submission
        document.getElementById('createAccountForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSignUp();
        });

        // Modal close events
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.closeSignInModal();
                this.closeSignUpModal();
            }
        });

        // Smooth scrolling for navigation links
        document.querySelectorAll('a[href^="#"]').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = link.getAttribute('href').substring(1);
                const targetElement = document.getElementById(targetId);

                if (targetElement) {
                    const headerHeight = document.querySelector('.landing-header').offsetHeight;
                    const targetPosition = targetElement.offsetTop - headerHeight - 20;

                    window.scrollTo({
                        top: targetPosition,
                        behavior: 'smooth'
                    });
                } else if (targetId === 'signin') {
                    this.showSignInModal();
                }
            });
        });

        // Header background on scroll
        window.addEventListener('scroll', () => {
            const header = document.querySelector('.landing-header');
            if (window.scrollY > 50) {
                header.style.background = 'rgba(255, 255, 255, 0.98)';
            } else {
                header.style.background = 'rgba(255, 255, 255, 0.95)';
            }
        });
    }

    checkExistingSession() {
        const currentUser = localStorage.getItem('currentUser');
        if (currentUser) {
            try {
                const user = JSON.parse(currentUser);
                console.log('checkExistingSession: Found currentUser:', user); // Debug
                if (user.id) {
                    window.location.href = 'dashboard.html';
                } else {
                    console.error('checkExistingSession: currentUser lacks id:', user);
                    localStorage.removeItem('currentUser'); // Clear invalid data
                }
            } catch (e) {
                console.error('checkExistingSession: Failed to parse currentUser:', e);
                localStorage.removeItem('currentUser'); // Clear corrupted data
            }
        } else {
            console.log('checkExistingSession: No currentUser in localStorage');
        }
    }

    // Update the handleSignIn method
    handleSignIn() {
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value.trim();
        const rememberMe = document.getElementById('rememberMe').checked;

        // Clear previous messages
        this.clearMessages('signInForm');

        // Validation
        if (!email || !password) {
            this.showMessage('Please fill in all fields', 'error', 'signInForm');
            return;
        }

        if (!this.isValidEmail(email)) {
            this.showMessage('Invalid email address', 'error', 'signInForm');
            return;
        }

        // Show loading state
        const submitButton = document.querySelector('#signInForm .signin-button');
        const originalText = submitButton.textContent;
        submitButton.textContent = 'Signing In...';
        submitButton.disabled = true;

        // Send API request
        fetch('/api/signin', { // Updated endpoint
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        })
        .then(response => {
            console.log('signin.php response status:', response.status); // Debug status
            return response.json();
        })
        .then(data => {
            console.log('signin.php response data:', data); // Debug response
            submitButton.textContent = originalText;
            submitButton.disabled = false;

            if (data.error) {
                this.showMessage(data.error, 'error', 'signInForm');
            } else if (!data.user || !data.user.id) {
                console.error('signin.php response lacks user or user.id:', data);
                this.showMessage('Invalid response from server. Please try again.', 'error', 'signInForm');
            } else {
                localStorage.setItem('currentUser', JSON.stringify({
                    id: data.user.id, // Include user ID
                    email: data.user.email,
                    username: data.user.username,
                    name: data.user.name,
                    rememberMe: rememberMe
                }));
                console.log('Stored currentUser in localStorage:', JSON.parse(localStorage.getItem('currentUser')));
                this.showMessage('Login successful! Redirecting...', 'success', 'signInForm');
                setTimeout(() => {
                    window.location.href = 'dashboard.html';
                }, 1000);
            }
        })
        .catch(error => {
            console.error('Error in handleSignIn:', error);
            submitButton.textContent = originalText;
            submitButton.disabled = false;
            this.showMessage('An error occurred: ' + error.message, 'error', 'signInForm');
        });
    }

    authenticateUser(email, password, rememberMe) {
        // Show loading state
        const submitButton = document.querySelector('#signInForm .signin-button');
        const originalText = submitButton.textContent;
        submitButton.textContent = 'Signing in...';
        submitButton.disabled = true;

        // Simulate API call delay
        setTimeout(() => {
            // In a real application, you would validate credentials against a server
            // For demo purposes, we'll accept any email/password combination

            const userData = {
                id: Date.now(),
                email: email,
                name: this.extractNameFromEmail(email),
                username: email.split('@')[0],
                loginTime: new Date().toISOString(),
                rememberMe: rememberMe
            };

            // Store user session
            localStorage.setItem('currentUser', JSON.stringify(userData));

            // Show success message
            this.showMessage('Sign in successful! Redirecting...', 'success', 'signInForm');

            // Redirect to dashboard after short delay
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1500);

        }, 1000);
    }


// landing.js
    handleSignUp() {
        const nameInput = document.getElementById('name');
        const usernameInput = document.getElementById('username');
        const emailInput = document.getElementById('signupEmail'); // Already updated
        const passwordInput = document.getElementById('newPassword');
        const confirmPasswordInput = document.getElementById('confirmPassword');

        // Debug: Check if inputs exist and their values
        console.log('Input Elements:', {
            nameInput: nameInput ? nameInput.value : 'Not found',
            usernameInput: usernameInput ? usernameInput.value : 'Not found',
            emailInput: emailInput ? emailInput.value : 'Not found',
            passwordInput: passwordInput ? passwordInput.value : 'Not found',
            confirmPasswordInput: confirmPasswordInput ? confirmPasswordInput.value : 'Not found'
        });

        const name = nameInput ? nameInput.value.trim() : '';
        const username = usernameInput ? usernameInput.value.trim() : '';
        const email = emailInput ? emailInput.value.trim() : '';
        const password = passwordInput ? passwordInput.value.trim() : '';
        const confirmPassword = confirmPasswordInput ? confirmPasswordInput.value.trim() : '';

        console.log('Form Data:', { name, username, email, password, confirmPassword });

        // Clear previous messages
        this.clearMessages('createAccountForm');

        // Validation
        if (!name || !username || !email || !password || !confirmPassword) {
            this.showMessage('Please fill in all fields', 'error', 'createAccountForm');
            return;
        }

        if (!this.isValidEmail(email)) {
            this.showMessage('Invalid email address', 'error', 'createAccountForm');
            return;
        }

        if (password.length < 6) {
            this.showMessage('Password must be at least 6 characters', 'error', 'createAccountForm');
            return;
        }

        if (password !== confirmPassword) {
            this.showMessage('Passwords do not match', 'error', 'createAccountForm');
            return;
        }

        // Show loading state
        const submitButton = document.querySelector('#createAccountForm .signin-button');
        const originalText = submitButton.textContent;
        submitButton.textContent = 'Creating Account...';
        submitButton.disabled = true;

        // Send API request
        fetch('/api/signup', { // Updated endpoint
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email,
                username,
                fullName,
                password
            })
        })
        .then(response => response.json())
        .then(data => {
            submitButton.textContent = originalText;
            submitButton.disabled = false;

            if (data.error) {
                this.showMessage(data.error, 'error', 'createAccountForm');
            } else {
                this.showMessage('Account created successfully! Redirecting to sign in...', 'success', 'createAccountForm');
                setTimeout(() => {
                    this.closeSignUpModal();
                    this.showSignInModal();
                }, 2000);
            }
        })
        .catch(error => {
            submitButton.textContent = originalText;
            submitButton.disabled = false;
            this.showMessage('An error occurred: ' + error.message, 'error', 'createAccountForm');
        });
    }

    showSignInModal() {
        const modal = document.getElementById('signInModal');
        const signInModal = modal.querySelector('.signin-modal');
        const signUpModal = document.getElementById('signUpModal');

        modal.classList.add('active');
        signInModal.style.display = 'block';
        signUpModal.style.display = 'none';
        document.body.style.overflow = 'hidden';

        // Focus on email field
        setTimeout(() => {
            document.getElementById('email').focus();
        }, 100);
    }

    closeSignInModal() {
        const modal = document.getElementById('signInModal');
        modal.classList.remove('active');
        document.body.style.overflow = 'auto';

        // Reset sign-in form
        document.getElementById('signInForm').reset();

        // Reset button state
        const submitButton = document.querySelector('#signInForm .signin-button');
        submitButton.textContent = 'Sign In';
        submitButton.disabled = false;

        // Clear any messages
        this.clearMessages('signInForm');
    }

    showSignUpModal() {
        const modal = document.getElementById('signInModal');
        const signInModal = modal.querySelector('.signin-modal');
        const signUpModal = document.getElementById('signUpModal');

        modal.classList.add('active');
        signInModal.style.display = 'none';
        signUpModal.style.display = 'block';
        document.body.style.overflow = 'hidden';

        // Focus on name field
        setTimeout(() => {
            document.getElementById('name').focus();
        }, 100);
    }

    closeSignUpModal() {
        const modal = document.getElementById('signInModal');
        modal.classList.remove('active');
        document.getElementById('signUpModal').style.display = 'none';
        document.body.style.overflow = 'auto';

        // Reset sign-up form
        document.getElementById('createAccountForm').reset();

        // Reset button state
        const submitButton = document.querySelector('#createAccountForm .signin-button');
        submitButton.textContent = 'Create Account';
        submitButton.disabled = false;

        // Clear any messages
        this.clearMessages('createAccountForm');
    }

    showMessage(message, type, formId) {
        // Remove existing messages for this form
        this.clearMessages(formId);

        const messageDiv = document.createElement('div');
        messageDiv.className = `form-message ${type}`;
        messageDiv.textContent = message;

        // Style the message
        messageDiv.style.cssText = `
            padding: 12px 16px;
            border-radius: 8px;
            margin-bottom: 16px;
            font-size: 14px;
            font-weight: 500;
            ${type === 'error' ?
                'background: #fee; color: #c53030; border: 1px solid #fecaca;' :
                'background: #f0fff4; color: #38a169; border: 1px solid #c6f6d5;'
            }
        `;

        // Insert message at the top of the form
        const form = document.getElementById(formId);
        form.insertBefore(messageDiv, form.firstChild);
    }

    clearMessages(formId) {
        const form = document.getElementById(formId);
        const existingMessages = form.querySelectorAll('.form-message');
        existingMessages.forEach(msg => msg.remove());
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    extractNameFromEmail(email) {
        const username = email.split('@')[0];
        // Convert username to a more readable name format
        return username
            .split(/[._-]/)
            .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
            .join(' ');
    }
}

// Global functions for inline event handlers
function showSignInModal() {
    landingManager.showSignInModal();
}

function closeSignInModal() {
    landingManager.closeSignInModal();
}

function showSignUpModal() {
    landingManager.showSignUpModal();
}

function closeSignUpModal() {
    landingManager.closeSignUpModal();
}

function temporaryDashboardAccess() {
    const tempUser = {
        id: 'temp',
        name: 'Temporary User',
        email: 'temp@example.com',
        username: 'tempuser',
        loginTime: new Date().toISOString()
    };
    localStorage.setItem('currentUser', JSON.stringify(tempUser));
    window.location.href = 'dashboard.html';
}

// Initialize landing page manager
const landingManager = new LandingPageManager();

// Add some interactive animations
document.addEventListener('DOMContentLoaded', () => {
    // Animate feature cards on scroll
    const observeElements = (selector, animationClass) => {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.animation = `fadeInUp 0.6s ease forwards`;
                    entry.target.style.opacity = '1';
                }
            });
        }, { threshold: 0.1 });

        document.querySelectorAll(selector).forEach(el => {
            el.style.opacity = '0';
            observer.observe(el);
        });
    };

    // Add fade-in animation CSS
    const style = document.createElement('style');
    style.textContent = `
        @keyframes fadeInUp {
            from {
                opacity: 0;
                transform: translateY(30px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
    `;
    document.head.appendChild(style);

    // Observe elements for animation
    observeElements('.feature-card');
    observeElements('.stat');
    observeElements('.model-item');
});