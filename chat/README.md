# chat/README.md
# Simple Chat (static)

A minimal, modern chat UI (Gemini-style) implemented with plain HTML, CSS, and JavaScript. It stores chat history locally in your browser and generates mock assistant replies.

## Features
- New chat, chat history in sidebar
- Message composer with Enter to send and Shift+Enter for new line
- Light/Dark/Auto theme toggle (respects system preference)
- LocalStorage persistence for chats and theme
- Mock assistant replies (no backend required)

## Quick start
1. Open `index.html` in a browser.
   - Or serve locally:

```bash
cd /workspace/chat
python3 -m http.server 8080
