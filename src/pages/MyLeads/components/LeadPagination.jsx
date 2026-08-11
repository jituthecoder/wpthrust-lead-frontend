import { Pagination } from "react-bootstrap";

export default function LeadPagination({
    pagination,
    filters,
    setFilters,
}) {

    if (!pagination || pagination.last_page <= 1) {
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

    const current = pagination.current_page;
    const last = pagination.last_page;

    const pages = [];

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
    if (last > 1) {

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

            <div className="text-muted">

                Showing <strong>{pagination.from}</strong> to{" "}
                <strong>{pagination.to}</strong> of{" "}
                <strong>{pagination.total}</strong> Leads

            </div>

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

        </div>

    );

}