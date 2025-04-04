document.getElementById("loginTab").addEventListener("click", () => {
  switchTab("login");
});

document.getElementById("registerTab").addEventListener("click", () => {
  switchTab("register");
});

function switchTab(tab) {
  const loginForm = document.getElementById("loginForm");
  const registerForm = document.getElementById("registerForm");
  const loginTab = document.getElementById("loginTab");
  const registerTab = document.getElementById("registerTab");
  const message = document.getElementById("message");

  if (tab === "login") {
    loginForm.classList.add("active");
    registerForm.classList.remove("active");
    loginTab.classList.add("active");
    registerTab.classList.remove("active");
  } else {
    registerForm.classList.add("active");
    loginForm.classList.remove("active");
    registerTab.classList.add("active");
    loginTab.classList.remove("active");
  }

  message.textContent = "";
}

// ✅ 로그인 요청
document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = document.getElementById("loginEmail").value;
  const password = document.getElementById("loginPassword").value;

  try {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include", // ✅ 쿠키 수신을 위한 설정
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (res.ok) {
      // 로그인 성공
      console.log("✅ 로그인 성공");
      window.location.href = "/index.html";
    } else {
      document.getElementById("message").textContent = data.message;
    }
  } catch (err) {
    console.error(err);
    document.getElementById("message").textContent = "서버 오류 발생";
  }
});

// ✅ 회원가입 요청
document.getElementById("registerForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const username = document.getElementById("registerUsername").value;
  const email = document.getElementById("registerEmail").value;
  const password = document.getElementById("registerPassword").value;

  try {
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, email, password }),
    });

    const data = await res.json();

    if (res.ok) {
      document.getElementById("message").textContent = "회원가입 성공! 로그인 해 주세요.";
      switchTab("login");
    } else {
      document.getElementById("message").textContent = data.message;
    }
  } catch (err) {
    console.error(err);
    document.getElementById("message").textContent = "서버 오류 발생";
  }
});

// ✅ 자동 로그인 (auth.html 에서만 작동)
document.addEventListener("DOMContentLoaded", async () => {
  if (!window.location.pathname.includes("auth.html")) return;

  try {
    const res = await fetch("/api/auth/me");
    if (res.ok) {
      const user = await res.json();
      console.log("✅ 자동 로그인 중:", user);
      window.location.href = "/index.html";
    }
  } catch {
    // 자동 로그인 실패 시 아무 작업 안 함
  }
});

// ✅ 로그아웃 요청
async function logout() {
  await fetch("/api/auth/logout", { method: "POST" });
  window.location.href = "/html/auth.html";
}

// ✅ 쿠키 가져오기 (사용자 확인용 등)
function getCookie(name) {
  const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  return match ? decodeURIComponent(match[2]) : null;
}
