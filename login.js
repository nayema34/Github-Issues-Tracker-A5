const usernameInput = document.getElementById('username-input');
const passwordInput = document.getElementById('password-input');
const loginButton = document.getElementById('login-button');

loginButton.addEventListener('click', () => {
    const username = usernameInput.value;
    const password = passwordInput.value;
    if (username === 'admin' && password === 'admin123') {
        window.location.href = 'home.html';
    } else {
        alert('Invalid username or password. Please try again.');
    }
});