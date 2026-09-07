import { useEffect, useState } from "react";
import "./App.css";

const API = "http://localhost:5000";

function App() {
  const [emails, setEmails] = useState([]);
  const [inboxCount, setInboxCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [lastSynced, setLastSynced] = useState(null);
  const [view, setView] = useState("inbox");
  const [composeOpen, setComposeOpen] = useState(false);
const [searchActive, setSearchActive] = useState(false);
const [filterSender, setFilterSender] = useState("");
const [filterKeyword, setFilterKeyword] = useState("");
const [filterDays, setFilterDays] = useState("");
const [filterRead, setFilterRead] = useState("all");
  // AI state
  const [aiOpen, setAiOpen] = useState(true);
  const [aiInput, setAiInput] = useState("");
  const [aiMessages, setAiMessages] = useState([
    {
      role: "assistant",
      text: "Hi! I can control your mailbox using natural language. Try asking me to compose, search, open, reply, delete, or mark an email as read or unread.",
    },
  ]);
  const [aiLoading, setAiLoading] = useState(false);
const [pendingSend, setPendingSend] = useState(false);
  const [compose, setCompose] = useState({
    to: "",
    subject: "",
    body: "",
     isReply: false,
  threadId: "",
  messageId: "",
  });

useEffect(() => {
  checkAuth();
}, []);
useEffect(() => {
  if (!authenticated|| searchActive) return;

  const interval = setInterval(() => {
    if (view === "sent") {
      loadSent(false);
    } else {
      loadInbox(false);
    }
  }, 15000);

  return () => clearInterval(interval);
}, [authenticated, view,searchActive]);

  const checkAuth = async () => {
    try {
      const response = await fetch(`${API}/api/auth/status`, {
        credentials: "include",
      });

      const data = await response.json();

    if (data.authenticated) {
  setAuthenticated(true);
  loadInbox();
} else {
  setAuthenticated(false);
  setLoading(false);
}
    } catch (error) {
      console.error("Auth error:", error);
      setLoading(false);
    }
  };
const loadInbox = async (showLoading = true) => {
  try {
    if (showLoading) {
      setLoading(true);
    }

    const response = await fetch(`${API}/api/mail/inbox`, {
      credentials: "include",
    });

    const data = await response.json();

    if (response.ok) {
  const inboxEmails = data.emails || [];

  setEmails(inboxEmails);
  setInboxCount(inboxEmails.length);
  setLastSynced(new Date());
} else {
      console.error("Inbox error:", data.error);
    }
  } catch (error) {
    console.error("Inbox error:", error);
  } finally {
    if (showLoading) {
      setLoading(false);
    }
  }
};

const loadSent = async (showLoading = true) => {
  try {
    if (showLoading) {
      setLoading(true);
    }

    const response = await fetch(`${API}/api/mail/sent`, {
      credentials: "include",
    });

    const data = await response.json();

    if (response.ok) {
      setEmails(data.emails || []);
      setLastSynced(new Date());
    } else {
      console.error("Sent error:", data.error);
    }
  } catch (error) {
    console.error("Sent error:", error);
  } finally {
    if (showLoading) {
      setLoading(false);
    }
  }
};

  // -----------------------------
  // UI CONTROL TOOLS
  // -----------------------------
const openEmail = async (email) => {
  setSelectedEmail(email);
  try {
    const response = await fetch(
      `${API}/api/mail/${email.id}`,
      {
        credentials: "include",
      }
    );

    const data = await response.json();

    if (response.ok) {
      setSelectedEmail(data);
    } else {
      console.error("Failed to load email:", data.error);
    }
  } catch (error) {
    console.error("Email detail error:", error);
  }
};
  const openLatestEmail = async () => {
  try {
    setLoading(true);

    const response = await fetch(
      `${API}/api/mail/latest`,
      {
        credentials: "include",
      }
    );

    const data = await response.json();

    console.log("📩 LATEST EMAIL RESPONSE:", data);

    if (!response.ok) {
      console.error("Latest email failed:", data.error);
      return null;
    }

    if (!data.email) {
      return null;
    }

    // Make sure all expected fields exist
    const email = {
      ...data.email,
      subject: data.email.subject || "",
      sender: data.email.sender || "",
      recipient: data.email.recipient || "",
      body: data.email.body || data.email.snippet || "",
    };

    console.log("📩 OPENING LATEST:", email);

    setSelectedEmail(email);

    return email;
  } catch (error) {
    console.error("Latest email error:", error);
    return null;
  } finally {
    setLoading(false);
  }
};

  const closeEmail = () => {
    setSelectedEmail(null);
  };

  const openCompose = () => {
    setComposeOpen(true);
    setCompose({
      to: "",
      subject: "",
      body: "",
      isReply: false,
    threadId: "",
    messageId: "",
    });
  };

  const closeCompose = () => {
    setComposeOpen(false);
  };

  const fillCompose = ({
  to = "",
  subject = "",
  body = "",
  isReply = false,
  threadId = "",
  messageId = "",
}) => {
  setCompose({
    to,
    subject,
    body,
    isReply,
    threadId,
    messageId,
  });

  setComposeOpen(true);
};

  const handleComposeChange = (e) => {
    setCompose({
      ...compose,
      [e.target.name]: e.target.value,
    });
  };
const sendEmail = async () => {
  if (!compose.to || !compose.body) {
    alert("Please fill recipient and message");
    return;
  }

  try {
    const endpoint = compose.isReply
      ? `${API}/api/mail/reply`
      : `${API}/api/mail/send`;

    const payload = compose.isReply
      ? {
          to: compose.to,
          subject: compose.subject,
          body: compose.body,
          threadId: compose.threadId,
          messageId: compose.messageId,
        }
      : {
          to: compose.to,
          subject: compose.subject,
          body: compose.body,
        };

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (response.ok) {
      closeCompose();

      addAiMessage(
        "assistant",
        compose.isReply
          ? "✅ Your reply was sent successfully."
          : "✈️ Email sent successfully!"
      );

      if (view === "sent") {
        loadSent(false);
      }
    } else {
      alert(
        data.error ||
          "Failed to send email"
      );
    }

  } catch (error) {
    console.error("Send email error:", error);

    alert(
      compose.isReply
        ? "Failed to send reply"
        : "Failed to send email"
    );
  }
};
  
const searchEmails = async (query) => {
  try {
    setLoading(true);

    console.log("🔎 SEARCH QUERY:", query);

    const response = await fetch(
      `${API}/api/mail/search?q=${encodeURIComponent(query)}`,
      {
        credentials: "include",
      }
    );

    const data = await response.json();

    console.log("🔎 SEARCH STATUS:", response.status);
    console.log("🔎 SEARCH RESPONSE:", data);

    if (!response.ok) {
      console.error("❌ Search failed:", data.error);
      return [];
    }

    const results = data.emails || [];

    setEmails(results);
    setView("inbox");
    setSelectedEmail(null);
    setSearchActive(true);

    return results;
  } catch (error) {
    console.error("❌ Search error:", error);
    return [];
  } finally {
    setLoading(false);
  }
};
const deleteEmail = async (emailId) => {
  try {
    const response = await fetch(
      `${API}/api/mail/delete/${emailId}`,
      {
        method: "DELETE",
        credentials: "include",
      }
    );

    const data = await response.json();

    if (response.ok) {
      setEmails((prev) =>
        prev.filter((email) => email.id !== emailId)
      );

      setSelectedEmail(null);

      addAiMessage(
        "assistant",
        "Email moved to Trash successfully."
      );

      return true;
    } else {
      addAiMessage(
        "assistant",
        data.error || "Failed to delete email."
      );

      return false;
    }
  } catch (error) {
    console.error("Delete error:", error);

    addAiMessage(
      "assistant",
      "Something went wrong while deleting the email."
    );

    return false;
  }
};
// -----------------------------
// MARK EMAIL AS READ
// -----------------------------
const markAsRead = async (emailId) => {
  try {
    const response = await fetch(
      `${API}/api/mail/${emailId}/read`,
      {
        method: "POST",
        credentials: "include",
      }
    );

    const data = await response.json();

    if (response.ok) {
      console.log("Frontend: Marked as read successfully");

      // Update selected email immediately
      setSelectedEmail((current) =>
        current?.id === emailId
          ? { ...current, isRead: true }
          : current
      );

      // Update email list immediately
      setEmails((currentEmails) =>
        currentEmails.map((email) =>
          email.id === emailId
            ? { ...email, isRead: true }
            : email
        )
      );

      // Sync with Gmail
      

      return true;
    } else {
      console.error("Mark read failed:", data.error);
      return false;
    }
  } catch (error) {
    console.error("Mark read error:", error);
    return false;
  }
};
// -----------------------------
// MARK EMAIL AS UNREAD
// -----------------------------
const markAsUnread = async (emailId) => {
  try {
    const response = await fetch(
      `${API}/api/mail/${emailId}/unread`,
      {
        method: "POST",
        credentials: "include",
      }
    );

    if (response.ok) {
      setEmails((currentEmails) =>
        currentEmails.map((email) =>
          email.id === emailId
            ? { ...email, isRead: false }
            : email
        )
      );

      setSelectedEmail((current) =>
        current?.id === emailId
          ? { ...current, isRead: false }
          : current
      );

      return true;
    }

    return false;
  } catch (error) {
    console.error("Mark unread error:", error);
    return false;
  }
};
  // -----------------------------
  // AI HELPER
  // -----------------------------

  const addAiMessage = (role, text) => {
    setAiMessages((messages) => [
      ...messages,
      {
        role,
        text,
      },
    ]);
  };
  const applyFilters = async () => {
  const searchParts = [];

  if (filterSender.trim()) {
    searchParts.push(`from:"${filterSender.trim()}"`);
  }

  if (filterKeyword.trim()) {
    searchParts.push(`"${filterKeyword.trim()}"`);
  }

  if (filterDays) {
    const days = Number(filterDays);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - days);

    const endDate = new Date(today);
    endDate.setDate(endDate.getDate() + 1);

    const startTimestamp = Math.floor(startDate.getTime() / 1000);
    const endTimestamp = Math.floor(endDate.getTime() / 1000);

    searchParts.push(
      `after:${startTimestamp}`,
      `before:${endTimestamp}`
    );
  }

  if (filterRead === "read") {
    searchParts.push("is:read");
  }

  if (filterRead === "unread") {
    searchParts.push("is:unread");
  }

  const query = searchParts.join(" ");

  if (!query) {
    setSearchActive(false);
    setSelectedEmail(null);

    if (view === "sent") {
      await loadSent();
    } else {
      await loadInbox();
    }

    return;
  }

  await searchEmails(query);
};
const clearFilters = async () => {
  setFilterSender("");
  setFilterKeyword("");
  setFilterDays("");
  setFilterRead("all");

  setSearchActive(false);
  setSelectedEmail(null);

  if (view === "sent") {
    await loadSent();
  } else {
    await loadInbox();
  }
};
const generateAiReply = async () => {
  if (!selectedEmail) {
    addAiMessage(
      "assistant",
      "📩 Please open an email first, then ask me to reply."
    );

    return;
  }

  try {
    setAiLoading(true);

    addAiMessage(
      "assistant",
      "🤖 I'm drafting a reply..."
    );

    const response = await fetch(
      `${API}/api/ai/reply`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          sender: selectedEmail.sender,
          subject: selectedEmail.subject,
          body:
            selectedEmail.body ||
            selectedEmail.snippet ||
            "",
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      addAiMessage(
        "assistant",
        data.error ||
          "I couldn't generate a reply."
      );

      return;
    }

    fillCompose({
      to: extractEmail(
        selectedEmail.sender
      ),

      subject: `Re: ${
        selectedEmail.subject || ""
      }`,

      body: data.reply,

      isReply: true,

      threadId:
        selectedEmail.threadId || "",

      messageId:
        selectedEmail.messageId || "",
    });

    addAiMessage(
      "assistant",
      "✍️ I've drafted a reply for you. Please review it before sending."
    );

  } catch (error) {
    console.error(
      "AI reply error:",
      error
    );

    addAiMessage(
      "assistant",
      "Something went wrong while generating the reply."
    );
  } finally {
    setAiLoading(false);
  }
};
  const handleAiCommand = async () => {
  const command = aiInput.trim();

  if (!command || aiLoading) {
    return;
  }

  const lower = command.toLowerCase();

  // -----------------------------------
  // SEND / CANCEL PENDING EMAIL
  // -----------------------------------
  if (pendingSend) {
    if (
      lower === "yes" ||
      lower === "yes send it" ||
      lower === "send it" ||
      lower === "send" ||
      lower.includes("yes, send") ||
      lower.includes("go ahead and send")
    ) {
      addAiMessage(
        "assistant",
        "✈️ Sending the email..."
      );

      setPendingSend(false);
      await sendEmail();
      return;
    }

    if (
      lower === "no" ||
      lower === "no don't send" ||
      lower === "cancel" ||
      lower.includes("don't send") ||
      lower.includes("do not send")
    ) {
      setPendingSend(false);
      closeCompose();

      addAiMessage(
        "assistant",
        "❌ Okay, I won't send it."
      );

      return;
    }
  }

  addAiMessage("user", command);
  setAiInput("");
  setAiLoading(true);

  try {
    // -----------------------------------
    // OPEN LATEST EMAIL
    // -----------------------------------
    if (
      lower.includes("open latest email") ||
      lower.includes("open the latest email")
    ) {
      const senderMatch = command.match(
        /open (?:the )?latest email from (.+)$/i
      );

      if (senderMatch) {
        const sender = senderMatch[1].trim();

        addAiMessage(
          "assistant",
          `📩 Finding the latest email from ${sender}...`
        );

        const results = await searchEmails(
          `from:"${sender}"`
        );

        if (results.length > 0) {
          const latestEmail = results[0];

          await openEmail(latestEmail);

          addAiMessage(
            "assistant",
            `Opened the latest email from ${
              latestEmail.sender || sender
            }.`
          );
        } else {
          addAiMessage(
            "assistant",
            `I couldn't find any emails from ${sender}.`
          );
        }

        return;
      }

      addAiMessage(
        "assistant",
        "📩 Opening the latest email..."
      );

      const email = await openLatestEmail();

      if (email) {
        const subject = email.subject?.trim();
        const sender = email.sender?.trim();

        addAiMessage(
          "assistant",
          subject
            ? `Opened "${subject}".`
            : sender
              ? `Opened the latest email from ${sender}.`
              : "Opened the latest email."
        );
      } else {
        addAiMessage(
          "assistant",
          "I couldn't find any emails."
        );
      }

      return;
    }

    // -----------------------------------
    // REPLY TO CURRENT EMAIL
    // -----------------------------------
    if (
      lower.includes("reply to this") ||
      lower.includes("reply this email") ||
      lower.includes("reply to this email") ||
      lower.includes("reply to this message")
    ) {
      if (!selectedEmail) {
        addAiMessage(
          "assistant",
          "Please open an email first, then ask me to reply to it."
        );

        return;
      }

      const recipient = extractEmail(
        selectedEmail.sender
      );

      if (!recipient) {
        addAiMessage(
          "assistant",
          "I couldn't determine the sender's email address."
        );

        return;
      }

      // -----------------------------------
      // USER PROVIDED REPLY CONTENT
      // -----------------------------------
      const replyMatch = command.match(
        /reply(?: to)? this(?: email| message)?\s+(?:saying|with|that)\s+(.+)/i
      );

      if (replyMatch) {
        const replyBody = replyMatch[1].trim();

        fillCompose({
          to: recipient,
          subject: selectedEmail.subject?.startsWith("Re:")
            ? selectedEmail.subject
            : `Re: ${selectedEmail.subject || ""}`,
          body: replyBody,
          isReply: true,
          threadId: selectedEmail.threadId || "",
          messageId: selectedEmail.messageId || "",
        });

        addAiMessage(
          "assistant",
          `↩️ Reply prepared to ${recipient}. Please review it and click Send.`
        );

        return;
      }

      // -----------------------------------
      // AI GENERATES REPLY
      // -----------------------------------
      addAiMessage(
        "assistant",
        "🤖 I'm drafting a reply..."
      );

      const response = await fetch(
        `${API}/api/ai/reply`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            sender: selectedEmail.sender,
            subject: selectedEmail.subject,
            body:
              selectedEmail.body ||
              selectedEmail.snippet ||
              "",
          }),
        }
      );

      const data = await response.json();

      console.log(
        "🤖 AI GENERATED REPLY RESPONSE:",
        data
      );

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Failed to generate reply"
        );
      }

      const generatedReply =
        data.reply?.trim();

      if (!generatedReply) {
        throw new Error(
          "AI returned an empty reply"
        );
      }

      const replySubject =
        selectedEmail.subject?.startsWith("Re:")
          ? selectedEmail.subject
          : `Re: ${selectedEmail.subject || ""}`;

      fillCompose({
        to: recipient,
        subject: replySubject,
        body: generatedReply,
        isReply: true,
        threadId:
          selectedEmail.threadId || "",
        messageId:
          selectedEmail.messageId || "",
      });

      addAiMessage(
        "assistant",
        `✍️ I've drafted a reply to ${recipient} based on the email you're viewing. Please review it before sending.`
      );

      return;
    }

    // -----------------------------------
    // FORWARD EMAIL
    // -----------------------------------
    if (
      lower.includes("forward this email") ||
      lower.includes("forward this message") ||
      lower.startsWith("forward")
    ) {
      if (!selectedEmail) {
        addAiMessage(
          "assistant",
          "📩 Please open an email first, then ask me to forward it."
        );

        return;
      }

      const recipientMatch = command.match(
        /(?:to|for)\s+([A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,})/i
      );

      if (!recipientMatch) {
        addAiMessage(
          "assistant",
          "↗️ Sure! Tell me the recipient's email address."
        );

        return;
      }

      const recipient =
        recipientMatch[1];

      const originalBody =
        selectedEmail.body ||
        selectedEmail.snippet ||
        "";

      const forwardedBody =
        `---------- Forwarded message ----------\n` +
        `From: ${selectedEmail.sender || ""}\n` +
        `Subject: ${selectedEmail.subject || ""}\n\n` +
        `${originalBody}`;

      fillCompose({
        to: recipient,
        subject: `Fwd: ${
          selectedEmail.subject || ""
        }`,
        body: forwardedBody,
        isReply: false,
        threadId: "",
        messageId: "",
      });

      setPendingSend(true);

      addAiMessage(
        "assistant",
        `↗️ I've prepared this email to be forwarded to ${recipient}.

Please review the forwarded message.

Would you like me to send it? Reply "Yes" to send or "No" to cancel.`
      );

      return;
    }

    // -----------------------------------
    // COMPOSE EMAIL
    // -----------------------------------
    if (
      lower.includes("compose an email") ||
      lower.includes("compose email") ||
      lower.startsWith("compose")
    ) {
      const recipientMatch = command.match(
        /(?:to|for)\s+([A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,})/i
      );

      if (!recipientMatch) {
        addAiMessage(
          "assistant",
          "✉️ Sure! Tell me the recipient's email address."
        );

        return;
      }

      const recipient =
        recipientMatch[1];

      const subjectMatch = command.match(
        /subject\s*:\s*(.*?)(?=\s+(?:saying|with message|and say|and tell)\s+|$)/i
      );

      const bodyMatch = command.match(
        /(?:saying|with message|and say|and tell)\s+(.+)$/i
      );

      const subject = subjectMatch
        ? subjectMatch[1].trim()
        : "";

      const body = bodyMatch
        ? bodyMatch[1].trim()
        : "";

      fillCompose({
        to: recipient,
        subject,
        body,
        isReply: false,
        threadId: "",
        messageId: "",
      });

      setPendingSend(true);

      addAiMessage(
        "assistant",
        `✉️ I've prepared an email to ${recipient}.

Please review the message in the compose window.

Would you like me to send it? Reply "Yes" to send or "No" to cancel.`
      );

      return;
    }

    // -----------------------------------
    // MARK AS READ
    // -----------------------------------
    if (
      lower.includes("mark this email as read") ||
      lower.includes("mark this email read")
    ) {
      if (!selectedEmail) {
        addAiMessage(
          "assistant",
          "📩 Please open an email first, then ask me to mark it as read."
        );

        return;
      }

      addAiMessage(
        "assistant",
        "📖 Marking this email as read..."
      );

      const success =
        await markAsRead(
          selectedEmail.id
        );

      addAiMessage(
        "assistant",
        success
          ? "✅ Done! This email has been marked as read."
          : "❌ I couldn't mark the email as read."
      );

      return;
    }

    // -----------------------------------
    // MARK AS UNREAD
    // -----------------------------------
    if (
      lower.includes("mark this email as unread") ||
      lower.includes("mark this email unread")
    ) {
      if (!selectedEmail) {
        addAiMessage(
          "assistant",
          "📬 Please open an email first, then ask me to mark it as unread."
        );

        return;
      }

      addAiMessage(
        "assistant",
        "📬 Marking this email as unread..."
      );

      const success =
        await markAsUnread(
          selectedEmail.id
        );

      addAiMessage(
        "assistant",
        success
          ? "✅ Done! This email has been marked as unread."
          : "❌ I couldn't mark the email as unread."
      );

      return;
    }

    // -----------------------------------
    // DELETE EMAIL
    // -----------------------------------
    if (
      lower.includes("delete this email") ||
      lower.includes("delete this message") ||
      lower === "delete email" ||
      lower === "delete this"
    ) {
      if (!selectedEmail) {
        addAiMessage(
          "assistant",
          "📩 Please open an email first, then ask me to delete it."
        );

        return;
      }

      addAiMessage(
        "assistant",
        "🗑️ Deleting this email..."
      );

      const success =
        await deleteEmail(
          selectedEmail.id
        );

      if (success) {
        addAiMessage(
          "assistant",
          "✅ Email deleted successfully."
        );

        setSelectedEmail(null);
      } else {
        addAiMessage(
          "assistant",
          "❌ I couldn't delete this email."
        );
      }

      return;
    }

    // -----------------------------------
    // NATURAL LANGUAGE SEARCH
    // -----------------------------------
    const searchParts = [];
    const searchDescriptions = [];

    const daysMatch = lower.match(
      /\b(?:last|past|within)\s+(\d+)\s+days?\b/i
    );

    const days = daysMatch
      ? Number(daysMatch[1])
      : null;

    let filterText = lower;

    if (daysMatch) {
      filterText = filterText
        .replace(daysMatch[0], "")
        .trim();
    }

    filterText = filterText
      .replace(/\s+from\s*$/i, "")
      .trim();

    // -----------------------------------
    // DATE
    // -----------------------------------
    if (days && days > 0) {
      const today = new Date();

      const startDate = new Date(today);
      startDate.setHours(0, 0, 0, 0);

      // IMPORTANT:
      // Gmail after: is exclusive.
      // For "last N days", subtract N days.
      startDate.setDate(
        startDate.getDate() - days
      );

      const endDate = new Date(today);
      endDate.setHours(0, 0, 0, 0);
      endDate.setDate(
        endDate.getDate() + 1
      );

      const formatGmailDate = (date) => {
        return `${date.getFullYear()}/${String(
          date.getMonth() + 1
        ).padStart(2, "0")}/${String(
          date.getDate()
        ).padStart(2, "0")}`;
      };

      const startDateString =
        formatGmailDate(startDate);

      const endDateString =
        formatGmailDate(endDate);

      searchParts.push(
        `after:${startDateString}`,
        `before:${endDateString}`
      );

      searchDescriptions.push(
        `emails from the last ${days} day${
          days === 1 ? "" : "s"
        }`
      );

      console.log(
        "DATE FILTER:",
        {
          days,
          startDate: startDateString,
          endDate: endDateString,
        }
      );
    }

    // -----------------------------------
    // READ / UNREAD
    // -----------------------------------
    const wantsUnread =
      /\bunread\s+(?:emails?|messages?)\b/i.test(
        filterText
      );

    const wantsRead =
      !wantsUnread &&
      /\bread\s+(?:emails?|messages?)\b/i.test(
        filterText
      );

    if (wantsUnread) {
      searchParts.push("is:unread");

      searchDescriptions.push(
        "unread emails"
      );
    }

    if (wantsRead) {
      searchParts.push("is:read");

      searchDescriptions.push(
        "read emails"
      );
    }

    // -----------------------------------
    // SENDER + KEYWORD
    // -----------------------------------
    const senderMatch = filterText.match(
      /\b(?:find|show|search)\s+(?:me\s+)?(?:emails?|messages?)\s+from\s+(.+?)(?:\s+about\s+(.+))?$/i
    );

    if (senderMatch) {
      let senderName =
        senderMatch[1].trim();

      const keyword =
        senderMatch[2]?.trim();

      senderName = senderName
        .replace(/\s+from\s*$/i, "")
        .trim();

      if (senderName) {
        searchParts.push(
          `from:"${senderName}"`
        );

        searchDescriptions.push(
          `emails from ${senderName}`
        );
      }

      if (keyword) {
        searchParts.push(
          `"${keyword}"`
        );

        searchDescriptions.push(
          `about ${keyword}`
        );
      }
    }

    // -----------------------------------
    // KEYWORD WITHOUT SENDER
    // -----------------------------------
    if (!senderMatch) {
      const aboutMatch =
        filterText.match(
          /\babout\s+(.+)$/i
        );

      if (aboutMatch) {
        const keyword =
          aboutMatch[1].trim();

        if (keyword) {
          searchParts.push(
            `"${keyword}"`
          );

          searchDescriptions.push(
            `about ${keyword}`
          );
        }
      }
    }

    // -----------------------------------
    // PROJECT EMAILS
    // -----------------------------------
    if (
      /\b(?:show|find|search)\s+project\s+emails?\b/i.test(
        filterText
      )
    ) {
      searchParts.push("project");

      searchDescriptions.push(
        "about project"
      );
    }

    const searchQuery =
      searchParts.join(" ");

    const searchDescription =
      searchDescriptions.length
        ? searchDescriptions.join(" and ")
        : "";

    console.log(
      "================================="
    );

    console.log(
      "🔎 AI SEARCH COMMAND:",
      command
    );

    console.log(
      "🔎 Filter text:",
      filterText
    );

    console.log(
      "🔎 Days:",
      days
    );

    console.log(
      "🔎 Search parts:",
      searchParts
    );

    console.log(
      "🔎 FINAL GMAIL QUERY:",
      searchQuery
    );

    console.log(
      "================================="
    );

    // -----------------------------------
    // EXECUTE SEARCH
    // -----------------------------------
    if (searchQuery) {
      addAiMessage(
        "assistant",
        `🔎 Searching for ${searchDescription}...`
      );

      const results =
        await searchEmails(
          searchQuery
        );

      addAiMessage(
        "assistant",
        results.length
          ? `I found ${results.length} matching email${
              results.length === 1
                ? ""
                : "s"
            }.`
          : `I couldn't find any ${searchDescription}.`
      );

      return;
    }

    // -----------------------------------
    // GEMINI FALLBACK
    // -----------------------------------
    const response = await fetch(
      `${API}/api/ai`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          message: command,
        }),
      }
    );

    const data = await response.json();

    console.log(
      "🤖 GEMINI RESPONSE:",
      data
    );

    if (!response.ok) {
      addAiMessage(
        "assistant",
        data.error ||
          "AI request failed."
      );

      return;
    }

    // -----------------------------------
    // GEMINI FUNCTION CALL
    // -----------------------------------
    if (data.type === "function_call") {
      const {
        name,
        arguments: args,
      } = data;

      console.log(
        "AI function:",
        name
      );

      console.log(
        "AI arguments:",
        args
      );

      // --------------------------------
      // FILL COMPOSE
      // --------------------------------
      if (name === "fillCompose") {
        fillCompose({
          to: args?.to || "",
          subject:
            args?.subject || "",
          body: args?.body || "",
          isReply: false,
          threadId: "",
          messageId: "",
        });

        setPendingSend(true);

        addAiMessage(
          "assistant",
          `✉️ I've prepared the email for ${
            args?.to ||
            "the recipient"
          }.

Please review it in the compose window.

Would you like me to send it? Reply "Yes" to send or "No" to cancel.`
        );

        return;
      }

      // --------------------------------
      // OPEN EMAIL
      // --------------------------------
      if (name === "openEmail") {
        if (args?.emailId) {
          const email = emails.find(
            (email) =>
              email.id ===
              args.emailId
          );

          if (email) {
            await openEmail(email);

            addAiMessage(
              "assistant",
              `Opening "${
                email.subject ||
                "(No subject)"
              }".`
            );
          } else {
            addAiMessage(
              "assistant",
              "I couldn't find that email."
            );
          }
        }

        return;
      }

      // --------------------------------
      // SEARCH EMAILS
      // --------------------------------
      if (name === "searchEmails") {
        if (args?.query) {
          const results =
            await searchEmails(
              args.query
            );

          addAiMessage(
            "assistant",
            results.length
              ? `I found ${results.length} matching email${
                  results.length === 1
                    ? ""
                    : "s"
                }.`
              : "I couldn't find any matching emails."
          );
        }

        return;
      }

      // --------------------------------
      // DELETE
      // --------------------------------
      if (name === "deleteEmail") {
        if (!selectedEmail) {
          addAiMessage(
            "assistant",
            "Please open an email first, then ask me to delete it."
          );

          return;
        }

        await deleteEmail(
          selectedEmail.id
        );

        return;
      }

      // --------------------------------
      // MARK READ
      // --------------------------------
      if (name === "markAsRead") {
        if (!selectedEmail) {
          addAiMessage(
            "assistant",
            "Please open an email first."
          );

          return;
        }

        const success =
          await markAsRead(
            selectedEmail.id
          );

        addAiMessage(
          "assistant",
          success
            ? "✅ Done! This email has been marked as read."
            : "❌ I couldn't mark the email as read."
        );

        return;
      }

      // --------------------------------
      // MARK UNREAD
      // --------------------------------
      if (name === "markAsUnread") {
        if (!selectedEmail) {
          addAiMessage(
            "assistant",
            "Please open an email first."
          );

          return;
        }

        const success =
          await markAsUnread(
            selectedEmail.id
          );

        addAiMessage(
          "assistant",
          success
            ? "✅ Done! This email has been marked as unread."
            : "❌ I couldn't mark the email as unread."
        );

        return;
      }
    }

    // -----------------------------------
    // NORMAL AI RESPONSE
    // -----------------------------------
    if (data.reply) {
      addAiMessage(
        "assistant",
        data.reply
      );
    } else {
      addAiMessage(
        "assistant",
        "I understood your request, but I couldn't determine the action."
      );
    }

  } catch (error) {
    console.error(
      "AI command error:",
      error
    );

    addAiMessage(
      "assistant",
      `❌ Something went wrong: ${
        error.message
      }`
    );

  } finally {
    setAiLoading(false);
  }
};
  // --------------------------------
  // EXTRACT EMAIL FROM COMMAND
  // --------------------------------
const extractRecipient = (text) => {
  const emailMatch = text.match(
    /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i
  );

  if (emailMatch) {
    return emailMatch[0];
  }

  return "";
};

  

  // Login screen
if (!loading && !authenticated) {
  return (
    <div className="login-screen">
      <div className="login-card">

        <div className="login-brand">
          <div className="mail-logo">✉</div>
          <div>
            <h1>MailPilot AI</h1>
            <span>AI-powered email workspace</span>
          </div>
        </div>

        <div className="login-divider"></div>

        <div className="login-content">
          <h2>Manage your inbox with AI.</h2>

          <p>
            Connect your Gmail account and control your email
            using simple natural-language commands.
          </p>

          <div className="login-features">
            <div>
              <span>✦</span>
              <p>Search emails with natural language</p>
            </div>

            <div>
              <span>✦</span>
              <p>Compose and reply with AI assistance</p>
            </div>

            <div>
              <span>✦</span>
              <p>Stay in sync with your Gmail inbox</p>
            </div>
          </div>

          <a
            href={`${API}/auth/google`}
            className="google-button"
          >
            <span className="google-icon">G</span>
            <span>Continue with Google</span>
          </a>

          <div className="login-security">
            <span>🔒</span>
            Secure connection with Google OAuth 2.0
          </div>
        </div>

      </div>
    </div>
  );
}

  return (
    <div className="mail-app">

      {/* SIDEBAR */}
      <aside className="sidebar">

        <div className="brand">
          <div className="brand-icon">✉</div>
          <span>Nebula Mail</span>
        </div>

        <button
          className="compose-button"
          onClick={openCompose}
        >
          ＋ Compose
        </button>

        <nav>

          <button
            className={
              view === "inbox"
                ? "nav-item active"
                : "nav-item"
            }
           onClick={() => {
  setView("inbox");
  setSearchActive(false);
  setSelectedEmail(null);
  loadInbox();
}}
          >
            <span>📥</span>
            Inbox
            <b>{inboxCount}</b>
          </button>

          <button
            className={
              view === "sent"
                ? "nav-item active"
                : "nav-item"
            }
           onClick={() => {
  setView("sent");
  setSearchActive(false);
  setSelectedEmail(null);
  loadSent();
}}
          >
            <span>📤</span>
            Sent
          </button>

        </nav>

        {/* AI CARD */}
        <div className="ai-card">

          <div className="ai-title">
            <span>🤖</span>
            AI Assistant
          </div>

          <p>
            Control your mailbox using natural language.
          </p>

          <button
            className="ai-example"
            onClick={() =>
              setAiInput("Open latest email")
            }
          >
            "Open latest email"
          </button>

          <button
            className="ai-example"
            onClick={() =>
              setAiInput("Compose an email to test@example.com")
            }
          >
            "Compose an email"
          </button>

          <button
            className="ai-example"
            onClick={() =>
              setAiInput("Reply to this")
            }
          >
            "Reply to this"
          </button>

        </div>

      </aside>

      {/* MAIN CONTENT */}
      <main className="main-content">

        <header className="topbar">

          <div>
            <h2>
              {view === "inbox" ? "Inbox" : "Sent"}
            </h2>

            <p>
              {emails.length} messages
            </p>
          </div>

          <div className="top-actions">
<div className="sync-status">
  <span className="sync-dot"></span>

  <div>
    <strong>Live sync</strong>

    {lastSynced && (
      <small>
        Synced {formatSyncTime(lastSynced)}
      </small>
    )}
  </div>
</div>
            <button
  className="refresh-button"
  onClick={() => {
    if (searchActive) {
      setSearchActive(false);
      setSelectedEmail(null);
      setView("inbox");
      loadInbox();
      return;
    }

    if (view === "sent") {
      loadSent();
    } else {
      loadInbox();
    }
  }}
>
  {searchActive ? "← Inbox" : "↻ Refresh"}
</button>

            <button
              className="ai-toggle"
              onClick={() => setAiOpen(!aiOpen)}
            >
              🤖 AI
            </button>

            <div className="avatar">
              T
            </div>

          </div>

        </header>
        <div className="filter-bar">
  <input
    type="text"
    placeholder="Sender"
    value={filterSender}
    onChange={(e) => setFilterSender(e.target.value)}
  />

  <input
    type="text"
    placeholder="Keyword"
    value={filterKeyword}
    onChange={(e) => setFilterKeyword(e.target.value)}
  />

  <select
    value={filterDays}
    onChange={(e) => setFilterDays(e.target.value)}
  >
    <option value="">Any date</option>
    <option value="1">Last 1 day</option>
    <option value="3">Last 3 days</option>
    <option value="7">Last 7 days</option>
    <option value="10">Last 10 days</option>
    <option value="30">Last 30 days</option>
  </select>

  <select
    value={filterRead}
    onChange={(e) => setFilterRead(e.target.value)}
  >
    <option value="all">All emails</option>
    <option value="read">Read</option>
    <option value="unread">Unread</option>
  </select>

  <button
    className="filter-apply"
    onClick={applyFilters}
  >
    🔎 Filter
  </button>

  <button
    className="filter-clear"
    onClick={clearFilters}
  >
    Clear
  </button>
</div>

        {/* EMAIL LIST */}
        <section className="email-list">

          {loading ? (
            <div className="loading">
              Loading your emails...
            </div>
          ) : emails.length === 0 ? (
            <div className="empty">
              <div>📭</div>
              <h3>No emails</h3>
              <p>Your inbox is empty.</p>
            </div>
          ) : (
            emails.map((email) => (
              <button
                key={email.id}
                className={`email-row ${
                  email.isRead ? "" : "unread"
                }`}
                onClick={() => openEmail(email)}
              >

                <div className="sender">
  {!email.isRead && (
    <span className="unread-dot"></span>
  )}

  {view === "sent"
    ? `To: ${email.recipient || "Unknown"}`
    : email.sender || "Unknown sender"}
</div>
                <div className="email-middle">

                  <strong>
                    {email.subject || "(No subject)"}
                  </strong>

                  <span>
                    {" — "}
                    {email.snippet}
                  </span>

                </div>

                <div className="email-date">
                  {formatDate(email.date)}
                </div>

              </button>
            ))
          )}

        </section>

      </main>

      {/* AI ASSISTANT PANEL */}
      {aiOpen && (
        <aside className="ai-panel">

          <div className="ai-panel-header">

            <div>
              <strong>🤖 Nebula AI</strong>
              <span>Mail Assistant</span>
            </div>

            <button
              onClick={() => setAiOpen(false)}
            >
              ×
            </button>

          </div>

          <div className="ai-messages">

            {aiMessages.map((message, index) => (
              <div
                key={index}
                className={
                  message.role === "user"
                    ? "ai-message user"
                    : "ai-message assistant"
                }
              >
                {message.text}
              </div>
            ))}

            {aiLoading && (
              <div className="ai-message assistant">
                Thinking...
              </div>
            )}
            {pendingSend && (
  <div className="ai-confirmation">
    <div className="ai-confirmation-title">
      ✋ Confirmation required
    </div>

    <div className="ai-confirmation-text">
      Review the email and confirm before sending.
    </div>

    <div className="ai-confirmation-actions">
      <button
        className="confirm-send-button"
        onClick={async () => {
          setPendingSend(false);
          addAiMessage(
            "user",
            "Yes, send it."
          );

          addAiMessage(
            "assistant",
            "✈️ Sending the email..."
          );

          await sendEmail();
        }}
      >
        ✓ Send
      </button>

      <button
        className="cancel-send-button"
        onClick={() => {
          setPendingSend(false);
          closeCompose();

          addAiMessage(
            "user",
            "No, cancel it."
          );

          addAiMessage(
            "assistant",
            "❌ Okay, I won't send it."
          );
        }}
      >
        Cancel
      </button>
    </div>
  </div>
)}

          </div>

          <div className="ai-input-area">

            <textarea
              value={aiInput}
              onChange={(e) =>
                setAiInput(e.target.value)
              }
              onKeyDown={(e) => {
                if (
                  e.key === "Enter" &&
                  !e.shiftKey
                ) {
                  e.preventDefault();
                  handleAiCommand();
                }
              }}
              placeholder="Ask me to control your mail..."
            />

            <button
              onClick={handleAiCommand}
              disabled={aiLoading}
            >
              Send
            </button>

          </div>

        </aside>
      )}

      {/* EMAIL DETAIL */}
      {selectedEmail && (
        <div className="email-reading-panel">

          <div className="email-detail">

            <div className="detail-header">

              <button
                className="back-button"
                onClick={closeEmail}
              >
                ←
              </button>

              <div>
                <h2>
                  {selectedEmail.subject ||
                    "(No subject)"}
                </h2>

                <p>
                  {selectedEmail.sender}
                </p>
              </div>

            </div>

            <div className="detail-meta">

              <span>
                From: {selectedEmail.sender}
              </span>

              <span>
                To: {selectedEmail.recipient}
              </span>

              <span>
                {formatDate(selectedEmail.date)}
              </span>

            </div>

            <div className="detail-body">

  <p>
    {selectedEmail.body || selectedEmail.snippet}
  </p>
<div className="reply-area">

  <button
    className="reply-button"
    onClick={() => {
      fillCompose({
  to: extractEmail(selectedEmail.sender),
  subject: `Re: ${selectedEmail.subject || ""}`,
  body: "",
  isReply: true,
  threadId: selectedEmail.threadId || "",
  messageId: selectedEmail.messageId || "",
});
    }}
  >
    ↩ Reply
  </button>

  {selectedEmail.isRead ? (
    <button
      className="reply-button"
      onClick={() =>
        markAsUnread(selectedEmail.id)
      }
    >
      📩 Mark as Unread
    </button>
  ) : (
    <button
      className="reply-button"
      onClick={() =>
        markAsRead(selectedEmail.id)
      }
    >
      ✓ Mark as Read
    </button>
  )}

</div>
            </div>

          </div>

        </div>
      )}

      {/* COMPOSE */}
      {composeOpen && (
        <div className="compose-window">
<div className="compose-header">

  <span>
    {compose.isReply
      ? "Reply"
      : "New Message"}
  </span>

  <button
    onClick={closeCompose}
  >
    ×
  </button>

</div>

{compose.isReply && (
  <div className="ai-draft-badge">
    🤖 AI-generated draft — review before sending
  </div>
)}
          

          <div className="compose-body">

            <input
              type="email"
              name="to"
              placeholder="To"
              value={compose.to}
              onChange={handleComposeChange}
            />

            <input
              type="text"
              name="subject"
              placeholder="Subject"
              value={compose.subject}
              onChange={handleComposeChange}
            />

            <textarea
              name="body"
              placeholder="Write your message..."
              value={compose.body}
              onChange={handleComposeChange}
            />

          </div>

          <div className="compose-footer">

            <button
              className="send-button"
              onClick={sendEmail}
            >
              Send ✈
            </button>

          </div>

        </div>
      )}

    </div>
  );
}

function formatDate(dateString) {
  if (!dateString) return "";

  const date = new Date(dateString);

  if (isNaN(date.getTime())) {
    return dateString;
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
  });
}
function formatSyncTime(date) {
  return date.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}
function extractEmail(sender) {
  if (!sender) return "";

  const match = sender.match(/<([^>]+)>/);

  return match ? match[1] : sender;
}

export default App;