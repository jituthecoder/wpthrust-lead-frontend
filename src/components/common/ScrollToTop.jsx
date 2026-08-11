import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export default function ScrollToTop() {
    const { pathname } = useLocation();

    useEffect(() => {
        // Reset scroll position to top on route change
        window.scrollTo(0, 0);

        // Reset any residual body overflow/padding left behind by Bootstrap modals or offcanvas
        document.body.style.overflow = "";
        document.body.style.paddingRight = "";
        document.body.style.position = "";
        document.body.classList.remove("modal-open", "offcanvas-open");

        // Remove lingering backdrop elements
        const backdrops = document.querySelectorAll(".modal-backdrop, .offcanvas-backdrop");
        backdrops.forEach((b) => b.remove());

        // Hide bootstrap offcanvas if active
        const mobileSidebar = document.getElementById("mobileSidebar");
        if (mobileSidebar && window.bootstrap?.Offcanvas) {
            const bsOffcanvas = window.bootstrap.Offcanvas.getInstance(mobileSidebar);
            if (bsOffcanvas) {
                bsOffcanvas.hide();
            }
        }
    }, [pathname]);

    return null;
}
