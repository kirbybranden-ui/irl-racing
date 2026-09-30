import { normalizeTrackName } from './raceHelpers';
export function trackKey(name) { return normalizeTrackName(name).replace(/^Preseason - /i, ''); }
export function positive(value) { const n=Number(value); return Number.isFinite(n)&&n>0?n:null; }
export function estimateHalfDistance(fullLaps) { const n=positive(fullLaps); return n?Math.ceil(n*.5):null; }
export function calculateStrategy(input) {
  const laps=positive(input.raceLaps); const lap=Number(input.startLap||0);
  if(!laps||!Number.isInteger(laps)||!Number.isInteger(lap)||lap<0||lap>=laps)return {error:'Enter a whole race lap count and a planning lap before the finish.'};
  const remaining=laps-lap, multiplier=input.rangeBasis==='3x'?1:3;
  const fuel=positive(input.fuelRange),tires=positive(input.tireRange);
  const fuelWindow=fuel?fuel/multiplier:null,tireWindow=tires?tires/multiplier:null;
  const fuelSaving=Number(input.fuelSaving||0),tireGain=Number(input.tireGain||0);
  if(!Number.isFinite(fuelSaving)||fuelSaving<0||fuelSaving>=100||!Number.isFinite(tireGain)||tireGain<0||tireGain>100)return {error:'Fuel reduction must be 0–99%; tire-life gain must be 0–100%.'};
  const window=(f,t)=>{const values=[f,t].filter(v=>v!==null);return values.length?Math.max(0,Math.floor(Math.min(...values))-1):null;};
  const push=window(fuelWindow,tireWindow),save=window(fuelWindow?fuelWindow/(1-fuelSaving/100):null,tireWindow?tireWindow*(1+tireGain/100):null);
  const stops=w=>w&&w>0?Math.max(0,Math.ceil(remaining/w)-1):null;
  const pushStops=stops(push),saveStops=stops(save),gap=String(input.paceLoss ?? "").trim()!==""&&Number.isFinite(Number(input.paceLoss))&&Number(input.paceLoss)>=0?Number(input.paceLoss):null,pitLoss=positive(input.pitLoss);
  const timeDelta=gap!==null&&pitLoss!==null&&pushStops!==null&&saveStops!==null?(pushStops-saveStops)*pitLoss-remaining*gap:null;
  return {remaining,fuelWindow,tireWindow,pushWindow:push,saveWindow:save,pushStops,saveStops,timeDelta,
    complete:!!fuel&&!!tires,limiter:fuelWindow&&tireWindow?(fuelWindow<=tireWindow?'Fuel':'Tires'):fuelWindow?'Fuel only':tireWindow?'Tires only':'Unknown'};
}
export function conditionAdvice(guide,temperature,rubber) {
  const hot=temperature==='hot',road=guide.kind==='road';
  return [hot?'Hot/slick scenario: back up entry, reduce tire scrub, and use progressive throttle. At 3×, recheck useful tire life before trying to stretch fuel.':'Cool/grippy scenario: test a faster arc, but monitor tire falloff at 3×. Better initial grip does not guarantee a longer stint.',
    rubber==='green'?'Low-rubber scenario: build pace gradually and compare grooves before committing. Early grip may differ from late-race grip.':'Rubbered-in scenario: compare average lap time in the established groove with an alternate lane. Rubber can change balance; one line need not stay fastest.',
    road?'Road-course focus: use lift-and-coast ahead of braking zones without disrupting the car behind; protect exit traction.':'Oval focus: compare smooth momentum with the shorter route. Use repeated 3× practice laps to judge the tradeoff.',
    '50% distance compresses recovery time. Save only when the remaining-lap plan improves after accounting for both fuel and tire stops.'];
}
