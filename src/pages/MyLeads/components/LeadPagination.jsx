import { Pagination, Form } from "react-bootstrap";

export default function LeadPagination({
    pagination,
    filters,
    setFilters,
}) {
    if (!pagination) {
        return null;
    }

    const changePage = (page) => {
        if (
            page < 1 ||
            page > pagination.last_page ||
            page === pagination.current_page
        ) {
            return;
        }

        setFilters({
            ...filters,
            page,
        });

        window.scrollTo({
            top: 0,
            behavior: "smooth",
        });
    };

    const handlePerPageChange = (e) => {
        const newPerPage = parseInt(e.target.value, 10);
        setFilters({
            ...filters,
            page: 1,
            per_page: newPerPage,
        });
    };

    const current = pagination.current_page || 1;
    const last = pagination.last_page || 1;

    const pages = [];

    if (last > 1) {
        // Always show first page
        pages.push(
            <Pagination.Item
                key={1}
                active={current === 1}
                onClick={() => changePage(1)}
            >
                1
            </Pagination.Item>
        );

        // Left dots
        if (current > 4) {
            pages.push(
                <Pagination.Ellipsis
                    key="left-ellipsis"
                    disabled
                />
            );
        }

        // Middle pages
        const start = Math.max(2, current - 2);
        const end = Math.min(last - 1, current + 2);

        for (let i = start; i <= end; i++) {
            pages.push(
                <Pagination.Item
                    key={i}
                    active={current === i}
                    onClick={() => changePage(i)}
                >
                    {i}
                </Pagination.Item>
            );
        }

        // Right dots
        if (current < last - 3) {
            pages.push(
                <Pagination.Ellipsis
                    key="right-ellipsis"
                    disabled
                />
            );
        }

        // Always show last page
        pages.push(
            <Pagination.Item
                key={last}
                active={current === last}
                onClick={() => changePage(last)}
            >
                {last}
            </Pagination.Item>
        );
    }

    return (
        <div className="d-flex justify-content-between align-items-center mt-4 flex-wrap gap-3">
            {/* Rows Per Page Selector */}
            <div className="d-flex align-items-center gap-2 text-muted">
                <small className="fw-semibold">Rows per page:</small>
                <Form.Select
                    size="sm"
                    style={{ width: "95px" }}
                    value={filters.per_page || 20}
                    onChange={handlePerPageChange}
                    className="shadow-sm"
                >
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                    <option value={250}>250</option>
                    <option value={500}>500</option>
                    <option value={1000}>1000</option>
                </Form.Select>
                <small className="ms-2">
                    Showing <strong>{pagination.from || 0}</strong> to{" "}
                    <strong>{pagination.to || 0}</strong> of{" "}
                    <strong>{pagination.total || 0}</strong> Leads
                </small>
            </div>

            {/* Pagination Controls (only shown if last_page > 1) */}
            {last > 1 && (
                <Pagination className="mb-0">
                    <Pagination.First
                        disabled={current === 1}
                        onClick={() => changePage(1)}
                    />

                    <Pagination.Prev
                        disabled={!pagination.prev_page_url}
                        onClick={() => changePage(current - 1)}
                    />

                    {pages}

                    <Pagination.Next
                        disabled={!pagination.next_page_url}
                        onClick={() => changePage(current + 1)}
                    />

                    <Pagination.Last
                        disabled={current === last}
                        onClick={() => changePage(last)}
                    />
                </Pagination>
            )}
        </div>
    );
}