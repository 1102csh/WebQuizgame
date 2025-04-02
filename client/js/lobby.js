async function fetchRooms() {
    try {
        const response = await fetch("/api/game/rooms"); // ✅ 방 목록 API 요청
        const rooms = await response.json();

        if (!response.ok) {
            console.error("방 목록을 불러오는 중 오류 발생:", rooms.message);
            return;
        }

        displayRooms(rooms); // 가져온 방 목록을 화면에 출력
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

        // 방 제목 영역
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

        // 오른쪽 인원 수
        const roomPlayers = document.createElement("span");
        roomPlayers.classList.add("room-players");
        roomPlayers.textContent = `${room.currentPlayers}/8명`;
        roomElement.appendChild(roomPlayers);

        // 자물쇠 아이콘 (비공개일 경우)
        //if (room.private) {
        const lockIcon = document.createElement("span");
        lockIcon.classList.add("lock-icon");
        lockIcon.textContent = "🔒";
        roomElement.appendChild(lockIcon);
        //}

        header.appendChild(titleWrap);
        roomElement.appendChild(header);

        // 설정 정보
        const meta = document.createElement("div");
        meta.classList.add("room-meta");
        //meta.innerHTML = `🛠️ 장르: ${room.genre} / 타이머: ${room.timer || 30}초`;
        meta.innerHTML = `🛠️ 장르: 상식 / 타이머: 30초`;
        roomElement.appendChild(meta);

        roomElement.addEventListener("click", () => joinRoom(room.roomId));
        roomList.appendChild(roomElement);
    });
}
async function createRoom() {
    const roomName = document.getElementById("roomNameInput").value.trim();
    const isPrivate = document.getElementById("privateRoom").checked;
    const password = isPrivate ? document.getElementById("roomPassword").value.trim() : null;
    const genres = Array.from(document.querySelectorAll('input[name="genre"]:checked')).map(cb => cb.value);

    const timerRadio = document.querySelector('input[name="timer"]:checked');
    const quizCountRadio = document.querySelector('input[name="quizCount"]:checked');

    // ✅ 기본 유효성 검사
    if (!roomName || genres.length === 0 || !timerRadio || !quizCountRadio) {
        alert("모든 필드를 입력해주세요.");
        return;
    }

    // ✅ hostId 설정
    let hostId = localStorage.getItem("userId");
    if (!hostId) {
        hostId = `player_${Math.floor(Math.random() * 10000)}`;
        localStorage.setItem("userId", hostId);
    }

    const requestBody = {
        title: roomName,
        isPrivate,
        password,
        genres,
        timeLimit: parseInt(timerRadio.value),
        quizCount: parseInt(quizCountRadio.value),
        hostId
    };

    try {
        const response = await fetch("/api/game/create", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(requestBody),
        });

        const result = await response.json();

        if (response.status === 401) {
            alert("로그인이 필요합니다.");
            window.location.href = "/html/auth.html";
            return;
        }

        if (response.ok) {
            // ✅ 모달 닫기 + 입력 초기화
            document.getElementById("roomModal").style.display = "none";
            document.getElementById("roomNameInput").value = "";

            // ✅ 게임 화면으로 이동 (방장 여부는 쿼리스트링으로 표시)
            window.location.href = `/html/game.html?roomId=${result.roomId}&host=true`;
        } else {
            alert(result.message);
        }
    } catch (error) {
        console.error("방 만들기 중 오류 발생:", error);
        alert("방 만들기 중 오류가 발생했습니다.");
    }
}
async function quickJoin() {
    try {
        const response = await fetch("/api/game/quick-join", { method: "POST" });
        const result = await response.json();

        if (response.status === 401) {
            alert("로그인이 필요합니다.");
            window.location.href = "/html/auth.html";
            return;
        }

        if (response.ok) {
            window.location.href = `/html/game.html?roomId=${result.roomId}`;
        } else {
            alert(result.message);
        }
    } catch (error) {
        console.error("빠른 입장 중 오류 발생:", error);
    }
}
async function joinRoom(roomId) {
    // ✅ userId를 localStorage에서 가져오거나 새로 생성
    let userId = localStorage.getItem("userId");
    if (!userId) {
        userId = `player_${Math.floor(Math.random() * 10000)}`;
        localStorage.setItem("userId", userId);
    }

    try {
        const response = await fetch("/api/game/join", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ roomId, userId }) // ✅ userId를 동적으로 설정
        });

        const result = await response.json();

        if (response.status === 401) {
            alert("로그인이 필요합니다.");
            window.location.href = "/html/auth.html";
            return;
        }

        if (response.ok) {
            window.location.href = `/html/game.html?roomId=${roomId}`;
        } else {
            alert(result.message);
        }
    } catch (error) {
        console.error("방 입장 중 오류 발생:", error);
    }
}
async function fetchRoomInfo(roomId) {
    try {
        const response = await fetch(`/api/game/room/${roomId}`); // 특정 방 정보 API 요청
        const roomData = await response.json();

        if (!response.ok) {
            alert(roomData.message);
            return;
        }

        console.log("방 정보:", roomData);
    } catch (error) {
        console.error("방 정보를 가져오는 중 오류 발생:", error);
    }
}

document.getElementById("createRoomBtn").addEventListener("click", async () => {
    const title = document.getElementById("roomNameInput").value.trim();
    const isPrivate = document.getElementById("privateRoom").checked;
    const password = isPrivate ? document.getElementById("roomPassword").value : null;
    const genres = Array.from(document.querySelectorAll('input[name="genre"]:checked')).map(cb => cb.value);
    const timeLimit = parseInt(document.querySelector('input[name="timer"]:checked').value);
    const quizCount = parseInt(document.querySelector('input[name="quizCount"]:checked').value);

    const roomData = {
        title,
        isPrivate,
        password,
        genres,
        timeLimit,
        quizCount,
        hostId: localStorage.getItem("userId")
    };

    const response = await fetch("/api/game/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(roomData)
    });

    const result = await response.json();

    if (response.status === 401) {
        alert("로그인이 필요합니다.");
        window.location.href = "/html/auth.html";
        return;
    }

    if (response.ok) {
        window.location.href = `/html/game.html?roomId=${result.roomId}&host=true`;
    } else {
        alert(result.message || "방 생성 실패");
    }
});

function logout() {
    document.cookie = "token=; Max-Age=0"; // 삭제
    localStorage.clear();
    window.location.href = "/auth.html";
}


// 페이지 로드 시 방 목록 가져오기
document.addEventListener("DOMContentLoaded", fetchRooms);
document.addEventListener("DOMContentLoaded", () => {
    const leftRoom = sessionStorage.getItem("leftRoom");
    if (leftRoom) {
        sessionStorage.removeItem("leftRoom");
    }
});
document.getElementById("joinRoom").addEventListener("click", quickJoin);
setInterval(fetchRooms, 5000); // 5초마다 방 목록 갱신
