const express = require("express");
const cors = require("cors");
const session = require("express-session");
const dotenv = require("dotenv");
const { google } = require("googleapis");
const { GoogleGenAI } = require("@google/genai");
dotenv.config();
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});
console.log("CLIENT ID loaded:", !!process.env.GOOGLE_CLIENT_ID);
console.log("CLIENT SECRET loaded:", !!process.env.GOOGLE_CLIENT_SECRET);
console.log("REDIRECT URI:", process.env.GOOGLE_REDIRECT_URI);
const app = express();
const PORT = 5000;

app.use(cors({
  origin: "http://localhost:5173",
  credentials: true,
}));

app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: false,
    sameSite: "lax",
    maxAge: 24 * 60 * 60 * 1000,
  },
}));

const SCOPES = [
  "https://www.googleapis.com/auth/gmail.modify",
];

function createOAuthClient() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
}


// -----------------------------
// Health Check
// -----------------------------
app.get("/", (req, res) => {
  res.json({
    message: "Nebula AI Mail Backend is running 🚀",
  });
});


// -----------------------------
// Start Google OAuth
// -----------------------------
app.get("/auth/google", (req, res) => {
  const oauth2Client = createOAuthClient();

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
    include_granted_scopes: true,
    prompt: "consent",
  });

  res.redirect(authUrl);
});


// -----------------------------
// Google OAuth Callback
// -----------------------------
app.get("/auth/google/callback", async (req, res) => {
  try {
    const { code } = req.query;

    if (!code) {
      return res.status(400).send("Authorization code missing");
    }

    const oauth2Client = createOAuthClient();

    const { tokens } = await oauth2Client.getToken(code);

    oauth2Client.setCredentials(tokens);

    // Store tokens in session for our development version
   req.session.tokens = tokens;

req.session.save((err) => {
  if (err) {
    console.error("Session save error:", err);
    return res.status(500).send("Failed to save Google session");
  }

  console.log("Google OAuth successful!");
  console.log("Session saved successfully!");

  res.redirect(`${process.env.FRONTEND_URL}/?auth=success`);
});
  } 
   catch (error) {
    console.error("========== OAUTH ERROR ==========");
    console.error("Message:", error.message);
    console.error("Response:", error.response?.data);
    console.error("Stack:", error.stack);
    console.error("================================");

    res.status(500).send("Google authentication failed. Check backend terminal.");
}
});


// -----------------------------
// Check Authentication
// -----------------------------
app.get("/api/auth/status", (req, res) => {
  if (req.session.tokens) {
    return res.json({
      authenticated: true,
    });
  }

  res.json({
    authenticated: false,
  });
});


// -----------------------------
// Get Gmail Inbox
// -----------------------------
app.get("/api/mail/inbox", async (req, res) => {
  try {
    if (!req.session.tokens) {
      return res.status(401).json({
        error: "Gmail not connected",
      });
    }

    const oauth2Client = createOAuthClient();

    oauth2Client.setCredentials(req.session.tokens);

    const gmail = google.gmail({
      version: "v1",
      auth: oauth2Client,
    });

    const response = await gmail.users.messages.list({
      userId: "me",
      labelIds: ["INBOX"],
      maxResults: 20,
    });

    const messages = response.data.messages || [];

    const emails = [];

    for (const message of messages) {
      const email = await gmail.users.messages.get({
        userId: "me",
        id: message.id,
        format: "metadata",
        metadataHeaders: [
          "From",
          "To",
          "Subject",
          "Date",
        ],
      });

      const headers = email.data.payload.headers || [];

      const getHeader = (name) => {
        const header = headers.find(
          (h) => h.name.toLowerCase() === name.toLowerCase()
        );

        return header ? header.value : "";
      };

      emails.push({
        id: email.data.id,
        threadId: email.data.threadId,
        sender: getHeader("From"),
        recipient: getHeader("To"),
        subject: getHeader("Subject"),
        date: getHeader("Date"),
        snippet: email.data.snippet,
        isRead: !email.data.labelIds?.includes("UNREAD"),
      });
    }

    res.json({
      emails,
    });
  } catch (error) {
    console.error("========== INBOX ERROR ==========");
    console.error("Message:", error.message);
    console.error("Response:", error.response?.data);
    console.error("Status:", error.response?.status);
    console.error("Stack:", error.stack);
    console.error("=================================");

    res.status(500).json({
      error: error.response?.data?.error?.message || error.message,
    });
}
});
// =============================
// GET GMAIL SENT MAIL
// =============================
app.get("/api/mail/sent", async (req, res) => {
  try {
    if (!req.session.tokens) {
      return res.status(401).json({
        error: "Gmail not connected",
      });
    }

    const oauth2Client = createOAuthClient();
    oauth2Client.setCredentials(req.session.tokens);

    const gmail = google.gmail({
      version: "v1",
      auth: oauth2Client,
    });

    const response = await gmail.users.messages.list({
      userId: "me",
      labelIds: ["SENT"],
      maxResults: 20,
    });

    const messages = response.data.messages || [];
    const emails = [];

    for (const message of messages) {
      const email = await gmail.users.messages.get({
        userId: "me",
        id: message.id,
        format: "metadata",
        metadataHeaders: [
          "From",
          "To",
          "Subject",
          "Date",
        ],
      });

      const headers = email.data.payload?.headers || [];

      const getHeader = (name) => {
        const header = headers.find(
          (h) => h.name.toLowerCase() === name.toLowerCase()
        );

        return header ? header.value : "";
      };

      emails.push({
        id: email.data.id,
        threadId: email.data.threadId,
        sender: getHeader("From"),
        recipient: getHeader("To"),
        subject: getHeader("Subject"),
        date: getHeader("Date"),
        snippet: email.data.snippet,
        isRead: !email.data.labelIds?.includes("UNREAD"),
      });
    }

    res.json({
      emails,
    });

  } catch (error) {
    console.error("========== SENT ERROR ==========");
    console.error("Message:", error.message);
    console.error("Response:", error.response?.data);
    console.error("================================");

    res.status(500).json({
      error:
        error.response?.data?.error?.message ||
        error.message ||
        "Failed to load sent emails",
    });
  }
});
// -----------------------------
// Search Gmail Emails
// -----------------------------
app.get("/api/mail/search", async (req, res) => {
  try {
    if (!req.session.tokens) {
      return res.status(401).json({
        error: "Gmail not connected",
      });
    }

    const q = req.query.q;

    if (!q) {
      return res.status(400).json({
        error: "Search query is required",
      });
    }

    const oauth2Client = createOAuthClient();
    oauth2Client.setCredentials(req.session.tokens);

    const gmail = google.gmail({
      version: "v1",
      auth: oauth2Client,
    });
console.log("=================================");
console.log("🔎 GMAIL SEARCH QUERY:", q);
console.log("🔎 SEARCHING IN: INBOX");
console.log("=================================");
   

    const response = await gmail.users.messages.list({
      userId: "me",
      q: q,
      labelIds: ["INBOX"],
      maxResults: 20,
    });

    const messages = response.data.messages || [];
    console.log("🔎 Gmail result count:", messages.length);
console.log(
  "🔎 Gmail message IDs:",
  messages.map((m) => m.id)
);
    const emails = [];

    for (const message of messages) {
      const email = await gmail.users.messages.get({
        userId: "me",
        id: message.id,
        format: "metadata",
        metadataHeaders: [
          "From",
          "To",
          "Subject",
          "Date",
        ],
      });

      const headers = email.data.payload.headers || [];

      const getHeader = (name) => {
        const header = headers.find(
          (h) => h.name.toLowerCase() === name.toLowerCase()
        );

        return header ? header.value : "";
      };
      console.log(
  "📧 SEARCH RESULT:",
  getHeader("Date"),
  "|",
  getHeader("From"),
  "|",
  getHeader("Subject")
);

      emails.push({
        id: email.data.id,
        threadId: email.data.threadId,
        sender: getHeader("From"),
        recipient: getHeader("To"),
        subject: getHeader("Subject"),
        date: getHeader("Date"),
        snippet: email.data.snippet,
        isRead: !email.data.labelIds?.includes("UNREAD"),
      });
    }

    res.json({
      emails,
    });

  } catch (error) {
    console.error("========== SEARCH ERROR ==========");
    console.error("Message:", error.message);
    console.error("Response:", error.response?.data);
    console.error("=================================");

    res.status(500).json({
      error:
        error.response?.data?.error?.message ||
        error.message ||
        "Failed to search emails",
    });
  }
});
// ===============================
// GET LATEST EMAIL
// ===============================
app.get("/api/mail/latest", async (req, res) => {
  try {
    if (!req.session.tokens) {
      return res.status(401).json({
        error: "Gmail not connected",
      });
    }

    const oauth2Client = createOAuthClient();
    oauth2Client.setCredentials(req.session.tokens);

    const gmail = google.gmail({
      version: "v1",
      auth: oauth2Client,
    });

    const response = await gmail.users.messages.list({
      userId: "me",
      labelIds: ["INBOX"],
      maxResults: 1,
    });

    const messages = response.data.messages || [];

    if (messages.length === 0) {
      return res.json({
        email: null,
      });
    }

    const message = await gmail.users.messages.get({
      userId: "me",
      id: messages[0].id,
      format: "full",
    });

    const email = message.data;
    const headers = email.payload?.headers || [];

    const getHeader = (name) => {
      const header = headers.find(
        (h) => h.name.toLowerCase() === name.toLowerCase()
      );

      return header ? header.value : "";
    };
    console.log("========== LATEST EMAIL ==========");
console.log("Message ID:", email.id);
console.log("Date:", getHeader("Date"));
console.log("From:", getHeader("From"));
console.log("To:", getHeader("To"));
console.log("Subject:", getHeader("Subject"));
console.log("Snippet:", email.snippet);
console.log("=================================");

    let body = "";

    const decodeBase64 = (data) => {
      if (!data) return "";

      return Buffer.from(
        data.replace(/-/g, "+").replace(/_/g, "/"),
        "base64"
      ).toString("utf-8");
    };

    const findBody = (part) => {
      if (!part) return "";

      if (part.mimeType === "text/plain" && part.body?.data) {
        return decodeBase64(part.body.data);
      }

      if (part.parts) {
        for (const child of part.parts) {
          const result = findBody(child);

          if (result) {
            return result;
          }
        }
      }

      return "";
    };

    body = findBody(email.payload);

    if (!body && email.payload?.body?.data) {
      body = decodeBase64(email.payload.body.data);
    }

    res.json({
      email: {
        id: email.id,
        threadId: email.threadId,
        sender: getHeader("From"),
        recipient: getHeader("To"),
        subject: getHeader("Subject"),
        date: getHeader("Date"),
        body,
        snippet: email.snippet,
        isRead: !email.labelIds?.includes("UNREAD"),
      },
    });

  } catch (error) {
    console.error("========== LATEST EMAIL ERROR ==========");
    console.error("Message:", error.message);
    console.error("Response:", error.response?.data);
    console.error("=========================================");

    res.status(500).json({
      error:
        error.response?.data?.error?.message ||
        error.message ||
        "Failed to get latest email",
    });
  }
});
// =============================
// GET FULL EMAIL
// =============================
app.get("/api/mail/:id", async (req, res) => {
  try {
    if (!req.session.tokens) {
      return res.status(401).json({
        error: "Gmail not connected",
      });
    }

    const oauth2Client = createOAuthClient();
    oauth2Client.setCredentials(req.session.tokens);

    const gmail = google.gmail({
      version: "v1",
      auth: oauth2Client,
    });

    const response = await gmail.users.messages.get({
      userId: "me",
      id: req.params.id,
      format: "full",
    });

    const message = response.data;

    const headers = message.payload?.headers || [];

    const getHeader = (name) => {
      const header = headers.find(
        (h) => h.name.toLowerCase() === name.toLowerCase()
      );

      return header ? header.value : "";
    };

    // -----------------------------
    // Extract email body
    // -----------------------------

    let body = "";

    const decodeBase64 = (data) => {
      if (!data) return "";

      return Buffer.from(
        data.replace(/-/g, "+").replace(/_/g, "/"),
        "base64"
      ).toString("utf-8");
    };

    const findBody = (part) => {
      if (!part) return "";

      if (
        part.mimeType === "text/plain" &&
        part.body?.data
      ) {
        return decodeBase64(part.body.data);
      }

      if (part.parts) {
        for (const child of part.parts) {
          const result = findBody(child);

          if (result) {
            return result;
          }
        }
      }

      return "";
    };

    body = findBody(message.payload);

    // Fallback
    if (!body && message.payload?.body?.data) {
      body = decodeBase64(message.payload.body.data);
    }

    res.json({
      id: message.id,
      threadId: message.threadId,
      sender: getHeader("From"),
      recipient: getHeader("To"),
      subject: getHeader("Subject"),
      date: getHeader("Date"),
      body,
      snippet: message.snippet,
      isRead: !message.labelIds?.includes("UNREAD"),
    });

  } catch (error) {
    console.error("========== GET EMAIL ERROR ==========");
    console.error("Message:", error.message);
    console.error("Response:", error.response?.data);
    console.error("=====================================");

    res.status(500).json({
      error:
        error.response?.data?.error?.message ||
        error.message ||
        "Failed to load email",
    });
  }
});

// ===============================
// MARK EMAIL AS READ
// ===============================
app.post("/api/mail/:emailId/read", async (req, res) => {
  try {
    if (!req.session.tokens) {
      return res.status(401).json({
        error: "Gmail not connected",
      });
    }

    const oauth2Client = createOAuthClient();
    oauth2Client.setCredentials(req.session.tokens);

    const gmail = google.gmail({
      version: "v1",
      auth: oauth2Client,
    });

    await gmail.users.messages.modify({
      userId: "me",
      id: req.params.emailId,
      requestBody: {
        removeLabelIds: ["UNREAD"],
      },
    });

    console.log("Email marked as READ:", req.params.emailId);

    res.json({
      success: true,
      message: "Email marked as read",
    });

  } catch (error) {
    console.error("Mark read error:", error.response?.data || error.message);

    res.status(500).json({
      error:
        error.response?.data?.error?.message ||
        error.message ||
        "Failed to mark email as read",
    });
  }
});

// ===============================
// MARK EMAIL AS UNREAD
// ===============================
app.post("/api/mail/:emailId/unread", async (req, res) => {
  console.log("=================================");
  console.log("MARK UNREAD REQUEST RECEIVED");
  console.log("Email ID:", req.params.emailId);
  console.log("Has session:", !!req.session.tokens);
  console.log("=================================");

  try {
    if (!req.session.tokens) {
      console.log("ERROR: No Gmail session");
      return res.status(401).json({
        error: "Gmail not connected",
      });
    }

    const oauth2Client = createOAuthClient();
    oauth2Client.setCredentials(req.session.tokens);

    const gmail = google.gmail({
      version: "v1",
      auth: oauth2Client,
    });

    console.log("Calling Gmail modify API...");

    const result = await gmail.users.messages.modify({
      userId: "me",
      id: req.params.emailId,
      requestBody: {
        addLabelIds: ["UNREAD"],
      },
    });

    console.log("SUCCESS: Email marked as unread");
    console.log("Message ID:", result.data.id);

    res.json({
      success: true,
      message: "Email marked as unread",
    });

  } catch (error) {
    console.log("========== GMAIL UNREAD ERROR ==========");
    console.log("Message:", error.message);
    console.log("Status:", error.response?.status);
    console.log(
      "Google error:",
      JSON.stringify(error.response?.data, null, 2)
    );
    console.log("========================================");

    res.status(500).json({
      success: false,
      error:
        error.response?.data?.error?.message ||
        error.message ||
        "Failed to mark email as unread",
    });
  }
});

// -----------------------------
// Send Gmail Email
// -----------------------------
app.post("/api/mail/send", async (req, res) => {
  try {
    if (!req.session.tokens) {
      return res.status(401).json({
        error: "Gmail not connected",
      });
    }

    const { to, subject, body } = req.body;

    console.log("Send request:", {
      to,
      subject,
      bodyLength: body?.length,
    });

    if (!to || !subject || !body) {
      return res.status(400).json({
        error: "To, subject and body are required",
      });
    }

    const oauth2Client = createOAuthClient();

    oauth2Client.setCredentials(req.session.tokens);

    const gmail = google.gmail({
      version: "v1",
      auth: oauth2Client,
    });

    const rawMessage = [
      `To: ${to}`,
      `Subject: ${subject}`,
      "MIME-Version: 1.0",
      "Content-Type: text/plain; charset=UTF-8",
      "Content-Transfer-Encoding: 8bit",
      "",
      body,
    ].join("\r\n");

    const encodedMessage = Buffer.from(rawMessage, "utf8")
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

    const result = await gmail.users.messages.send({
      userId: "me",
      requestBody: {
        raw: encodedMessage,
      },
    });

    console.log("========== EMAIL SENT ==========");
    console.log("Message ID:", result.data.id);
    console.log("================================");

    res.json({
      success: true,
      messageId: result.data.id,
    });

  } catch (error) {
    console.error("========== SEND EMAIL ERROR ==========");
    console.error("Message:", error.message);
    console.error("Status:", error.response?.status);
    console.error("Response:", error.response?.data);
    console.error("======================================");

    res.status(500).json({
      error:
        error.response?.data?.error?.message ||
        error.message ||
        "Failed to send email",
    });
  }
});
app.delete("/api/mail/delete/:id", async (req, res) => {
  try {
    if (!req.session.tokens) {
      return res.status(401).json({
        error: "Gmail not connected",
      });
    }

    const oauth2Client = createOAuthClient();
    oauth2Client.setCredentials(req.session.tokens);

    const gmail = google.gmail({
      version: "v1",
      auth: oauth2Client,
    });

    await gmail.users.messages.trash({
      userId: "me",
      id: req.params.id,
    });

    res.json({
      success: true,
      message: "Email moved to trash",
    });
  } catch (error) {
    console.error("Delete email error:", error.message);

    res.status(500).json({
      error:
        error.response?.data?.error?.message ||
        error.message ||
        "Failed to delete email",
    });
  }
});

// -----------------------------
// GEMINI AI COMMAND HANDLER
// -----------------------------
app.post("/api/ai", async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({
        error: "Message is required",
      });
    }

    const interaction = await ai.interactions.create({
      model: "gemini-3.6-flash",

      input: `
You are Nebula AI, an AI assistant controlling a Gmail application.

You MUST use functions for email actions.

SEARCH RULES:
- "find emails" -> searchEmails with a useful query
- "find emails from Google" -> query "from:google"
- "find emails from Sarah" -> query "from:sarah"
- "find emails from the last 10 days" -> query "newer_than:10d"
- "emails from last 7 days" -> query "newer_than:7d"
- "emails from last month" -> query "newer_than:30d"
- "unread emails" -> query "is:unread"
- "read emails" -> query "is:read"
- "emails about project" -> query "project"

IMPORTANT:
Never say you cannot access Gmail.
Never tell the user to search manually.
Always use the appropriate function.

For "this email", use the currently selected email.

User request:
${message}
`,

      tools: [
        // -----------------------------
        // 1. COMPOSE EMAIL
        // -----------------------------
        {
          type: "function",
          name: "fillCompose",
          description:
            "Open the email compose window and fill the recipient, subject, and message body.",
          parameters: {
            type: "object",
            properties: {
              to: {
                type: "string",
                description: "Email address of the recipient",
              },
              subject: {
                type: "string",
                description: "Subject of the email",
              },
              body: {
                type: "string",
                description: "Main message body of the email",
              },
            },
            required: ["to", "subject", "body"],
          },
        },

        // -----------------------------
        // 2. SEARCH EMAILS
        // -----------------------------
        {
  type: "function",
  name: "searchEmails",
  description:
    "Search Gmail and return matching emails. ALWAYS convert the user's natural-language request into valid Gmail search syntax. Examples: 'emails from Google' -> from:google, 'emails from Sarah' -> from:sarah, 'emails about project' -> project, 'emails from last 10 days' -> newer_than:10d, 'unread emails' -> is:unread, 'read emails' -> is:read. For multiple conditions, combine them with spaces. NEVER return an empty query.",
  parameters: {
    type: "object",
    properties: {
      query: {
        type: "string",
        description:
          "A valid Gmail search query. Examples: from:google, newer_than:10d, from:sarah project, is:unread",
      },
    },
    required: ["query"],
  },
},

        // -----------------------------
        // 3. OPEN EMAIL
        // -----------------------------
        {
          type: "function",
          name: "openEmail",
          description:
            "Open a specific email from the currently displayed email list.",
          parameters: {
            type: "object",
            properties: {
              emailId: {
                type: "string",
                description:
                  "The Gmail message ID of the email to open.",
              },
            },
            required: ["emailId"],
          },
        },

        // -----------------------------
        // 4. MARK AS READ
        // -----------------------------
        {
          type: "function",
          name: "markAsRead",
          description:
            "Mark the currently selected email as read.",
          parameters: {
            type: "object",
            properties: {},
          },
        },

        // -----------------------------
        // 5. MARK AS UNREAD
        // -----------------------------
        {
          type: "function",
          name: "markAsUnread",
          description:
            "Mark the currently selected email as unread.",
          parameters: {
            type: "object",
            properties: {},
          },
        },

        // -----------------------------
        // 6. DELETE EMAIL
        // -----------------------------
        {
          type: "function",
          name: "deleteEmail",
          description:
            "Delete the currently selected email by moving it to Gmail trash.",
          parameters: {
            type: "object",
            properties: {},
          },
        },
      ],
    });

    console.log(
      "Gemini interaction:",
      JSON.stringify(interaction, null, 2)
    );

    const functionCall = interaction.steps?.find(
      (step) => step.type === "function_call"
    );

    if (functionCall) {
      return res.json({
        type: "function_call",
        name: functionCall.name,
        arguments: functionCall.arguments,
      });
    }

    res.json({
      type: "text",
      reply: interaction.output_text || "",
    });
  } catch (error) {
    console.error("========== GEMINI ERROR ==========");
    console.error("Message:", error.message);
    console.error("Response:", error.response?.data);
    console.error("==================================");

    res.status(500).json({
      error: error.message || "Gemini request failed",
    });
  }
});
app.listen(PORT, () => {
  console.log(`Backend running at http://localhost:${PORT}`);
});