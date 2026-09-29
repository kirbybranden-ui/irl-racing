import React from "react";
import logo from "./assets/logo1.png";
import JoinRequestForm from "./components/auth/JoinRequestForm";

export default function WelcomePage() {
  return <main style={{ minHeight: "100vh", background: "#f7f7f5", color: "#111216", padding: "40px 20px", boxSizing: "border-box", fontFamily: "Arial, sans-serif" }}>
    <section style={{ maxWidth: 520, margin: "0 auto", borderTop: "4px solid #d71920", paddingTop: 24 }}>
      <a href="/" aria-label="League home"><img src={logo} alt="BRL" style={{ height: 54, objectFit: "contain" }} /></a>
      <h1 style={{ fontSize: 42, fontStyle: "italic", textTransform: "uppercase", margin: "22px 0 6px" }}>Register to Join</h1>
      <p style={{ color: "#4b5563", lineHeight: 1.5 }}>Send your driver details to the admin team. Once your request is approved and access is set up, you can log in with your driver number and password.</p>
      <JoinRequestForm />
      <p style={{ borderTop: "1px solid #d6d7d9", paddingTop: 20, marginTop: 28 }}><a href="/standings?login=1" style={{ color: "#a31820", fontWeight: 900 }}>Already a driver? Log in →</a></p>
    </section>
  </main>;
}
