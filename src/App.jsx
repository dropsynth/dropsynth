import { useState, useEffect } from "react";
import { supabase } from "./lib/supabase";
import { trackLead } from "./lib/track";

// ─── TOKENS ───────────────────────────────────────────────
const C = {
  bg:"#090B0F", surface:"#0F1219", card:"#131822", border:"#1B2130",
  accent:"#00FFB2", a2:"#7B5EFF", warn:"#FFB800",
  text:"#ECF1FA", muted:"#6B7794", dim:"#303A52", danger:"#FF5C5C",
};

// ─── SMOOTH SCROLL ────────────────────────────────────────
function smoothScroll(id) {
  const el = document.getElementById(id);
  if (!el) return;
  const root = document.scrollingElement || document.documentElement;
  const start = root.scrollTop;
  const target = el.getBoundingClientRect().top + start - 58;
  const dist = target - start;
  const dur = 420;
  let t0 = null;
  function step(ts) {
    if (!t0) t0 = ts;
    const p = Math.min((ts - t0) / dur, 1);
    root.scrollTop = start + dist * (1 - Math.pow(1 - p, 3));
    if (p < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

function useIsMobile() {
  const [mob, setMob] = useState(() => window.innerWidth <= 680);
  useEffect(() => {
    const fn = () => setMob(window.innerWidth <= 680);
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, []);
  return mob;
}

// ─── DATA ─────────────────────────────────────────────────
const PLANS = [
  { id:"starter", name:"Starter", price:29, tag:"For beginners", highlight:false,
    features:["1 niche store","AI product research (50 scans/mo)","Auto-import up to 50 SKUs","Dynamic pricing — 1 store","AI listing copy — 20 products/mo","Email support"],
    cta:"Start free 14-day trial" },
  { id:"pro", name:"Pro", price:79, tag:"Most popular", highlight:true,
    features:["3 niche stores","Unlimited AI product scans","Auto-import unlimited SKUs","Dynamic pricing — all stores","AI listing copy — unlimited","Live feed + ops log","Auto-fulfilment (CJ + AliExpress)","Priority support"],
    cta:"Start free 14-day trial" },
  { id:"scale", name:"Scale", price:199, tag:"For serious sellers", highlight:false,
    features:["Unlimited stores","White-label option","Custom niche onboarding","API access","Dedicated account manager","Multi-language copy (EN/FI/SE/DE)","Advanced analytics dashboard","SLA uptime guarantee"],
    cta:"Book a demo" },
];

const FAQS = [
  { q:"Do I need a Shopify account?", a:"DropSynth connects to Shopify, WooCommerce, and our hosted storefront. You can start without any existing platform — we set one up during onboarding." },
  { q:"How does AI product research work?", a:"Our engine scans 40M+ product listings daily across CJ Dropshipping, AliExpress, and partner catalogues. It scores each product on margin, trend velocity, competition density, and repeat-purchase potential." },
  { q:"Which countries do you ship to?", a:"All EU countries including Finland, Sweden, Germany, France, and the Netherlands. Fulfilment partners support worldwide shipping, but our AI is optimised for European demand signals." },
  { q:"Can I cancel anytime?", a:"Yes. No contracts, no lock-in. Cancel from your dashboard and keep access until the end of your billing period." },
  { q:"What happens after the free trial?", a:"You choose a plan and enter payment details. Nothing is charged during the 14 days. If you don't upgrade, your account pauses — store data stays saved for 30 days." },
  { q:"How is my data handled?", a:"Your email is stored securely and used only to contact you about DropSynth early access. We never sell or share it. You can request deletion at any time — see our privacy policy." },
];

const TICKS = ["Bio-hacking ↑38%","Smart Home ↑29%","Pet Wellness ↑31%","Eco-friendly ↑24%","Ultralight Hiking ↑41%","Fitness Recovery ↑19%","Backyard Astronomy ↑35%","Ergonomic Office ↑22%"];

// ─── TRENDING LEADERBOARD DATA ────────────────────────────
const TRENDING = [
  { rank:1, locked:true, trend:"+312%" },
  { rank:2, locked:true, trend:"+268%" },
  { rank:3, locked:true, trend:"+241%" },
  { rank:4, locked:true, trend:"+199%" },
  { rank:5, locked:true, trend:"+176%" },
  { rank:6, locked:false, emoji:"📱", name:"Magnetic Phone Car Mount",  sales:"4.1K", bars:4, trend:"+154%" },
  { rank:7, locked:false, emoji:"🍼", name:"Silicone Baby Bibs 3-Pack", sales:"3.7K", bars:3, trend:"+121%" },
  { rank:8, locked:false, emoji:"💆", name:"Foam Roller Massage Set",   sales:"2.9K", bars:3, trend:"+97%" },
];

// product thumb tile
const Thumb = ({ emoji, locked }) => (
  <div aria-hidden style={{
    width:42,height:42,borderRadius:10,flexShrink:0,
    display:"flex",alignItems:"center",justifyContent:"center",fontSize:21,
    background:locked?`linear-gradient(135deg,${C.dim}33,${C.a2}14)`:`linear-gradient(135deg,${C.accent}14,${C.a2}1A)`,
    border:`1px solid ${locked?C.border:`${C.accent}33`}`,
    filter:locked?"saturate(0)":"none",
  }}>
    <span style={locked?{filter:"blur(3px)",opacity:.7}:undefined}>{locked?"?":emoji}</span>
  </div>
);

const DEMO_LINES = [
  {t:"ok",  m:"Trend scan — bio-hack/glucose-patch ↑38% flagged"},
  {t:"ok",  m:"12 SKUs auto-imported from CJ Dropshipping"},
  {t:"ok",  m:"AI listing copy generated (EN + FI)"},
  {t:"warn",m:"Supplier A stock low on SKU-884 → rerouted to B"},
  {t:"ok",  m:"Dynamic repricing: 3 SKUs adjusted (+€4 avg)"},
  {t:"ok",  m:"7 orders auto-fulfilled · avg margin 34%"},
  {t:"ok",  m:"Chatbot resolved 4 tickets without human input"},
  {t:"ok",  m:"Smart Home — new winner flagged: €89 lock, 38% margin"},
];

// ─── SMALL COMPONENTS ─────────────────────────────────────
const Tag = ({ children, color=C.accent }) => (
  <span className="mono" style={{fontSize:10,letterSpacing:"0.12em",textTransform:"uppercase",padding:"3px 8px",borderRadius:4,background:`${color}16`,color}}>{children}</span>
);

const Check = () => <span style={{color:C.accent,flexShrink:0,fontSize:13}}>✓</span>;

function Btn({ children, onClick, variant="primary", disabled, full, size="md", style={} }) {
  const sz = { sm:{padding:"7px 16px",fontSize:12}, md:{padding:"11px 24px",fontSize:14}, lg:{padding:"15px 32px",fontSize:15} }[size];
  const v = {
    primary:{background:C.accent,color:"#090B0F",border:"none",boxShadow:`0 0 22px ${C.accent}30`,fontWeight:700},
    outline:{background:"transparent",color:C.text,border:`1px solid ${C.border}`,fontWeight:500},
  }[variant];
  return (
    <button className="hv-btn" onClick={disabled?undefined:onClick} disabled={disabled} style={{
      ...sz,...v,display:"inline-flex",alignItems:"center",justifyContent:"center",gap:7,
      borderRadius:8,cursor:disabled?"not-allowed":"pointer",opacity:disabled?.5:1,
      fontFamily:"'Space Grotesk',sans-serif",width:full?"100%":"auto",...style,
    }}>{children}</button>
  );
}

const Spinner = () => <div style={{width:14,height:14,border:`2px solid ${C.border}`,borderTopColor:C.accent,borderRadius:"50%",animation:"spin .7s linear infinite",flexShrink:0}}/>;

function SignalBars({ bars=3, max=5 }) {
  return (
    <div style={{display:"flex",alignItems:"flex-end",gap:2}}>
      {Array.from({length:max},(_,i)=>(
        <div key={i} style={{width:4,height:5+i*3,borderRadius:2,background:i<bars?C.accent:C.dim}}/>
      ))}
    </div>
  );
}

function Ticker() {
  const items = [...TICKS,...TICKS];
  return (
    <div className="hv-ticker" style={{overflow:"hidden",background:"#0C0F16",borderBottom:`1px solid ${C.border}`,padding:"7px 0"}}>
      <div className="mono" style={{display:"inline-block",whiteSpace:"nowrap",animation:"ticker 26s linear infinite",fontSize:10,letterSpacing:"0.1em",textTransform:"uppercase"}}>
        {items.map((it,i)=>(
          <span key={i}><span style={{color:C.dim}}>◆ </span><span style={{color:C.accent}}>{it}</span><span style={{color:C.dim}}>{"　　"}</span></span>
        ))}
      </div>
    </div>
  );
}

const VISIBLE = 6;
function LiveDemo() {
  const [lines, setLines] = useState(()=>DEMO_LINES.slice(0,VISIBLE));
  useEffect(()=>{
    let idx = VISIBLE;
    const iv = setInterval(()=>{
      setLines(prev=>[...prev.slice(1), DEMO_LINES[idx % DEMO_LINES.length]]);
      idx++;
    },1800);
    return ()=>clearInterval(iv);
  },[]);
  const col = {ok:C.accent,warn:C.warn};
  const lbl = {ok:"✓ OK",warn:"! WRN"};
  return (
    <div style={{background:"#070A0E",border:`1px solid ${C.border}`,borderRadius:12,padding:18,fontFamily:"'Space Mono',monospace",fontSize:11,lineHeight:1.8,overflow:"hidden"}}>
      <div style={{fontSize:9,color:C.dim,letterSpacing:"0.2em",marginBottom:12,textTransform:"uppercase"}}>DROPSYNTH · LIVE OPS FEED</div>
      {lines.map((l,i)=>(
        <div key={i} style={{display:"flex",gap:10,alignItems:"baseline",minWidth:0,opacity:i===lines.length-1?1:0.45+(i/lines.length)*0.45}}>
          <span style={{color:col[l.t]||C.muted,flexShrink:0,width:38,fontSize:9,textTransform:"uppercase",letterSpacing:"0.08em"}}>{lbl[l.t]}</span>
          <span style={{color:l.t==="ok"?C.text:C.muted,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",flex:1,minWidth:0}}>{l.m}</span>
        </div>
      ))}
      <div style={{display:"flex",gap:8,alignItems:"center",marginTop:6,borderTop:`1px solid ${C.border}`,paddingTop:8}}>
        <span style={{color:C.a2}}>—</span>
        <span style={{color:C.muted}}>monitoring<span className="blink" style={{color:C.accent}}> █</span></span>
      </div>
    </div>
  );
}

// ─── WAITLIST FORM (real Supabase) ────────────────────────
function WaitlistForm({ plan="general", onSuccess }) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    const e = email.trim().toLowerCase();
    if (!e) { setError("Email is required."); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) { setError("Enter a valid email."); return; }
    if (!consent) { setError("Please accept the privacy terms."); return; }
    if (!supabase) { setError("Backend not configured yet — see .env.example."); return; }

    setError(""); setLoading(true);
    const { error: dbError } = await supabase
      .from("waitlist")
      .insert({ email: e, name: name.trim() || null, plan, source: "landing" });

    setLoading(false);
    if (dbError) {
      if (dbError.code === "23505") setError("You're already on the list!");
      else setError("Something went wrong. Try again.");
      return;
    }
    trackLead(plan);
    onSuccess({ email: e, name: name.trim() });
  };

  const inputStyle = {
    background:C.surface,border:`1px solid ${C.border}`,borderRadius:7,
    padding:"11px 14px",color:C.text,fontSize:14,
    fontFamily:"'Space Grotesk',sans-serif",outline:"none",width:"100%",
  };

  return (
    <div style={{display:"flex",flexDirection:"column",gap:10}}>
      <input style={inputStyle} placeholder="Your name (optional)" value={name} onChange={e=>setName(e.target.value)} autoComplete="name"/>
      <input style={inputStyle} placeholder="your@email.com" type="email" value={email}
        onChange={e=>setEmail(e.target.value)} onKeyDown={e=>e.key==="Enter"&&submit()} autoComplete="email"/>
      <label style={{display:"flex",gap:8,alignItems:"flex-start",fontSize:11,color:C.muted,cursor:"pointer",lineHeight:1.5}}>
        <input type="checkbox" checked={consent} onChange={e=>setConsent(e.target.checked)}
          style={{marginTop:2,accentColor:C.accent,flexShrink:0}}/>
        <span>I agree that DropSynth stores my email to contact me about early access. I can unsubscribe and request deletion anytime. <a href="/privacy.html" target="_blank" style={{color:C.accent}}>Privacy policy</a></span>
      </label>
      {error && <div style={{fontSize:12,color:C.danger}}>{error}</div>}
      <Btn full onClick={submit} disabled={loading}>
        {loading ? <><Spinner/> Joining…</> : "Join the waitlist →"}
      </Btn>
      <div style={{fontSize:11,color:C.dim,textAlign:"center"}}>No spam. No credit card. Ever.</div>
    </div>
  );
}

function SuccessCard({ entry, onBack }) {
  return (
    <div className="fadeUp" style={{background:C.card,border:`1px solid ${C.accent}40`,borderRadius:12,padding:24,textAlign:"center",boxShadow:`0 0 40px ${C.accent}14`}}>
      <div style={{fontSize:36,marginBottom:10}}>✓</div>
      <div style={{fontSize:17,fontWeight:700,marginBottom:6}}>You're in{entry.name?`, ${entry.name.split(" ")[0]}`:""}!</div>
      <div style={{fontSize:13,color:C.muted,lineHeight:1.7}}>
        We'll email <span style={{color:C.text}}>{entry.email}</span> when your spot opens.
      </div>
      <button onClick={onBack} style={{marginTop:14,background:"none",border:"none",color:C.muted,fontSize:12,cursor:"pointer",textDecoration:"underline"}}>Back</button>
    </div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────
export default function App() {
  const mob = useIsMobile();
  const [modalOpen, setModalOpen] = useState(false);
  const [signupPlan, setSignupPlan] = useState("pro");
  const [modalSuccess, setModalSuccess] = useState(null);
  const [heroSuccess, setHeroSuccess] = useState(null);
  const [ctaSuccess, setCtaSuccess] = useState(null);
  const [billing, setBilling] = useState("monthly");
  const [openFaq, setOpenFaq] = useState(null);

  const px = mob ? "16px" : "40px";
  const sec = mob ? "64px" : "96px";

  const openModal = (plan) => { setSignupPlan(plan); setModalSuccess(null); setModalOpen(true); };

  return (
    <div style={{minHeight:"100vh",display:"flex",flexDirection:"column",overflowX:"hidden",background:C.bg,color:C.text}}>

      {modalOpen && (
        <div onClick={()=>setModalOpen(false)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.8)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000,padding:16,backdropFilter:"blur(6px)"}}>
          <div onClick={e=>e.stopPropagation()} style={{background:C.card,border:`1px solid ${C.border}`,position:"relative",borderRadius:14,padding:mob?24:32,width:"100%",maxWidth:420}}>
            {modalSuccess
              ? <SuccessCard entry={modalSuccess} onBack={()=>setModalOpen(false)}/>
              : <>
                  <div style={{marginBottom:18}}>
                    <div className="mono" style={{fontSize:10,color:C.accent,letterSpacing:"0.15em",marginBottom:8}}>GET EARLY ACCESS</div>
                    <div style={{fontSize:20,fontWeight:700,marginBottom:6}}>Join the waitlist</div>
                    <div style={{fontSize:13,color:C.muted}}>Be first in line when DropSynth launches.</div>
                  </div>
                  <WaitlistForm plan={signupPlan} onSuccess={setModalSuccess}/>
                  <button onClick={()=>setModalOpen(false)} style={{position:"absolute",top:12,right:16,background:"none",border:"none",color:C.muted,fontSize:22,cursor:"pointer",lineHeight:1}}>×</button>
                </>
            }
          </div>
        </div>
      )}

      {/* NAV */}
      <nav style={{position:"sticky",top:0,zIndex:100,background:"rgba(9,11,15,.92)",backdropFilter:"blur(14px)",borderBottom:`1px solid ${C.border}`,padding:`0 ${px}`,height:54,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div className="mono hv-logo" style={{fontSize:16,fontWeight:700}}>Drop<span style={{color:C.accent}}>Synth</span></div>
        <div style={{display:"flex",alignItems:"center",gap:mob?12:28}}>
          {!mob && ["Features","Pricing","FAQ"].map(l=>(
            <span key={l} className="hv-link" onClick={()=>smoothScroll(l.toLowerCase())}
              style={{fontSize:13,color:C.muted,fontWeight:500,cursor:"pointer"}}
            >{l}</span>
          ))}
          <Btn size="sm" onClick={()=>openModal("pro")}>Join waitlist</Btn>
        </div>
      </nav>

      <Ticker/>

      {/* HERO */}
      <section style={{padding:`${mob?"56px":"80px"} ${px}`,position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",inset:0,backgroundImage:`linear-gradient(${C.border} 1px,transparent 1px),linear-gradient(90deg,${C.border} 1px,transparent 1px)`,backgroundSize:"56px 56px",maskImage:"radial-gradient(ellipse 80% 70% at 50% 40%,black 20%,transparent 100%)",opacity:.4,pointerEvents:"none"}}/>
        <div style={{position:"relative",display:"grid",gridTemplateColumns:mob?"1fr":"1fr 1fr",gap:mob?36:80,alignItems:"center",maxWidth:1160,margin:"0 auto"}}>
          <div>
            <Tag>AI-Powered Dropshipping Platform</Tag>
            <h1 style={{fontSize:mob?36:52,fontWeight:700,letterSpacing:"-0.035em",lineHeight:1.08,marginTop:16,marginBottom:16}}>
              Let AI run<br/>
              <span style={{position:"relative",display:"inline-block",color:C.accent}}>
                your store
                <span style={{position:"absolute",bottom:-4,left:0,right:0,height:2,background:`linear-gradient(90deg,${C.accent},${C.a2},transparent)`,animation:"scanBar 2.8s ease-in-out infinite"}}/>
              </span>
            </h1>
            <p style={{fontSize:mob?14:16,color:C.muted,lineHeight:1.75,marginBottom:26}}>
              DropSynth scans 40M+ products daily, spots rising niches before your competitors, auto-imports winning SKUs, and writes your product copy — while you focus on growth.
            </p>
            {heroSuccess
              ? <SuccessCard entry={heroSuccess} onBack={()=>setHeroSuccess(null)}/>
              : <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:mob?16:22}}>
                  <div style={{fontSize:13,fontWeight:600,marginBottom:12}}>Get early access — free 14-day trial</div>
                  <WaitlistForm plan="pro" onSuccess={setHeroSuccess}/>
                </div>
            }
            <div style={{display:"flex",gap:mob?12:20,marginTop:14,flexWrap:"wrap"}}>
              {["No credit card","Cancel anytime","EU suppliers"].map(t=>(
                <div key={t} style={{display:"flex",alignItems:"center",gap:5,fontSize:12,color:C.muted}}><Check/>{t}</div>
              ))}
            </div>
          </div>
          <div>
            <div style={{marginBottom:10,display:"flex",alignItems:"center",gap:8}}>
              <div className="pulse" style={{width:7,height:7,borderRadius:"50%",background:C.accent,flexShrink:0}}/>
              <span className="mono" style={{fontSize:10,color:C.muted,letterSpacing:"0.12em",textTransform:"uppercase"}}>Live engine preview</span>
            </div>
            <LiveDemo/>
            <div style={{marginTop:12,display:"grid",gridTemplateColumns:"1fr 1fr",gap:2,borderRadius:10,overflow:"hidden",border:`1px solid ${C.border}`}}>
              {[["40M+","products scanned daily"],["20h","saved per week"],["34%","avg store margin"],["300+","suppliers connected"]].map(([v,l])=>(
                <div key={l} className="hv-stat" style={{background:C.card,padding:"12px 14px",textAlign:"center"}}>
                  <div className="mono statv" style={{fontSize:18,fontWeight:700,color:C.accent}}>{v}</div>
                  <div style={{fontSize:10,color:C.muted,marginTop:3}}>{l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* TRENDING LEADERBOARD */}
      <section style={{padding:`${mob?"48px":"80px"} ${px}`,borderTop:`1px solid ${C.border}`}}>
        <div style={{maxWidth:1160,margin:"0 auto"}}>
          <div style={{textAlign:"center",marginBottom:mob?28:44}}>
            <Tag color={C.warn}>🔥 This Week</Tag>
            <h2 style={{fontSize:mob?24:34,fontWeight:700,letterSpacing:"-0.03em",marginTop:12,marginBottom:8}}>
              Trending products right now
            </h2>
            <p style={{fontSize:13,color:C.muted,maxWidth:440,margin:"0 auto"}}>
              Our AI tracks sales velocity across 40M+ listings. Sign up to unlock the full leaderboard.
            </p>
          </div>

          <div style={{display:"grid",gridTemplateColumns:mob?"1fr 1fr":"repeat(4,1fr)",gap:10}}>
            {TRENDING.map(item=>(
              <div key={item.rank} className="hv-card" style={{
                background:C.card,border:`1px solid ${C.border}`,borderRadius:12,
                padding:"16px 14px",position:"relative",overflow:"hidden",minHeight:110,
              }}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                  <span className="mono" style={{
                    fontSize:10,fontWeight:700,padding:"2px 8px",borderRadius:20,
                    background:item.rank<=3?`${C.warn}22`:`${C.dim}55`,
                    color:item.rank<=3?C.warn:C.muted,
                  }}>#{item.rank}</span>
                  <span className="mono" style={{fontSize:10,fontWeight:700,color:C.accent,background:`${C.accent}14`,padding:"2px 7px",borderRadius:20}}>▲ {item.trend}</span>
                </div>

                {item.locked ? (
                  <>
                    <div style={{display:"flex",gap:10,alignItems:"center",pointerEvents:"none",userSelect:"none"}}>
                      <Thumb locked/>
                      <div style={{flex:1,filter:"blur(7px)"}}>
                        <div style={{height:13,background:C.dim,borderRadius:4,marginBottom:6,width:"88%"}}/>
                        <div style={{height:10,background:C.dim,borderRadius:4,width:"55%"}}/>
                      </div>
                    </div>
                    <div style={{
                      position:"absolute",inset:0,
                      background:`linear-gradient(to bottom,transparent 20%,${C.card}F2 52%)`,
                      display:"flex",flexDirection:"column",alignItems:"center",
                      justifyContent:"flex-end",padding:"12px 10px",textAlign:"center",
                    }}>
                      <div style={{fontSize:15,marginBottom:3}}><span className="hv-lock">🔒</span></div>
                      <div style={{fontSize:10,color:C.muted,lineHeight:1.5,marginBottom:9}}>
                        Sign up for free<br/>and unlock this product!
                      </div>
                      <Btn size="sm" onClick={()=>openModal("pro")} style={{width:"100%",fontSize:10,padding:"6px 10px"}}>
                        Try for free →
                      </Btn>
                    </div>
                  </>
                ) : (
                  <div style={{display:"flex",gap:10,alignItems:"center"}}>
                    <Thumb emoji={item.emoji}/>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:13,fontWeight:600,lineHeight:1.35,marginBottom:5}}>{item.name}</div>
                      <div style={{display:"flex",alignItems:"center",gap:6,flexWrap:"wrap"}}>
                        <span style={{fontSize:12,color:C.accent,fontWeight:700}}>{item.sales}</span>
                        <span style={{fontSize:11,color:C.muted}}>sales this week</span>
                        <SignalBars bars={item.bars}/>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div style={{textAlign:"center",marginTop:16}}>
            <span style={{fontSize:12,color:C.muted}}>
              Showing 3 of{" "}<span style={{color:C.text,fontWeight:600}}>847 trending products</span>{" "}this week.{" "}
              <span onClick={()=>openModal("pro")} style={{color:C.accent,cursor:"pointer",textDecoration:"underline"}}>
                Unlock all →
              </span>
            </span>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" style={{background:C.surface,borderTop:`1px solid ${C.border}`,borderBottom:`1px solid ${C.border}`,padding:`${sec} ${px}`}}>
        <div style={{maxWidth:1160,margin:"0 auto"}}>
          <div style={{textAlign:"center",marginBottom:mob?36:60}}>
            <Tag>What's inside</Tag>
            <h2 style={{fontSize:mob?26:36,fontWeight:700,letterSpacing:"-0.03em",marginTop:14,marginBottom:10}}>Everything a modern dropshipper needs</h2>
            <p style={{fontSize:14,color:C.muted,maxWidth:480,margin:"0 auto"}}>One platform. No duct-tape stack.</p>
          </div>
          <div style={{display:"grid",gridTemplateColumns:mob?"1fr":"repeat(3,1fr)",gap:12}}>
            {[
              {icon:"🔍",title:"Trend Intelligence",desc:"Scans 40M+ SKUs daily. Scores each product on sell-through velocity, social momentum, and review sentiment."},
              {icon:"✍️",title:"AI Listing Engine",desc:"Generates product titles, descriptions, and SEO meta tags automatically. Multi-language (EN, FI, SE, DE)."},
              {icon:"💲",title:"Dynamic Pricing",desc:"Real-time competitor monitoring with margin-aware repricing. Set your floor — AI handles the rest."},
              {icon:"📦",title:"Auto-Fulfilment",desc:"Orders route to the right supplier automatically. Reroutes on stock issues."},
              {icon:"🤖",title:"AI Support Bot",desc:"Deflects 40–60% of support tickets. Handles shipping, returns, and product questions 24/7."},
              {icon:"📊",title:"Analytics Dashboard",desc:"Margin by product, niche, and supplier. Trend alerts before competitors catch on."},
            ].map(f=>(
              <div key={f.title} className="hv-card" style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:"20px 18px"}}>
                <div style={{fontSize:24,marginBottom:10}}><span className="hv-icon">{f.icon}</span></div>
                <div style={{fontSize:14,fontWeight:600,marginBottom:6}}>{f.title}</div>
                <div style={{fontSize:13,color:C.muted,lineHeight:1.65}}>{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" style={{padding:`${sec} ${px}`}}>
        <div style={{maxWidth:1160,margin:"0 auto"}}>
          <div style={{textAlign:"center",marginBottom:mob?36:48}}>
            <Tag>Pricing</Tag>
            <h2 style={{fontSize:mob?26:36,fontWeight:700,letterSpacing:"-0.03em",marginTop:14,marginBottom:8}}>Simple, honest pricing</h2>
            <p style={{fontSize:14,color:C.muted,marginBottom:18}}>14-day free trial on all plans. No credit card required.</p>
            <div style={{display:"inline-flex",background:C.card,border:`1px solid ${C.border}`,borderRadius:8,padding:4,gap:2}}>
              {["monthly","annual"].map(b=>(
                <button key={b} onClick={()=>setBilling(b)} style={{padding:"7px 14px",borderRadius:6,border:"none",cursor:"pointer",background:billing===b?C.accent:"transparent",color:billing===b?"#090B0F":C.muted,fontSize:11,fontWeight:billing===b?700:400,fontFamily:"'Space Grotesk',sans-serif"}}>
                  {b==="annual"?"Annual −20%":"Monthly"}
                </button>
              ))}
            </div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:mob?"1fr":"repeat(3,1fr)",gap:14,alignItems:"start"}}>
            {PLANS.map(plan=>{
              const price = billing==="annual" ? Math.round(plan.price*.8) : plan.price;
              return (
                <div key={plan.id} className="hv-card" style={{background:plan.highlight?`linear-gradient(145deg,${C.card},#181F30)`:C.card,border:`1px solid ${plan.highlight?C.accent:C.border}`,borderRadius:14,padding:mob?"24px 20px":"28px 24px",position:"relative",boxShadow:plan.highlight?`0 0 32px ${C.accent}18`:"none"}}>
                  {plan.highlight && <div style={{position:"absolute",top:-11,left:"50%",transform:"translateX(-50%)",background:C.accent,color:"#090B0F",fontSize:9,fontWeight:700,fontFamily:"'Space Mono',monospace",letterSpacing:"0.1em",padding:"3px 12px",borderRadius:20,textTransform:"uppercase",whiteSpace:"nowrap"}}>Most popular</div>}
                  <Tag color={plan.highlight?C.accent:C.a2}>{plan.tag}</Tag>
                  <div style={{fontSize:17,fontWeight:700,marginTop:12,marginBottom:4}}>{plan.name}</div>
                  <div style={{display:"flex",alignItems:"flex-end",gap:4,marginBottom:18}}>
                    <span className="mono" style={{fontSize:36,fontWeight:700,lineHeight:1}}>€{price}</span>
                    <span style={{fontSize:12,color:C.muted,marginBottom:5}}>/ mo</span>
                  </div>
                  <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:22}}>
                    {plan.features.map(f=>(
                      <div key={f} style={{display:"flex",gap:8,alignItems:"flex-start",fontSize:12}}><Check/><span style={{color:C.muted,lineHeight:1.5}}>{f}</span></div>
                    ))}
                  </div>
                  <Btn full variant={plan.highlight?"primary":"outline"} onClick={()=>openModal(plan.id)}>{plan.cta}</Btn>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" style={{background:C.surface,borderTop:`1px solid ${C.border}`,borderBottom:`1px solid ${C.border}`,padding:`${sec} ${px}`}}>
        <div style={{maxWidth:720,margin:"0 auto"}}>
          <div style={{textAlign:"center",marginBottom:mob?36:48}}>
            <Tag>FAQ</Tag>
            <h2 style={{fontSize:mob?26:36,fontWeight:700,letterSpacing:"-0.03em",marginTop:14}}>Common questions</h2>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:2}}>
            {FAQS.map((faq,i)=>(
              <div key={i} className="hv-faq" style={{background:C.card,borderRadius:10,overflow:"hidden",border:`1px solid ${openFaq===i?C.accent:C.border}`}}>
                <button onClick={()=>setOpenFaq(openFaq===i?null:i)} style={{width:"100%",padding:"16px 18px",background:"none",border:"none",display:"flex",justifyContent:"space-between",alignItems:"center",cursor:"pointer",color:C.text,fontSize:mob?13:14,fontWeight:600,fontFamily:"'Space Grotesk',sans-serif",textAlign:"left",gap:12}}>
                  <span>{faq.q}</span>
                  <span style={{color:C.muted,fontSize:20,flexShrink:0,transform:openFaq===i?"rotate(45deg)":"none",transition:"transform .2s"}}>+</span>
                </button>
                {openFaq===i && <div className="fadeUp" style={{padding:"0 18px 16px",fontSize:13,color:C.muted,lineHeight:1.75}}>{faq.a}</div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section style={{padding:`${sec} ${px}`}}>
        <div style={{maxWidth:760,margin:"0 auto",textAlign:"center",background:`linear-gradient(135deg,${C.accent}08,${C.a2}08)`,border:`1px solid ${C.border}`,borderRadius:16,padding:mob?"32px 20px":"56px 48px"}}>
          <Tag>Limited early access</Tag>
          <h2 style={{fontSize:mob?26:36,fontWeight:700,letterSpacing:"-0.03em",marginTop:16,marginBottom:12}}>Ready to let AI run<br/>your store?</h2>
          <p style={{fontSize:14,color:C.muted,maxWidth:420,margin:"0 auto 28px",lineHeight:1.75}}>Join the waitlist now. Free 14-day trial, no card required.</p>
          <div style={{maxWidth:360,margin:"0 auto"}}>
            {ctaSuccess
              ? <SuccessCard entry={ctaSuccess} onBack={()=>setCtaSuccess(null)}/>
              : <WaitlistForm plan="pro" onSuccess={setCtaSuccess}/>
            }
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{borderTop:`1px solid ${C.border}`,padding:`24px ${px}`,display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:12}}>
        <div className="mono hv-logo" style={{fontSize:14,fontWeight:700}}>Drop<span style={{color:C.accent}}>Synth</span></div>
        <div style={{fontSize:11,color:C.dim}}>© 2026 DropSynth</div>
        <div style={{display:"flex",gap:20}}>
          <a className="hv-link" href="/privacy.html" style={{fontSize:12,color:C.muted,textDecoration:"none"}}>Privacy</a>
          <a className="hv-link" href="mailto:hello@dropsynth.app" style={{fontSize:12,color:C.muted,textDecoration:"none"}}>Contact</a>
        </div>
      </footer>
    </div>
  );
}
