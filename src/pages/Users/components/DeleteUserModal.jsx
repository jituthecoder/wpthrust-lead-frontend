import { useState } from "react";
import {
    Modal,
    Button,
    Alert,
    Spinner,
} from "react-bootstrap";

import { deleteUser } from "../../../api/user";

export default function DeleteUserModal({
    show,
    onHide,
    onSuccess,
    user,
}) {

    const [loading, setLoading] = useState(false);

    const [error, setError] = useState("");

    const handleDelete = async () => {

        try {

            setLoading(true);

            setError("");

            const response = await deleteUser(user.id);

            if (response.data.success) {

                onSuccess();

            }

        } catch (err) {

            setError(
                err.response?.data?.message ||
                "Unable to delete user."
            );

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

                    Delete User

                </Modal.Title>

            </Modal.Header>

            <Modal.Body>

                {error && (

                    <Alert variant="danger">

                        {error}

                    </Alert>

                )}

                <p>

                    Are you sure you want to delete

                    <strong>

                        {" "}{user?.name}

                    </strong>

                    ?

                </p>

                <p className="text-muted mb-0">

                    This action cannot be undone.

                </p>

            </Modal.Body>

            <Modal.Footer>

                <Button
                    variant="secondary"
                    onClick={onHide}
                >

                    Cancel

                </Button>

                <Button
                    variant="danger"
                    onClick={handleDelete}
                    disabled={loading}
                >

                    {loading ? (

                        <>
                            <Spinner
                                animation="border"
                                size="sm"
                                className="me-2"
                            />

                            Deleting...

                        </>

                    ) : (

                        "Delete User"

                    )}

                </Button>

            </Modal.Footer>

        </Modal>

    );

}