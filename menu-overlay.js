document.addEventListener("DOMContentLoaded", () => {
  const menuBtn = document.getElementById("menu-toggle");
  const overlay = document.getElementById("menu-overlay");
  const sideMenu = overlay.querySelector(".side-menu");
  const closeBtn = document.getElementById("menu-close");

  // Optional: button click sound
  // Uncomment and replace with your own sound file if desired
  // const audio = new Audio("button-click.mp3");
  // audio.volume = 0.3;

  function openMenu() {
    overlay.classList.remove("hidden");
    // Trigger CSS animation to slide menu in
    requestAnimationFrame(() => {
      sideMenu.classList.add("open");
    });
    // audio.currentTime = 0;
    // audio.play();
  }

  function closeMenu() {
    sideMenu.classList.remove("open");
    // Wait for animation to finish before hiding overlay
    setTimeout(() => {
      overlay.classList.add("hidden");
    }, 300);
  }

  menuBtn?.addEventListener("click", openMenu);
  closeBtn?.addEventListener("click", closeMenu);

  // Close menu if clicking outside side menu area
  overlay.addEventListener("click", (e) => {
    if (!sideMenu.contains(e.target)) {
      closeMenu();
    }
  });

  // Navigation buttons inside menu
  document.querySelectorAll(".menu-navButton").forEach(button => {
    button.addEventListener("click", () => {
      const target = button.dataset.target;
      // Add fade-out class for page transition effect
      document.body.classList.add("fade-out");
      setTimeout(() => {
        window.location.href = target;
      }, 300);
    });
  });
});
