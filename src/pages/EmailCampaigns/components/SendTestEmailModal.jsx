import { useState } from "react";
import { Modal, Button, Form, Spinner } from "react-bootstrap";
import toast from "react-hot-toast";
import { sendSenderTestEmail } from "../../../api/emailSenders";

export default function SendTestEmailModal({ show, onHide, sender }) {
    const [sending, setSending] = useState(false);
    const [formData, setFormData] = useState({
        to: "",
        subject: "Test Email from WPThrust Lead CRM",
        message: "Hi,\n\nThis is a test email sent to verify your SMTP sender settings in WPThrust CRM.\n\nBest regards,",
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!sender?.id) return;

        try {
            setSending(true);
            await sendSenderTestEmail(sender.id, formData);
            toast.success(`Test email sent successfully to ${formData.to}!`);
            onHide();
        } catch (error) {
            const msg = error.response?.data?.message || "Failed to send test email";
            toast.error(msg);
        } finally {
            setSending(false);
        }
    };

    return (
        <Modal show={show} onHide={onHide} centered>
            <Modal.Header closeButton className="border-0">
                <Modal.Title className="fw-bold fs-5">
                    Send Test Email ({sender?.display_name || sender?.email})
                </Modal.Title>
            </Modal.Header>
            <Form onSubmit={handleSubmit}>
                <Modal.Body className="pt-0">
                    <Form.Group className="mb-3">
                        <Form.Label className="fw-semibold small">Recipient Email *</Form.Label>
                        <Form.Control
                            type="email"
                            name="to"
                            placeholder="recipient@example.com"
                            value={formData.to}
                            onChange={handleChange}
                            required
                        />
                    </Form.Group>

                    <Form.Group className="mb-3">
                        <Form.Label className="fw-semibold small">Subject *</Form.Label>
                        <Form.Control
                            type="text"
                            name="subject"
                            value={formData.subject}
                            onChange={handleChange}
                            required
                        />
                    </Form.Group>

                    <Form.Group className="mb-3">
                        <Form.Label className="fw-semibold small">Message *</Form.Label>
                        <Form.Control
                            as="textarea"
                            rows={4}
                            name="message"
                            value={formData.message}
                            onChange={handleChange}
                            required
                        />
                    </Form.Group>
                </Modal.Body>
                <Modal.Footer className="border-0 pt-0">
                    <Button variant="light" onClick={onHide} disabled={sending}>
                        Cancel
                    </Button>
                    <Button variant="primary" type="submit" disabled={sending}>
                        {sending ? (
                            <>
                                <Spinner size="sm" animation="border" className="me-2" />
                                Sending...
                            </>
                        ) : (
                            "Send Test Email"
                        )}
                    </Button>
                </Modal.Footer>
            </Form>
        </Modal>
    );
}
