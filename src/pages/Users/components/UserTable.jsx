import { Table, Badge, Button, Spinner } from "react-bootstrap";
import { FiEdit2, FiTrash2 } from "react-icons/fi";

export default function UserTable({
    loading,
    users,
    onEdit,
    onDelete,
}) {

    if (loading) {

        return (

            <div className="text-center py-5">

                <Spinner animation="border" />

            </div>

        );

    }

    return (

        <div className="card shadow-sm border-0">

            <div className="table-responsive">

                <Table hover className="align-middle mb-0">

                    <thead className="table-light">

                        <tr>

                            <th>Name</th>

                            <th>Email</th>

                            <th>Role</th>

                            <th>Created</th>

                            <th width="160">

                                Actions

                            </th>

                        </tr>

                    </thead>

                    <tbody>

                        {users.length === 0 ? (

                            <tr>

                                <td
                                    colSpan="5"
                                    className="text-center py-5"
                                >

                                    No users found.

                                </td>

                            </tr>

                        ) : (

                            users.map((user) => (

                                <tr key={user.id}>

                                    <td>

                                        <strong>

                                            {user.name}

                                        </strong>

                                    </td>

                                    <td>

                                        {user.email}

                                    </td>

                                    <td>

                                        <Badge
                                            bg={
                                                user.role === "super_admin"
                                                    ? "danger"
                                                    : "primary"
                                            }
                                        >

                                            {user.role === "super_admin"
                                                ? "Super Admin"
                                                : "Sales Executive"}

                                        </Badge>

                                    </td>

                                    <td>

                                        {new Date(
                                            user.created_at
                                        ).toLocaleDateString()}

                                    </td>

                                    <td>

                                        <div className="d-flex gap-2">

                                            <Button
                                                size="sm"
                                                variant="outline-primary"
                                                onClick={() => onEdit(user)}
                                            >

                                                <FiEdit2 />

                                            </Button>

                                            <Button
                                                size="sm"
                                                variant="outline-danger"
                                                onClick={() => onDelete(user)}
                                                >

                                                <FiTrash2 />

                                            </Button>

                                        </div>

                                    </td>

                                </tr>

                            ))

                        )}

                    </tbody>

                </Table>

            </div>

        </div>

    );

}