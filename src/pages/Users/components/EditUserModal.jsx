import { useEffect, useState } from "react";
import {
    Modal,
    Button,
    Form,
    Alert,
    Spinner,
} from "react-bootstrap";

import { updateUser } from "../../../api/user";

export default function EditUserModal({
    show,
    onHide,
    onSuccess,
    user,
}) {

    const [form, setForm] = useState({
        name: "",
        email: "",
        role: "sales_executive",
        is_active: true,
    });

    const [loading, setLoading] = useState(false);

    const [error, setError] = useState("");

    useEffect(() => {

        if (user) {

            setForm({
                name: user.name,
                email: user.email,
                role: user.role,
                is_active: user.is_active,
            });

        }

    }, [user]);

    const handleChange = (e) => {

        const { name, value } = e.target;

        setForm({
            ...form,
            [name]:
                name === "is_active"
                    ? value === "true"
                    : value,
        });

    };

    const handleSubmit = async () => {

        try {

            setLoading(true);

            setError("");

            const response = await updateUser(
                user.id,
                form
            );

            if (response.data.success) {

                onSuccess();

            }

        } catch (err) {

            if (err.response?.data?.errors) {

                setError(

                    Object.values(
                        err.response.data.errors
                    )
                        .flat()
                        .join("\n")

                );

            } else {

                setError(
                    err.response?.data?.message ||
                    "Unable to update user."
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

                    Edit User

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

                <Form.Group>

                    <Form.Label>

                        Status

                    </Form.Label>

                    <Form.Select
                        name="is_active"
                        value={form.is_active.toString()}
                        onChange={handleChange}
                    >

                        <option value="true">

                            Active

                        </option>

                        <option value="false">

                            Inactive

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

                            Updating...

                        </>

                    ) : (

                        "Update User"

                    )}

                </Button>

            </Modal.Footer>

        </Modal>

    );

}