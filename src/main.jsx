import React from "react";
import ReactDOM from "react-dom/client";
import UserAgreementGate from "./components/auth/UserAgreementGate";
import App from "./App.jsx";
import DesktopNavigation from "./components/layout/DesktopNavigation.jsx";
import "./styles/brlGlobalTheme.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <UserAgreementGate>
      <DesktopNavigation />
      <App />
    </UserAgreementGate>
  </React.StrictMode>
);
