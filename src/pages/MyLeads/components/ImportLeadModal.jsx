import { useState } from "react";
import {
    Modal,
    Button,
    Form,
    Alert,
    Spinner,
} from "react-bootstrap";

import { importBusinesses } from "../../../api/business";

export default function ImportLeadModal({
    show,
    onHide,
    onSuccess,
}) {

    const [file, setFile] = useState(null);

    const [loading, setLoading] = useState(false);

    const [error, setError] = useState("");

    const [success, setSuccess] = useState("");
    const [result, setResult] = useState(null);

    const handleSubmit = async () => {

        if (!file) {

            setError("Please select a CSV file.");

            return;

        }

        try {

            setLoading(true);

            setError("");

            setSuccess("");

            const response = await importBusinesses(file);

            if (response.data.success) {

                setSuccess(response.data.message);

                setResult(response.data.data);

                setFile(null);

            }

        } catch (err) {

            setError(
                err.response?.data?.message ||
                "Failed to import CSV."
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

                    Import Leads

                </Modal.Title>

            </Modal.Header>

            <Modal.Body>

                {success && (

                    <Alert variant="success">

                        <h5 className="mb-3">
                            ✅ {success}
                        </h5>

                        {result && (

                            <div>

                                <div className="d-flex justify-content-between mb-2">
                                    <strong>Total Records</strong>
                                    <span>{result.total_rows}</span>
                                </div>

                                <div className="d-flex justify-content-between mb-2">
                                    <strong>Imported</strong>
                                    <span className="text-success">
                                        {result.imported}
                                    </span>
                                </div>

                                <div className="d-flex justify-content-between">
                                    <strong>Skipped</strong>
                                    <span >
                                        {result.skipped}
                                    </span>
                                </div>

                            </div>

                        )}

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
                    onClick={() => {

                        onHide();

                        if (success) {

                            onSuccess();

                        }

                    }}
                >
                    {success ? "Close" : "Cancel"}
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

                        "Import CSV"

                    )}

                </Button>

            </Modal.Footer>

        </Modal>

    );

}