import { useState, useEffect } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import {
    getInboxMessages,
    getInboxSenders,
    getInboxThread,
    getInboxMessage,
    sendInboxEmail,
    replyInboxEmail,
    markInboxRead,
    toggleInboxStar,
    deleteInboxMessage,
    syncInbox,
} from "../../api/inbox";
import { getEmailSenders } from "../../api/emailSenders";
import {
    FiInbox,
    FiStar,
    FiSend,
    FiAlertOctagon,
    FiTrash2,
    FiRefreshCw,
    FiPlus,
    FiSearch,
    FiCornerUpLeft,
    FiUser,
    FiMail,
    FiCheckCircle,
    FiChevronDown,
} from "react-icons/fi";
import "./inbox.css";

function Inbox() {
    const [senders, setSenders] = useState([]);
    const [selectedSenderId, setSelectedSenderId] = useState("");
    const [senderDropdownOpen, setSenderDropdownOpen] = useState(false);
    const [senderSearch, setSenderSearch] = useState("");
    const [folder, setFolder] = useState("inbox");
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);
    const [search, setSearch] = useState("");

    // Message selection & thread
    const [selectedMessage, setSelectedMessage] = useState(null);
    const [threadMessages, setThreadMessages] = useState([]);
    const [replyContent, setReplyContent] = useState("");
    const [sendingReply, setSendingReply] = useState(false);

    // Compose Modal
    const [showCompose, setShowCompose] = useState(false);
    const [composeData, setComposeData] = useState({
        email_sender_id: "",
        to_email: "",
        subject: "",
        body_html: "",
    });
    const [sendingNew, setSendingNew] = useState(false);
    const [alertMsg, setAlertMsg] = useState(null);

    useEffect(() => {
        loadSenders();
    }, []);

    useEffect(() => {
        loadMessages();
    }, [selectedSenderId, folder, search]);

    const loadSenders = async () => {
        try {
            const res = await getInboxSenders();
            let list = [];
            if (res.data?.success) {
                list = Array.isArray(res.data.data) ? res.data.data : (res.data.data?.data || []);
            }
            if (list.length === 0) {
                const fallbackRes = await getEmailSenders();
                if (fallbackRes.data?.success) {
                    list = fallbackRes.data.data?.data || fallbackRes.data.data || [];
                }
            }
            setSenders(list);
        } catch (err) {
            console.error("Error loading senders:", err);
            try {
                const fallbackRes = await getEmailSenders();
                if (fallbackRes.data?.success) {
                    const list = fallbackRes.data.data?.data || fallbackRes.data.data || [];
                    setSenders(list);
                }
            } catch (e) {
                console.error("Fallback error:", e);
            }
        }
    };

    const loadMessages = async (targetSenderId = selectedSenderId, targetFolder = folder, targetSearch = search) => {
        setLoading(true);
        try {
            const res = await getInboxMessages({
                email_sender_id: targetSenderId,
                folder: targetFolder,
                search: targetSearch,
            });
            if (res.data?.success) {
                const list = res.data.data?.data || [];
                setMessages(list);
                if (list.length > 0) {
                    selectMessage(list[0]);
                } else {
                    setSelectedMessage(null);
                    setThreadMessages([]);
                }
            }
        } catch (err) {
            console.error("Error loading messages:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleSync = async () => {
        setSyncing(true);
        try {
            const res = await syncInbox(selectedSenderId);
            if (res.data?.success) {
                setAlertMsg({ type: "success", text: res.data.message });
                loadSenders();
                loadMessages();
            }
        } catch (err) {
            setAlertMsg({ type: "danger", text: "Failed to sync inbox." });
        } finally {
            setSyncing(false);
        }
    };

    const selectMessage = async (msg) => {
        setSelectedMessage(msg);
        markInboxRead(msg.id, true);

        // Update read status in local state
        setMessages((prev) =>
            prev.map((m) => (m.id === msg.id ? { ...m, is_read: true } : m))
        );

        // Load full thread if thread_id exists
        if (msg.thread_id) {
            try {
                const res = await getInboxThread(msg.thread_id);
                if (res.data?.success) {
                    setThreadMessages(res.data.data || [msg]);
                } else {
                    setThreadMessages([msg]);
                }
            } catch (err) {
                setThreadMessages([msg]);
            }
        } else {
            setThreadMessages([msg]);
        }
    };

    const handleToggleStar = async (e, msg) => {
        e.stopPropagation();
        try {
            const res = await toggleInboxStar(msg.id);
            const newStarred = res.data?.data?.is_starred ?? !msg.is_starred;
            setMessages((prev) => {
                if (folder === "starred" && !newStarred) {
                    return prev.filter((m) => m.id !== msg.id);
                }
                return prev.map((m) =>
                    m.id === msg.id ? { ...m, is_starred: newStarred } : m
                );
            });
            if (selectedMessage?.id === msg.id) {
                setSelectedMessage((prev) => (prev ? { ...prev, is_starred: newStarred } : null));
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleDelete = async (e, msg) => {
        e.stopPropagation();
        try {
            await deleteInboxMessage(msg.id);
            setMessages((prev) => prev.filter((m) => m.id !== msg.id));
            if (selectedMessage?.id === msg.id) {
                setSelectedMessage(null);
                setThreadMessages([]);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleSendReply = async (e) => {
        e.preventDefault();
        if (!replyContent.trim() || !selectedMessage) return;

        setSendingReply(true);
        try {
            const res = await replyInboxEmail(selectedMessage.id, {
                body_html: replyContent,
            });
            if (res.data?.success) {
                setReplyContent("");
                setAlertMsg({ type: "success", text: "Reply sent successfully!" });
                selectMessage(selectedMessage);
            }
        } catch (err) {
            setAlertMsg({
                type: "danger",
                text: err.response?.data?.message || "Failed to send reply.",
            });
        } finally {
            setSendingReply(false);
        }
    };

    const handleSendNew = async (e) => {
        e.preventDefault();
        setSendingNew(true);
        try {
            const res = await sendInboxEmail(composeData);
            if (res.data?.success) {
                const sentMsg = res.data.data;
                setShowCompose(false);
                const targetSenderId = sentMsg?.email_sender_id ? String(sentMsg.email_sender_id) : selectedSenderId;
                setSelectedSenderId(targetSenderId);
                setFolder("sent");
                setComposeData({
                    email_sender_id: "",
                    to_email: "",
                    subject: "",
                    body_html: "",
                });
                setAlertMsg({ type: "success", text: "Email sent successfully!" });
                loadMessages(targetSenderId, "sent");
            }
        } catch (err) {
            setAlertMsg({
                type: "danger",
                text: err.response?.data?.message || "Failed to send email.",
            });
        } finally {
            setSendingNew(false);
        }
    };

    return (
        <DashboardLayout>
            <div className="container-fluid p-0 inbox-container">
                {/* Header bar */}
                <div className="d-flex align-items-center justify-content-between">
                    <div>
                        <h4 className="fw-bold text-dark mb-1">Unified Inbox</h4>
                        <p className="text-muted small mb-0">
                            Manage all lead communications across all sender email accounts in one place
                        </p>
                    </div>
                    <div className="d-flex align-items-center gap-2">
                        <button
                            className="btn btn-outline-primary d-flex align-items-center gap-2 font-weight-bold"
                            onClick={handleSync}
                            disabled={syncing}
                            title={
                                selectedSenderId
                                    ? `Sync emails for ${senders.find((s) => String(s.id) === String(selectedSenderId))?.email || "selected account"}`
                                    : "Sync active mailboxes"
                            }
                        >
                            <FiRefreshCw className={syncing ? "spin" : ""} />
                            <span>
                                {syncing
                                    ? "Syncing..."
                                    : selectedSenderId
                                    ? `Sync ${senders.find((s) => String(s.id) === String(selectedSenderId))?.email || "Selected Account"}`
                                    : "Sync Mailbox"}
                            </span>
                        </button>
                    </div>
                </div>

                {alertMsg && (
                    <div className={`alert alert-${alertMsg.type} alert-dismissible fade show`} role="alert">
                        {alertMsg.text}
                        <button type="button" className="btn-close" onClick={() => setAlertMsg(null)}></button>
                    </div>
                )}

                {/* 3-Column Unified Inbox Layout */}
                <div className="inbox-layout">
                    {/* Left Column: Senders & Folders Nav */}
                    <div className="inbox-sidebar">
                        <button
                            className="inbox-compose-btn"
                            onClick={() => {
                                setComposeData({
                                    email_sender_id: senders[0]?.id || "",
                                    to_email: "",
                                    subject: "",
                                    body_html: "",
                                });
                                setShowCompose(true);
                            }}
                        >
                            <FiPlus />
                            <span>Compose Email</span>
                        </button>

                        <div>
                            <div className="inbox-section-title">Sender Account</div>
                            <div className="searchable-sender-select">
                                <button
                                    type="button"
                                    className="sender-select-btn"
                                    onClick={() => setSenderDropdownOpen(!senderDropdownOpen)}
                                >
                                    <span>
                                        {selectedSenderId
                                            ? senders.find((s) => String(s.id) === String(selectedSenderId))?.email || "Selected Sender"
                                            : "All Sender Accounts"}
                                    </span>
                                    <FiChevronDown />
                                </button>

                                {senderDropdownOpen && (
                                    <div className="sender-dropdown-menu">
                                        <div className="sender-search-box">
                                            <FiSearch />
                                            <input
                                                type="text"
                                                placeholder="Search senders..."
                                                value={senderSearch}
                                                onChange={(e) => setSenderSearch(e.target.value)}
                                                autoFocus
                                            />
                                        </div>
                                        <div className="sender-options-list">
                                            <div
                                                className={`sender-option-item ${selectedSenderId === "" ? "selected" : ""}`}
                                                onClick={() => {
                                                    setSelectedSenderId("");
                                                    setSenderDropdownOpen(false);
                                                    setSenderSearch("");
                                                    loadMessages("", folder);
                                                }}
                                            >
                                                All Sender Accounts
                                            </div>
                                            {senders
                                                .filter((s) => (s.email || "").toLowerCase().includes(senderSearch.toLowerCase()))
                                                .map((s) => (
                                                    <div
                                                        key={s.id}
                                                        className={`sender-option-item ${String(selectedSenderId) === String(s.id) ? "selected" : ""}`}
                                                        onClick={() => {
                                                            setSelectedSenderId(String(s.id));
                                                            setSenderDropdownOpen(false);
                                                            setSenderSearch("");
                                                            loadMessages(String(s.id), folder);
                                                        }}
                                                    >
                                                        {s.email}
                                                    </div>
                                                ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div>
                            <div className="inbox-section-title">Folders</div>
                            <nav className="inbox-nav">
                                <button
                                    className={`inbox-nav-item ${folder === "inbox" ? "active" : ""}`}
                                    onClick={() => setFolder("inbox")}
                                >
                                    <div className="inbox-nav-icon-label">
                                        <FiInbox />
                                        <span>Inbox</span>
                                    </div>
                                </button>
                                <button
                                    className={`inbox-nav-item ${folder === "starred" ? "active" : ""}`}
                                    onClick={() => setFolder("starred")}
                                >
                                    <div className="inbox-nav-icon-label">
                                        <FiStar />
                                        <span>Starred</span>
                                    </div>
                                </button>
                                <button
                                    className={`inbox-nav-item ${folder === "sent" ? "active" : ""}`}
                                    onClick={() => setFolder("sent")}
                                >
                                    <div className="inbox-nav-icon-label">
                                        <FiSend />
                                        <span>Sent</span>
                                    </div>
                                </button>
                                <button
                                    className={`inbox-nav-item ${folder === "bounce" ? "active" : ""}`}
                                    onClick={() => setFolder("bounce")}
                                >
                                    <div className="inbox-nav-icon-label">
                                        <FiAlertOctagon className="text-danger" />
                                        <span>Bounces</span>
                                    </div>
                                </button>
                                <button
                                    className={`inbox-nav-item ${folder === "trash" ? "active" : ""}`}
                                    onClick={() => setFolder("trash")}
                                >
                                    <div className="inbox-nav-icon-label">
                                        <FiTrash2 />
                                        <span>Trash</span>
                                    </div>
                                </button>
                            </nav>
                        </div>
                    </div>

                    {/* Middle Column: Email Messages List */}
                    <div className="inbox-list">
                        <div className="inbox-list-header">
                            <div className="inbox-search-wrapper">
                                <FiSearch className="inbox-search-icon" />
                                <input
                                    type="text"
                                    className="form-control inbox-search-input"
                                    placeholder="Search messages..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="inbox-items">
                            {loading ? (
                                <div className="p-4 text-center text-muted">Loading messages...</div>
                            ) : messages.length === 0 ? (
                                <div className="p-4 text-center text-muted">No messages found</div>
                            ) : (
                                messages.map((msg) => (
                                    <div
                                        key={msg.id}
                                        className={`inbox-item ${!msg.is_read ? "unread" : ""} ${selectedMessage?.id === msg.id ? "active" : ""}`}
                                        onClick={() => selectMessage(msg)}
                                    >
                                        <div className="inbox-item-header">
                                            <span className="inbox-item-sender">
                                                {msg.from_name || msg.from_email}
                                            </span>
                                            <div className="d-flex align-items-center gap-1">
                                                <span className="inbox-item-time">
                                                    {new Date(msg.received_at || msg.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                                                </span>
                                                <button
                                                    type="button"
                                                    className="btn btn-link p-0 text-decoration-none border-0 ms-1"
                                                    onClick={(e) => handleToggleStar(e, msg)}
                                                    title={msg.is_starred ? "Unstar" : "Star"}
                                                >
                                                    <FiStar style={{ color: msg.is_starred ? "#f59e0b" : "#cbd5e1", fill: msg.is_starred ? "#f59e0b" : "none" }} />
                                                </button>
                                            </div>
                                        </div>
                                        <div className="inbox-item-subject">{msg.subject}</div>
                                        <div className="inbox-item-snippet">{msg.snippet}</div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Right Column: Message Detail & Thread Reader */}
                    <div className="inbox-reader">
                        {!selectedMessage ? (
                            <div className="inbox-reader-empty">
                                <FiMail size={48} />
                                <h5>Select a message to read</h5>
                            </div>
                        ) : (
                            <>
                                <div className="inbox-reader-header">
                                    <div>
                                        <div className="inbox-reader-subject">{selectedMessage.subject}</div>
                                        <div className="inbox-reader-meta">
                                            <span><strong>From:</strong> {selectedMessage.from_name ? `${selectedMessage.from_name} <${selectedMessage.from_email}>` : selectedMessage.from_email}</span>
                                            <span><strong>To:</strong> {selectedMessage.to_name ? `${selectedMessage.to_name} <${selectedMessage.to_email}>` : selectedMessage.to_email}</span>
                                            <span><strong>Date:</strong> {new Date(selectedMessage.received_at || selectedMessage.created_at).toLocaleString()}</span>
                                        </div>
                                    </div>
                                    <div className="d-flex align-items-center gap-2">
                                        <button
                                            className={`btn btn-sm ${selectedMessage.is_starred ? "btn-warning text-white" : "btn-outline-secondary"}`}
                                            onClick={(e) => handleToggleStar(e, selectedMessage)}
                                            title={selectedMessage.is_starred ? "Unstar" : "Star"}
                                        >
                                            <FiStar style={{ fill: selectedMessage.is_starred ? "#ffffff" : "none" }} />
                                        </button>
                                        <button
                                            className="btn btn-sm btn-outline-danger"
                                            onClick={(e) => handleDelete(e, selectedMessage)}
                                        >
                                            <FiTrash2 />
                                        </button>
                                    </div>
                                </div>

                                <div className="inbox-reader-body">
                                    {threadMessages.map((tMsg, idx) => (
                                        <div key={tMsg.id} className="mb-4 pb-3 border-bottom">
                                            <div className="d-flex justify-content-between mb-2 text-muted small">
                                                <span><strong>{tMsg.from_name || tMsg.from_email}</strong></span>
                                                <span>{new Date(tMsg.received_at || tMsg.created_at).toLocaleString()}</span>
                                            </div>
                                            {tMsg.body_html ? (
                                                <div dangerouslySetInnerHTML={{ __html: tMsg.body_html }} />
                                            ) : (
                                                <div style={{ whiteSpace: "pre-wrap" }}>{tMsg.body_text}</div>
                                            )}
                                        </div>
                                    ))}
                                </div>

                                {/* Reply Box */}
                                <form className="inbox-reply-box" onSubmit={handleSendReply}>
                                    <div className="d-flex align-items-center gap-2 text-muted small font-weight-bold">
                                        <FiCornerUpLeft />
                                        <span>Reply to {selectedMessage.from_email}</span>
                                    </div>
                                    <textarea
                                        className="form-control"
                                        rows={3}
                                        placeholder="Write your response here..."
                                        value={replyContent}
                                        onChange={(e) => setReplyContent(e.target.value)}
                                        required
                                    />
                                    <div className="d-flex justify-content-end">
                                        <button
                                            type="submit"
                                            className="btn btn-primary d-flex align-items-center gap-2"
                                            disabled={sendingReply}
                                        >
                                            <FiSend />
                                            <span>{sendingReply ? "Sending..." : "Send Reply"}</span>
                                        </button>
                                    </div>
                                </form>
                            </>
                        )}
                    </div>
                </div>

                {/* Compose Modal */}
                {showCompose && (
                    <div className="modal fade show d-block" tabIndex="-1" style={{ background: "rgba(0,0,0,0.5)" }}>
                        <div className="modal-dialog modal-lg">
                            <div className="modal-content">
                                <div className="modal-header">
                                    <h5 className="modal-title">Compose Email</h5>
                                    <button type="button" className="btn-close" onClick={() => setShowCompose(false)}></button>
                                </div>
                                <form onSubmit={handleSendNew}>
                                    <div className="modal-body">
                                        <div className="mb-3">
                                            <label className="form-label font-weight-bold">From Sender Account</label>
                                            <select
                                                className="form-select"
                                                value={composeData.email_sender_id}
                                                onChange={(e) => setComposeData({ ...composeData, email_sender_id: e.target.value })}
                                                required
                                            >
                                                {senders.map((s) => (
                                                    <option key={s.id} value={s.id}>
                                                        {s.email}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="mb-3">
                                            <label className="form-label font-weight-bold">To Email</label>
                                            <input
                                                type="email"
                                                className="form-control"
                                                placeholder="recipient@example.com"
                                                value={composeData.to_email}
                                                onChange={(e) => setComposeData({ ...composeData, to_email: e.target.value })}
                                                required
                                            />
                                        </div>

                                        <div className="mb-3">
                                            <label className="form-label font-weight-bold">Subject</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                placeholder="Subject line..."
                                                value={composeData.subject}
                                                onChange={(e) => setComposeData({ ...composeData, subject: e.target.value })}
                                                required
                                            />
                                        </div>

                                        <div className="mb-3">
                                            <label className="form-label font-weight-bold">Message Content</label>
                                            <textarea
                                                className="form-control"
                                                rows={6}
                                                placeholder="Type your message here..."
                                                value={composeData.body_html}
                                                onChange={(e) => setComposeData({ ...composeData, body_html: e.target.value })}
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="modal-footer">
                                        <button type="button" className="btn btn-secondary" onClick={() => setShowCompose(false)}>Cancel</button>
                                        <button type="submit" className="btn btn-primary d-flex align-items-center gap-2" disabled={sendingNew}>
                                            <FiSend />
                                            <span>{sendingNew ? "Sending..." : "Send Email"}</span>
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}

export default Inbox;
