import { createClient } from "npm:@supabase/supabase-js@2";
import tracks from "../_shared/mediaTracks.json" with { type: "json" };
import { editorialRules, personalities, publicContext, validateArticle } from "../_shared/mediaCore.ts";

const url = Deno.env.get("SUPABASE_URL")!;
const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const openAIKey = Deno.env.get("OPENAI_API_KEY");
const workerSecret = Deno.env.get("BRL_AI_WORKER_SECRET") || "";
const model = Deno.env.get("BRL_AI_MODEL") || "gpt-5-mini";
const origins = (Deno.env.get("BRL_ALLOWED_ORIGINS") || "https://irl-racing.vercel.app").split(",").map(s => s.trim());
const admin = createClient(url, service, { auth: { persistSession: false, autoRefreshToken: false } });
const check = (r: any) => { if (r.error) throw new Error(r.error.message); return r.data; };
const rpc = async (name: string, args: any = {}) => check(await admin.rpc(name, args));
function constantEqual(a: string, b: string) { let diff=a.length^b.length; for(let i=0;i<Math.max(a.length,b.length);i++) diff|=(a.charCodeAt(i)||0)^(b.charCodeAt(i)||0); return diff===0; }

async function aiRequest(path: string, body: any) {
  if (!openAIKey) throw new Error("AI media is not configured. Add OPENAI_API_KEY to Edge Function secrets.");
  if (!await rpc("brl_ai_take_budget")) throw new Error("AI media is paused or its daily request limit has been reached.");
  const response = await fetch(`https://api.openai.com/v1/${path}`, { method: "POST", headers: { Authorization: `Bearer ${openAIKey}`, "Content-Type": "application/json" }, body: JSON.stringify(body), signal: AbortSignal.timeout(path === "moderations" ? 15000 : 60000) });
  const result = await response.json();
  if (!response.ok) {
    console.error("BRL AI provider failure", response.status, result.error?.code || "unknown");
    throw new Error(response.status===429 ? "AI service is busy or API billing needs attention. Try again later." : "AI generation failed. Check the media function logs.");
  }
  return result;
}
async function moderate(text: string) {
  if (!text.trim()) return [];
  const result = await aiRequest("moderations", { model: "omni-moderation-latest", input: text.slice(0, 22000) });
  const categories=result.results?.[0]?.categories;
  if (!categories) throw new Error("Content checks are unavailable. Try again later.");
  // Criticism, profanity and ordinary racing trash talk are not held by default.
  return ["harassment/threatening", "hate", "hate/threatening", "sexual/minors", "self-harm/intent", "illicit/violent"].filter(k=>categories[k]);
}
async function generate(task: string, context: any, schema: any) {
  const response = await aiRequest("responses", {
    model, store: false, max_output_tokens: 5000,
    ...(model.startsWith("gpt-5") ? { reasoning: { effort: "low" } } : {}),
    input: [{role:"developer",content:editorialRules+"\n"+task},{role:"user",content:JSON.stringify(context)}],
    text: { format: { type: "json_schema", name: "brl_media", strict: true, schema } },
  });
  if (response.status!=="completed") throw new Error("The AI response was incomplete. Retry without retyping your answer.");
  const text = (response.output || []).flatMap((o:any)=>o.content||[]).filter((c:any)=>c.type==="output_text").map((c:any)=>c.text).join("");
  if (!text) throw new Error("AI did not return usable text.");
  return JSON.parse(text);
}
const turnSchema={ type:"object", additionalProperties:false, properties:{reply:{type:"string"},done:{type:"boolean"},review_reasons:{type:"array",items:{type:"string"}}}, required:["reply","done","review_reasons"] };
const articleSchema={type:"object",additionalProperties:false,properties:{title:{type:"string"},paragraphs:{type:"array",items:{type:"string"}},quotes:{type:"array",items:{type:"object",additionalProperties:false,properties:{source_id:{type:"string"},text:{type:"string"}},required:["source_id","text"]}},review_reasons:{type:"array",items:{type:"string"}}},required:["title","paragraphs","quotes","review_reasons"]};
async function league(raceName="") {
  const row=check(await admin.from("league_state").select("data").eq("season_name","irl-league").single());
  return publicContext(row.data,tracks,raceName);
}
async function sourcesFor(context:any) {
  const rows=check(await admin.from("brl_ai_sessions").select("id,driver_name,race_name,messages").eq("season_id",context.seasonId).eq("status","completed").in("kind",["pre","post"]).order("updated_at",{ascending:false}).limit(18));
  return (rows||[]).flatMap((s:any)=>s.messages.filter((m:any)=>m.role==="user").map((m:any)=>({id:`${s.id}:${m.id}`,driver:s.driver_name,race:s.race_name,text:m.text}))).slice(0,70);
}
async function processJob() {
  const j=await rpc("brl_ai_claim_job"); if(!j)return {processed:0};
  try {
    const context=await league(j.race_name);
    if(String(context.seasonId)!==String(j.season_id)) {
      check(await admin.from("brl_ai_jobs").update({status:"cancelled",error:"Season is no longer active.",lease_until:null}).eq("id",j.id).eq("lease_token",j.lease_token));
      return {processed:0,cancelled:true};
    }
    if(j.kind==="recap"&&!context.selectedRace) throw new Error("Published race results are no longer available.");
    if(j.kind==="preview"&&!context.track) throw new Error("This race was removed from the schedule.");
    if(j.kind==="interview") {
      const s=check(await admin.from("brl_ai_sessions").select("status").eq("id",j.session_id).single());
      if(s.status!=="completed")throw new Error("Interview is not cleared for publication.");
    }
    let sources=await sourcesFor(context);
    if(j.kind==="interview") {
      const focused=check(await admin.from("brl_ai_sessions").select("id,driver_name,race_name,messages").eq("id",j.session_id).single());
      const own=focused.messages.filter((m:any)=>m.role==="user").map((m:any)=>({id:`${focused.id}:${m.id}`,driver:focused.driver_name,race:focused.race_name,text:m.text}));
      sources=[...own,...sources.filter((s:any)=>!s.id.startsWith(`${focused.id}:`))].slice(0,70);
    }
    const persona=personalities.find(p=>p.id===(j.kind==="preview"?"crew":j.kind==="recap"?"champion":"story"))!;
    const output=await generate(`Write a vivid 250–500 word ${j.kind} article as ${persona.name}, ${persona.role}. ${persona.style}
For a preview: track strategy, drivers to watch, standings battles, interview storylines; distinguish predictions from verified performance. For a recap use selectedRace only for that race's finish. For interview coverage prioritize sources beginning with the requested session ID, and use actual answers.
Narrative paragraphs MUST NOT contain quotation marks, attributed direct speech, or invented quotes. Put up to 4 literal excerpts ONLY in quotes, using exact source IDs and exact substrings. No markdown. Review reasons cover private information and serious unsupported accusations in both source material and output. Ordinary criticism and racing trash talk are allowed.`,{...context,sources,interviewSession:j.session_id||null},articleSchema);
    const article=validateArticle(output,sources);
    const flags=[...article.reviewReasons,...await moderate(article.title+"\n"+article.content)];
    // A pause/season change while the model worked must prevent publication.
    const latest=await league(j.race_name);
    if(String(latest.seasonId)!==String(j.season_id))throw new Error("Active season changed during generation.");
    if(JSON.stringify(latest.selectedRace)!==JSON.stringify(context.selectedRace)||JSON.stringify(latest.track)!==JSON.stringify(context.track))throw new Error("Race data changed during generation. Retrying with current facts.");
    const id=await rpc("brl_ai_publish_job",{target:j.id,token:j.lease_token,article:{...article,category:j.kind==="preview"?"Race Preview":j.kind==="recap"?"Race Recap":"Paddock Interview",byline:`${persona.name} · BRL AI Media`,image_url:context.track?.facts?.imageUrl||null,status:flags.length?"review":"published",review_reasons:[...new Set(flags)],source_snapshot:{...context,sources}}});
    return {processed:1,articleId:id,held:flags.length>0};
  } catch(error) {
    const message=error instanceof Error?error.message:"Article generation failed.";
    check(await admin.from("brl_ai_jobs").update({status:message.includes("daily request limit")?"pending":j.attempts>=3?"failed":"pending",attempts:message.includes("daily request limit")?j.attempts-1:j.attempts,error:message,lease_until:null,updated_at:new Date().toISOString()}).eq("id",j.id).eq("lease_token",j.lease_token));
    throw error;
  }
}

Deno.serve(async request=>{
  const origin=request.headers.get("Origin")||"";
  const headers={"Access-Control-Allow-Origin":origins.includes(origin)?origin:origins[0],"Access-Control-Allow-Headers":"authorization, apikey, content-type, x-client-info, x-brl-worker","Access-Control-Allow-Methods":"POST, OPTIONS","Content-Type":"application/json","Cache-Control":"no-store","Vary":"Origin"};
  const reply=(status:number,data:any)=>new Response(JSON.stringify(data),{status,headers});
  if(origin&&!origins.includes(origin))return reply(403,{error:"Origin not allowed."});
  if(request.method==="OPTIONS")return new Response(null,{headers});
  if(request.method!=="POST")return reply(405,{error:"POST required."});
  let reserved:any=null;
  try {
    const body=await request.json();
    const isWorker=workerSecret.length>=32&&constantEqual(request.headers.get("x-brl-worker")||"",workerSecret);
    if(isWorker) {
      if(body.action!=="worker")return reply(403,{error:"Invalid worker action."});
      await rpc("brl_ai_queue_calendar",{force_preview:false});
      return reply(200,await processJob());
    }
    const bearer=request.headers.get("Authorization")?.replace(/^Bearer\s+/i,"")||"";
    const {data:{user},error}=await admin.auth.getUser(bearer);
    if(error||!user)return reply(401,{error:"Log in as a driver to use the media desk."});
    const account=check(await admin.from("brl_accounts").select("driver_id,driver_name,roles,active").eq("auth_user_id",user.id).single());
    if(!account.active)return reply(403,{error:"This driver account is inactive."});
    const fullAdmin=account.roles.includes("full_admin");
    const settings=check(await admin.from("brl_ai_settings").select("*").eq("id",true).single());
    if(body.action==="status")return reply(200,{configured:Boolean(openAIKey),workerConfigured:workerSecret.length>=32,enabled:settings.enabled,personalities});
    if(!settings.enabled)return reply(409,{error:"AI media is paused by the admin."});
    if(!openAIKey)return reply(503,{error:"Add OPENAI_API_KEY to Supabase Edge Function secrets to enable AI media."});
    if(["run","preview","retry"].includes(body.action)) {
      if(!fullAdmin)return reply(403,{error:"Full admin required."});
      if(body.action==="retry") {
        const job=check(await admin.from("brl_ai_jobs").select("status").eq("id",body.jobId).single());
        if(!["failed","done"].includes(job.status))return reply(409,{error:"This job is already queued or running."});
        check(await admin.from("brl_ai_jobs").update({status:"pending",attempts:0,error:null,lease_until:null}).eq("id",body.jobId).eq("status",job.status));
      }
      await rpc("brl_ai_queue_calendar",{force_preview:body.action==="preview"});
      return reply(200,await processJob());
    }
    const allowed=await rpc("brl_login_allowed",{bucket_key:`ai-media:${user.id}`});
    if(!allowed)return reply(429,{error:"Too many requests. Wait a few minutes before continuing."});
    let session:any;
    if(body.action==="start") {
      if(!["pre","post","strategy"].includes(body.kind))return reply(400,{error:"Select pre-race, post-race, or strategy."});
      const context=await league(String(body.raceName||""));
      const driver=context.drivers.find((d:any)=>String(d.id)===String(account.driver_id));
      if(!driver)return reply(403,{error:"You are not on the active roster."});
      if(!context.track)return reply(400,{error:"Select a published race."});
      if(body.kind==="post"&&!context.selectedRace)return reply(409,{error:"Post-race interviews open after results are published."});
      const persona=body.kind==="strategy"?"crew":personalities.find(p=>p.id===body.persona)?.id||"pit";
      const existing=check(await admin.from("brl_ai_sessions").select("*").eq("season_id",context.seasonId).eq("driver_id",account.driver_id).eq("race_name",body.raceName).eq("kind",body.kind).maybeSingle());
      session=existing;
      if(!session) {
        const insert=await admin.from("brl_ai_sessions").insert({season_id:context.seasonId,driver_id:account.driver_id,driver_name:driver.name,race_name:body.raceName,kind:body.kind,persona}).select().single();
        if(insert.error?.code==="23505")session=check(await admin.from("brl_ai_sessions").select("*").eq("season_id",context.seasonId).eq("driver_id",account.driver_id).eq("race_name",body.raceName).eq("kind",body.kind).single());
        else session=check(insert);
      }
      if(session.messages.length||session.status!=="active")return reply(200,{session});
    } else if(["answer","resume","finish"].includes(body.action)) {
      session=check(await admin.from("brl_ai_sessions").select("*").eq("id",body.sessionId).single());
      if(String(session.driver_id)!==String(account.driver_id))return reply(403,{error:"You can only answer your own interview."});
      if(!Number.isInteger(body.version)||body.version!==session.version)return reply(409,{error:"Conversation changed. Reload before replying."});
    } else return reply(400,{error:"Unknown media action."});
    const context=await league(session.race_name);
    if(String(session.season_id)!==String(context.seasonId))return reply(409,{error:"This interview belongs to a previous season."});
    const driver=context.drivers.find((d:any)=>String(d.id)===String(account.driver_id));
    if(!driver)return reply(403,{error:"You are no longer on the active roster."});
    const userCount=session.messages.filter((m:any)=>m.role==="user").length;
    if(body.action==="finish"&&!userCount)return reply(409,{error:"Answer at least one question before completing media."});
    if(body.action==="resume"&&session.messages.length&&session.messages.at(-1)?.role!=="user")return reply(409,{error:"The interviewer is waiting for your answer."});
    const token=crypto.randomUUID();
    reserved=await rpc("brl_ai_reserve_turn",{target:session.id,expected_version:session.version,user_answer:body.action==="answer"?String(body.answer||""):null,token});
    const last=reserved.messages.at(-1);
    const flags=await moderate(last?.role==="user"?last.text:"");
    const persona=personalities.find(p=>p.id===reserved.persona)||personalities[0];
    const userTurns=reserved.messages.filter((m:any)=>m.role==="user").length;
    let output:any;
    if(flags.length)output={reply:"Let's pause here. This interview needs a league admin to check it before we continue.",done:true,review_reasons:flags};
    else output=await generate(`You are an AI persona inspired by ${persona.name}, serving as a BRL ${persona.role}. You are not the real person and must never claim their identity, endorsement or personal experiences. ${persona.style}
Have a real conversation. Opening: ONE concise question based on driver and race evidence. After each answer acknowledge something specific and ask at most ONE useful follow-up. No question lists, no repeated canned questions, no answering for the driver. Emotion and racing banter should flow from what the driver actually says. Never pressure a reluctant driver. Conclude naturally when there is no useful follow-up or when driver asks to stop; completed interviews require at least one driver answer. Whenever a pre-race or post-race interview ends, close like a TV pit reporter: thank the driver by their supplied name, briefly acknowledge one specific point from their actual answers when available, and finish with a natural sign-off suited to the race context. Use 1-3 short sentences in your own personality. Do not invent quotes, results, broadcast colleagues, or future events. Do not ask another question or invite another answer in a closing. For a strategy conversation, instead give a brief supportive crew-chief wrap-up based on the discussion. ${body.action==="finish"||userTurns>=12?"Wrap up has been requested. Your entire reply must be the final sign-off described above, with no further question. Set done=true.":""}
For strategy mode help with practice and handling, asking one clarifying question as needed. Flag private information or unsupported serious accusations in driver answers. Keep reply under 1600 characters.`,{...context,driver,kind:reserved.kind,transcript:reserved.messages.map((m:any)=>({role:m.role,text:m.text}))},turnSchema);
    if(typeof output.reply!=="string"||!output.reply.trim()||output.reply.length>1600||typeof output.done!=="boolean"||!Array.isArray(output.review_reasons))throw new Error("The interviewer response was invalid. Retry your saved reply.");
    const outputFlags=await moderate(output.reply);
    const reviewReasons=[...new Set([...flags,...output.review_reasons,...outputFlags])];
    if(!userTurns&&!reviewReasons.length)output.done=false;
    const result=await rpc("brl_ai_finish_turn",{target:reserved.id,token,reply_text:output.reply,closed:output.done||body.action==="finish"||userTurns>=12,flags:reviewReasons});
    reserved=null;
    return reply(200,{session:result});
  } catch(error) {
    if(reserved)await admin.from("brl_ai_sessions").update({lease_until:null,lease_token:null}).eq("id",reserved.id).eq("lease_token",reserved.lease_token);
    const message=error instanceof Error?error.message:"AI media request failed.";
    console.error("BRL media failed",message);
    return reply(503,{error:message});
  }
});
