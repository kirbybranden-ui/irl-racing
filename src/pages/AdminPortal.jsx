# Payment Compliance Race Selector Fix

The AdminPortal file is already passing the selected compliance race into `PaymentCompliancePanel`, but `PaymentCompliancePanel` in `App.jsx` must be updated to actually use those props.

## Replace this block in `App.jsx`

Find:

```jsx
function PaymentCompliancePanel({ mode = "admin" }) {
  const rows = paymentComplianceSummary;
  const allMet = rows.length > 0 && rows.every((row) => row.finalEligible);
  const isAdminMode = mode === "admin";
```

Replace it with:

```jsx
function PaymentCompliancePanel({
  mode = "admin",
  selectedRace = "",
  raceName = "",
  complianceRace = "",
  paymentRace = "",
  activeRace = "",
  onRaceChange,
  setRaceName,
}) {
  const selectedComplianceRaceName = String(
    selectedRace || raceName || complianceRace || paymentRace || activeRace || ""
  ).trim();

  const paymentRacePair = useMemo(() => {
    if (!selectedComplianceRaceName) {
      return {
        previousRace: previousRaceForPayment,
        upcomingRace: upcomingRaceForPayment,
      };
    }

    const normalizeName = (value) => String(value || "").trim().toLowerCase();
    const selectedKey = normalizeName(selectedComplianceRaceName);
    const trackList = tracks || [];
    const trackIndex = trackList.findIndex((track) =>
      [track?.name, track?.raceName, track?.race_name, track?.title, track?.id]
        .some((value) => normalizeName(value) === selectedKey)
    );

    const selectedTrack =
      trackIndex >= 0
        ? trackList[trackIndex]
        : trackList.find((track) => normalizeName(track?.name || track?.raceName || track?.race_name || track?.title) === selectedKey) || null;

    const upcomingRace = selectedTrack
      ? {
          ...selectedTrack,
          name: selectedTrack.name || selectedTrack.raceName || selectedTrack.race_name || selectedComplianceRaceName,
          date: selectedTrack.date || selectedTrack.raceDate || selectedTrack.race_date || "",
        }
      : { name: selectedComplianceRaceName, date: "" };

    const previousTrack = trackIndex > 0 ? trackList[trackIndex - 1] : null;
    const historyBeforeSelected = (raceHistory || [])
      .filter((race) => normalizeName(race?.raceName || race?.race_name || race?.track || race?.name) !== selectedKey)
      .slice()
      .reverse()
      .find((race) => {
        if (trackIndex < 0) return true;
        const raceKey = normalizeName(race?.raceName || race?.race_name || race?.track || race?.name);
        const raceTrackIndex = trackList.findIndex((track) =>
          normalizeName(track?.name || track?.raceName || track?.race_name || track?.title) === raceKey
        );
        return raceTrackIndex >= 0 && raceTrackIndex < trackIndex;
      });

    const previousRace = previousTrack
      ? {
          name: previousTrack.name || previousTrack.raceName || previousTrack.race_name || previousTrack.title || "Previous Race",
          date: previousTrack.date || previousTrack.raceDate || previousTrack.race_date || "",
        }
      : historyBeforeSelected
        ? {
            name: historyBeforeSelected.raceName || historyBeforeSelected.race_name || historyBeforeSelected.track || historyBeforeSelected.name,
            date: historyBeforeSelected.raceDate || historyBeforeSelected.date || historyBeforeSelected.postedAt || historyBeforeSelected.savedAt || "",
          }
        : previousRaceForPayment;

    return { previousRace, upcomingRace };
  }, [selectedComplianceRaceName, tracks, raceHistory, previousRaceForPayment, upcomingRaceForPayment]);

  const rows = selectedComplianceRaceName
    ? buildPaymentComplianceRows({
        teams: teamStandings,
        drivers: visibleDrivers,
        interviews: paymentComplianceInterviews,
        carUploads: paymentComplianceUploads,
        overrides: paymentComplianceOverrides,
        previousRace: paymentRacePair.previousRace,
        upcomingRace: paymentRacePair.upcomingRace,
      })
    : paymentComplianceSummary;

  const allMet = rows.length > 0 && rows.every((row) => row.finalEligible);
  const isAdminMode = mode === "admin";
```

## Then replace the race stat cards inside `PaymentCompliancePanel`

Find these two lines/cards:

```jsx
<div style={statBoxStyle}><div style={{ opacity: 0.7, fontSize: 12, fontWeight: 900 }}>PREVIOUS RACE</div><div style={{ fontSize: 18, fontWeight: 900 }}>{previousRaceForPayment?.name || "—"}</div></div>
<div style={statBoxStyle}><div style={{ opacity: 0.7, fontSize: 12, fontWeight: 900 }}>UPCOMING RACE</div><div style={{ fontSize: 18, fontWeight: 900 }}>{upcomingRaceForPayment?.name || "—"}</div></div>
```

Replace with:

```jsx
<div style={statBoxStyle}><div style={{ opacity: 0.7, fontSize: 12, fontWeight: 900 }}>PREVIOUS RACE</div><div style={{ fontSize: 18, fontWeight: 900 }}>{paymentRacePair.previousRace?.name || "—"}</div></div>
<div style={statBoxStyle}><div style={{ opacity: 0.7, fontSize: 12, fontWeight: 900 }}>UPCOMING RACE</div><div style={{ fontSize: 18, fontWeight: 900 }}>{paymentRacePair.upcomingRace?.name || "—"}</div></div>
```

## Why this fixes it

`AdminPortal.jsx` can display and change the selected race, but `PaymentCompliancePanel` is defined inside `App.jsx`. Before this fix, that panel always used `paymentComplianceSummary`, `previousRaceForPayment`, and `upcomingRaceForPayment`, so changing the race in AdminPortal did not affect whether teams were marked eligible.

After this change, the selected compliance race recalculates the previous/upcoming race pair and rebuilds the team compliance rows for that selected period.
