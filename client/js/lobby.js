function getToken() {
    const match = document.cookie.match(/(^| )token=([^;]+)/);
    return match ? decodeURIComponent(match[2]) : null;
}

// ✅ 방 목록 가져오기
async function fetchRooms() {
    try {
        const response = await fetch("/api/game/rooms");
        const rooms = await response.json();

        if (!response.ok) {
            console.error("방 목록을 불러오는 중 오류 발생:", rooms.message);
            return;
        }

        displayRooms(rooms);
    } catch (error) {
        console.error("방 목록을 가져오는 중 오류 발생:", error);
    }
}

function displayRooms(rooms) {
    const roomList = document.getElementById("roomList");
    roomList.innerHTML = "";

    if (rooms.length === 0) {
        roomList.innerHTML = "<p>현재 개설된 방이 없습니다.</p>";
        return;
    }

    rooms.forEach((room) => {
        const roomElement = document.createElement("div");
        roomElement.classList.add("room-card");

        const header = document.createElement("div");
        header.classList.add("room-header");

        const titleWrap = document.createElement("div");
        titleWrap.classList.add("room-title-wrap");

        const roomId = document.createElement("span");
        roomId.classList.add("room-id");
        roomId.textContent = `[${String(room.roomNumber).padStart(3, "0")}]`;

        const roomTitle = document.createElement("span");
        roomTitle.classList.add("room-title");
        roomTitle.textContent = room.title;

        titleWrap.appendChild(roomId);
        titleWrap.appendChild(roomTitle);

        const roomPlayers = document.createElement("span");
        roomPlayers.classList.add("room-players");
        roomPlayers.textContent = `${room.currentPlayers}/8명`;
        roomElement.appendChild(roomPlayers);

        if (room.isPrivate) {
            const lockIcon = document.createElement("span");
            lockIcon.classList.add("lock-icon");
            lockIcon.textContent = "🔒";
            roomElement.appendChild(lockIcon);
        }

        header.appendChild(titleWrap);
        roomElement.appendChild(header);

        const meta = document.createElement("div");
        meta.classList.add("room-meta");
        meta.innerHTML = `🛠️ 장르: ${room.genres?.join(", ") || "-"} / 타이머: ${room.timeLimit || 30}초`;
        roomElement.appendChild(meta);

        roomElement.addEventListener("click", () => joinRoom(room.roomId));
        roomList.appendChild(roomElement);
    });
}

// ✅ 방 생성
async function createRoom() {
    const title = document.getElementById("roomNameInput").value.trim();
    const isPrivate = document.getElementById("privateRoom").checked;
    const password = isPrivate ? document.getElementById("roomPassword").value.trim() : null;
    const genres = Array.from(document.querySelectorAll('input[name="genre"]:checked')).map(cb => cb.value);
    const timeLimit = parseInt(document.querySelector('input[name="timer"]:checked').value);
    const quizCount = parseInt(document.querySelector('input[name="quizCount"]:checked').value);

    if (!title || genres.length === 0 || !timeLimit || !quizCount) {
        return alert("모든 필드를 입력해주세요.");
    }

    const roomData = { title, isPrivate, password, genres, timeLimit, quizCount };

    try {
        const response = await fetch("/api/game/create", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(roomData)
        });

        const result = await response.json();

        if (response.status === 401) {
            alert("로그인이 필요합니다.");
            return window.location.href = "/html/auth.html";
        }

        if (response.ok) {
            window.location.href = `/html/game.html?roomId=${result.roomId}&host=true`;
        } else {
            alert(result.message);
        }
    } catch (err) {
        console.error("방 만들기 오류:", err);
        alert("방 만들기 중 오류 발생");
    }
}

// ✅ 방 입장
async function joinRoom(roomId) {
    try {
        const response = await fetch("/api/game/join", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ roomId })
        });

        const result = await response.json();

        if (response.status === 401) {
            alert("로그인이 필요합니다.");
            return window.location.href = "/html/auth.html";
        }

        if (response.ok) {
            window.location.href = `/html/game.html?roomId=${roomId}`;
        } else {
            alert(result.message);
        }
    } catch (err) {
        console.error("입장 오류:", err);
        alert("방 입장 중 오류 발생");
    }
}

// ✅ 빠른 입장
async function quickJoin() {
    try {
        const response = await fetch("/api/game/quick-join", { method: "POST" });
        const result = await response.json();

        if (response.status === 401) {
            alert("로그인이 필요합니다.");
            return window.location.href = "/html/auth.html";
        }

        if (response.ok) {
            window.location.href = `/html/game.html?roomId=${result.roomId}`;
        } else {
            alert(result.message);
        }
    } catch (err) {
        console.error("빠른 입장 오류:", err);
    }
}

// ✅ 초기 실행
document.addEventListener("DOMContentLoaded", () => {
    const leftRoom = sessionStorage.getItem("leftRoom");
    if (leftRoom) {
        sessionStorage.removeItem("leftRoom");
    }
    
    fetchRooms();
    setInterval(fetchRooms, 5000);

    document.getElementById("createRoomBtn").addEventListener("click", createRoom);
    document.getElementById("joinRoom").addEventListener("click", quickJoin);
});
