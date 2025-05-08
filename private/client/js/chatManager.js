// script/chatManager.js

let autoScrollEnabled = true;
let chatBox = null;
let chatMessages = null;

//채팅 자동스크롤 및 버튼 초기화
export function initChat(element1, element2, scrollToBottomBtn) {
    chatBox = element1;
    chatMessages = element2;
    
    chatBox.addEventListener('scroll', () => {
        const threshold = 10;
        const atBottom = chatBox.scrollHeight - chatBox.scrollTop - chatBox.clientHeight <= threshold;
        autoScrollEnabled = atBottom;
        scrollToBottomBtn.style.display = atBottom ? 'none' : 'block';
    });

    scrollToBottomBtn.addEventListener('click', () => {
        chatBox.scrollTop = chatBox.scrollHeight;
        autoScrollEnabled = true;
        scrollToBottomBtn.style.display = 'none';
    });
}

//채팅 메시지를 추가하고 자동 스크롤
export function addChatMessage(html) {
    const msg = document.createElement('div');
    msg.innerHTML = html;
    chatMessages.appendChild(msg);

    if (autoScrollEnabled) {
        chatBox.scrollTop = chatBox.scrollHeight;
    }
}

//(선택) 채팅 초기화
export function clearChat(chatMessages) {
    chatMessages.innerHTML = '';
}
