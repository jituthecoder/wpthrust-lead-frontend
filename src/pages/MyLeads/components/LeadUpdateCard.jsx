import { useState, useEffect } from "react";
import {
    Card,
    Form,
    Button,
    Row,
    Col,
    Alert,
} from "react-bootstrap";

import { callLead } from "../../../api/lead";

export default function LeadUpdateCard({ lead, onUpdated }) {

    const [form, setForm] = useState({
        status: lead.lead_status || "new",
        comment: "",
        followup_date: "",
    });

    useEffect(() => {

        setForm({
            status: lead.lead_status || "new",
            comment: "",
            followup_date: lead.next_followup_at
                ? lead.next_followup_at.slice(0, 16)
                : "",
        });

    }, [lead]);

    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");

    const handleChange = (e) => {

        setForm({
            ...form,
            [e.target.name]: e.target.value,
        });

    };

    const submit = async (e) => {

        e.preventDefault();

        try {

            setLoading(true);
            setMessage("");

            const response = await callLead(lead.id, form);

            if (response.success) {

                setMessage(response.message);

                // Refresh parent component
                onUpdated(response.data);

                // Clear only fields that should be reset
                setForm({
                    status: response.data.lead_status,
                    comment: "",
                    followup_date: response.data.next_followup_at
                        ? response.data.next_followup_at.slice(0, 16)
                        : "",
                });

            }

        } catch (error) {

            setMessage(
                error.response?.data?.message ||
                "Something went wrong."
            );

        } finally {

            setLoading(false);

        }

    };

    return (

        <Card className="shadow-sm border-0 mt-4">

            <Card.Header className="bg-white">

                <h5 className="mb-0">

                    Update Lead

                </h5>

            </Card.Header>

            <Card.Body>

                {message && (

                        <Alert
                            variant={
                                message.toLowerCase().includes("success")
                                    ? "success"
                                    : "danger"
                            }
                            className="mb-4"
                        >

                            {message}

                        </Alert>

                    )}

                <Form onSubmit={submit}>

                    <Row>

                        <Col md={6}>

                            <Form.Group className="mb-3">

                                <Form.Label>

                                    Lead Status

                                </Form.Label>

                                <Form.Select
                                    name="status"
                                    value={form.status}
                                    onChange={handleChange}
                                >

                                    <option value="new">New</option>
                                    <option value="interested">Interested</option>
                                    <option value="call_later">Call Later</option>
                                    <option value="didnt_pick">Didn't Pick</option>
                                    <option value="not_reachable">Not Reachable</option>
                                    <option value="wrong_number">Wrong Number</option>
                                    <option value="not_interested">Not Interested</option>
                                    <option value="converted">Converted</option>

                                </Form.Select>

                            </Form.Group>

                        </Col>

                        <Col md={6}>

                            <Form.Group className="mb-3">

                                <Form.Label>

                                    Next Follow-up

                                </Form.Label>

                                <Form.Control
                                    type="datetime-local"
                                    name="followup_date"
                                    value={form.followup_date}
                                    onChange={handleChange}
                                />

                            </Form.Group>

                        </Col>

                    </Row>

                    <Form.Group className="mb-4">

                        <Form.Label>

                            Call Notes

                        </Form.Label>

                        <Form.Control
                            as="textarea"
                            rows={5}
                            placeholder="Write conversation summary..."
                            name="comment"
                            value={form.comment}
                            onChange={handleChange}
                        />

                    </Form.Group>

                    <div className="d-flex justify-content-end">

                        <Button
                                type="submit"
                                size="lg"
                                disabled={loading}
                            >

                                {loading ? (

                                    <>
                                        <span
                                            className="spinner-border spinner-border-sm me-2"
                                            role="status"
                                        />

                                        Saving...

                                    </>

                                ) : (

                                    "Save Lead"

                                )}

                            </Button>

                    </div>

                </Form>

            </Card.Body>

        </Card>

    );

}