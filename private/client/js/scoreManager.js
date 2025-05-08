// script/scoreManager.js
let playerListElement = null;
let playerNames = new Map();

// 점수판에 사용할 DOM 요소 설정
 
export function initScoreBoard(domElement) {
  playerListElement = domElement;
}

// 플레이어 이름 매핑 설정

export function setPlayerNames(map) {
  playerNames = map;
}

// 점수판 갱신
export function updateScoreBoard(scoreMap) {
  if (!playerListElement) return;

  playerListElement.innerHTML = '';
  for (const id in scoreMap) {
    const score = scoreMap[id];
    const div = document.createElement('div');
    div.textContent = `${getPlayerName(id)}: ${score}점`;
    playerListElement.appendChild(div);
  }
}

function getPlayerName(id) {
  return playerNames.get(id) || id;
}
