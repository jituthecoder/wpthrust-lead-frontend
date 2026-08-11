import React from "react";
import ReactDOM from "react-dom/client";

import App from "./App";

import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";

import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import "./assets/css/theme.css";
import "./assets/css/layout.css";
import "./assets/css/dashboardLayout.css";
import "./assets/css/sidebar.css";
import "./assets/css/header.css";
import "./assets/css/cards.css";
import "./assets/css/table.css";
import "./assets/css/buttons.css";
import "./assets/css/forms.css";

ReactDOM.createRoot(document.getElementById("root")).render(
    <React.StrictMode>

        <BrowserRouter>

            <AuthProvider>

                <App />

            </AuthProvider>

        </BrowserRouter>

    </React.StrictMode>
);