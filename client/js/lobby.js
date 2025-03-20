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
        roomElement.classList.add("rooms");
        roomElement.innerHTML = `
            <span class='roomId'>${String(room.roomNumber).padStart(3, '0')}</span>
            <span class='roomName'>${room.title}</span>
            <span class='roomPlayers'>(${room.currentPlayers}/${room.maxPlayers})</span>
        `;
        roomElement.addEventListener("click", ()=>joinRoom(room.roomId));
        roomList.appendChild(roomElement);
    });
}
async function createRoom() {
    const roomName = document.getElementById("roomNameInput").value;
    if (!roomName) {
        return;
    }

    // ✅ hostId를 고유한 ID로 설정 (localStorage에서 가져오거나 생성)
    let hostId = localStorage.getItem("userId");
    if (!hostId) {
        hostId = `player_${Math.floor(Math.random() * 10000)}`;
        localStorage.setItem("userId", hostId);
    }

    const requestBody = {
        title: roomName,
        maxPlayers: 8,
        hostId: hostId, // ✅ 올바르게 설정된 hostId 사용
    };

    try {
        const response = await fetch("/api/game/create", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(requestBody),
        });

        const result = await response.json();
        if (response.ok) {
            fetchRooms(); // 방 목록 갱신
            document.getElementById("roomModal").style.display = "none";
            document.getElementById("roomNameInput").value = "";
            window.location.href = `/html/game.html?roomId=${result.roomId}&host=true`; // 방장으로 게임 화면 이동
        } else {
            alert(result.message);
        }
    } catch (error) {
        console.error("방 만들기 중 오류 발생:", error);
    }
}
async function quickJoin() {
    try {
        const response = await fetch("/api/game/quick-join", { method: "POST" });
        const result = await response.json();

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

// 페이지 로드 시 방 목록 가져오기
document.addEventListener("DOMContentLoaded", fetchRooms);
document.getElementById("createRoomBtn").addEventListener("click", createRoom);
document.getElementById("joinRoom").addEventListener("click", quickJoin);
setInterval(fetchRooms, 5000); // 5초마다 방 목록 갱신
