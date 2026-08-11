import { useRef } from "react";
import Sidebar from "./Sidebar";

function MobileSidebar() {
    const offcanvasRef = useRef(null);

    const handleClose = () => {
        if (offcanvasRef.current && window.bootstrap?.Offcanvas) {
            const bsOffcanvas = window.bootstrap.Offcanvas.getInstance(offcanvasRef.current);
            if (bsOffcanvas) {
                bsOffcanvas.hide();
            }
        }
        document.body.style.overflow = "";
        document.body.style.paddingRight = "";
        document.body.classList.remove("offcanvas-open", "modal-open");
        const backdrops = document.querySelectorAll(".offcanvas-backdrop, .modal-backdrop");
        backdrops.forEach((b) => b.remove());
    };

    return (
        <div
            ref={offcanvasRef}
            className="offcanvas offcanvas-start bg-dark border-0"
            tabIndex="-1"
            id="mobileSidebar"
            aria-labelledby="mobileSidebarLabel"
            style={{ width: "280px" }}
        >
            <div className="offcanvas-body p-0">
                <Sidebar mobile onClose={handleClose} />
            </div>
        </div>
    );
}

export default MobileSidebar;