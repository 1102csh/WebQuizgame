// script/hostControl.js

let controlBox = null;

// 방장 전용 버튼 영역 DOM 설정
export function initHostControls(element) {
  controlBox = element;
}

// 방장일 경우 버튼 표시
export function showHostControls() {
  if (controlBox) {
    controlBox.style.display = 'block';
  }
}

// 방장이 아닐 경우 버튼 숨김
export function hideHostControls() {
  if (controlBox) {
    controlBox.style.display = 'none';
  }
}