import { useState, useEffect, useRef, useCallback } from "react";
import * as d3 from "d3";

// ─── THEME ─────────────────────────────────────────────────────────────────────
const C = {
  bg: "#050810", surface: "#080d17", panel: "#0c1420", panelAlt: "#0f1928",
  border: "#162235", borderHi: "#1e3350", borderGlow: "#00d4ff30",
  accent: "#00d4ff", accentDim: "rgba(0,212,255,0.12)", accentMid: "rgba(0,212,255,0.25)",
  green: "#00e5a0", greenDim: "rgba(0,229,160,0.12)",
  amber: "#ffa940", amberDim: "rgba(255,169,64,0.12)",
  red: "#ff4d6a", redDim: "rgba(255,77,106,0.12)",
  purple: "#a78bfa", purpleDim: "rgba(167,139,250,0.12)",
  text: "#c8dff0", textMid: "#7a9fc0", muted: "#344d6a", white: "#f0f8ff",
};

const LANG_EXT = { javascript:"js", typescript:"ts", python:"py", php:"php", java:"java", go:"go", ruby:"rb", rust:"rs", css:"css", html:"html" };
const LANG_COL = { javascript:"#f0db4f", typescript:"#3178c6", python:"#3572A5", java:"#b07219", php:"#777bb4", ruby:"#701516", go:"#00add8", rust:"#dea584", css:"#563d7c", html:"#e34c26" };
const langColor = l => LANG_COL[l?.toLowerCase()] || C.accent;
const langExt   = l => LANG_EXT[l?.toLowerCase()] || "txt";

const CAT_COL = { Syntax:C.accent, Async:C.amber, Types:C.purple, APIs:C.green, Security:C.red, Style:"#fb923c", Performance:C.green, Dead:"#64748b" };

// ─── GLOBAL CSS ─────────────────────────────────────────────────────────────────
const GLOBAL_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Geist+Mono:wght@300;400;500;600;700&family=Syne:wght@600;700;800&display=swap');
*{box-sizing:border-box;margin:0;padding:0}
::selection{background:${C.accentMid}}
::-webkit-scrollbar{width:4px;height:4px}
::-webkit-scrollbar-track{background:${C.surface}}
::-webkit-scrollbar-thumb{background:${C.border};border-radius:4px}
::-webkit-scrollbar-thumb:hover{background:${C.borderHi}}
textarea::placeholder{color:${C.muted};opacity:1}
textarea,button,input,select{font-family:'Geist Mono',monospace}
button{cursor:pointer}

@keyframes spin{to{transform:rotate(360deg)}}
@keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
@keyframes slideRight{from{opacity:0;transform:translateX(-12px)}to{opacity:1;transform:translateX(0)}}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.35}}
@keyframes gradShift{0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%}}
@keyframes borderGlow{0%,100%{box-shadow:0 0 0 1px ${C.border}}50%{box-shadow:0 0 0 1px ${C.accent}44,0 0 20px ${C.accentDim}}}
@keyframes countUp{from{opacity:0;transform:scale(.8)}to{opacity:1;transform:scale(1)}}
@keyframes scanline{0%{top:-6px}100%{top:100%}}
@keyframes scanpulse{0%,100%{opacity:.7}50%{opacity:1}}
@keyframes scanflicker{0%,100%{opacity:1}45%{opacity:.85}50%{opacity:1}95%{opacity:.9}}
@keyframes borderScan{0%,100%{border-color:${C.border}}50%{border-color:${C.accent}88;box-shadow:0 0 0 1px ${C.accent}22,0 0 24px ${C.accentDim}}}
.scan-wrap{position:relative}
.scan-wrap.scanning{animation:borderScan 1.8s ease-in-out infinite}
.scan-line{pointer-events:none;position:absolute;left:0;right:0;height:2px;background:linear-gradient(90deg,transparent,${C.accent},${C.accent}cc,${C.accent},transparent);animation:scanline 1.6s cubic-bezier(.4,0,.6,1) infinite;z-index:10;box-shadow:0 0 12px 3px ${C.accent}55,0 0 30px 8px ${C.accentDim}}
.scan-line::before{content:'';position:absolute;left:0;right:0;top:-18px;height:18px;background:linear-gradient(to top,${C.accent}18,transparent);pointer-events:none}
.scan-line::after{content:'';position:absolute;left:0;right:0;top:2px;height:18px;background:linear-gradient(to bottom,${C.accent}18,transparent);pointer-events:none}
.scan-overlay{pointer-events:none;position:absolute;inset:0;background:repeating-linear-gradient(0deg,transparent,transparent 2px,${C.accent}04 2px,${C.accent}04 4px);z-index:9;animation:scanflicker 3s ease infinite;border-radius:inherit}
.scan-vignette{pointer-events:none;position:absolute;inset:0;background:radial-gradient(ellipse at center,transparent 60%,${C.accentDim} 100%);z-index:8;border-radius:inherit}
.scan-label{position:absolute;top:10px;right:12px;z-index:11;font-size:9px;letter-spacing:.2em;color:${C.accent};font-family:'Geist Mono',monospace;animation:scanpulse 1s ease infinite;display:flex;align-items:center;gap:5px}
.scan-label::before{content:'';width:5px;height:5px;border-radius:50%;background:${C.accent};display:block;animation:pulse .8s ease infinite;box-shadow:0 0 6px ${C.accent}}
.scan-corner{position:absolute;width:14px;height:14px;z-index:11}
.sc-tl{top:0;left:0;border-top:2px solid ${C.accent};border-left:2px solid ${C.accent}}
.sc-tr{top:0;right:0;border-top:2px solid ${C.accent};border-right:2px solid ${C.accent}}
.sc-bl{bottom:0;left:0;border-bottom:2px solid ${C.accent};border-left:2px solid ${C.accent}}
.sc-br{bottom:0;right:0;border-bottom:2px solid ${C.accent};border-right:2px solid ${C.accent}}
@keyframes riskFill{from{stroke-dashoffset:440}to{}}

.btn-cta{background:${C.accent};color:#000;border:none;border-radius:8px;padding:13px 30px;font-size:13px;font-weight:700;letter-spacing:.07em;display:flex;align-items:center;gap:8px;transition:all .2s;box-shadow:0 0 30px rgba(0,212,255,.25),0 2px 10px rgba(0,0,0,.5)}
.btn-cta:hover:not(:disabled){background:#2de0ff;box-shadow:0 0 50px rgba(0,212,255,.4),0 2px 15px rgba(0,0,0,.5);transform:translateY(-2px)}
.btn-cta:active:not(:disabled){transform:translateY(0)}
.btn-cta:disabled{opacity:.25;cursor:not-allowed;box-shadow:none}

.btn-ghost{background:none;border:1px solid ${C.border};border-radius:8px;color:${C.muted};padding:12px 20px;font-size:12px;letter-spacing:.05em;transition:all .15s}
.btn-ghost:hover{color:${C.text};border-color:${C.borderHi}}

.btn-icon{background:none;border:1px solid ${C.border};border-radius:6px;color:${C.muted};padding:5px 10px;font-size:11px;display:flex;align-items:center;gap:5px;transition:all .15s;letter-spacing:.04em}
.btn-icon:hover{color:${C.text};border-color:${C.borderHi}}
.btn-icon.success{color:${C.green};border-color:${C.green}44}

.tab{background:none;border:none;border-bottom:2px solid transparent;color:${C.muted};padding:10px 18px;font-size:11px;letter-spacing:.12em;text-transform:uppercase;transition:all .15s;margin-bottom:-1px}
.tab:hover{color:${C.textMid}}
.tab.on{color:${C.accent};border-bottom-color:${C.accent}}

.nav-item{background:none;border:none;color:${C.muted};padding:8px 14px;font-size:11px;letter-spacing:.1em;text-transform:uppercase;transition:all .15s;border-radius:6px;display:flex;align-items:center;gap:7px}
.nav-item:hover{color:${C.text};background:${C.panelAlt}}
.nav-item.on{color:${C.accent};background:${C.accentDim}}

.card{background:${C.panel};border:1px solid ${C.border};border-radius:12px;transition:border-color .2s,background .15s}
.card:hover{border-color:${C.borderHi}}

.change-row{animation:slideRight .3s ease forwards;opacity:0}
.stat-anim{animation:countUp .4s ease forwards}
.fade-up{animation:fadeUp .5s ease forwards}

.risk-low{color:${C.green}}
.risk-med{color:${C.amber}}
.risk-high{color:${C.red}}

.tooltip{position:absolute;background:${C.panelAlt};border:1px solid ${C.borderHi};border-radius:7px;padding:8px 12px;font-size:11px;color:${C.text};pointer-events:none;white-space:nowrap;z-index:999;box-shadow:0 8px 24px rgba(0,0,0,.5)}
`;

// ─── PROMPTS ────────────────────────────────────────────────────────────────────
const MAIN_PROMPT = `You are a world-class code analysis and modernization engine. Analyze the provided code deeply and return ONLY a valid JSON object (no markdown, no backticks, no extra text) with this exact structure:
{
  "language": "string - detected language",
  "version_from": "string - e.g. ES5, Python 2.7, PHP 5",
  "version_to": "string - e.g. ES2024, Python 3.12, PHP 8.3",
  "modernized": "string - fully modernized code",
  "summary": "string - 2-3 sentence overview",
  "score_before": number 1-100,
  "score_after": number 1-100,
  "risk_score": number 0-100 (higher = more risky/problematic original code),
  "changes": [{"category":"Syntax|Async|Types|APIs|Security|Style|Performance|Dead","description":"string"}],
  "functions": [{"name":"string","lines":number,"complexity":number 1-10,"description":"string","dead":boolean}],
  "dependencies": [{"name":"string","type":"builtin|external|internal","used":boolean}],
  "metrics": {
    "lines_total": number,
    "lines_code": number,
    "num_functions": number,
    "avg_complexity": number,
    "max_complexity": number,
    "dead_code_pct": number 0-100,
    "duplicate_pct": number 0-100,
    "comment_pct": number 0-100
  },
  "suggestions": [{"type":"modularize|extract|rename|remove|optimize|security","priority":"high|medium|low","message":"string","line":number or null}],
  "bugs": [{"severity":"critical|warning|info","message":"string","line":number or null}],
  "dep_graph": [{"from":"string","to":"string"}]
}
Rules: Be accurate and detailed. Return 3-8 changes, up to 10 functions, up to 8 dependencies, 3-6 suggestions, 0-4 bugs. dep_graph shows function call relationships.`;

// ─── ICONS ──────────────────────────────────────────────────────────────────────
const I = {
  bolt:  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" fill="rgba(0,0,0,0.15)"/></svg>,
  copy:  <svg width="11" height="11" viewBox="0 0 24 24" fill="none"><rect x="9" y="9" width="13" height="13" rx="2" stroke="currentColor" strokeWidth="1.8"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" stroke="currentColor" strokeWidth="1.8"/></svg>,
  check: <svg width="11" height="11" viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/></svg>,
  spin:  <svg width="14" height="14" viewBox="0 0 24 24" style={{animation:"spin .8s linear infinite"}}><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2.5" fill="none" strokeDasharray="40 20"/></svg>,
  code:  <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><polyline points="16 18 22 12 16 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><polyline points="8 6 2 12 8 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>,
  graph: <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><circle cx="18" cy="5" r="3" stroke="currentColor" strokeWidth="1.8"/><circle cx="6" cy="12" r="3" stroke="currentColor" strokeWidth="1.8"/><circle cx="18" cy="19" r="3" stroke="currentColor" strokeWidth="1.8"/><line x1="15.2" y1="6.6" x2="8.8" y2="10.4" stroke="currentColor" strokeWidth="1.5"/><line x1="8.8" y1="13.6" x2="15.2" y2="17.4" stroke="currentColor" strokeWidth="1.5"/></svg>,
  chart: <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><rect x="18" y="3" width="4" height="18" rx="1" stroke="currentColor" strokeWidth="1.8"/><rect x="10" y="8" width="4" height="13" rx="1" stroke="currentColor" strokeWidth="1.8"/><rect x="2" y="13" width="4" height="8" rx="1" stroke="currentColor" strokeWidth="1.8"/></svg>,
  bug:   <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M9 2h6l1 3H8L9 2z" stroke="currentColor" strokeWidth="1.8"/><path d="M12 8c-3.31 0-6 2.69-6 6v3c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2v-3c0-3.31-2.69-6-6-6z" stroke="currentColor" strokeWidth="1.8"/><line x1="12" y1="8" x2="12" y2="5" stroke="currentColor" strokeWidth="1.8"/><line x1="6" y1="12" x2="3" y2="10" stroke="currentColor" strokeWidth="1.8"/><line x1="18" y1="12" x2="21" y2="10" stroke="currentColor" strokeWidth="1.8"/><line x1="6" y1="17" x2="3" y2="19" stroke="currentColor" strokeWidth="1.8"/><line x1="18" y1="17" x2="21" y2="19" stroke="currentColor" strokeWidth="1.8"/></svg>,
  star:  <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/></svg>,
  diff:  <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M9 3H5a2 2 0 00-2 2v14a2 2 0 002 2h4M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4M12 8v8M9 12h6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>,
  upload:<svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  export:<svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>,
};

// ─── SCORE RING ─────────────────────────────────────────────────────────────────
function ScoreRing({ score, label, color, size=68 }) {
  const r = size/2 - 6, circ = 2*Math.PI*r, dash = (score/100)*circ;
  return (
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:5}}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={C.border} strokeWidth="4"/>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth="4"
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
          transform={`rotate(-90 ${size/2} ${size/2})`}
          style={{transition:"stroke-dasharray 1.2s ease",filter:`drop-shadow(0 0 5px ${color}77)`}}/>
        <text x={size/2} y={size/2+5} textAnchor="middle" fill={color}
          style={{fontSize:size*.22,fontFamily:"'Geist Mono',monospace",fontWeight:700}}>{score}</text>
      </svg>
      <span style={{fontSize:9,color:C.muted,letterSpacing:".14em",textTransform:"uppercase"}}>{label}</span>
    </div>
  );
}

// ─── RISK GAUGE ─────────────────────────────────────────────────────────────────
function RiskGauge({ score }) {
  const color = score < 35 ? C.green : score < 65 ? C.amber : C.red;
  const label = score < 35 ? "LOW" : score < 65 ? "MEDIUM" : "HIGH";
  const r = 40, circ = Math.PI * r; // semicircle
  const dash = (score/100) * circ;
  return (
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
      <svg width="110" height="65" viewBox="0 0 110 65">
        <path d="M 10 60 A 45 45 0 0 1 100 60" fill="none" stroke={C.border} strokeWidth="8" strokeLinecap="round"/>
        <path d="M 10 60 A 45 45 0 0 1 100 60" fill="none" stroke={color} strokeWidth="8" strokeLinecap="round"
          strokeDasharray={`${dash * 1.18} 999`}
          style={{transition:"stroke-dasharray 1.2s ease",filter:`drop-shadow(0 0 6px ${color}66)`}}/>
        <text x="55" y="55" textAnchor="middle" fill={color} style={{fontSize:20,fontFamily:"'Geist Mono',monospace",fontWeight:700}}>{score}</text>
      </svg>
      <span style={{fontSize:9,letterSpacing:".18em",color,fontFamily:"'Geist Mono',monospace",fontWeight:600}}>{label} RISK</span>
    </div>
  );
}

// ─── DEPENDENCY GRAPH ───────────────────────────────────────────────────────────
function DepGraph({ depGraph, functions }) {
  const svgRef = useRef(null);
  useEffect(() => {
    if (!svgRef.current) return;
    const el = svgRef.current;
    el.innerHTML = "";
    const W = el.clientWidth || 560, H = 320;
    const allNames = [...new Set([...(depGraph||[]).map(d=>d.from), ...(depGraph||[]).map(d=>d.to)])];
    if (!allNames.length && functions?.length) allNames.push(...functions.map(f=>f.name));
    if (!allNames.length) { el.innerHTML = `<text x="${W/2}" y="${H/2}" text-anchor="middle" fill="${C.muted}" font-family="'Geist Mono',monospace" font-size="12">No dependency data</text>`; return; }
    const nodes = allNames.map(id=>({id}));
    const links = (depGraph||[]).map(d=>({source:d.from,target:d.to}));
    const svg = d3.select(el).attr("width",W).attr("height",H);
    svg.append("defs").append("marker").attr("id","arrow").attr("viewBox","0 -5 10 10").attr("refX",22).attr("markerWidth",6).attr("markerHeight",6).attr("orient","auto")
      .append("path").attr("d","M0,-5L10,0L0,5").attr("fill",C.borderHi);
    const sim = d3.forceSimulation(nodes)
      .force("link",d3.forceLink(links).id(d=>d.id).distance(90))
      .force("charge",d3.forceManyBody().strength(-220))
      .force("center",d3.forceCenter(W/2,H/2))
      .force("collide",d3.forceCollide(40));
    const link = svg.append("g").selectAll("line").data(links).enter().append("line")
      .attr("stroke",C.borderHi).attr("stroke-width",1.5).attr("marker-end","url(#arrow)").attr("opacity",.7);
    const node = svg.append("g").selectAll("g").data(nodes).enter().append("g").call(
      d3.drag().on("start",(e,d)=>{if(!e.active)sim.alphaTarget(.3).restart();d.fx=d.x;d.fy=d.y})
               .on("drag",(e,d)=>{d.fx=e.x;d.fy=e.y})
               .on("end",(e,d)=>{if(!e.active)sim.alphaTarget(0);d.fx=null;d.fy=null})
    );
    node.append("circle").attr("r",18).attr("fill",C.panel).attr("stroke",C.accent).attr("stroke-width",1.5)
      .style("filter",`drop-shadow(0 0 6px ${C.accentDim})`);
    node.append("text").attr("text-anchor","middle").attr("dy","4").attr("fill",C.text)
      .attr("font-size",9).attr("font-family","'Geist Mono',monospace").text(d=>d.id.length>10?d.id.slice(0,9)+"…":d.id);
    sim.on("tick",()=>{
      link.attr("x1",d=>d.source.x).attr("y1",d=>d.source.y).attr("x2",d=>d.target.x).attr("y2",d=>d.target.y);
      node.attr("transform",d=>`translate(${Math.max(22,Math.min(W-22,d.x))},${Math.max(22,Math.min(H-22,d.y))})`);
    });
    return ()=>sim.stop();
  }, [depGraph, functions]);
  return <svg ref={svgRef} style={{width:"100%",height:320,display:"block"}}/>;
}

// ─── COMPLEXITY BAR CHART ───────────────────────────────────────────────────────
function ComplexityChart({ functions }) {
  if (!functions?.length) return <div style={{textAlign:"center",color:C.muted,padding:40,fontSize:12}}>No function data</div>;
  const max = Math.max(...functions.map(f=>f.complexity), 1);
  return (
    <div style={{padding:"16px 4px 4px"}}>
      <div style={{display:"flex",flexDirection:"column",gap:8}}>
        {functions.map((f,i) => {
          const pct = (f.complexity/10)*100;
          const col = f.complexity<=3?C.green:f.complexity<=6?C.amber:C.red;
          return (
            <div key={i} style={{display:"flex",alignItems:"center",gap:10,animation:`slideRight .3s ease ${i*50}ms forwards`,opacity:0}}>
              <div style={{width:110,fontSize:11,color:f.dead?C.muted:C.text,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",fontFamily:"'Geist Mono',monospace"}}>
                {f.dead?<s style={{color:C.muted}}>{f.name}</s>:f.name}
              </div>
              <div style={{flex:1,height:22,background:C.surface,borderRadius:4,overflow:"hidden",position:"relative",border:`1px solid ${C.border}`}}>
                <div style={{height:"100%",width:`${pct}%`,background:`linear-gradient(90deg, ${col}88, ${col})`,borderRadius:3,transition:"width 1s ease",boxShadow:`0 0 8px ${col}44`}}/>
                <span style={{position:"absolute",right:8,top:"50%",transform:"translateY(-50%)",fontSize:10,color:C.muted,fontFamily:"'Geist Mono',monospace"}}>{f.complexity}/10</span>
              </div>
              {f.dead && <span style={{fontSize:9,color:C.muted,background:C.panelAlt,border:`1px solid ${C.border}`,borderRadius:3,padding:"1px 6px",letterSpacing:".06em"}}>DEAD</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── METRICS GRID ──────────────────────────────────────────────────────────────
function MetricsGrid({ metrics, score_before, score_after, risk_score }) {
  const items = [
    { label:"Lines of Code",   val:metrics?.lines_code,        unit:"",  color:C.accent },
    { label:"Functions",       val:metrics?.num_functions,     unit:"",  color:C.purple },
    { label:"Avg Complexity",  val:metrics?.avg_complexity,    unit:"",  color:metrics?.avg_complexity>5?C.red:C.green },
    { label:"Max Complexity",  val:metrics?.max_complexity,    unit:"",  color:metrics?.max_complexity>7?C.red:C.amber },
    { label:"Dead Code",       val:metrics?.dead_code_pct,     unit:"%", color:C.muted },
    { label:"Duplicates",      val:metrics?.duplicate_pct,     unit:"%", color:metrics?.duplicate_pct>20?C.red:C.muted },
    { label:"Comments",        val:metrics?.comment_pct,       unit:"%", color:C.textMid },
    { label:"Dependencies",    val:metrics?.dep_count,         unit:"",  color:C.textMid },
  ].filter(x => x.val !== undefined && x.val !== null);
  return (
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(130px,1fr))",gap:10,padding:"4px 0"}}>
      {items.map((m,i) => (
        <div key={i} className="card" style={{padding:"14px 16px",background:C.panel,animation:`countUp .4s ease ${i*60}ms forwards`,opacity:0}}>
          <div style={{fontSize:22,fontWeight:700,color:m.color,fontFamily:"'Syne',sans-serif",lineHeight:1}}>
            {m.val}{m.unit}
          </div>
          <div style={{fontSize:10,color:C.muted,marginTop:5,letterSpacing:".1em"}}>{m.label.toUpperCase()}</div>
        </div>
      ))}
    </div>
  );
}

// ─── LINE NUMBERS SIDEBAR ───────────────────────────────────────────────────────
function LineNums({ count }) {
  return (
    <div style={{padding:"12px 0",minWidth:40,background:C.surface,borderRight:`1px solid ${C.border}`,flexShrink:0,userSelect:"none"}}>
      {Array.from({length:count},(_,i)=>(
        <div key={i} style={{fontSize:11,color:C.muted,textAlign:"right",paddingRight:9,lineHeight:"1.65",height:"1.65em",fontFamily:"'Geist Mono',monospace"}}>{i+1}</div>
      ))}
    </div>
  );
}

// ─── EDITOR TITLEBAR ────────────────────────────────────────────────────────────
function EditorBar({ filename, meta, right }) {
  return (
    <div style={{display:"flex",alignItems:"center",gap:10,padding:"9px 14px",background:C.surface,borderBottom:`1px solid ${C.border}`}}>
      <div style={{display:"flex",gap:5}}>
        {["#ff5f57","#febc2e","#28c840"].map(c=><span key={c} style={{width:10,height:10,borderRadius:"50%",background:c,display:"block"}}/>)}
      </div>
      <span style={{fontSize:11,color:C.muted,flex:1,fontFamily:"'Geist Mono',monospace",letterSpacing:".04em"}}>{filename}</span>
      {meta && <span style={{fontSize:10,color:C.muted}}>{meta}</span>}
      {right}
    </div>
  );
}

// ─── DIFF VIEW ──────────────────────────────────────────────────────────────────
function DiffView({ before, after }) {
  const bLines = (before||"").split("\n"), aLines = (after||"").split("\n");
  const maxLen = Math.max(bLines.length, aLines.length);
  return (
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:1,background:C.border,borderRadius:12,overflow:"hidden"}}>
      {[{label:"BEFORE",lines:bLines,col:C.red},{label:"AFTER",lines:aLines,col:C.green}].map(({label,lines,col})=>(
        <div key={label} style={{background:C.panel}}>
          <div style={{display:"flex",alignItems:"center",gap:8,padding:"9px 14px",background:C.surface,borderBottom:`1px solid ${C.border}`}}>
            <span style={{width:8,height:8,borderRadius:"50%",background:col,display:"block"}}/>
            <span style={{fontSize:10,color:col,letterSpacing:".15em",fontFamily:"'Geist Mono',monospace"}}>{label}</span>
            <span style={{marginLeft:"auto",fontSize:10,color:C.muted}}>{lines.length} lines</span>
          </div>
          <div style={{display:"flex",maxHeight:440,overflow:"auto"}}>
            <div style={{padding:"12px 0",minWidth:40,background:C.surface,borderRight:`1px solid ${C.border}`,flexShrink:0,userSelect:"none"}}>
              {Array.from({length:maxLen},(_,i)=>(
                <div key={i} style={{fontSize:11,color:C.muted,textAlign:"right",paddingRight:9,lineHeight:"1.65",height:"1.65em",fontFamily:"'Geist Mono',monospace"}}>{i<lines.length?i+1:""}</div>
              ))}
            </div>
            <pre style={{flex:1,padding:"12px 14px",fontSize:12,lineHeight:1.65,color:C.text,fontFamily:"'Geist Mono',monospace",whiteSpace:"pre-wrap",wordBreak:"break-word",margin:0}}>
              {lines.join("\n")}
            </pre>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── SUGGESTIONS ────────────────────────────────────────────────────────────────
function Suggestions({ suggestions }) {
  if (!suggestions?.length) return <div style={{textAlign:"center",color:C.muted,padding:40,fontSize:12}}>No suggestions</div>;
  const priCol = {high:C.red,medium:C.amber,low:C.muted};
  const typeCol = {modularize:C.accent,extract:C.purple,rename:C.textMid,remove:C.red,optimize:C.green,security:C.red};
  return (
    <div style={{display:"flex",flexDirection:"column",gap:8}}>
      {suggestions.map((s,i)=>(
        <div key={i} className="card change-row" style={{padding:"14px 16px",display:"flex",gap:14,alignItems:"flex-start",animationDelay:`${i*60}ms`,background:C.panel}}>
          <span style={{fontSize:9,padding:"3px 8px",borderRadius:4,border:`1px solid ${(typeCol[s.type]||C.textMid)}30`,background:`${(typeCol[s.type]||C.textMid)}12`,color:typeCol[s.type]||C.textMid,letterSpacing:".08em",flexShrink:0,marginTop:1}}>{s.type?.toUpperCase()}</span>
          <div style={{flex:1}}>
            <div style={{fontSize:12,color:C.text,lineHeight:1.7}}>{s.message}</div>
            {s.line && <div style={{fontSize:10,color:C.muted,marginTop:3}}>Line {s.line}</div>}
          </div>
          <span style={{fontSize:9,color:priCol[s.priority]||C.muted,letterSpacing:".1em",fontWeight:600,flexShrink:0}}>{s.priority?.toUpperCase()}</span>
        </div>
      ))}
    </div>
  );
}

// ─── BUGS ───────────────────────────────────────────────────────────────────────
function Bugs({ bugs }) {
  if (!bugs?.length) return (
    <div style={{textAlign:"center",padding:40}}>
      <div style={{fontSize:28,marginBottom:8}}>✓</div>
      <div style={{fontSize:13,color:C.green}}>No bugs detected</div>
    </div>
  );
  const sevCol = {critical:C.red,warning:C.amber,info:C.textMid};
  return (
    <div style={{display:"flex",flexDirection:"column",gap:8}}>
      {bugs.map((b,i)=>(
        <div key={i} className="card change-row" style={{padding:"14px 16px",display:"flex",gap:14,alignItems:"flex-start",animationDelay:`${i*70}ms`,background:C.panel,borderLeft:`3px solid ${sevCol[b.severity]||C.muted}`}}>
          <div style={{flex:1}}>
            <div style={{fontSize:12,color:C.text,lineHeight:1.7}}>{b.message}</div>
            {b.line && <div style={{fontSize:10,color:C.muted,marginTop:3}}>Line {b.line}</div>}
          </div>
          <span style={{fontSize:9,color:sevCol[b.severity]||C.muted,letterSpacing:".1em",fontWeight:700,flexShrink:0}}>{b.severity?.toUpperCase()}</span>
        </div>
      ))}
    </div>
  );
}

// ─── DEPENDENCIES ───────────────────────────────────────────────────────────────
function DepsView({ dependencies }) {
  if (!dependencies?.length) return <div style={{textAlign:"center",color:C.muted,padding:40,fontSize:12}}>No dependencies found</div>;
  const typeCol = {builtin:C.textMid,external:C.accent,internal:C.green};
  const groups = dependencies.reduce((acc,d)=>{(acc[d.type]=acc[d.type]||[]).push(d);return acc},{});
  return (
    <div style={{display:"flex",flexDirection:"column",gap:20}}>
      {Object.entries(groups).map(([type,deps])=>(
        <div key={type}>
          <div style={{fontSize:10,color:C.muted,letterSpacing:".15em",marginBottom:8,paddingLeft:2}}>{type.toUpperCase()} ({deps.length})</div>
          <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
            {deps.map((d,i)=>(
              <div key={i} style={{display:"flex",alignItems:"center",gap:7,background:C.panel,border:`1px solid ${d.used?C.border:`${C.red}44`}`,borderRadius:7,padding:"7px 12px",fontSize:12}}>
                <span style={{width:6,height:6,borderRadius:"50%",background:d.used?typeCol[d.type]:C.red,display:"block"}}/>
                <span style={{color:d.used?C.text:C.muted,fontFamily:"'Geist Mono',monospace"}}>{d.name}</span>
                {!d.used && <span style={{fontSize:9,color:C.red,letterSpacing:".06em"}}>UNUSED</span>}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── CHANGES ────────────────────────────────────────────────────────────────────
function Changes({ changes, summary }) {
  return (
    <div style={{display:"flex",flexDirection:"column",gap:12}}>
      {summary && <div style={{padding:"14px 18px",background:C.panelAlt,border:`1px solid ${C.border}`,borderRadius:10,fontSize:13,color:C.textMid,lineHeight:1.8}}>{summary}</div>}
      <div style={{display:"flex",flexDirection:"column",gap:6}}>
        {changes?.map((c,i)=>{
          const cat=typeof c==="string"?"Style":c.category, desc=typeof c==="string"?c:c.description, col=CAT_COL[cat]||C.textMid;
          return (
            <div key={i} className="card change-row" style={{padding:"12px 16px",display:"flex",gap:12,alignItems:"flex-start",animationDelay:`${i*55}ms`,background:C.panel}}>
              <span style={{fontSize:9,background:`${col}15`,color:col,border:`1px solid ${col}30`,borderRadius:4,padding:"2px 8px",flexShrink:0,marginTop:2,letterSpacing:".08em"}}>{cat}</span>
              <span style={{fontSize:12,color:C.text,lineHeight:1.7}}>{desc}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── TOAST ──────────────────────────────────────────────────────────────────────
function Toast({ msg, type="success" }) {
  const col = type==="error"?C.red:C.green;
  return (
    <div style={{position:"fixed",bottom:32,right:32,background:C.panelAlt,border:`1px solid ${col}44`,borderRadius:10,padding:"12px 20px",fontSize:12,color:C.text,boxShadow:"0 8px 32px rgba(0,0,0,.6)",zIndex:999,display:"flex",alignItems:"center",gap:8,animation:"fadeUp .3s ease"}}>
      <span style={{color:col}}>{type==="error"?"✕":"✓"}</span> {msg}
    </div>
  );
}

// ─── MAIN APP ───────────────────────────────────────────────────────────────────
export default function App() {
  const [code,     setCode]     = useState("");
  const [result,   setResult]   = useState(null);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");
  const [toast,    setToast]    = useState(null);
  const [tab,      setTab]      = useState("code");
  const [navTab,   setNavTab]   = useState("analyze");
  const [copied,   setCopied]   = useState(false);
  const [history,  setHistory]  = useState([]);
  const fileRef    = useRef(null);
  const resultsRef = useRef(null);

  useEffect(() => {
    const el = document.createElement("style");
    el.textContent = GLOBAL_CSS;
    document.head.appendChild(el);
    try { const h = localStorage.getItem("mzr_history"); if (h) setHistory(JSON.parse(h)); } catch {}
    return () => document.head.removeChild(el);
  }, []);

  useEffect(() => {
    if (result) setTimeout(() => resultsRef.current?.scrollIntoView({behavior:"smooth",block:"start"}), 120);
  }, [result]);

  const showToast = (msg, type="success") => {
    setToast({msg,type});
    setTimeout(() => setToast(null), 3000);
  };

  const run = async () => {
   if (!code.trim() || loading) return;

   setLoading(true);
   setError("");
   setResult(null);

   try {
    const res = await fetch("http://127.0.0.1:8000/convert", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        code: code,
        function_name: "main"
      })
    });

    const data = await res.json();
    console.log("BACKEND RESPONSE:", data);
    const detectLanguage = (code) => {
    if (code.includes("#include")) return "C++";
    if (code.includes("printf")) return "C";
    if (code.includes("System.out")) return "Java";
    if (code.includes("def ") || code.includes("import ")) return "Python";
    if (code.includes("function") || code.includes("=>")) return "JavaScript";
    return "Unknown";
    };
    // 👇 convert backend response to UI format
    const parsed = {
      language: detectLanguage(code),
      version_from: "Legacy",
      version_to: "Modern",
      modernized: (data.converted_code || "").replace(/def/g, "\ndef"),
      summary: "Code modernized using optimized context pruning.",
      score_before: 50,
      score_after: 85,
      risk_score: 40,
      changes: [
        {
          category: "Optimization",
          description: "Removed unnecessary context and improved structure"
        }
      ],
      functions: [],
      dependencies: [],
      metrics: {
        lines_total: code.split("\n").length,
        lines_code: data.converted_code?.split("\n").length || 0,
        num_functions: 1,
        avg_complexity: 3,
        max_complexity: 3,
        dead_code_pct: 0,
        duplicate_pct: 0,
        comment_pct: 0,
        dep_count: 0,

        // 🚀 backend metrics
        reduction: data.metrics?.reduction_percent || 0,
        latency: data.metrics?.latency || 0,
        cost_before: data.metrics?.cost_before || 0,
        cost_after: data.metrics?.cost_after || 0
      },
      suggestions: [],
      bugs: [],
      dep_graph: []
    };

    setResult(parsed);
    setTab("code");

    showToast("Analysis complete!");

    } catch (e) {
     console.error(e);
     setError("Backend connection failed");
     showToast("Backend error", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleFile = (e) => {
    const f = e.target.files[0]; if (!f) return;
    const reader = new FileReader();
    reader.onload = ev => setCode(ev.target.result);
    reader.readAsText(f);
  };

  const copy = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true); showToast("Copied to clipboard!");
    setTimeout(()=>setCopied(false),2000);
  };

  const exportResult = () => {
    if (!result) return;
    const txt = [
      `MODERNIZR ANALYSIS REPORT`,`Generated: ${new Date().toLocaleString()}`,`${"─".repeat(50)}`,
      `Language: ${result.language}`,`Migration: ${result.version_from} → ${result.version_to}`,
      `Quality Score: ${result.score_before} → ${result.score_after}`,`Risk Score: ${result.risk_score}`,
      `${"─".repeat(50)}`,`SUMMARY`,result.summary,`${"─".repeat(50)}`,
      `CHANGES (${result.changes?.length})`, ...(result.changes||[]).map((c,i)=>`${i+1}. [${c.category||""}] ${c.description||c}`),
      `${"─".repeat(50)}`,`MODERNIZED CODE`,result.modernized
    ].join("\n");
    const a = document.createElement("a"); a.href="data:text/plain;charset=utf-8,"+encodeURIComponent(txt); a.download="modernizr_report.txt"; a.click();
    showToast("Report exported!");
  };

  const ext = langExt(result?.language);
  const lc  = langColor(result?.language);
  const lines = (code||" ").split("\n");

  const OUTPUT_TABS = [
    {id:"code",    label:"Code",        icon:I.code},
    {id:"diff",    label:"Diff",        icon:I.diff},
    {id:"metrics", label:"Metrics",     icon:I.chart},
    {id:"graph",   label:"Dep Graph",   icon:I.graph},
    {id:"changes", label:"Changes",     icon:I.star},
    {id:"suggest", label:"Suggestions", icon:I.bolt},
    {id:"bugs",    label:"Bugs",        icon:I.bug},
    {id:"deps",    label:"Dependencies",icon:I.graph},
  ];

  return (
    <div style={{background:C.bg,minHeight:"100vh",color:C.text,fontFamily:"'Geist Mono',monospace"}}>

      {/* Grid + glow */}
      <div style={{position:"fixed",inset:0,backgroundImage:`linear-gradient(${C.border}12 1px,transparent 1px),linear-gradient(90deg,${C.border}12 1px,transparent 1px)`,backgroundSize:"44px 44px",pointerEvents:"none",zIndex:0}}/>
      <div style={{position:"fixed",top:-180,left:"50%",transform:"translateX(-50%)",width:800,height:400,background:`radial-gradient(ellipse,rgba(0,212,255,.04) 0%,transparent 70%)`,pointerEvents:"none",zIndex:0}}/>

      {/* ── HEADER ── */}
      <header style={{position:"sticky",top:0,zIndex:200,background:`${C.surface}f2`,backdropFilter:"blur(20px)",borderBottom:`1px solid ${C.border}`}}>
        <div style={{maxWidth:1200,margin:"0 auto",padding:"0 28px",height:54,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div style={{display:"flex",alignItems:"center",gap:16}}>
            <div style={{width:32,height:32,borderRadius:8,background:`linear-gradient(135deg,${C.accent}22,${C.accent}05)`,border:`1px solid ${C.accent}28`,display:"flex",alignItems:"center",justifyContent:"center"}}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke={C.accent} strokeWidth="2" strokeLinejoin="round" fill={`${C.accent}18`}/></svg>
            </div>
            <div>
              <div style={{fontSize:13,fontWeight:800,letterSpacing:".2em",color:C.white,fontFamily:"'Syne',sans-serif",lineHeight:1}}>MODERNIZR</div>
              <div style={{fontSize:9,color:C.muted,letterSpacing:".1em",marginTop:2}}>Code Intelligence Platform</div>
            </div>
          </div>

          {/* Nav */}
          <div style={{display:"flex",gap:2}}>
            {[{id:"analyze",label:"Analyze"},{id:"history",label:"History"}].map(n=>(
              <button key={n.id} className={`nav-item${navTab===n.id?" on":""}`} onClick={()=>setNavTab(n.id)}>{n.label}</button>
            ))}
          </div>

          <div style={{display:"flex",alignItems:"center",gap:8}}>
            {["JS","TS","PY","PHP","JAVA","GO","RUST","C++"].map(l=>(
              <span key={l} style={{fontSize:9,color:C.muted,letterSpacing:".08em",padding:"2px 6px",border:`1px solid ${C.border}`,borderRadius:3}}>{l}</span>
            ))}
            <div style={{width:1,height:14,background:C.border,margin:"0 4px"}}/>
            <div style={{display:"flex",alignItems:"center",gap:6,fontSize:11,color:C.textMid,border:`1px solid ${C.border}`,borderRadius:20,padding:"3px 10px"}}>
              <span style={{width:5,height:5,borderRadius:"50%",background:C.green,display:"block",animation:"pulse 2s ease infinite"}}/>
              Live
            </div>
          </div>
        </div>
      </header>

      {/* ── CONTENT ── */}
      <main style={{position:"relative",zIndex:1,maxWidth:1200,margin:"0 auto",padding:"36px 28px 100px"}}>

        {navTab === "history" ? (
          // ── HISTORY VIEW ──
          <div className="fade-up">
            <div style={{marginBottom:24}}>
              <h2 style={{fontFamily:"'Syne',sans-serif",fontSize:22,color:C.white,marginBottom:6}}>Analysis History</h2>
              <p style={{fontSize:12,color:C.muted}}>Previous sessions from this browser.</p>
            </div>
            {history.length === 0
              ? <div style={{textAlign:"center",padding:80,color:C.muted,fontSize:13}}>No history yet. Run your first analysis!</div>
              : <div style={{display:"flex",flexDirection:"column",gap:10}}>
                  {history.map((h,i)=>(
                    <div key={h.id} className="card" style={{padding:"14px 18px",display:"flex",alignItems:"center",gap:16,background:C.panel,cursor:"pointer",animation:`slideRight .3s ease ${i*40}ms forwards`,opacity:0}}
                      onClick={()=>{setNavTab("analyze")}}>
                      <span style={{width:8,height:8,borderRadius:"50%",background:langColor(h.lang),display:"block",flexShrink:0}}/>
                      <div style={{flex:1}}>
                        <div style={{fontSize:11,color:C.text,fontFamily:"'Geist Mono',monospace",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",maxWidth:400}}>{h.snippet}…</div>
                        <div style={{fontSize:10,color:C.muted,marginTop:3}}>{h.lang} · {h.lines} lines · Score: {h.score_after}</div>
                      </div>
                      <span style={{fontSize:10,color:C.muted}}>{h.ts}</span>
                    </div>
                  ))}
                </div>}
          </div>
        ) : (
          // ── ANALYZE VIEW ──
          <>
            {/* Hero */}
            <div style={{marginBottom:32}}>
              <h1 style={{fontSize:34,fontWeight:800,fontFamily:"'Syne',sans-serif",color:C.white,letterSpacing:"-.02em",lineHeight:1.1}}>
                Modernize. Analyze.<br/>
                <span style={{background:`linear-gradient(90deg,${C.accent},${C.green},${C.purple},${C.accent})`,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",backgroundSize:"300% auto",animation:"gradShift 5s ease infinite"}}>Understand everything.</span>
              </h1>
              <p style={{marginTop:10,fontSize:12,color:C.muted,lineHeight:1.9,maxWidth:520}}>
                Drop in any legacy code. Get modernized output, complexity metrics, a live dependency graph, bug detection, smart suggestions, and a full change log — all at once.
              </p>
            </div>

            {/* Input editor */}
            <div className={`card scan-wrap${loading ? " scanning" : ""}`} style={{background:C.panel,borderRadius:12,overflow:"hidden",marginBottom:16,position:"relative",transition:"border-color .3s, box-shadow .3s"}}>
              {/* Scan effect overlays */}
              {loading && (
                <>
                  <div className="scan-line" />
                  <div className="scan-overlay" />
                  <div className="scan-vignette" />
                  <div className="scan-label">ANALYZING</div>
                  <div className="scan-corner sc-tl" />
                  <div className="scan-corner sc-tr" />
                  <div className="scan-corner sc-bl" />
                  <div className="scan-corner sc-br" />
                </>
              )}
              <EditorBar
                filename={loading ? "analyzing..." : "legacy_code"}
                meta={`${code.length} chars · ${lines.length} lines`}
                right={
                  <div style={{display:"flex",gap:6,alignItems:"center"}}>
                    {loading && <span style={{fontSize:10,color:C.accent,letterSpacing:".1em",animation:"scanpulse 1s ease infinite"}}>● SCANNING</span>}
                    <input ref={fileRef} type="file" accept=".js,.ts,.py,.java,.php,.go,.rb,.rs,.c,.cpp,.cs" style={{display:"none"}} onChange={handleFile}/>
                    {!loading && <button className="btn-icon" onClick={()=>fileRef.current?.click()}>{I.upload} Upload File</button>}
                  </div>
                }
              />
              <div style={{display:"flex",maxHeight:380,overflow:"auto",position:"relative"}}>
                <LineNums count={lines.length}/>
                <textarea value={code} onChange={e=>setCode(e.target.value)} spellCheck={false}
                  readOnly={loading}
                  placeholder={"// Paste or upload your legacy code here...\n// Supports JS, TS, Python, PHP, Java, Go, Ruby, Rust, C, C++, C#"}
                  style={{flex:1,background:"transparent",color:loading?`${C.accent}99`:C.text,border:"none",outline:"none",resize:"none",padding:"12px 14px",fontSize:13,lineHeight:1.65,minHeight:240,fontFamily:"'Geist Mono',monospace",transition:"color .4s",filter:loading?"brightness(0.85)":"none"}}
                />
              </div>
            </div>

            {/* Action bar */}
            <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:result?48:0}}>
              <button className="btn-cta" onClick={run} disabled={loading||!code.trim()}>
                {loading ? <>{I.spin} Analyzing…</> : <>{I.bolt} Analyze & Modernize</>}
              </button>
              {(code||result) && !loading && <button className="btn-ghost" onClick={()=>{setCode("");setResult(null);setError("");}}>Clear</button>}
              {result && <button className="btn-icon" onClick={exportResult}>{I.export} Export Report</button>}
              {error && <span style={{fontSize:12,color:C.red,padding:"9px 14px",background:C.redDim,border:`1px solid ${C.red}30`,borderRadius:7}}>{error}</span>}
            </div>

            {/* ── RESULTS ── */}
            {result && (
              <div ref={resultsRef} className="fade-up">

                {/* Divider */}
                <div style={{display:"flex",alignItems:"center",gap:16,marginBottom:24}}>
                  <div style={{height:1,flex:1,background:`linear-gradient(90deg,${C.border},transparent)`}}/>
                  <span style={{fontSize:9,color:C.muted,letterSpacing:".22em"}}>ANALYSIS RESULTS</span>
                  <div style={{height:1,flex:1,background:`linear-gradient(90deg,transparent,${C.border})`}}/>
                </div>

                {/* Stats row */}
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr auto",gap:10,marginBottom:16}}>
                  {/* Language */}
                  <div className="card stat-anim" style={{background:C.panel,padding:"14px 18px",borderRadius:12}}>
                    <div style={{fontSize:9,color:C.muted,letterSpacing:".14em",marginBottom:7}}>LANGUAGE</div>
                    <div style={{display:"flex",alignItems:"center",gap:8}}>
                      <span style={{width:9,height:9,borderRadius:"50%",background:lc,boxShadow:`0 0 7px ${lc}88`,display:"block"}}/>
                      <span style={{fontSize:16,fontWeight:700,color:C.white,fontFamily:"'Syne',sans-serif"}}>{result.language||"—"}</span>
                    </div>
                  </div>
                  {/* Migration */}
                  <div className="card stat-anim" style={{background:C.panel,padding:"14px 18px",borderRadius:12,animationDelay:"60ms"}}>
                    <div style={{fontSize:9,color:C.muted,letterSpacing:".14em",marginBottom:7}}>MIGRATION</div>
                    <div style={{display:"flex",alignItems:"center",gap:7,fontSize:13,fontWeight:700}}>
                      <span style={{color:C.red,fontFamily:"'Syne',sans-serif"}}>{result.version_from||"Legacy"}</span>
                      <span style={{color:C.muted}}>→</span>
                      <span style={{color:C.green,fontFamily:"'Syne',sans-serif"}}>{result.version_to||"Modern"}</span>
                    </div>
                  </div>
                  {/* Issues */}
                  <div className="card stat-anim" style={{background:C.panel,padding:"14px 18px",borderRadius:12,animationDelay:"120ms"}}>
                    <div style={{fontSize:9,color:C.muted,letterSpacing:".14em",marginBottom:5}}>ISSUES FOUND</div>
                    <div style={{display:"flex",gap:14,marginTop:2}}>
                      <div><div style={{fontSize:18,fontWeight:700,color:(result.bugs?.filter(b=>b.severity==="critical").length>0)?C.red:C.muted,fontFamily:"'Syne',sans-serif"}}>{result.bugs?.filter(b=>b.severity==="critical").length||0}</div><div style={{fontSize:9,color:C.muted,marginTop:2}}>CRITICAL</div></div>
                      <div><div style={{fontSize:18,fontWeight:700,color:C.amber,fontFamily:"'Syne',sans-serif"}}>{result.bugs?.filter(b=>b.severity==="warning").length||0}</div><div style={{fontSize:9,color:C.muted,marginTop:2}}>WARNINGS</div></div>
                      <div><div style={{fontSize:18,fontWeight:700,color:C.textMid,fontFamily:"'Syne',sans-serif"}}>{result.suggestions?.length||0}</div><div style={{fontSize:9,color:C.muted,marginTop:2}}>SUGGESTIONS</div></div>
                    </div>
                  </div>
                  {/* Scores */}
                  <div className="card stat-anim" style={{background:C.panel,padding:"14px 18px",borderRadius:12,animationDelay:"180ms",display:"flex",alignItems:"center",gap:16,justifyContent:"center"}}>
                    <ScoreRing score={result.score_before??40} label="Before" color={C.amber}/>
                    <div style={{width:1,height:44,background:C.border}}/>
                    <ScoreRing score={result.score_after??92}  label="After"  color={C.green}/>
                  </div>
                  {/* Risk gauge */}
                  <div className="card stat-anim" style={{background:C.panel,padding:"10px 18px",borderRadius:12,animationDelay:"240ms",display:"flex",alignItems:"center",justifyContent:"center"}}>
                    <RiskGauge score={result.risk_score??55}/>
                  </div>
                </div>
                  {/* 🚀 EXTRA METRICS DISPLAY */}
                  <div style={{
                    gridColumn: "1 / -1",
                    display: "flex",
                    justifyContent: "space-between",
                    marginTop: "10px",
                    padding: "12px 18px",
                    background: C.panel,
                    border: `1px solid ${C.border}`,
                    borderRadius: "10px",
                    fontSize: "12px",
                    color: C.textMid
                  }}>
                    
                    <span>Reduction: {result.metrics?.reduction || 0}%</span>
                    <span>Latency: {result.metrics?.latency || 0}s</span>
                    <span>
                      Cost Saved: {(
                        (result.metrics?.cost_before || 0) -
                        (result.metrics?.cost_after || 0)
                      ).toFixed(6)}
                    </span>
                  </div>
                {/* Output tabs */}
                <div style={{borderBottom:`1px solid ${C.border}`,display:"flex",gap:2,marginBottom:16,overflowX:"auto"}}>
                  {OUTPUT_TABS.map(t=>(
                    <button key={t.id} className={`tab${tab===t.id?" on":""}`} onClick={()=>setTab(t.id)} style={{display:"flex",alignItems:"center",gap:6,whiteSpace:"nowrap"}}>
                      {t.icon} {t.label}
                      {t.id==="bugs" && result.bugs?.length>0 && (
                        <span style={{fontSize:9,background:result.bugs.some(b=>b.severity==="critical")?C.redDim:C.amberDim,color:result.bugs.some(b=>b.severity==="critical")?C.red:C.amber,borderRadius:10,padding:"1px 6px"}}>{result.bugs.length}</span>
                      )}
                    </button>
                  ))}
                </div>

                {/* Tab content */}
                {tab==="code" && (
                  <div className="card" style={{background:C.panel,borderRadius:12,overflow:"hidden"}}>
                    <EditorBar filename={`modernized.${ext}`} meta={`${result.modernized?.split("\n").length||0} lines`}
                      right={
                        <button className={`btn-icon${copied?" success":""}`} onClick={()=>copy(result.modernized)}>
                          {copied ? <>{I.check} Copied!</> : <>{I.copy} Copy</>}
                        </button>
                      }
                    />
                    <div style={{display:"flex",maxHeight:460,overflow:"auto"}}>
                      <LineNums count={(result.modernized||"").split("\n").length}/>
                      <pre style={{flex:1,padding:"12px 14px",fontSize:13,lineHeight:1.65,color:C.text,fontFamily:"'Geist Mono',monospace",whiteSpace:"pre-wrap",wordBreak:"break-word",margin:0}}>
                        {result.modernized}
                      </pre>
                      <div style={{
                        marginTop: "16px",
                        padding: "12px",
                        background: C.panel,
                        borderRadius: "10px",
                        border: `1px solid ${C.border}`,
                        color: C.textMid,
                        display: "flex",
                        justifyContent: "space-between"
                      }}>
                        <span>Reduction: {result.metrics?.reduction || 0}%</span>
                        <span>Latency: {result.metrics?.latency || 0}s</span>
                        <span>
                          Cost Saved: {(
                            (result.metrics?.cost_before || 0) -
                            (result.metrics?.cost_after || 0)
                          ).toFixed(6)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {tab==="diff"    && <DiffView before={code} after={result.modernized}/>}
                {tab==="metrics" && <MetricsGrid metrics={result.metrics} score_before={result.score_before} score_after={result.score_after} risk_score={result.risk_score}/>}
                {tab==="graph"   && (
                  <div className="card" style={{background:C.panel,borderRadius:12,overflow:"hidden"}}>
                    <div style={{padding:"10px 16px",background:C.surface,borderBottom:`1px solid ${C.border}`,fontSize:11,color:C.muted,letterSpacing:".1em"}}>
                      FUNCTION DEPENDENCY GRAPH — drag nodes to explore
                    </div>
                    <DepGraph depGraph={result.dep_graph} functions={result.functions}/>
                  </div>
                )}
                {tab==="changes" && (
                  <div className="card" style={{background:C.panel,borderRadius:12,padding:16}}>
                    <Changes changes={result.changes} summary={result.summary}/>
                  </div>
                )}
                {tab==="suggest" && (
                  <div>
                    <div style={{marginBottom:12,display:"flex",alignItems:"center",gap:8}}>
                      <div style={{fontSize:11,color:C.muted}}>FUNCTION COMPLEXITY</div>
                    </div>
                    <div className="card" style={{background:C.panel,borderRadius:12,padding:"16px 20px",marginBottom:16}}>
                      <ComplexityChart functions={result.functions}/>
                    </div>
                    <Suggestions suggestions={result.suggestions}/>
                  </div>
                )}
                {tab==="bugs"    && <Bugs bugs={result.bugs}/>}
                {tab==="deps"    && (
                  <div className="card" style={{background:C.panel,borderRadius:12,padding:20}}>
                    <DepsView dependencies={result.dependencies}/>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </main>

      {toast && <Toast msg={toast.msg} type={toast.type}/>}
    </div>
  );
}
