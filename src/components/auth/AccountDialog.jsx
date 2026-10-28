import React, { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import RoleLogin from "./RoleLogin";
export default function AccountDialog({ onClose }) {
  const ref = useRef(null);
  useEffect(() => { const previous = document.activeElement;ref.current.showModal();return () => previous?.focus(); }, []);
  return createPortal(<dialog ref={ref} aria-label="League account login and registration" onCancel={onClose} onClose={onClose} style={{ width: "min(560px, calc(100% - 20px))", maxHeight: "90dvh", padding: 16, border: "1px solid #999", borderRadius: 8, background: "#f7f7f5", color: "#111" }}><button type="button" aria-label="Close login" onClick={onClose} style={{ float: "right", width: 44, height: 44 }}>×</button><RoleLogin next="/career" /></dialog>, document.body);
}
