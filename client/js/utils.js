document.addEventListener("DOMContentLoaded", () => {
    const darkModeToggle = document.getElementById("darkModeToggle");

    // ✅ 저장된 모드 확인하여 초기 적용
    const savedMode = localStorage.getItem("darkMode");
    if (savedMode === "true") {
        document.body.classList.add("dark-mode");
    }

    // ✅ 버튼 클릭 시 모드 토글 + 저장
    darkModeToggle.addEventListener("click", () => {
        document.body.classList.toggle("dark-mode");

        // 현재 상태 저장
        const isDarkMode = document.body.classList.contains("dark-mode");
        localStorage.setItem("darkMode", isDarkMode);
    });
});

// 로고 클릭 시 로비로 이동
document.getElementById("logo").addEventListener("click", () => {
    window.location.href = "/index.html";
});
