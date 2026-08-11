import { useEffect, useState } from "react";
import {
    Modal,
    Button,
    Form,
    Alert,
    Spinner,
} from "react-bootstrap";

import { assignLeads } from "../../../api/business";
import { getSalesExecutives } from "../../../api/user";

export default function AssignLeadModal({
    show,
    onHide,
    selectedLeads,
    onSuccess,
}) {

    const [users, setUsers] = useState([]);
    const [userId, setUserId] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {

        if (show) {

            loadUsers();

        }

    }, [show]);

    async function loadUsers() {

        try {

            const response = await getSalesExecutives();

            setUsers(response.data.data);

        } catch (err) {

            console.error(err);

        }

    }

    async function handleAssign() {

        if (!userId) {

            setError("Please select a sales executive.");

            return;

        }

        try {

            setLoading(true);

            setError("");

            const response = await assignLeads(
                selectedLeads,
                userId
            );

            if (response.data.success) {

                onSuccess();

            }

        } catch (err) {

            setError(
                err.response?.data?.message ||
                "Failed to assign leads."
            );

        } finally {

            setLoading(false);

        }

    }

    return (

        <Modal
            show={show}
            onHide={onHide}
            centered
        >

            <Modal.Header closeButton>

                <Modal.Title>

                    Assign Leads

                </Modal.Title>

            </Modal.Header>

            <Modal.Body>

                {error && (

                    <Alert variant="danger">

                        {error}

                    </Alert>

                )}

                <p>

                    Selected Leads:
                    <strong> {selectedLeads.length}</strong>

                </p>

                <Form.Group>

                    <Form.Label>

                        Sales Executive

                    </Form.Label>

                    <Form.Select
                        value={userId}
                        onChange={(e) =>
                            setUserId(e.target.value)
                        }
                    >

                        <option value="">

                            Select Sales Executive

                        </option>

                        {users.map((user) => (

                            <option
                                key={user.id}
                                value={user.id}
                            >

                                {user.name}

                            </option>

                        ))}

                    </Form.Select>

                </Form.Group>

            </Modal.Body>

            <Modal.Footer>

                <Button
                    variant="secondary"
                    onClick={onHide}
                >

                    Cancel

                </Button>

                <Button
                    onClick={handleAssign}
                    disabled={loading}
                >

                    {loading ? (

                        <>
                            <Spinner
                                animation="border"
                                size="sm"
                                className="me-2"
                            />

                            Assigning...

                        </>

                    ) : (

                        "Assign Leads"

                    )}

                </Button>

            </Modal.Footer>

        </Modal>

    );

}