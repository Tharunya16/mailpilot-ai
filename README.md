\# MailPilot AI



MailPilot AI is an AI-powered Gmail web application where users can control their email using natural-language commands.



The application integrates with Gmail using Google OAuth 2.0 and Gmail API, while the AI assistant controls the application UI for actions such as searching, opening, composing, replying, forwarding, and managing emails.



\## Features



\- Gmail OAuth 2.0 authentication

\- Real Inbox and Sent emails

\- Natural-language email search

\- AI-controlled compose and reply

\- Context-aware email actions

\- Open latest email

\- Mark emails as read/unread

\- Delete and forward emails

\- Automatic inbox synchronization



\## Setup \& Run Locally



\### 1. Clone the repository



```bash

git clone <YOUR\_GITHUB\_REPOSITORY\_URL>

cd mailpilot-ai



\###2. Backend

cd backend

npm install



Create backend/.env:



PORT=5000



GOOGLE\_CLIENT\_ID=YOUR\_GOOGLE\_CLIENT\_ID

GOOGLE\_CLIENT\_SECRET=YOUR\_GOOGLE\_CLIENT\_SECRET

GOOGLE\_REDIRECT\_URI=http://localhost:5000/auth/google/callback



SESSION\_SECRET=YOUR\_SESSION\_SECRET

GEMINI\_API\_KEY=YOUR\_GEMINI\_API\_KEY



Start the backend:



node server.js



\###3. Frontend

Open another terminal:



cd frontend

npm install

npm run dev



Open:



http://localhost:5173



Google OAuth redirect URI:



http://localhost:5000/auth/google/callback



\###Architecture Decisions \& Trade-offs

React + Vite — used for a responsive UI and easy state management.

Node.js + Express — handles Gmail API operations and keeps OAuth credentials on the backend.

Gmail API — provides real Inbox, Sent, search, send, reply, and email-management functionality.

Gemini AI — interprets natural-language commands and generates contextual replies.

Hybrid AI approach — common commands such as search, open, reply, and mark read/unread are handled deterministically for reliability, while flexible requests can use the AI layer.

15-second polling — used for automatic mailbox synchronization within the project timeframe. A production version would use Gmail Push Notifications with Google Cloud Pub/Sub.





\##Screenshots



The demo shows the AI assistant controlling the application UI:



\###Login

!\[Login Screen](screenshots/login.png)

\### Inbox

!\[Inbox](screenshots/inbox.png)

\### AI Reply

!\[AI Reply](screenshots/ai-reply.png)

\### Sent Email

!\[Sent Email](screenshots/sent.png)

\### Forward Email

!\[Forward Email](screenshots/forward.png)

\### Latest Email

!\[Latest Email](screenshots/latestemail.png)





\##What I Would Improve With More Time

Replace polling with Gmail Push Notifications / Pub/Sub

Add full Gmail-style conversation threads

Improve multi-step AI commands

Add automated unit and end-to-end tests

Add production deployment with HTTPS and secure cookies

Improve AI validation and confirmation for destructive actions



\##Tech Stack



Frontend: React, Vite, JavaScript, CSS

Backend: Node.js, Express.js, Gmail API, Google OAuth 2.0



AI: Gemini API



