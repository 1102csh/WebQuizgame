// script/index.js

function moveToGame(name, roomId) {
    const params = new URLSearchParams({ name, room: roomId });
    window.location.href = `../html/game.html?${params.toString()}`;
}

// 닉네임 가져오기
function getName() {
    return document.getElementById('nameInput').value.trim();
}

document.getElementById('createRoomBtn').onclick = async () => {
    const name = getName();
    if (!name) return alert('닉네임을 입력하세요.');

    // 서버에 방 생성 요청 (여기선 클라이언트에서 생성, 실서버에서는 요청 후 코드 받아도 됨)
    const roomCode = generateRoomCode();
    moveToGame(name, roomCode);
};

document.getElementById('joinRandomBtn').onclick = () => {
    const name = getName();
    if (!name) return alert('닉네임을 입력하세요.');

    // 랜덤 입장 시 서버에서 처리
    moveToGame(name, 'random');
};

document.getElementById('joinBtn').onclick = () => {
    const name = getName();
    const code = document.getElementById('roomCodeInput').value.trim();
    if (!name || !code) return alert('닉네임과 방 코드를 입력하세요.');
    moveToGame(name, code);
};
