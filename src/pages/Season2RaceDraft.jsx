/* Scoped to the Season 2 recorder; no global theme changes. */
.brl-race-draft .brl-race-steps,
.brl-race-draft .brl-race-filters {
  display: grid;
  align-items: stretch;
  gap: 12px;
}
.brl-race-draft .brl-race-steps {
  grid-template-columns: repeat(4, minmax(0, 1fr));
}
.brl-race-draft .brl-race-filters {
  grid-template-columns: minmax(0, 1.6fr) repeat(4, minmax(0, 1fr));
}
.brl-race-draft .brl-race-steps > button,
.brl-race-draft .brl-race-filters > :is(input, select, button),
.brl-race-draft .brl-race-settings-fields select {
  box-sizing: border-box;
  width: 100%;
  min-width: 0;
  min-height: 44px;
  margin: 0;
  padding: 10px 12px;
  font: inherit;
  font-size: 14px;
}
.brl-race-draft .brl-race-steps > button,
.brl-race-draft .brl-race-filters > button { font-weight: 700; white-space: normal; }
.brl-race-draft .brl-race-steps > button:disabled { opacity: 1; background: #b91c1c; color: white; }
.brl-race-draft select {
  border: 1px solid #b8b8b8;
  border-radius: 6px;
  background: #fff;
  color: #17191c;
}
.brl-race-draft td select {
  min-height: 40px;
  min-width: 150px;
  padding: 8px 10px;
  font-size: 14px;
}
.brl-race-draft .brl-race-settings-fields {
  display: grid;
  grid-template-columns: minmax(0, 2fr) minmax(0, 1fr);
  gap: 12px;
  align-items: end;
  margin-top: 16px;
}
.brl-race-draft .brl-race-actions { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 20px; }
.brl-race-draft .brl-race-actions > button { min-height: 44px; margin: 0; padding: 10px 20px; }
@media (max-width: 1100px) {
  .brl-race-draft .brl-race-filters { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .brl-race-draft .brl-race-filters > input { grid-column: 1 / -1; }
}
@media (max-width: 650px) {
  .brl-race-draft .brl-race-steps { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .brl-race-draft .brl-race-settings-fields { grid-template-columns: minmax(0, 1fr); }
  .brl-race-draft .brl-race-actions > button { flex: 1 1 100%; }
}
