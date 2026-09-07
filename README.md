\# Nebula AI Mail



> An AI-powered email client that lets users manage their Gmail inbox through natural-language commands while keeping the AI actions visible and controllable through the user interface.



Nebula AI Mail is a full-stack AI-powered mail application developed as part of the \*\*Nebula KnowLab Hiring Task\*\*.



The core idea is simple: instead of treating AI as a separate chatbot, the assistant acts as an \*\*interface controller\*\*. Users can ask the assistant to search emails, open messages, compose replies, forward emails, mark messages as read/unread, delete emails, and perform other mailbox actions using natural language.



\---



\## Overview



Traditional email applications require users to manually navigate through folders, search messages, open emails, and fill forms.



Nebula AI Mail introduces a natural-language interaction layer on top of a real Gmail mailbox.



For example:



```text

"Show me emails from the last 3 days"



"Find emails from Google"



"Open the latest email"



"Compose an email to john@gmail.com subject: Project Update saying the project is completed and ready for review"



"Reply to this saying I'll check and get back to you tomorrow"



"Forward this email to someone@example.com"



"Mark this email as read"



"Delete this email"



The assistant translates these requests into mailbox operations and updates the main application UI accordingly.



Key Features

Real Gmail Integration

Google OAuth authentication

Gmail API integration

Real inbox data

Real sent-mail data

Read full email content

Send real emails

Delete emails

Mark emails as read

Mark emails as unread

AI-Controlled UI



The AI assistant is integrated directly into the application interface rather than functioning only as a text-based chatbot.



It can:



Open emails

Populate the compose window

Search the mailbox

Apply email filters

Prepare replies

Prepare forwarded messages

Mark messages as read/unread

Delete messages

Natural-Language Email Composition



Users can describe an email naturally:



Compose an email to john@gmail.com subject: Project Update saying the project is completed and ready for review



The application extracts:



Recipient

Subject

Message body



and automatically opens the compose interface with the fields populated.



The user can review the message before sending it.



Context-Aware Replies



When an email is currently open, users can say:



Reply to this saying I'll check and get back to you tomorrow



The application understands the currently selected email and automatically prepares a reply using the existing email context.



Natural-Language Search



The assistant supports searches such as:



Find emails from Google



Show emails from the last 3 days



Find emails from Sarah about project update



Show unread emails



Show emails from the last 10 days



The search request is converted into Gmail-compatible search filters and the main email list is updated.



Email Filtering



The UI also provides direct filters for:



Sender

Keyword

Date range

Read / unread status



Available date filters include:



Last 1 day

Last 3 days

Last 7 days

Last 10 days

Last 30 days

Automatic Mail Synchronization



The application automatically checks for mailbox updates at regular intervals and refreshes the visible mailbox without requiring the user to manually reload the page.



A live-sync indicator is displayed in the interface.



AI Assistant Capabilities

User Request	Application Action

Compose an email	Opens and fills compose window

Send an email	Sends through Gmail API

Find emails from Google	Searches Gmail

Show emails from last 3 days	Applies date-based search

Open latest email	Opens newest message

Reply to this	Uses currently opened email

Forward this email	Prepares forwarded message

Mark as read	Updates Gmail message state

Mark as unread	Updates Gmail message state

Delete this email	Moves email to Gmail trash



The important design principle is that AI actions produce visible UI changes rather than returning instructions for the user to perform manually.



System Architecture

&#x20;                   ┌──────────────────────┐

&#x20;                   │       User           │

&#x20;                   │ Natural Language     │

&#x20;                   └──────────┬───────────┘

&#x20;                              │

&#x20;                              ▼

&#x20;                   ┌──────────────────────┐

&#x20;                   │   React Frontend     │

&#x20;                   │                      │

&#x20;                   │ Inbox / Sent         │

&#x20;                   │ Email Detail        │

&#x20;                   │ Compose              │

&#x20;                   │ Filters              │

&#x20;                   │ AI Assistant         │

&#x20;                   └──────────┬───────────┘

&#x20;                              │

&#x20;                        HTTP / REST

&#x20;                              │

&#x20;                              ▼

&#x20;                   ┌──────────────────────┐

&#x20;                   │   Express Backend    │

&#x20;                   │                      │

&#x20;                   │ Authentication       │

&#x20;                   │ Mail APIs            │

&#x20;                   │ Search               │

&#x20;                   │ Email Actions        │

&#x20;                   │ AI Command Handler   │

&#x20;                   └───────┬───────┬──────┘

&#x20;                           │       │

&#x20;                 ┌─────────┘       └──────────┐

&#x20;                 ▼                            ▼

&#x20;       ┌──────────────────┐         ┌──────────────────┐

&#x20;       │    Gmail API     │         │   Gemini API     │

&#x20;       │                  │         │                  │

&#x20;       │ Inbox            │         │ Intent / Tool    │

&#x20;       │ Sent             │         │ Selection        │

&#x20;       │ Search           │         │                  │

&#x20;       │ Send             │         │                  │

&#x20;       │ Modify           │         │                  │

&#x20;       └──────────────────┘         └──────────────────┘

Technology Stack

Frontend

React

Vite

JavaScript

CSS

Fetch API

Backend

Node.js

Express.js

Google APIs

Express Session

CORS

dotenv

AI

Google Gemini API

Gemini Interactions API

Function/tool calling

Email

Gmail API

Google OAuth 2.0

Project Structure

nebula-mail-ai/

│

├── backend/

│   ├── server.js

│   ├── package.json

│   ├── package-lock.json

│   ├── .env

│   └── .gitignore

│

├── frontend/

│   ├── public/

│   ├── src/

│   │   ├── App.jsx

│   │   ├── App.css

│   │   ├── index.css

│   │   ├── main.jsx

│   │   └── assets/

│   ├── package.json

│   └── package-lock.json

│

├── README.md

└── .gitignore

Gmail Authentication



The application uses Google OAuth 2.0 to securely connect the user's Gmail account.



Authentication flow:



User

&#x20; │

&#x20; ▼

"Sign in with Google"

&#x20; │

&#x20; ▼

Google OAuth

&#x20; │

&#x20; ▼

Permission Grant

&#x20; │

&#x20; ▼

OAuth Callback

&#x20; │

&#x20; ▼

Backend Session

&#x20; │

&#x20; ▼

Gmail API Access



The application requests the Gmail modify scope because the application needs both read and modification capabilities, including:



Reading messages

Sending messages

Marking messages as read/unread

Moving messages to trash



Credentials and secrets are kept outside the source code using environment variables.



AI Command Processing



The assistant follows a command-processing pipeline:



Natural Language Request

&#x20;         │

&#x20;         ▼

Command Analysis

&#x20;         │

&#x20;         ▼

Intent / Parameters

&#x20;         │

&#x20;         ▼

Mailbox Operation

&#x20;         │

&#x20;         ▼

Backend API

&#x20;         │

&#x20;         ▼

Gmail API

&#x20;         │

&#x20;         ▼

UI State Update



For supported operations, the application can handle the request directly and deterministically.



This approach is especially useful for common mailbox operations because it provides predictable behavior and avoids unnecessary AI calls.



Gemini is used where AI-based intent interpretation and tool selection are beneficial.



Search Architecture



Natural-language date requests are translated into Gmail search operators.



For example:



Show emails from the last 3 days



is converted into an appropriate Gmail date query before being sent to the Gmail API.



Additional filters can be combined:



Sender

Keyword

Date

Read / Unread



This keeps the actual mailbox filtering close to Gmail's native search capabilities instead of downloading the entire mailbox and filtering everything in the browser.



Context-Aware Email Operations



The application maintains the currently selected email as UI context.



For example:



User:

Open latest email



&#x20;       ↓



Email Detail View



&#x20;       ↓



User:

Reply to this saying I'll check and get back to you tomorrow



&#x20;       ↓



Application uses the currently opened email



&#x20;       ↓



Compose window populated with:

Recipient

Subject

Reply body



This demonstrates the key requirement that the assistant understands the current application state.



Automatic Synchronization



The current implementation uses periodic background synchronization to keep the mailbox updated without requiring manual page refreshes.



The frontend periodically requests the latest mailbox state from the backend.



React Application

&#x20;      │

&#x20;      │ periodic request

&#x20;      ▼

Express Backend

&#x20;      │

&#x20;      ▼

Gmail API

&#x20;      │

&#x20;      ▼

Updated Mailbox

&#x20;      │

&#x20;      ▼

React UI

Engineering Trade-off



A production implementation could use Gmail Push Notifications through Google Cloud Pub/Sub for event-driven synchronization.



For this recruitment prototype, periodic synchronization was selected because it:



Keeps the implementation lightweight

Avoids additional infrastructure

Works reliably in local development

Keeps the architecture easy to understand



Moving to Gmail Pub/Sub would be a natural next step for a production deployment.



UI Design



The application provides a Gmail-style workspace containing:



Sidebar navigation

Inbox

Sent mail

Email detail view

Compose window

Search/filter controls

AI assistant panel

Live synchronization indicator



The AI assistant remains visible alongside the mailbox so that AI-driven actions are reflected directly in the application.



Security Considerations



The project follows several basic security practices:



OAuth authentication instead of storing Gmail passwords

Credentials stored using environment variables

.env excluded from Git

OAuth client secrets excluded from source control

HTTP-only session cookies

Backend-controlled Gmail API access

Gmail permissions limited to the required API scope



Sensitive configuration files should never be committed to the repository.



Local Development Setup

Prerequisites



Install:



Node.js

npm

Google Cloud account

Gmail account

Gemini API key

1\. Clone the Repository

git clone <repository-url>

cd nebula-mail-ai

2\. Install Backend Dependencies

cd backend

npm install

3\. Configure Environment Variables



Create:



backend/.env



Example:



PORT=5000



GOOGLE\_CLIENT\_ID=your\_google\_client\_id

GOOGLE\_CLIENT\_SECRET=your\_google\_client\_secret

GOOGLE\_REDIRECT\_URI=http://localhost:5000/auth/google/callback



SESSION\_SECRET=your\_session\_secret



GEMINI\_API\_KEY=your\_gemini\_api\_key



Do not commit this file.



4\. Install Frontend Dependencies

cd ../frontend

npm install

5\. Start Backend

cd ../backend

node server.js



Backend:



http://localhost:5000

6\. Start Frontend



Open another terminal:



cd frontend

npm run dev



Frontend:



http://localhost:5173

Production Build



The frontend can be built using:



npm run build



The production build is generated in:



frontend/dist/

Example AI Commands

Search

Find emails from Google

Show emails from the last 3 days

Find emails from Sarah about project update

Compose

Compose an email to john@gmail.com subject: Project Update saying the project is completed and ready for review

Open

Open the latest email

Open latest email from David

Reply

Reply to this saying I'll check and get back to you tomorrow

Forward

Forward this email to someone@example.com

Mail Management

Mark this email as read

Mark this email as unread

Delete this email

Design Decisions

Why Gmail API?



Gmail API provides direct access to real mailbox data and supports the operations required by the task, including reading, searching, sending, and modifying messages.



Why React?



React provides a convenient state-driven UI architecture, which is particularly useful when AI commands need to modify the visible application state.



Why Express?



Express provides a lightweight backend layer for authentication, Gmail API communication, AI integration, and mailbox operations.



Why combine deterministic commands with AI?



Not every email operation requires an LLM.



For predictable commands such as date-based searches and direct mailbox actions, deterministic handling provides:



Better reliability

Faster response time

Lower AI usage

Easier debugging



AI tool calling is used where natural-language interpretation adds value.



Engineering Trade-offs



This project was developed as a recruitment-focused prototype within a limited implementation window.



The main trade-offs were:



Synchronization



Current:



Periodic synchronization



Production improvement:



Gmail Push Notifications + Google Cloud Pub/Sub

AI Usage



Common predictable commands use deterministic processing where appropriate, while Gemini is used for AI-driven interpretation and tool selection.



This balances:



Reliability + Speed + AI capability

Known Limitations



The current prototype can be further improved with:



Gmail Push Notifications / Pub/Sub

Production deployment

More advanced conversation/thread handling

Rich-text email composition

Attachments

Advanced multi-turn AI conversations

Comprehensive automated test coverage

More granular permission handling

Production-grade token/session persistence



These are considered natural next steps rather than blockers for the current prototype.



Future Improvements



Potential production enhancements include:



Gmail Push Notifications using Cloud Pub/Sub

Full email thread support

Rich-text composition

Attachments

Advanced conversational context

AI-generated email summaries

AI-generated smart replies

Better error recovery

Automated unit and integration tests

Cloud deployment

Observability and logging

Expanded mailbox search capabilities

Submission Notes



This project was built for the Nebula KnowLab AI-Powered Mail Web Application Hiring Task.



The implementation focuses on the core evaluation areas:



Real email provider integration

Real inbox and sent data

AI-controlled UI

Natural-language email composition

Natural-language search

Context-aware email actions

Email state management

Automatic synchronization

Clean separation between frontend, backend, Gmail API, and AI services



Author

Tharunya S

Computer Science \& Engineering



Project Status

Functional prototype completed



Core Gmail integration, AI-assisted mailbox control, natural-language search, email composition, context-aware reply/forward workflows, mailbox actions, filtering, and automatic synchronization are implemented.



The project is structured to allow the prototype to evolve into a production-grade AI email client.

