// ✅ 쿠키에서 값 추출
function getCookie(name) {
  const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  return match ? decodeURIComponent(match[2]) : null;
}

// ✅ DOM 로드 후 실행
document.addEventListener("DOMContentLoaded", () => {
  const token = getCookie("token");
  const usernameLabel = document.getElementById("username");
  const userProfile = document.getElementById("user-profile");

  if (token) {
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      const username = decodeURIComponent(escape(payload.username)); // ✅ 한글 깨짐 방지

      if (usernameLabel) usernameLabel.textContent = username;

      // 로그인 상태면 클릭 시 설정 메뉴
      userProfile.addEventListener("click", () => {toggleSettingsMenu()});
    } catch (err) {
      console.error("❌ 토큰 파싱 실패:", err);
      redirectToLogin();
    }
  } else {
    console.log("🔒 로그인 필요");
    // 비로그인 상태면 로그인 페이지로 이동
    userProfile.addEventListener("click", () => {
      window.location.href = "/html/auth.html";
    });
  }

  // ✅ 다크 모드 초기 적용
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

  // ✅ 로고 클릭 시 메인으로 이동
  const logo = document.getElementById("logo");
  if (logo) {
    logo.addEventListener("click", () => {
      window.location.href = "/index.html";
    });
  }
});

// ✅ 설정 메뉴 토글
function toggleSettingsMenu() {
  const menu = document.getElementById("settingsMenu");
  if (menu) {
    console.log("check");
    menu.style.display = menu.style.display === "block" ? "none" : "block";
  }
}

// ✅ 로그아웃 처리
function logout() {
  document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;";
  localStorage.removeItem("userId");
  localStorage.removeItem("username");
  window.location.href = "/index.html";
}

// ✅ 로그인 페이지로 강제 이동
function redirectToLogin() {
  window.location.href = "/html/auth.html";
}
