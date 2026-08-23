import { FiSearch } from "react-icons/fi";

export default function BusinessToolbar({
    search,
    setSearch,
    status,
    setStatus,
    category,
    setCategory,
    assigned,
    setAssigned,
    hasEmail,
    setHasEmail,
    hasOpened,
    setHasOpened,
    hasClicked,
    setHasClicked,
}) {

    return (

        <div className="card border-0 shadow-sm mb-4">
            <div className="card-body p-3">
                <form onSubmit={(e) => e.preventDefault()} className="row g-2">
                    <div className="col-xl-3 col-lg-3 col-md-6 col-12">
                        <div className="input-group">
                            <span className="input-group-text">
                                <FiSearch />
                            </span>
                            <input
                                className="form-control"
                                placeholder="Search business name, email..."
                                value={search}
                                onChange={(e)=>setSearch(e.target.value)}
                                onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); }}
                            />
                        </div>
                    </div>

                    <div className="col-xl-2 col-lg-2 col-md-4 col-6">
                        <select
                            className="form-select"
                            value={status}
                            onChange={(e)=>setStatus(e.target.value)}
                        >
                            <option value="">All Status</option>
                            <option value="new">New</option>
                            <option value="interested">Interested</option>
                            <option value="call_later">Call Later</option>
                        </select>
                    </div>

                    <div className="col-xl-2 col-lg-2 col-md-4 col-6">
                        <input
                            className="form-control"
                            placeholder="Category"
                            value={category}
                            onChange={(e)=>setCategory(e.target.value)}
                        />
                    </div>

                    <div className="col-xl-2 col-lg-2 col-md-4 col-6">
                        <select
                            className="form-select"
                            value={hasEmail}
                            onChange={(e)=>setHasEmail(e.target.value)}
                        >
                            <option value="">All Emails</option>
                            <option value="yes">Must Have Email</option>
                            <option value="no">Missing Email Only</option>
                        </select>
                    </div>

                    <div className="col-xl-2 col-lg-2 col-md-4 col-6">
                        <select
                            className="form-select"
                            value={hasOpened}
                            onChange={(e)=>setHasOpened(e.target.value)}
                        >
                            <option value="">All Email Opens</option>
                            <option value="yes">Opened Email (System)</option>
                            <option value="no">Not Opened</option>
                        </select>
                    </div>

                    <div className="col-xl-2 col-lg-2 col-md-4 col-6">
                        <select
                            className="form-select"
                            value={hasClicked}
                            onChange={(e)=>setHasClicked(e.target.value)}
                        >
                            <option value="">All Email Clicks</option>
                            <option value="yes">Clicked Email Link</option>
                            <option value="no">Not Clicked</option>
                        </select>
                    </div>

                    <div className="col-xl-2 col-lg-2 col-md-4 col-6">
                        <select
                            className="form-select"
                            value={assigned}
                            onChange={(e)=>setAssigned(e.target.value)}
                        >
                            <option value="">All Leads</option>
                            <option value="yes">Assigned</option>
                            <option value="no">Unassigned</option>
                        </select>
                    </div>

                    <div className="col-xl-1 col-lg-1 col-md-2 col-4">
                        <button
                            type="button"
                            className="btn btn-outline-secondary w-100"
                            onClick={()=>{
                                setSearch("");
                                setStatus("");
                                setCategory("");
                                setAssigned("");
                                setHasEmail("");
                                setHasOpened("");
                                setHasClicked("");
                            }}
                            title="Reset Filters"
                        >
                            Reset
                        </button>
                    </div>
                </form>
            </div>
        </div>

    );

}