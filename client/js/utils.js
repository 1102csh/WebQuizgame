function getCookie(name) {
    const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
    return match ? decodeURIComponent(match[2]) : null;
  }
  
  document.addEventListener("DOMContentLoaded", () => {
    const token = getCookie("token");
    const usernameLabel = document.getElementById("usernameLabel");
    const userProfile = document.getElementById("user-profile");
  
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        const username = payload.username;
  
        usernameLabel.textContent = username;
  
        userProfile.addEventListener("click", () => {
          toggleSettingsMenu();
        });
      } catch (err) {
        console.error("❌ 토큰 파싱 실패:", err);
        redirectToLogin();
      }
    } else {
      // 로그인 상태가 아니면 클릭 시 로그인 창으로 이동
      userProfile.addEventListener("click", () => {
        window.location.href = "/html/auth.html";
      });
    }
  
    // ✅ 다크 모드 유지
    const savedMode = localStorage.getItem("darkMode");
    if (savedMode === "true") {
      document.body.classList.add("dark-mode");
    }
  
    const darkModeToggle = document.getElementById("darkModeToggle");
    if (darkModeToggle) {
      darkModeToggle.addEventListener("click", () => {
        document.body.classList.toggle("dark-mode");
        localStorage.setItem("darkMode", document.body.classList.contains("dark-mode"));
      });
    }
  
    // 로고 클릭 시 로비 이동
    document.getElementById("logo").addEventListener("click", () => {
      window.location.href = "/index.html";
    });
  });
  
  function toggleSettingsMenu() {
    const menu = document.getElementById("settingsMenu");
    if (menu) {
      menu.style.display = menu.style.display === "block" ? "none" : "block";
    }
  }
  
  function logout() {
    document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;";
    localStorage.removeItem("userId");
    localStorage.removeItem("username");
    window.location.href = "/html/auth.html";
  }
  
  function redirectToLogin() {
    window.location.href = "/html/auth.html";
  }
  
