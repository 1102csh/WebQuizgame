// script/questionRenderer.js

let questionBox = null;

// 문제 표시 영역 DOM 요소 지정
export function initQuestionBox(element) {
  questionBox = element;
}

/**
 * 문제 출력
 * @param {object} q - 문제 객체
 */
export function renderQuestion(q) {
  if (!questionBox || !q) return;

  if (q.type === 'text') {
    questionBox.innerHTML = q.content;
  } else if (q.type === 'image') {
    questionBox.innerHTML = `${q.question_text}<br><img src="${q.content}" width="300">`;
  } else if (q.type === 'audio') {
    questionBox.innerHTML = `${q.question_text}<br><audio src="${q.content}" controls></audio>`;
  } else {
    questionBox.innerHTML = '알 수 없는 문제 유형입니다.';
  }
}
