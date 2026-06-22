export const appShellStyle = {
  minHeight: "100vh",
  background: "#0c0f14",
  color: "white",
  fontFamily: "Arial, sans-serif",
};

export const pageContainerStyle = {
  maxWidth: 1400,
  margin: "0 auto",
  padding: 20,
};

export const sectionCardStyle = {
  background: "#171b22",
  border: "1px solid #2c3440",
  borderRadius: 16,
  padding: 18,
  marginBottom: 20,
  boxShadow: "0 8px 24px rgba(0,0,0,0.22)",
};

export const headerButtonStyle = {
  background: "#222936",
  color: "white",
  border: "1px solid #3a4453",
  borderRadius: 10,
  padding: "10px 14px",
  fontWeight: 700,
  cursor: "pointer",
};

export const activeHeaderButtonStyle = {
  ...headerButtonStyle,
  background: "#d4af37",
  color: "#111",
  border: "1px solid #d4af37",
};

export const primaryButtonStyle = {
  background: "#d4af37",
  color: "#111",
  border: "none",
  borderRadius: 10,
  padding: "10px 16px",
  fontWeight: 700,
  cursor: "pointer",
};

export const secondaryButtonStyle = {
  background: "#2a3140",
  color: "white",
  border: "1px solid #3d4859",
  borderRadius: 10,
  padding: "10px 16px",
  fontWeight: 700,
  cursor: "pointer",
};

export const dangerButtonStyle = {
  background: "#b42318",
  color: "white",
  border: "none",
  borderRadius: 10,
  padding: "10px 16px",
  fontWeight: 700,
  cursor: "pointer",
};

export const inputStyle = {
  width: "100%",
  background: "#0f1319",
  color: "white",
  border: "1px solid #313947",
  borderRadius: 10,
  padding: "10px 12px",
  boxSizing: "border-box",
};

export const racePositionInputStyle = {
  ...inputStyle,
  width: 110,
  minWidth: 110,
  maxWidth: 130,
  padding: "10px 12px",
  fontSize: 16,
  fontWeight: 800,
  textAlign: "center",
};

export const racePenaltyInputStyle = {
  ...inputStyle,
  width: 130,
  minWidth: 130,
  maxWidth: 150,
  padding: "10px 12px",
  fontSize: 15,
  fontWeight: 800,
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
  borderBottom: "1px solid #313947",
  background: "#10141b",
  fontSize: 13,
};

export const tdStyle = {
  padding: 10,
  borderBottom: "1px solid #252c38",
  verticalAlign: "top",
  fontSize: 14,
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
  background: "#11161d",
  border: "1px solid #2a3240",
  borderRadius: 14,
  padding: 16,
  flex: "1 1 220px",
};
