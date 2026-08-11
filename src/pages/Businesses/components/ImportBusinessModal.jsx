import { useState } from "react";
import {
    Modal,
    Button,
    Form,
    Alert,
    Spinner,
} from "react-bootstrap";

import { importBusinesses } from "../../../api/business";

export default function ImportBusinessModal({
    show,
    onHide,
    onSuccess,
}) {

    const [file, setFile] = useState(null);

    const [loading, setLoading] = useState(false);

    const [message, setMessage] = useState("");

    const [error, setError] = useState("");

    const handleSubmit = async () => {

        if (!file) {

            setError("Please select a CSV file.");

            return;

        }

        try {

            setLoading(true);

            setError("");

            setMessage("");

            const response = await importBusinesses(file);

            if (response.success) {

                setMessage(response.message);

                setFile(null);

                onSuccess();

            }

        } catch (err) {

            setError(
                err.response?.data?.message ||
                "Failed to import businesses."
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

                    Import Businesses

                </Modal.Title>

            </Modal.Header>

            <Modal.Body>

                {message && (

                    <Alert variant="success">

                        {message}

                    </Alert>

                )}

                {error && (

                    <Alert variant="danger">

                        {error}

                    </Alert>

                )}

                <Form.Group>

                    <Form.Label>

                        CSV File

                    </Form.Label>

                    <Form.Control
                        type="file"
                        accept=".csv"
                        onChange={(e) =>
                            setFile(e.target.files[0])
                        }
                    />

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

                            Uploading...

                        </>

                    ) : (

                        "Import"

                    )}

                </Button>

            </Modal.Footer>

        </Modal>

    );

}