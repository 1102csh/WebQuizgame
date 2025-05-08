// script/timerManager.js

let timerDisplay = null;

// 타이머 표시 영역 DOM 요소 설정
export function initTimerDisplay(element) {
  timerDisplay = element;
}

/**
 * 타이머 값 업데이트
 * @param {number} seconds
 */
export function updateTimer(seconds) {
  if (timerDisplay) {
    timerDisplay.textContent = `⏱ ${seconds}초 남음`;
  }
}

// 타이머 제거
export function clearTimer() {
  if (timerDisplay) {
    timerDisplay.textContent = '';
  }
}
