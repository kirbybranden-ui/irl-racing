export const FONT_STACK =
  '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", Arial, sans-serif';

export const GOLD = "#d71920";
export const TEXT_PRIMARY = "#111216";
export const TEXT_SECONDARY = "#686b70";
export const GLASS_BG = "transparent";
export const GLASS_BG_STRONG = "#f7f7f5";
export const GLASS_BORDER = "1px solid #d6d7d9";
export const GLASS_SHADOW = "none";
export const HAIRLINE = "1px solid #d6d7d9";
export const GREEN = "#34c759";
export const RED = "#ff3b30";
export const ORANGE = "#ff9500";
export const BLUE = "#0071e3";
export const PURPLE = "#af52de";

export const appShellStyle = {
  minHeight: "100vh",
  background: "#f7f7f5",
  color: TEXT_PRIMARY,
  fontFamily: FONT_STACK,
  WebkitFontSmoothing: "antialiased",
};

export const pageContainerStyle = {
  maxWidth: 1400,
  margin: "0 auto",
  padding: 20,
};

export const sectionCardStyle = {
  background: GLASS_BG,
  border: 0,
  borderTop: HAIRLINE,
  borderRadius: 0,
  padding: "24px 0",
  marginBottom: 20,
  boxShadow: "none",
};

export const headerButtonStyle = {
  background: "rgba(0,0,0,0.05)",
  color: TEXT_PRIMARY,
  border: "1px solid rgba(0,0,0,0.08)",
  borderRadius: 999,
  padding: "10px 16px",
  fontWeight: 600,
  cursor: "pointer",
  fontFamily: FONT_STACK,
};

export const activeHeaderButtonStyle = {
  ...headerButtonStyle,
  background: TEXT_PRIMARY,
  color: "white",
  border: `1px solid ${TEXT_PRIMARY}`,
};

export const primaryButtonStyle = {
  background: TEXT_PRIMARY,
  color: "#fff",
  border: "none",
  borderRadius: 2,
  padding: "10px 18px",
  fontWeight: 700,
  cursor: "pointer",
  fontFamily: FONT_STACK,
};

export const secondaryButtonStyle = {
  background: "rgba(0,0,0,0.05)",
  color: TEXT_PRIMARY,
  border: "1px solid rgba(0,0,0,0.08)",
  borderRadius: 999,
  padding: "10px 18px",
  fontWeight: 600,
  cursor: "pointer",
  fontFamily: FONT_STACK,
};

export const dangerButtonStyle = {
  background: RED,
  color: "white",
  border: "none",
  borderRadius: 999,
  padding: "10px 18px",
  fontWeight: 600,
  cursor: "pointer",
  fontFamily: FONT_STACK,
};

export const inputStyle = {
  width: "100%",
  background: "rgba(0,0,0,0.04)",
  color: TEXT_PRIMARY,
  border: "1px solid rgba(0,0,0,0.08)",
  borderRadius: 12,
  padding: "10px 12px",
  boxSizing: "border-box",
  fontFamily: FONT_STACK,
};

export const racePositionInputStyle = {
  ...inputStyle,
  width: 110,
  minWidth: 110,
  maxWidth: 130,
  padding: "10px 12px",
  fontSize: 16,
  fontWeight: 700,
  textAlign: "center",
};

export const racePenaltyInputStyle = {
  ...inputStyle,
  width: 130,
  minWidth: 130,
  maxWidth: 150,
  padding: "10px 12px",
  fontSize: 15,
  fontWeight: 700,
  textAlign: "center",
};

export const raceNotesInputStyle = {
  ...inputStyle,
  width: 260,
  minWidth: 260,
  padding: "10px 12px",
  fontSize: 14,
};

export const tableStyle = {
  width: "100%",
  borderCollapse: "collapse",
};

export const thStyle = {
  textAlign: "left",
  padding: 10,
  borderBottom: HAIRLINE,
  background: "rgba(0,0,0,0.03)",
  fontSize: 13,
  color: TEXT_SECONDARY,
  fontWeight: 600,
};

export const tdStyle = {
  padding: 10,
  borderBottom: "1px solid rgba(0,0,0,0.06)",
  verticalAlign: "top",
  fontSize: 14,
  color: TEXT_PRIMARY,
};

export const raceEntryThStyle = {
  ...thStyle,
  minWidth: 115,
  textAlign: "center",
};

export const raceEntryTdStyle = {
  ...tdStyle,
  minWidth: 115,
};

export const statBoxStyle = {
  background: GLASS_BG,
  backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
  border: GLASS_BORDER,
  borderRadius: 16,
  padding: 16,
  flex: "1 1 220px",
  boxShadow: GLASS_SHADOW,
};
