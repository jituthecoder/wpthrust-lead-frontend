export default function Pagination({ pagination, onPageChange }) {

    if (!pagination || pagination.last_page <= 1) {
        return null;
    }

    const current = pagination.current_page;
    const last = pagination.last_page;

    let start = Math.max(current - 2, 1);
    let end = Math.min(current + 2, last);

    if (current <= 3) {
        end = Math.min(5, last);
    }

    if (current >= last - 2) {
        start = Math.max(last - 4, 1);
    }

    const pages = [];

    for (let i = start; i <= end; i++) {
        pages.push(i);
    }

    return (

        <div className="d-flex justify-content-between align-items-center mt-4 flex-wrap gap-3">

            <div>

                Showing <strong>{pagination.from}</strong> -

                <strong> {pagination.to}</strong> of

                <strong> {pagination.total}</strong>

            </div>

            <nav>

                <ul className="pagination mb-0">

                    <li className={`page-item ${current === 1 ? "disabled" : ""}`}>

                        <button
                            className="page-link"
                            onClick={() => onPageChange(current - 1)}
                        >
                            Previous
                        </button>

                    </li>

                    {start > 1 && (

                        <>
                            <li className="page-item">

                                <button
                                    className="page-link"
                                    onClick={() => onPageChange(1)}
                                >
                                    1
                                </button>

                            </li>

                            {start > 2 && (

                                <li className="page-item disabled">

                                    <span className="page-link">...</span>

                                </li>

                            )}

                        </>

                    )}

                    {pages.map((page) => (

                        <li
                            key={page}
                            className={`page-item ${page === current ? "active" : ""}`}
                        >

                            <button
                                className="page-link"
                                onClick={() => onPageChange(page)}
                            >
                                {page}
                            </button>

                        </li>

                    ))}

                    {end < last && (

                        <>
                            {end < last - 1 && (

                                <li className="page-item disabled">

                                    <span className="page-link">...</span>

                                </li>

                            )}

                            <li className="page-item">

                                <button
                                    className="page-link"
                                    onClick={() => onPageChange(last)}
                                >
                                    {last}
                                </button>

                            </li>

                        </>

                    )}

                    <li className={`page-item ${current === last ? "disabled" : ""}`}>

                        <button
                            className="page-link"
                            onClick={() => onPageChange(current + 1)}
                        >
                            Next
                        </button>

                    </li>

                </ul>

            </nav>

        </div>

    );

}