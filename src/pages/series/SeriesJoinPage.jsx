import React from 'react';
import JoinRequestForm from '../../components/auth/JoinRequestForm';
const SERIES_NAMES={cup:'Cup Series',xfinity:'Xfinity Series',trucks:'Craftsman Truck Series',arca:'ARCA Menards Series'};
export default function SeriesJoinPage({seriesId='cup'}){
 const name=SERIES_NAMES[seriesId]||'League';
 return <main className="career-auth"><a href={`/series/${encodeURIComponent(seriesId)}`}>← Back to {name}</a><h1>Join the league</h1><p>Create one league account first. After acceptance, sign in and use the approved team and contract process for an available series. This application does not reserve a seat or number.</p><p>Already registered? <a href="/login">Sign in or check your account</a>.</p><JoinRequestForm/><p className="career-muted">If you submitted the older series form, it may have saved only on your device. That form did not deliver an application to the league. Submit through this form if you have not received a confirmed league registration.</p></main>;
}
