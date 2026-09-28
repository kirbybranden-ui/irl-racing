import React from "react";
import { AppShell } from "../components/layout/AppShell";
import teamLogo from "../assets/teams/19XI.png";
import toyotaLogo from "../assets/manufacturers/toyota.png";
import cinematicReference from "../assets/season2-cinematic-reference.png";

const tasks = [
  ["INTERVIEW", "Post-Race Interview", "Complete before Friday"],
  ["SCHEME", "Paint Scheme Approval", "Due in 2 days"],
  ["CONTRACT", "Contract Review", "1 item pending"],
];

export default function FoundationPreviewPage() {
  const theme = {
    "--team-primary": "#8d38ff",
    "--team-secondary": "#4a11a8",
    "--team-glow": "rgba(141,56,255,.42)",
    "--team-soft": "rgba(141,56,255,.12)",
  };

  return (
    <AppShell currentUser={{ displayName: "Bowhunter", roleLabel: "Driver • 19XI Racing", driverNumber: "23" }} currentPath="/foundation-preview">
      <div className="cinematic-home" style={theme}>
        <section className="cinematic-hero">
          <img className="cinematic-hero__art" src={cinematicReference} alt="" />
          <div className="cinematic-hero__shade" />
          <div className="cinematic-hero__copy">
            <img src={teamLogo} className="cinematic-team-logo" alt="19XI Racing" />
            <div className="cinematic-eyebrow">FAITH <i/> FAMILY <i/> RACING <i/> PURPOSE</div>
            <span className="cinematic-welcome">WELCOME BACK,</span>
            <h1>BOWHUNTER</h1>
            <p className="cinematic-meta">DRIVER <b>//</b> #23 <b>//</b> 19XI RACING <b>//</b> TOYOTA</p>
            <p className="cinematic-script">Same Vision. Higher Ground.</p>
            <div className="cinematic-actions"><a href="/owners">My Team <span>→</span></a><a href="/driver/23">Driver Profile</a></div>
          </div>
          <div className="cinematic-number">23</div>
        </section>

        <div className="cinematic-ticker"><strong>● &nbsp; TRENDING</strong><span>19XI ready to make noise in Season 2.</span><i/> <span>Daytona opens the season.</span><i/> <span>31 drivers. 1 goal.</span></div>

        <section className="cinematic-race">
          <div className="cinematic-race__copy">
            <span className="cinematic-label">NEXT UP</span><h2>DAYTONA</h2><p>SEASON 2 &nbsp; • &nbsp; RACE 1<br/>DAYTONA INTERNATIONAL SPEEDWAY</p>
            <div className="cinematic-countdown"><b>12<small>DAYS</small></b><b>05<small>HRS</small></b><b>32<small>MINS</small></b><b>17<small>SECS</small></b></div>
            <div className="cinematic-actions"><a href="#tasks">Race Week Hub <span>→</span></a><a href="/schedule">View Schedule</a></div>
          </div>
          <div className="cinematic-race__statement"><span>History.</span><span>Speed.</span><span>Opportunity.</span><small>NEW SEASON.<br/>SAME FIGHT.<br/>BIGGER GOALS.</small></div>
        </section>

        <section id="tasks" className="cinematic-tasks">
          <div className="cinematic-row-title"><h3>3 THINGS NEED YOUR ATTENTION</h3><a href="#tasks">View All Tasks →</a></div>
          <div className="cinematic-task-row">
            {tasks.map(([type,title,due],i)=><a href="#tasks" className="cinematic-task" key={title}><span className="cinematic-task__icon">0{i+1}</span><span><small>{type}</small><b>{title}</b><em>{due}</em></span><strong>→</strong></a>)}
          </div>
        </section>

        <section className="cinematic-paddock">
          <div className="cinematic-row-title"><h3>FROM THE PADDOCK</h3><a href="/news">View All →</a></div>
          <div className="cinematic-filters"><button>All</button><span>News</span><span>Team</span><span>Interviews</span><span>BRL Updates</span></div>
          <div className="cinematic-stories">
            <a href="/news" className="cinematic-story"><div className="cinematic-story__visual cinematic-story__visual--1"><span>SEASON 2</span></div><small>BRL SEASON 2 PREVIEW</small><h4>Pressure Builds at Daytona</h4><p>A new season. New rivalries. Same mission.</p></a>
            <a href="/news" className="cinematic-story"><div className="cinematic-story__visual cinematic-story__visual--2"><img src={teamLogo} alt=""/></div><small>BEHIND THE SCENES</small><h4>Inside 19XI: Ready for More</h4><p>Team identity follows you throughout the app.</p></a>
            <a href="/driver/23" className="cinematic-story"><div className="cinematic-story__visual cinematic-story__visual--3"><span>23</span></div><small>DRIVER SPOTLIGHT</small><h4>Bowhunter: A Higher Purpose</h4><p>Racing. Family. Faith. The story continues.</p></a>
          </div>
        </section>

        <blockquote className="cinematic-quote"><span>“</span><p>IT'S BIGGER THAN RACING. IT'S A PLATFORM TO MAKE A DIFFERENCE.</p><small>— BOWHUNTER</small></blockquote>

        <section className="cinematic-team-footer">
          <div><img src={teamLogo} alt="19XI Racing"/><p>PEOPLE.<br/>PREPARATION.<br/>PURPOSE.</p><a href="/owners">Go to Team HQ →</a></div>
          <div className="cinematic-team-footer__mark"><span>23</span><img src={toyotaLogo} alt="Toyota"/></div>
          <p className="cinematic-script">Same Vision.<br/>Higher Ground.</p>
        </section>
      </div>
    </AppShell>
  );
}
