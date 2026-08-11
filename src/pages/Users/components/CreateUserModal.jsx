import { useState } from "react";
import {
    Modal,
    Button,
    Form,
    Alert,
    Spinner,
} from "react-bootstrap";

import { createUser } from "../../../api/user";

export default function CreateUserModal({
    show,
    onHide,
    onSuccess,
}) {

    const [form, setForm] = useState({
        name: "",
        email: "",
        password: "",
        role: "sales_executive",
    });

    const [loading, setLoading] = useState(false);

    const [error, setError] = useState("");

    const handleChange = (e) => {

        setForm({
            ...form,
            [e.target.name]: e.target.value,
        });

    };

    const handleSubmit = async () => {

        try {

            setLoading(true);

            setError("");

            const response = await createUser(form);

            if (response.data.success) {

                setForm({
                    name: "",
                    email: "",
                    password: "",
                    role: "sales_executive",
                });

                onSuccess();

            }

        } catch (err) {

            if (err.response?.data?.errors) {

                const errors = Object.values(
                    err.response.data.errors
                )
                    .flat()
                    .join("\n");

                setError(errors);

            } else {

                setError(
                    err.response?.data?.message ||
                    "Unable to create user."
                );

            }

        } finally {

            setLoading(false);

        }

    };

    return (

        <Modal
            show={show}
            onHide={onHide}
            centered
        >

            <Modal.Header closeButton>

                <Modal.Title>

                    Create User

                </Modal.Title>

            </Modal.Header>

            <Modal.Body>

                {error && (

                    <Alert variant="danger">

                        <pre className="mb-0">

                            {error}

                        </pre>

                    </Alert>

                )}

                <Form.Group className="mb-3">

                    <Form.Label>

                        Name

                    </Form.Label>

                    <Form.Control
                        name="name"
                        value={form.name}
                        onChange={handleChange}
                    />

                </Form.Group>

                <Form.Group className="mb-3">

                    <Form.Label>

                        Email

                    </Form.Label>

                    <Form.Control
                        type="email"
                        name="email"
                        value={form.email}
                        onChange={handleChange}
                    />

                </Form.Group>

                <Form.Group className="mb-3">

                    <Form.Label>

                        Password

                    </Form.Label>

                    <Form.Control
                        type="password"
                        name="password"
                        value={form.password}
                        onChange={handleChange}
                    />

                </Form.Group>

                <Form.Group>

                    <Form.Label>

                        Role

                    </Form.Label>

                    <Form.Select
                        name="role"
                        value={form.role}
                        onChange={handleChange}
                    >

                        <option value="sales_executive">

                            Sales Executive

                        </option>

                        <option value="super_admin">

                            Super Admin

                        </option>

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
                    onClick={handleSubmit}
                    disabled={loading}
                >

                    {loading ? (

                        <>
                            <Spinner
                                animation="border"
                                size="sm"
                                className="me-2"
                            />

                            Creating...

                        </>

                    ) : (

                        "Create User"

                    )}

                </Button>

            </Modal.Footer>

        </Modal>

    );

}