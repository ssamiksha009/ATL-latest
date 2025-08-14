// Event listener for the login form submission
document.getElementById('loginForm').addEventListener('submit', async function (event) {
    event.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const errorMessage = document.getElementById('errorMessage');

    // Clear previous error messages
    errorMessage.textContent = '';

    // Basic client-side validation
    if (!email || !password) {
        errorMessage.textContent = 'Please enter both email and password';
        return;
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        errorMessage.textContent = 'Please enter a valid email address';
        return;
    }

    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (data.success) {
            // Store authentication token in localStorage
            localStorage.setItem('authToken', data.token);

            // Decode the JWT token to get user role
            const payload = JSON.parse(atob(data.token.split('.')[1]));

            // Redirect based on user role
            if (payload.role === 'manager') {
                window.location.href = 'manager-dashboard.html';
            } else {
                window.location.href = 'index.html';
            }
        } else {
            // Display error message
            errorMessage.textContent = data.message || 'Invalid email or password';
        }
    } catch (error) {
        console.error('Login error:', error);
        errorMessage.textContent = 'An error occurred during login. Please try again.';
    }
});

// Add to your login.js file
document.querySelector('.toggle-password').addEventListener('click', function () {
    const passwordInput = document.querySelector('#password');
    const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
    passwordInput.setAttribute('type', type);

    // Toggle icon
    this.classList.toggle('fa-eye');
    this.classList.toggle('fa-eye-slash');
});