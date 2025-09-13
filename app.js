// chat/app.js
// Simple Chat front-end logic (no backend required)
(function () {
  const STORAGE_KEY = 'simpleChat:v1';
  const THEME_KEY = 'simpleChat:theme'; // 'auto' | 'light' | 'dark'

  /** @typedef {{ id: string, title: string, messages: Array<{ role: 'user' | 'assistant', content: string }>, createdAt: number, updatedAt: number }} Chat */

  /** @type {Chat[]} */
  let chats = [];
  /** @type {string | null} */
  let activeChatId = null;

  const elements = {
    chatList: /** @type {HTMLElement} */ (document.getElementById('chatList')),
    newChatBtn: /** @type {HTMLButtonElement} */ (document.getElementById('newChatBtn')),
    messages: /** @type {HTMLElement} */ (document.getElementById('messages')),
    suggestions: /** @type {HTMLElement} */ (document.getElementById('suggestions')),
    composer: /** @type {HTMLFormElement} */ (document.getElementById('composer')),
    input: /** @type {HTMLTextAreaElement} */ (document.getElementById('input')),
    themeToggle: /** @type {HTMLButtonElement} */ (document.getElementById('themeToggle')),
  };

  const SUGGESTIONS = [
    'Summarize this article',
    'Draft a friendly email',
    'Explain this concept simply',
    'Brainstorm ideas for a weekend trip',
  ];

  function generateId() {
    return Math.random().toString(36).slice(2) + Date.now().toString(36);
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      chats = Array.isArray(parsed.chats) ? parsed.chats : [];
      activeChatId = typeof parsed.activeChatId === 'string' ? parsed.activeChatId : null;
    } catch (err) {
      console.error('Failed to load state', err);
    }
  }

  function saveState() {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ chats, activeChatId })
      );
    } catch (err) {
      console.error('Failed to save state', err);
    }
  }

  function getActiveChat() {
    return chats.find((c) => c.id === activeChatId) || null;
  }

  function upsertChat(chat) {
    const index = chats.findIndex((c) => c.id === chat.id);
    if (index === -1) {
      chats.unshift(chat);
    } else {
      chats[index] = chat;
    }
    saveState();
    renderSidebar();
  }

  function createNewChat() {
    const id = generateId();
    /** @type {Chat} */
    const chat = {
      id,
      title: 'New chat',
      messages: [
        {
          role: 'assistant',
          content: 'Hi! I\'m a mock assistant. Ask me anything to get started.',
        },
      ],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    activeChatId = id;
    upsertChat(chat);
    renderActiveChat();
    focusInput();
  }

  function setActiveChat(id) {
    activeChatId = id;
    saveState();
    renderSidebar();
    renderActiveChat();
  }

  function deleteChat(id) {
    const index = chats.findIndex((c) => c.id === id);
    if (index !== -1) {
      chats.splice(index, 1);
      if (activeChatId === id) {
        activeChatId = chats[0]?.id || null;
      }
      saveState();
      renderSidebar();
      renderActiveChat();
    }
  }

  function updateChatTitleFromFirstUserMessage(chat) {
    const firstUserMessage = chat.messages.find((m) => m.role === 'user');
    if (!firstUserMessage) return chat;
    const title = firstUserMessage.content.trim().slice(0, 60) || 'New chat';
    if (title && title !== chat.title) {
      chat.title = title;
    }
    return chat;
  }

  function renderSidebar() {
    elements.chatList.innerHTML = '';
    for (const chat of chats) {
      const button = document.createElement('button');
      button.className = 'chat-item' + (chat.id === activeChatId ? ' active' : '');
      button.textContent = chat.title || 'New chat';
      button.title = new Date(chat.updatedAt).toLocaleString();
      button.addEventListener('click', () => setActiveChat(chat.id));
      // Context menu for delete
      button.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        if (confirm('Delete this chat?')) deleteChat(chat.id);
      });
      elements.chatList.appendChild(button);
    }
  }

  function messageElement(message) {
    const wrapper = document.createElement('div');
    wrapper.className = 'message ' + (message.role === 'user' ? 'user' : 'assistant');

    const avatar = document.createElement('div');
    avatar.className = 'avatar';
    avatar.textContent = message.role === 'user' ? '🙂' : '🤖';

    const bubble = document.createElement('div');
    bubble.className = 'bubble';
    bubble.textContent = message.content;

    wrapper.appendChild(avatar);
    wrapper.appendChild(bubble);
    return wrapper;
  }

  function renderActiveChat() {
    const chat = getActiveChat();
    elements.messages.innerHTML = '';
    if (!chat) return;
    for (const msg of chat.messages) {
      elements.messages.appendChild(messageElement(msg));
    }
    elements.messages.scrollTop = elements.messages.scrollHeight;
  }

  function renderSuggestions() {
    elements.suggestions.innerHTML = '';
    for (const text of SUGGESTIONS) {
      const chip = document.createElement('button');
      chip.className = 'chip';
      chip.type = 'button';
      chip.textContent = text;
      chip.addEventListener('click', () => {
        elements.input.value = text;
        autoSizeInput();
        elements.input.focus();
      });
      elements.suggestions.appendChild(chip);
    }
  }

  function focusInput() {
    setTimeout(() => elements.input?.focus(), 0);
  }

  function autoSizeInput() {
    elements.input.style.height = 'auto';
    elements.input.style.height = Math.min(elements.input.scrollHeight, 200) + 'px';
  }

  function sendMessage(content) {
    const chat = getActiveChat();
    if (!chat) return;
    const trimmed = content.trim();
    if (!trimmed) return;

    chat.messages.push({ role: 'user', content: trimmed });
    chat.updatedAt = Date.now();
    updateChatTitleFromFirstUserMessage(chat);
    upsertChat(chat);
    renderActiveChat();

    elements.input.value = '';
    autoSizeInput();

    // Mock assistant reply
    mockAssistantReply(trimmed);
  }

  function mockAssistantReply(userText) {
    const chat = getActiveChat();
    if (!chat) return;
    const placeholder = { role: 'assistant', content: 'Thinking…' };
    chat.messages.push(placeholder);
    upsertChat(chat);
    renderActiveChat();

    const reply = generateMockReply(userText);
    setTimeout(() => {
      const c = getActiveChat();
      if (!c) return;
      // Replace the last assistant placeholder with the final reply
      for (let i = c.messages.length - 1; i >= 0; i--) {
        if (c.messages[i].role === 'assistant' && c.messages[i].content === 'Thinking…') {
          c.messages[i].content = reply;
          break;
        }
      }
      c.updatedAt = Date.now();
      upsertChat(c);
      renderActiveChat();
    }, 450);
  }

  function generateMockReply(userText) {
    const templates = [
      `You said: "${userText}". I can help refine or expand on that.`,
      `Here are some thoughts about "${userText}":\n- Key points\n- Examples\n- Follow-ups`,
      `Echoing back: ${userText}. What outcome are you aiming for?`,
    ];
    return templates[Math.floor(Math.random() * templates.length)];
  }

  function setupComposer() {
    elements.composer.addEventListener('submit', (e) => {
      e.preventDefault();
      sendMessage(elements.input.value);
    });
    elements.input.addEventListener('input', autoSizeInput);
    elements.input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage(elements.input.value);
      }
    });
    autoSizeInput();
  }

  function applyThemeFromSetting() {
    const setting = localStorage.getItem(THEME_KEY) || 'auto';
    const root = document.documentElement;
    if (setting === 'auto') {
      root.removeAttribute('data-theme');
    } else {
      root.setAttribute('data-theme', setting);
    }
    updateThemeToggleLabel(setting);
  }

  function updateThemeToggleLabel(setting) {
    const label = setting.charAt(0).toUpperCase() + setting.slice(1);
    elements.themeToggle.textContent = `Theme: ${label}`;
  }

  function cycleTheme() {
    const current = localStorage.getItem(THEME_KEY) || 'auto';
    const next = current === 'auto' ? 'light' : current === 'light' ? 'dark' : 'auto';
    localStorage.setItem(THEME_KEY, next);
    applyThemeFromSetting();
  }

  function boot() {
    loadState();
    if (chats.length === 0) {
      createNewChat();
    } else {
      if (!activeChatId) activeChatId = chats[0].id;
      renderSidebar();
      renderActiveChat();
    }
    renderSuggestions();
    setupComposer();
    applyThemeFromSetting();

    elements.newChatBtn.addEventListener('click', createNewChat);
    elements.themeToggle.addEventListener('click', cycleTheme);
  }

  document.addEventListener('DOMContentLoaded', boot);
})();
