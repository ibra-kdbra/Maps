// Dark mode toggle
var darkModeButton = document.getElementById('dark-mode-button');
darkModeButton.addEventListener('click', function() {
  document.body.classList.toggle('dark-mode');
  darkModeButton.querySelector('i').classList.toggle('fa-sun');
});
