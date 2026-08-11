import { useEffect, useState } from "react";

import DashboardLayout from "../../components/layout/DashboardLayout";

import { getUsers } from "../../api/user";

import UserToolbar from "./components/UserToolbar";
import UserTable from "./components/UserTable";
import UserPagination from "./components/UserPagination";
import CreateUserModal from "./components/CreateUserModal";
import EditUserModal from "./components/EditUserModal";
import DeleteUserModal from "./components/DeleteUserModal";

export default function Users() {

    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);

    const [showEditModal, setShowEditModal] = useState(false);

    const [selectedUser, setSelectedUser] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    const [users, setUsers] = useState([]);

    const [pagination, setPagination] = useState({});

    const [filters, setFilters] = useState({
        page: 1,
        search: "",
        role: "",
    });

    useEffect(() => {

        loadUsers();

    }, [filters]);

    async function loadUsers() {

        try {

            setLoading(true);

            const response = await getUsers(filters);

            setUsers(response.data.data.data);

            setPagination(response.data.data);

        } catch (error) {

            console.error(error);

        } finally {

            setLoading(false);

        }

    }

    return (

        <DashboardLayout title="Users">
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
                <div>
                    <h3 className="fw-bold m-0 text-dark">User Management</h3>
                    <p className="text-muted m-0 small">Manage sales team members, roles, and access credentials</p>
                </div>
            </div>

            <UserToolbar
                filters={filters}
                setFilters={setFilters}
                onCreate={() => setShowCreateModal(true)}
            />

            <UserTable
                loading={loading}
                users={users}
                onEdit={(user) => {

                    setSelectedUser(user);

                    setShowEditModal(true);

                }}
                onDelete={(user) => {

                    setSelectedUser(user);

                    setShowDeleteModal(true);

                }}
                />

            <UserPagination
                pagination={pagination}
                filters={filters}
                setFilters={setFilters}
            />

            <CreateUserModal
                show={showCreateModal}
                onHide={() => setShowCreateModal(false)}
                onSuccess={() => {

                    setShowCreateModal(false);

                    loadUsers();

                }}
            />

            <EditUserModal
                show={showEditModal}
                user={selectedUser}
                onHide={() => {

                    setShowEditModal(false);

                    setSelectedUser(null);

                }}
                onSuccess={() => {

                    setShowEditModal(false);

                    setSelectedUser(null);

                    loadUsers();

                }}
            />

            <DeleteUserModal
                show={showDeleteModal}
                user={selectedUser}
                onHide={() => {

                    setShowDeleteModal(false);

                    setSelectedUser(null);

                }}
                onSuccess={() => {

                    setShowDeleteModal(false);

                    setSelectedUser(null);

                    loadUsers();

                }}
            />

        </DashboardLayout>

    );

}