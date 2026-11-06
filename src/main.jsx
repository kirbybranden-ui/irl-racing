import React from "react";
import ReactDOM from "react-dom/client";
import UserAgreementGate from "./components/auth/UserAgreementGate";
import App from "./App.jsx";
import DesktopNavigation from "./components/layout/DesktopNavigation.jsx";
import "./styles/brlGlobalTheme.css";
import "./styles/racewayTheme.css";
import "./styles/mobileFlow.css";
import MobileTableFlow from "./components/layout/MobileTableFlow";

document.documentElement.dataset.brlTheme = "raceway";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <UserAgreementGate>
      <MobileTableFlow />
      <DesktopNavigation />
      <App />
    </UserAgreementGate>
  </React.StrictMode>
);
