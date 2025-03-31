document.getElementById("loginTab").addEventListener("click", () => {
  document.getElementById("loginForm").classList.add("active");
  document.getElementById("registerForm").classList.remove("active");
  document.getElementById("loginTab").classList.add("active");
  document.getElementById("registerTab").classList.remove("active");
  document.getElementById("message").textContent = "";
});

document.getElementById("registerTab").addEventListener("click", () => {
  document.getElementById("registerForm").classList.add("active");
  document.getElementById("loginForm").classList.remove("active");
  document.getElementById("registerTab").classList.add("active");
  document.getElementById("loginTab").classList.remove("active");
  document.getElementById("message").textContent = "";
});

document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = document.getElementById("loginEmail").value;
  const password = document.getElementById("loginPassword").value;
  try {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (res.ok) {
      window.location.href = "/index.html";
    } else {
      document.getElementById("message").textContent = data.message;
    }
  } catch (err) {
    console.error(err);
    document.getElementById("message").textContent = "서버 오류 발생";
  }
});

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
    } else {
      document.getElementById("message").textContent = data.message;
    }
  } catch (err) {
    console.error(err);
    document.getElementById("message").textContent = "서버 오류 발생";
  }
});

// ✅ 자동 로그인 확인
document.addEventListener("DOMContentLoaded", async () => {
  try {
    const res = await fetch("/api/auth/me");
    if (res.ok) {
      const user = await res.json();
      console.log("✅ 자동 로그인 중...", user);
      window.location.href = "/index.html";
    }
  } catch {}
});

// ✅ 로그아웃 함수
async function logout() {
  await fetch("/api/auth/logout", { method: "POST" });
  window.location.href = "/html/auth.html";
} 

function getCookie(name) {
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  if (match) return match[2];
}
