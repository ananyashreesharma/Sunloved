// SkinLens screens — all phone-content components

// ─── data ────────────────────────────────────────────────────────────────
const TONE_GREETINGS = {
  morning: {
    Gentle: "Good morning, sunshine. Five minutes for your skin today. You've earned it.",
    Bold: "Your skin didn't come this far to be treated with trash ingredients. Let's go.",
    Spiritual: "The morning is yours. Begin it with intention. Begin it with care.",
    Playful: "Rise and glow. Your pores are ready. Are you?",
  },
  night: {
    Gentle: "Your skin repairs itself while you sleep. Give it what it needs tonight.",
    Bold: "You're not an overthinker. You're emotionally intelligent. Now go wash your face.",
    Spiritual: "Release the day. Let your skin breathe, rest, renew.",
    Playful: "Skincare o'clock. Your SPF worked hard all day. Time to clock out.",
  }
};

const VERDICTS = {
  RED: {
    word: "Avoid",
    sub: "We found ingredients we wouldn't put on our own skin.",
    hex: 'var(--red)',
    soft: 'var(--red-soft)',
    count: { red: 3, amber: 4, green: 18 }
  },
  YELLOW: {
    word: "Use with care",
    sub: "Mostly fine, but a few flags worth knowing about.",
    hex: 'var(--amber)',
    soft: 'var(--amber-soft)',
    count: { red: 0, amber: 5, green: 17 }
  },
  GREEN: {
    word: "Skin-safe",
    sub: "Clean ingredients. We'd happily put this on our face.",
    hex: 'var(--green)',
    soft: 'var(--green-soft)',
    count: { red: 0, amber: 1, green: 21 }
  }
};

// fictional product — original brand
const PRODUCT = {
  name: "Lumière Glow Brightening Serum",
  brand: "Aurora Skin Co.",
  size: "30 ml · ₹ 1,249",
  ingredients: [
    { name: "Hydroquinone", zone: "red", note: "A skin-bleaching agent. Banned for over-the-counter use in many countries." },
    { name: "Mercury (as Calomel)", zone: "red", note: "A neurotoxin. Should not be on a label, let alone on your face." },
    { name: "Methylparaben", zone: "red", note: "A preservative linked to hormone disruption." },
    { name: "Fragrance / Parfum", zone: "amber", note: "Can hide hundreds of undisclosed chemicals. Common irritant." },
    { name: "Sodium Lauryl Sulfate", zone: "amber", note: "Strips skin's natural oils. Can cause dryness and redness." },
    { name: "Phenoxyethanol", zone: "amber", note: "Generally safe in low doses. Worth knowing it's there." },
    { name: "Niacinamide", zone: "green", note: "Vitamin B3. Calms redness and supports the skin barrier." },
    { name: "Glycerin", zone: "green", note: "A humectant. Pulls moisture into the skin." },
    { name: "Aqua (Water)", zone: "green", note: "The base of most formulations. Always safe." },
  ]
};

// ─── tiny svg primitives ─────────────────────────────────────────────────
const Dot = ({ c, size = 8 }) => (
  <span style={{ width: size, height: size, borderRadius: 99, background: c, display: 'inline-block' }} />
);

const Caret = ({ c = 'var(--ink-mute)', size = 10 }) => (
  <svg width={size} height={size * 1.4} viewBox="0 0 10 14" style={{ flexShrink: 0 }}>
    <path d="M2 2l5 5-5 5" stroke={c} strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// striped placeholder for product imagery
const ProductPlaceholder = ({ w = 60, h = 60, label, dark = false }) => (
  <div style={{
    width: w, height: h, borderRadius: 8,
    background: `repeating-linear-gradient(135deg, ${dark ? '#3a342d' : '#E8DFCC'} 0 5px, ${dark ? '#332e28' : '#DDD3BC'} 5px 10px)`,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontFamily: 'JetBrains Mono', fontSize: 7, color: dark ? '#8a7f71' : '#8A7F71',
    textAlign: 'center', padding: 4, boxSizing: 'border-box', lineHeight: 1.2,
  }}>{label}</div>
);

// ─── ONBOARDING — tone picker ────────────────────────────────────────────
function OnboardingScreen({ tone, setTone }) {
  const tones = [
    { name: 'Gentle', sample: '"Good morning, sunshine."', },
    { name: 'Bold', sample: '"Now go wash your face."' },
    { name: 'Spiritual', sample: '"Begin with intention."' },
    { name: 'Playful', sample: '"Rise and glow."' },
  ];
  return (
    <div style={{ padding: '70px 28px 40px', height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bone)' }}>
      <div className="mono" style={{ fontSize: 10, letterSpacing: 2, color: 'var(--ink-mute)', marginBottom: 20 }}>STEP 03 OF 03</div>
      <h1 className="serif" style={{ fontSize: 44, lineHeight: 1.02, margin: 0, color: 'var(--ink)', letterSpacing: -0.5 }}>
        Choose<br/>the voice<br/><em style={{ fontStyle: 'italic' }}>you'll wake up to.</em>
      </h1>
      <p style={{ fontSize: 14, lineHeight: 1.5, color: 'var(--ink-soft)', marginTop: 16, marginBottom: 26 }}>
        We'll send one note in the morning, one at night.<br/>
        You can change this anytime.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
        {tones.map(t => {
          const active = tone === t.name;
          return (
            <button key={t.name} onClick={() => setTone(t.name)} style={{
              textAlign: 'left',
              padding: '14px 16px',
              border: active ? '1px solid var(--ink)' : '1px solid var(--line)',
              background: active ? 'var(--ink)' : 'var(--card)',
              color: active ? 'var(--bone)' : 'var(--ink)',
              borderRadius: 12,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              transition: 'all 200ms ease',
            }}>
              <div>
                <div className="serif" style={{ fontSize: 22, lineHeight: 1, marginBottom: 4 }}>{t.name}</div>
                <div style={{ fontSize: 12, opacity: 0.7, fontStyle: 'italic' }}>{t.sample}</div>
              </div>
              <div style={{
                width: 18, height: 18, borderRadius: 99,
                border: active ? '1px solid var(--bone)' : '1px solid var(--ink-mute)',
                background: active ? 'var(--bone)' : 'transparent',
              }} />
            </button>
          );
        })}
      </div>

      <button style={{
        marginTop: 18, padding: '16px 0', borderRadius: 99,
        border: 'none', background: 'var(--ink)', color: 'var(--bone)',
        fontSize: 15, fontWeight: 500, letterSpacing: -0.1,
        boxShadow: '0 4px 14px rgba(26,23,20,0.18)',
      }}>
        Allow notifications · Continue
      </button>
    </div>
  );
}

// ─── HOME ────────────────────────────────────────────────────────────────
function HomeScreen({ tone, streak, setScreen }) {
  return (
    <div style={{ background: 'var(--bone)', minHeight: '100%', paddingBottom: 110 }}>
      {/* top bar */}
      <div style={{ paddingTop: 60, padding: '60px 24px 8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div className="mono" style={{ fontSize: 10, letterSpacing: 1.6, color: 'var(--ink-mute)' }}>FRIDAY · 6:47 AM</div>
          <div className="serif" style={{ fontSize: 28, lineHeight: 1.05, marginTop: 4 }}>Morning, Aanya.</div>
        </div>
        <div style={{
          width: 38, height: 38, borderRadius: 99, background: 'var(--ink)', color: 'var(--bone)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'Instrument Serif', fontSize: 18,
        }}>A</div>
      </div>

      {/* hero streak card */}
      <div style={{
        margin: '20px 16px 0', padding: '28px 24px 24px',
        background: 'var(--ink)', color: 'var(--bone)', borderRadius: 24,
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', top: -40, right: -40, width: 180, height: 180, borderRadius: 99,
          background: 'radial-gradient(circle at 30% 30%, rgba(244,239,231,0.15), transparent 70%)',
        }} />
        <div className="mono" style={{ fontSize: 10, letterSpacing: 2, opacity: 0.5 }}>CURRENT STREAK</div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginTop: 4 }}>
          <span className="serif" style={{ fontSize: 92, lineHeight: 0.9, fontWeight: 400 }}>{streak}</span>
          <span className="serif" style={{ fontSize: 22, opacity: 0.7, fontStyle: 'italic' }}>days</span>
        </div>
        <div style={{ fontSize: 13, lineHeight: 1.45, opacity: 0.78, marginTop: 14, maxWidth: 260 }}>
          {streak >= 100 ? "One hundred days. Your skin remembers every single one."
            : streak >= 30 ? "Most people quit in week two. You didn't."
            : streak >= 7 ? "That's not luck. That's a decision you made every single day."
            : "Every day counts. Begin again."}
        </div>
        <div style={{ display: 'flex', gap: 6, marginTop: 18 }}>
          {Array.from({ length: 14 }).map((_, i) => (
            <div key={i} style={{
              flex: 1, height: 4, borderRadius: 2,
              background: i < Math.min(14, streak) ? 'var(--bone)' : 'rgba(244,239,231,0.18)'
            }} />
          ))}
        </div>
      </div>

      {/* today's routine */}
      <div style={{ padding: '24px 24px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <div className="mono" style={{ fontSize: 10, letterSpacing: 1.6, color: 'var(--ink-mute)' }}>TODAY'S RITUAL</div>
        <div style={{ fontSize: 12, color: 'var(--ink-mute)' }}>2 of 4 done</div>
      </div>
      <div style={{ margin: '8px 16px', background: 'var(--card)', borderRadius: 18, border: '1px solid var(--line)', overflow: 'hidden' }}>
        {[
          { name: 'Gentle Cleanser', brand: 'Plum', done: true, zone: 'green' },
          { name: 'Vitamin C Serum', brand: 'Minimalist', done: true, zone: 'green', wait: '10 min' },
          { name: 'Moisturizer', brand: 'Re\'equil', done: false, zone: 'amber' },
          { name: 'SPF 50', brand: 'The Derma Co.', done: false, zone: 'green' },
        ].map((s, i, arr) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', padding: '14px 16px',
            borderBottom: i < arr.length - 1 ? '1px solid var(--line)' : 'none',
            opacity: s.done ? 0.55 : 1,
          }}>
            <div style={{
              width: 22, height: 22, borderRadius: 99, marginRight: 12,
              border: s.done ? 'none' : '1.5px solid var(--ink-mute)',
              background: s.done ? 'var(--ink)' : 'transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {s.done && <svg width="10" height="10" viewBox="0 0 10 10"><path d="M2 5l2 2 4-4" stroke="var(--bone)" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 500, textDecoration: s.done ? 'line-through' : 'none' }}>{s.name}</div>
              <div style={{ fontSize: 11, color: 'var(--ink-mute)' }}>{s.brand}{s.wait && ' · wait ' + s.wait}</div>
            </div>
            <Dot c={`var(--${s.zone})`} />
          </div>
        ))}
      </div>

      {/* primary scan CTA */}
      <button onClick={() => setScreen('scan')} style={{
        margin: '20px 16px 0', padding: '20px', width: 'calc(100% - 32px)',
        background: 'var(--bone-deep)', border: '1px solid var(--line)', borderRadius: 18,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ textAlign: 'left' }}>
          <div className="serif" style={{ fontSize: 22, lineHeight: 1 }}>Scan a label</div>
          <div style={{ fontSize: 12, color: 'var(--ink-mute)', marginTop: 4 }}>Know what's on your skin in 4 seconds.</div>
        </div>
        <div style={{
          width: 44, height: 44, borderRadius: 99, background: 'var(--ink)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <rect x="3" y="5" width="14" height="10" rx="2" stroke="var(--bone)" strokeWidth="1.5"/>
            <circle cx="10" cy="10" r="2.5" stroke="var(--bone)" strokeWidth="1.5"/>
          </svg>
        </div>
      </button>

      {/* recent scans */}
      <div className="mono" style={{ padding: '24px 24px 8px', fontSize: 10, letterSpacing: 1.6, color: 'var(--ink-mute)' }}>RECENTLY SCANNED</div>
      <div style={{ display: 'flex', gap: 10, padding: '0 16px', overflowX: 'auto' }} className="scroll-hide">
        {[
          { n: 'Lumière Serum', z: 'red', b: 'Aurora' },
          { n: 'Hydra Cream', z: 'amber', b: 'Plum' },
          { n: 'SPF 50', z: 'green', b: 'Derma Co.' },
        ].map((p, i) => (
          <div key={i} style={{ minWidth: 130, background: 'var(--card)', border: '1px solid var(--line)', borderRadius: 14, padding: 12 }}>
            <ProductPlaceholder w={56} h={56} label="bottle" />
            <div style={{ marginTop: 10, fontSize: 12, fontWeight: 500, lineHeight: 1.2 }}>{p.n}</div>
            <div style={{ fontSize: 10, color: 'var(--ink-mute)', marginTop: 2 }}>{p.b}</div>
            <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Dot c={`var(--${p.z})`} size={6} />
              <span className="mono" style={{ fontSize: 9, letterSpacing: 1, color: `var(--${p.z})`, textTransform: 'uppercase' }}>
                {p.z === 'red' ? 'Avoid' : p.z === 'amber' ? 'Caution' : 'Safe'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── SCAN INPUT ──────────────────────────────────────────────────────────
function ScanScreen({ setScreen }) {
  const [tab, setTab] = React.useState('photo');
  return (
    <div style={{ background: 'var(--bone)', minHeight: '100%', paddingBottom: 110 }}>
      <div style={{ paddingTop: 64, padding: '64px 24px 0' }}>
        <button onClick={() => setScreen('home')} style={{ background: 'none', border: 'none', padding: 0, fontSize: 13, color: 'var(--ink-mute)', display: 'flex', alignItems: 'center', gap: 4 }}>
          <svg width="14" height="14" viewBox="0 0 14 14"><path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>
          Home
        </button>
        <h1 className="serif" style={{ fontSize: 36, lineHeight: 1.05, margin: '14px 0 6px' }}>What's on your skin?</h1>
        <p style={{ fontSize: 13, color: 'var(--ink-soft)', lineHeight: 1.5, margin: 0 }}>
          Three ways in. Pick whichever is fastest right now.
        </p>
      </div>

      {/* tabs */}
      <div style={{ display: 'flex', gap: 6, padding: '20px 16px 0' }}>
        {[
          { id: 'photo', label: 'Photograph' },
          { id: 'paste', label: 'Type / Paste' },
          { id: 'search', label: 'Search' },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            flex: 1, padding: '10px 0', borderRadius: 99, fontSize: 12, fontWeight: 500,
            background: tab === t.id ? 'var(--ink)' : 'transparent',
            color: tab === t.id ? 'var(--bone)' : 'var(--ink-soft)',
            border: tab === t.id ? '1px solid var(--ink)' : '1px solid var(--line)',
          }}>{t.label}</button>
        ))}
      </div>

      {tab === 'photo' && (
        <div style={{ margin: '16px', padding: 16, background: 'var(--ink)', borderRadius: 24, color: 'var(--bone)' }}>
          {/* mock viewfinder */}
          <div style={{
            aspectRatio: '3/4', borderRadius: 16, position: 'relative', overflow: 'hidden',
            background: `repeating-linear-gradient(135deg, #3a342d 0 8px, #332e28 8px 16px)`,
          }}>
            {/* corner brackets */}
            {[
              { top: 16, left: 16, br: '4px 0 0 0' },
              { top: 16, right: 16, br: '0 4px 0 0' },
              { bottom: 16, left: 16, br: '0 0 0 4px' },
              { bottom: 16, right: 16, br: '0 0 4px 0' },
            ].map((b, i) => {
              const isTop = b.top !== undefined;
              const isLeft = b.left !== undefined;
              return (
                <div key={i} style={{
                  position: 'absolute', ...b, width: 28, height: 28,
                  borderTop: isTop ? '2px solid var(--bone)' : 'none',
                  borderBottom: !isTop ? '2px solid var(--bone)' : 'none',
                  borderLeft: isLeft ? '2px solid var(--bone)' : 'none',
                  borderRight: !isLeft ? '2px solid var(--bone)' : 'none',
                }} />
              );
            })}
            {/* product label mockup */}
            <div style={{
              position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%) rotate(-2deg)',
              width: '70%', background: 'rgba(244,239,231,0.92)', color: 'var(--ink)',
              padding: '14px 16px', borderRadius: 4,
            }}>
              <div className="mono" style={{ fontSize: 7, letterSpacing: 1, opacity: 0.6 }}>INGREDIENTS</div>
              <div style={{ fontSize: 8.5, lineHeight: 1.5, marginTop: 4 }}>
                Aqua, Niacinamide, Glycerin, Hydroquinone, Methylparaben, Sodium Lauryl Sulfate, Phenoxyethanol, Fragrance, Mercury (as Calomel)…
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 18 }}>
            <div style={{ fontSize: 12, opacity: 0.6 }}>Hold steady. We'll auto-capture.</div>
            <button onClick={() => setScreen('reveal')} style={{
              width: 56, height: 56, borderRadius: 99, background: 'var(--bone)',
              border: '4px solid rgba(244,239,231,0.3)', boxShadow: '0 0 0 2px var(--bone)',
            }} />
          </div>
        </div>
      )}

      {tab === 'paste' && (
        <div style={{ margin: 16 }}>
          <div style={{
            background: 'var(--card)', border: '1px solid var(--line)', borderRadius: 16,
            padding: 16, minHeight: 180, fontSize: 13, lineHeight: 1.5, color: 'var(--ink-soft)',
          }}>
            <span style={{ color: 'var(--ink)' }}>Aqua, Niacinamide, Glycerin, Hydroquinone, Methylparaben, Sodium Lauryl Sulfate, Phenoxyethanol, Fragrance,</span>
            <span style={{ background: 'var(--ink)', color: 'var(--bone)', display: 'inline-block', width: 1.5, height: 14, marginLeft: 1, verticalAlign: -2 }}/>
          </div>
          <button onClick={() => setScreen('reveal')} style={{
            width: '100%', marginTop: 12, padding: '15px', borderRadius: 99,
            background: 'var(--ink)', color: 'var(--bone)', border: 'none',
            fontSize: 14, fontWeight: 500,
          }}>Analyze 9 ingredients</button>
        </div>
      )}

      {tab === 'search' && (
        <div style={{ margin: 16 }}>
          <div style={{
            background: 'var(--card)', border: '1px solid var(--line)', borderRadius: 99,
            padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <svg width="14" height="14" viewBox="0 0 14 14"><circle cx="6" cy="6" r="4.5" stroke="var(--ink-mute)" strokeWidth="1.4" fill="none"/><path d="M9.5 9.5l3 3" stroke="var(--ink-mute)" strokeWidth="1.4" strokeLinecap="round"/></svg>
            <span style={{ fontSize: 13, color: 'var(--ink)' }}>Lumière Glow</span>
            <span style={{ fontSize: 13, color: 'var(--ink-mute)', flex: 1 }}>Brightening Serum</span>
          </div>
          {[
            { n: 'Lumière Glow Brightening Serum', b: 'Aurora Skin Co.', z: 'red' },
            { n: 'Lumière Glow Day Cream', b: 'Aurora Skin Co.', z: 'amber' },
            { n: 'Lumière Lite Sunscreen', b: 'Aurora Skin Co.', z: 'green' },
          ].map((r, i) => (
            <button key={i} onClick={() => setScreen('reveal')} style={{
              width: '100%', textAlign: 'left', marginTop: 8, padding: 14,
              background: 'var(--card)', border: '1px solid var(--line)', borderRadius: 14,
              display: 'flex', alignItems: 'center', gap: 12,
            }}>
              <ProductPlaceholder w={44} h={44} label="prod" />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{r.n}</div>
                <div style={{ fontSize: 11, color: 'var(--ink-mute)' }}>{r.b}</div>
              </div>
              <Dot c={`var(--${r.z})`} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── REVEAL — the cinematic moment ───────────────────────────────────────
function RevealScreen({ verdict, setScreen }) {
  const v = VERDICTS[verdict];
  const [phase, setPhase] = React.useState('analyzing');
  React.useEffect(() => {
    const t1 = setTimeout(() => setPhase('reveal'), 1100);
    return () => clearTimeout(t1);
  }, [verdict]);

  // analyzing state
  if (phase === 'analyzing') {
    return (
      <div style={{
        background: 'var(--ink)', minHeight: '100%', color: 'var(--bone)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: 40, textAlign: 'center',
      }}>
        <div style={{
          width: 72, height: 72, borderRadius: 99,
          border: '1px solid rgba(244,239,231,0.2)',
          borderTopColor: 'var(--bone)',
          animation: 'spin 1.4s linear infinite',
        }} />
        <div className="serif" style={{ fontSize: 26, lineHeight: 1.2, marginTop: 30 }}><em>Reading every ingredient.</em></div>
        <div className="mono" style={{ fontSize: 11, letterSpacing: 1.6, opacity: 0.5, marginTop: 12 }}>9 OF 9 · 100%</div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // reveal screen — the moment
  return (
    <div style={{
      background: v.soft, minHeight: '100%', position: 'relative', overflow: 'hidden',
      animation: 'fadeIn 600ms ease',
    }}>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes riseIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>

      {/* gradient bloom */}
      <div style={{
        position: 'absolute', top: -100, left: -100, right: -100, height: 500,
        background: `radial-gradient(ellipse at center top, ${v.hex.replace('var(--','').replace(')','') === 'red' ? 'rgba(138,42,34,0.4)' : v.hex.replace('var(--','').replace(')','') === 'amber' ? 'rgba(181,118,42,0.35)' : 'rgba(79,107,61,0.3)'} 0%, transparent 70%)`,
      }} />

      {/* status bar / close */}
      <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', padding: '60px 24px 0' }}>
        <button onClick={() => setScreen('scan')} style={{
          width: 36, height: 36, borderRadius: 99, background: 'rgba(26,23,20,0.08)',
          border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="14" height="14" viewBox="0 0 14 14"><path d="M3 3l8 8M11 3l-8 8" stroke="var(--ink)" strokeWidth="1.5" strokeLinecap="round"/></svg>
        </button>
        <button onClick={() => setScreen('share')} style={{
          padding: '8px 14px', borderRadius: 99, background: 'rgba(26,23,20,0.08)',
          border: 'none', fontSize: 12, fontWeight: 500, color: 'var(--ink)',
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          <svg width="12" height="12" viewBox="0 0 14 14"><path d="M7 1v9M3 5l4-4 4 4M2 11v2h10v-2" stroke="var(--ink)" strokeWidth="1.4" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>
          Share
        </button>
      </div>

      <div style={{ position: 'relative', padding: '40px 28px 0', textAlign: 'center' }}>
        <div className="mono" style={{ fontSize: 10, letterSpacing: 2, color: 'var(--ink-mute)', animation: 'riseIn 500ms ease 0ms backwards' }}>
          AURORA SKIN CO.
        </div>
        <div className="serif" style={{ fontSize: 22, marginTop: 4, lineHeight: 1.2, animation: 'riseIn 600ms ease 80ms backwards' }}>
          Lumière Glow<br/><em>Brightening Serum</em>
        </div>

        {/* The verdict */}
        <div style={{ marginTop: 36, animation: 'riseIn 700ms ease 250ms backwards' }}>
          <div style={{
            display: 'inline-block', padding: '4px 14px', borderRadius: 99,
            background: v.hex, color: 'var(--bone)',
          }} className="mono" >
            <span style={{ fontSize: 10, letterSpacing: 2 }}>{verdict}</span>
          </div>
          <div className="serif" style={{
            fontSize: 88, lineHeight: 0.95, marginTop: 16,
            color: v.hex, letterSpacing: -2, fontWeight: 400,
          }}>
            <em>{v.word}.</em>
          </div>
          <div style={{ fontSize: 14, lineHeight: 1.5, color: 'var(--ink)', maxWidth: 280, margin: '18px auto 0', opacity: 0.85 }}>
            {v.sub}
          </div>
        </div>

        {/* breakdown bar */}
        <div style={{ marginTop: 38, animation: 'riseIn 700ms ease 450ms backwards' }}>
          <div style={{ display: 'flex', borderRadius: 99, overflow: 'hidden', height: 6, background: 'rgba(26,23,20,0.08)' }}>
            <div style={{ flex: v.count.red, background: 'var(--red)' }} />
            <div style={{ flex: v.count.amber, background: 'var(--amber)' }} />
            <div style={{ flex: v.count.green, background: 'var(--green)' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, padding: '0 4px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <Dot c="var(--red)" size={6}/>
              <span style={{ fontSize: 11 }}>{v.count.red} avoid</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <Dot c="var(--amber)" size={6}/>
              <span style={{ fontSize: 11 }}>{v.count.amber} caution</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <Dot c="var(--green)" size={6}/>
              <span style={{ fontSize: 11 }}>{v.count.green} safe</span>
            </div>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div style={{ padding: '36px 16px 16px', display: 'flex', flexDirection: 'column', gap: 8, animation: 'riseIn 700ms ease 600ms backwards' }}>
        <button onClick={() => setScreen('ingredients')} style={{
          padding: '17px', borderRadius: 99, background: 'var(--ink)', color: 'var(--bone)',
          border: 'none', fontSize: 14, fontWeight: 500,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        }}>
          See every ingredient
          <Caret c="var(--bone)" />
        </button>
        {verdict !== 'GREEN' && (
          <button onClick={() => setScreen('swap')} style={{
            padding: '17px', borderRadius: 99, background: 'transparent', color: 'var(--ink)',
            border: '1px solid var(--ink)', fontSize: 14, fontWeight: 500,
          }}>
            Show me what to use instead
          </button>
        )}
      </div>
    </div>
  );
}

// ─── INGREDIENTS LIST ────────────────────────────────────────────────────
function IngredientsScreen({ verdict, setScreen }) {
  const v = VERDICTS[verdict];
  return (
    <div style={{ background: 'var(--bone)', minHeight: '100%', paddingBottom: 110 }}>
      <div style={{ paddingTop: 60, padding: '60px 24px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button onClick={() => setScreen('reveal')} style={{ background: 'none', border: 'none', padding: 0, fontSize: 13, color: 'var(--ink-mute)', display: 'flex', alignItems: 'center', gap: 4 }}>
          <svg width="14" height="14" viewBox="0 0 14 14"><path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>
          Back
        </button>
        <Dot c={v.hex} size={10} />
      </div>

      <div style={{ padding: '14px 24px 0' }}>
        <div className="mono" style={{ fontSize: 10, letterSpacing: 2, color: 'var(--ink-mute)' }}>9 INGREDIENTS</div>
        <h1 className="serif" style={{ fontSize: 32, lineHeight: 1.05, margin: '6px 0 4px' }}>Here's what's<br/><em>actually in it.</em></h1>
        <p style={{ fontSize: 13, color: 'var(--ink-soft)', margin: 0, lineHeight: 1.5 }}>Tap any ingredient to learn more.</p>
      </div>

      {/* badges */}
      <div style={{ display: 'flex', gap: 6, padding: '20px 16px 0', flexWrap: 'wrap' }}>
        {[
          { l: 'Cruelty-free', ok: true },
          { l: 'Vegan', ok: false },
          { l: 'Pregnancy-safe', ok: false },
          { l: 'Fragrance', ok: 'flag' },
          { l: 'Parabens', ok: 'flag' },
        ].map((b, i) => (
          <div key={i} style={{
            padding: '6px 11px', borderRadius: 99, fontSize: 11, fontWeight: 500,
            background: b.ok === true ? 'var(--green-soft)' : b.ok === 'flag' ? 'var(--red-soft)' : 'var(--bone-deep)',
            color: b.ok === true ? 'var(--green)' : b.ok === 'flag' ? 'var(--red)' : 'var(--ink-mute)',
            display: 'flex', alignItems: 'center', gap: 4,
            textDecoration: b.ok === false ? 'line-through' : 'none',
            border: '1px solid ' + (b.ok === true ? 'rgba(79,107,61,0.2)' : b.ok === 'flag' ? 'rgba(138,42,34,0.2)' : 'var(--line)'),
          }}>
            {b.ok === true && '✓'}
            {b.ok === 'flag' && '⚠'}
            {b.l}
          </div>
        ))}
      </div>

      {/* ingredient list */}
      <div style={{ margin: '20px 16px', background: 'var(--card)', borderRadius: 18, border: '1px solid var(--line)', overflow: 'hidden' }}>
        {PRODUCT.ingredients.map((ing, i) => (
          <div key={i} style={{
            padding: '16px 18px',
            borderBottom: i < PRODUCT.ingredients.length - 1 ? '1px solid var(--line)' : 'none',
            display: 'flex', gap: 14, alignItems: 'flex-start',
          }}>
            <div style={{
              minWidth: 22, marginTop: 3,
              fontFamily: 'JetBrains Mono', fontSize: 10, color: 'var(--ink-mute)',
            }}>{String(i + 1).padStart(2, '0')}</div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <Dot c={`var(--${ing.zone})`} size={7} />
                <span style={{ fontSize: 14, fontWeight: 500 }}>{ing.name}</span>
              </div>
              <div style={{ fontSize: 12.5, lineHeight: 1.45, color: 'var(--ink-soft)' }}>{ing.note}</div>
            </div>
          </div>
        ))}
      </div>

      {verdict !== 'GREEN' && (
        <button onClick={() => setScreen('swap')} style={{
          margin: '12px 16px 0', padding: '17px', width: 'calc(100% - 32px)', borderRadius: 99,
          background: 'var(--ink)', color: 'var(--bone)', border: 'none', fontSize: 14, fontWeight: 500,
        }}>Show me a better version →</button>
      )}
    </div>
  );
}

// ─── SMART SWAP ──────────────────────────────────────────────────────────
function SwapScreen({ setScreen }) {
  const [filter, setFilter] = React.useState('Better ingredients');
  const swaps = [
    {
      name: 'Plum 5% Niacinamide Serum', brand: 'Plum Goodness',
      diff: 'Removes hydroquinone & mercury. Adds niacinamide. ₹400 cheaper.',
      price: '₹ 849', oldPrice: '₹ 1,249', zone: 'green', match: 96
    },
    {
      name: 'Minimalist Alpha Arbutin 2%', brand: 'Minimalist',
      diff: 'Same brightening effect, dermatologist-tested. No parabens.',
      price: '₹ 699', oldPrice: '₹ 1,249', zone: 'green', match: 92
    },
    {
      name: 'The Derma Co. Brightening Serum', brand: 'The Derma Co.',
      diff: 'Removes parabens. Adds vitamin C. Pregnancy-safe.',
      price: '₹ 749', oldPrice: '₹ 1,249', zone: 'amber', match: 84
    },
  ];

  return (
    <div style={{ background: 'var(--bone)', minHeight: '100%', paddingBottom: 110 }}>
      <div style={{ paddingTop: 60, padding: '60px 24px 0' }}>
        <button onClick={() => setScreen('reveal')} style={{ background: 'none', border: 'none', padding: 0, fontSize: 13, color: 'var(--ink-mute)', display: 'flex', alignItems: 'center', gap: 4 }}>
          <svg width="14" height="14" viewBox="0 0 14 14"><path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>
          Back
        </button>
        <h1 className="serif" style={{ fontSize: 36, lineHeight: 1.05, margin: '14px 0 8px' }}>
          Try one of these <em>instead.</em>
        </h1>
        <p style={{ fontSize: 13, color: 'var(--ink-soft)', margin: 0, lineHeight: 1.5 }}>
          Ranked by ingredient quality. Never by who paid us. <span style={{ textDecoration: 'underline', textDecorationColor: 'var(--line)', textUnderlineOffset: 3 }}>How we rank →</span>
        </p>
      </div>

      {/* filter pills */}
      <div style={{ display: 'flex', gap: 6, padding: '20px 16px 0', overflowX: 'auto' }} className="scroll-hide">
        {['Better ingredients', 'Cheaper', 'Vegan', 'Cruelty-free', 'Pregnancy-safe'].map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding: '8px 14px', borderRadius: 99, fontSize: 12, fontWeight: 500,
            background: filter === f ? 'var(--ink)' : 'var(--card)',
            color: filter === f ? 'var(--bone)' : 'var(--ink-soft)',
            border: filter === f ? '1px solid var(--ink)' : '1px solid var(--line)',
            whiteSpace: 'nowrap', flexShrink: 0,
          }}>{f}</button>
        ))}
      </div>

      {/* swap cards */}
      <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {swaps.map((s, i) => (
          <div key={i} style={{
            background: 'var(--card)', border: '1px solid var(--line)', borderRadius: 18,
            padding: 16, position: 'relative', overflow: 'hidden',
          }}>
            <div style={{ display: 'flex', gap: 12 }}>
              <ProductPlaceholder w={70} h={84} label="bottle" />
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Dot c={`var(--${s.zone})`} size={6}/>
                  <span className="mono" style={{ fontSize: 9, letterSpacing: 1.4, color: 'var(--ink-mute)', textTransform: 'uppercase' }}>{s.brand}</span>
                </div>
                <div className="serif" style={{ fontSize: 18, lineHeight: 1.2, marginTop: 4 }}>{s.name}</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 6 }}>
                  <span style={{ fontSize: 16, fontWeight: 600 }}>{s.price}</span>
                  <span style={{ fontSize: 12, color: 'var(--ink-mute)', textDecoration: 'line-through' }}>{s.oldPrice}</span>
                </div>
              </div>
              {/* match circle */}
              <div style={{ textAlign: 'center' }}>
                <div className="serif" style={{ fontSize: 28, color: 'var(--green)', lineHeight: 1 }}>{s.match}</div>
                <div className="mono" style={{ fontSize: 8, letterSpacing: 1.4, color: 'var(--ink-mute)', marginTop: 2 }}>MATCH</div>
              </div>
            </div>
            <div style={{
              marginTop: 12, padding: 12, background: 'var(--bone-deep)', borderRadius: 10,
              fontSize: 12, lineHeight: 1.45, color: 'var(--ink-soft)',
            }}>
              {s.diff}
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <button style={{
                flex: 1, padding: '12px', borderRadius: 99, fontSize: 13, fontWeight: 500,
                background: 'var(--ink)', color: 'var(--bone)', border: 'none',
              }}>Buy on Nykaa</button>
              <button style={{
                width: 44, height: 44, borderRadius: 99,
                background: 'transparent', border: '1px solid var(--line)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <svg width="14" height="14" viewBox="0 0 14 14"><path d="M3 1v12l4-3 4 3V1z" stroke="var(--ink)" strokeWidth="1.4" fill="none" strokeLinejoin="round"/></svg>
              </button>
            </div>
          </div>
        ))}
      </div>

      <div style={{ padding: '0 24px 30px', textAlign: 'center', fontSize: 11, color: 'var(--ink-mute)', lineHeight: 1.5 }}>
        SkinLens earns a small commission on purchases.<br/>
        <span style={{ color: 'var(--ink-soft)' }}>This never affects ranking.</span>
      </div>
    </div>
  );
}

// ─── LOCK SCREEN ─────────────────────────────────────────────────────────
function LockScreen({ tone }) {
  const msg = TONE_GREETINGS.morning[tone];
  return (
    <div style={{
      width: '100%', height: '100%', position: 'relative',
      background: 'linear-gradient(180deg, #2a1f18 0%, #0e0a07 100%)',
      overflow: 'hidden',
    }}>
      {/* moody bloom */}
      <div style={{
        position: 'absolute', top: '20%', left: '-30%', width: '160%', height: 400,
        background: 'radial-gradient(ellipse at center, rgba(244,217,178,0.12) 0%, transparent 65%)',
      }} />

      {/* time */}
      <div style={{ paddingTop: 90, textAlign: 'center', color: '#fff' }}>
        <div className="mono" style={{ fontSize: 11, letterSpacing: 2, opacity: 0.5 }}>FRIDAY, OCTOBER 24</div>
        <div className="serif" style={{ fontSize: 96, lineHeight: 1, marginTop: 4, fontWeight: 300, letterSpacing: -2 }}>6:47</div>
      </div>

      {/* notification */}
      <div style={{
        position: 'absolute', bottom: 130, left: 14, right: 14,
        background: 'rgba(255,255,255,0.14)',
        backdropFilter: 'blur(40px) saturate(180%)',
        WebkitBackdropFilter: 'blur(40px) saturate(180%)',
        borderRadius: 22, padding: 16,
        border: '0.5px solid rgba(255,255,255,0.18)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <div style={{
            width: 22, height: 22, borderRadius: 6, background: 'var(--bone)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'Instrument Serif', fontSize: 14, color: 'var(--ink)',
          }}>S</div>
          <span style={{ fontSize: 12, fontWeight: 500, color: 'rgba(255,255,255,0.85)' }}>SKINLENS</span>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginLeft: 'auto' }}>now</span>
        </div>
        <div className="serif" style={{ fontSize: 18, lineHeight: 1.3, color: '#fff', fontStyle: 'italic' }}>
          {msg}
        </div>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', marginTop: 8 }}>
          Day {23} · Morning ritual
        </div>
      </div>
    </div>
  );
}

// ─── SHARE CARD (Instagram Story) ────────────────────────────────────────
function ShareCardScreen({ verdict, setScreen }) {
  const v = VERDICTS[verdict];
  return (
    <div style={{ background: 'var(--ink)', minHeight: '100%', paddingBottom: 60, color: 'var(--bone)' }}>
      <div style={{ padding: '60px 24px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button onClick={() => setScreen('reveal')} style={{ background: 'none', border: 'none', padding: 0, fontSize: 13, color: 'rgba(244,239,231,0.6)', display: 'flex', alignItems: 'center', gap: 4 }}>
          <svg width="14" height="14" viewBox="0 0 14 14"><path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
        </button>
        <div className="mono" style={{ fontSize: 10, letterSpacing: 2, opacity: 0.5 }}>SHARE</div>
        <div style={{ width: 14 }} />
      </div>

      <div style={{ padding: '8px 28px 0', textAlign: 'center' }}>
        <div className="serif" style={{ fontSize: 24, lineHeight: 1.2 }}><em>This is what they'll see.</em></div>
        <div style={{ fontSize: 12, opacity: 0.6, marginTop: 6 }}>9:16 — perfect for Instagram Stories.</div>
      </div>

      {/* the story card */}
      <div style={{ padding: '20px 28px 0' }}>
        <div style={{
          aspectRatio: '9/16', borderRadius: 16, position: 'relative', overflow: 'hidden',
          background: v.soft, color: 'var(--ink)',
          boxShadow: '0 30px 80px rgba(0,0,0,0.5)',
        }}>
          {/* bloom */}
          <div style={{
            position: 'absolute', top: -60, left: '-30%', width: '160%', height: 350,
            background: `radial-gradient(ellipse at center, ${verdict === 'RED' ? 'rgba(138,42,34,0.45)' : verdict === 'YELLOW' ? 'rgba(181,118,42,0.4)' : 'rgba(79,107,61,0.35)'} 0%, transparent 65%)`,
          }} />

          <div style={{ position: 'relative', padding: '28px 24px 0' }}>
            <div className="mono" style={{ fontSize: 9, letterSpacing: 2, color: 'var(--ink-mute)' }}>SCANNED ON SKINLENS</div>
            <div className="serif" style={{ fontSize: 18, marginTop: 6, lineHeight: 1.2 }}>
              Aurora Skin Co.<br/><em>Lumière Glow Serum</em>
            </div>
          </div>

          <div style={{ position: 'relative', padding: '0 24px', textAlign: 'center', marginTop: 36 }}>
            <div style={{
              display: 'inline-block', padding: '4px 12px', borderRadius: 99,
              background: v.hex, color: 'var(--bone)',
            }} className="mono">
              <span style={{ fontSize: 9, letterSpacing: 2 }}>{verdict}</span>
            </div>
            <div className="serif" style={{
              fontSize: 64, lineHeight: 0.95, marginTop: 12,
              color: v.hex, letterSpacing: -1.5,
            }}>
              <em>{v.word}.</em>
            </div>
            <div style={{ fontSize: 11, marginTop: 14, color: 'var(--ink-soft)', maxWidth: 240, margin: '14px auto 0', lineHeight: 1.5 }}>
              {v.sub}
            </div>
          </div>

          <div style={{ position: 'absolute', bottom: 24, left: 24, right: 24 }}>
            <div style={{ display: 'flex', borderRadius: 99, overflow: 'hidden', height: 4, background: 'rgba(26,23,20,0.1)' }}>
              <div style={{ flex: v.count.red, background: 'var(--red)' }} />
              <div style={{ flex: v.count.amber, background: 'var(--amber)' }} />
              <div style={{ flex: v.count.green, background: 'var(--green)' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 16, alignItems: 'center' }}>
              <div className="serif" style={{ fontSize: 16, fontStyle: 'italic' }}>skinlens</div>
              <div className="mono" style={{ fontSize: 8, letterSpacing: 1.6, color: 'var(--ink-mute)' }}>KNOW WHAT'S ON YOUR SKIN</div>
            </div>
          </div>
        </div>
      </div>

      {/* share buttons */}
      <div style={{ display: 'flex', gap: 8, padding: '20px 16px 0' }}>
        {[
          { l: 'Instagram', i: '◍' },
          { l: 'WhatsApp', i: '✉' },
          { l: 'Save', i: '↓' },
          { l: 'Copy', i: '⎘' },
        ].map(b => (
          <button key={b.l} style={{
            flex: 1, padding: '12px 0', borderRadius: 12,
            background: 'rgba(244,239,231,0.08)', border: '1px solid rgba(244,239,231,0.12)',
            color: 'var(--bone)', fontSize: 11,
          }}>
            <div style={{ fontSize: 18, marginBottom: 4 }}>{b.i}</div>
            {b.l}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── tab bar ─────────────────────────────────────────────────────────────
function TabBar({ active, setScreen }) {
  const items = [
    { id: 'home', label: 'Home', icon: <svg width="20" height="20" viewBox="0 0 20 20"><path d="M3 8l7-5 7 5v9H3z" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinejoin="round"/></svg> },
    { id: 'scan', label: 'Scan', icon: <svg width="22" height="22" viewBox="0 0 22 22"><path d="M3 7V5a2 2 0 012-2h2M19 7V5a2 2 0 00-2-2h-2M3 15v2a2 2 0 002 2h2M19 15v2a2 2 0 01-2 2h-2" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round"/><circle cx="11" cy="11" r="3" stroke="currentColor" strokeWidth="1.5" fill="none"/></svg> },
    { id: 'routine', label: 'Routine', icon: <svg width="20" height="20" viewBox="0 0 20 20"><circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.5" fill="none"/><path d="M10 5v5l3 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg> },
    { id: 'profile', label: 'Profile', icon: <svg width="20" height="20" viewBox="0 0 20 20"><circle cx="10" cy="7" r="3" stroke="currentColor" strokeWidth="1.5" fill="none"/><path d="M3 17c1-3 4-5 7-5s6 2 7 5" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round"/></svg> },
  ];
  // map screens to tabs
  const tabFor = { home: 'home', scan: 'scan', reveal: 'scan', ingredients: 'scan', swap: 'scan', share: 'scan' };
  const activeTab = tabFor[active] || 'home';

  return (
    <div style={{
      position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 40,
      padding: '14px 16px 32px',
      background: 'linear-gradient(180deg, transparent 0%, rgba(244,239,231,0.95) 30%)',
    }}>
      <div style={{
        background: 'var(--ink)', borderRadius: 99,
        padding: '8px', display: 'flex', justifyContent: 'space-around',
        boxShadow: '0 10px 30px rgba(26,23,20,0.25)',
      }}>
        {items.map(it => {
          const isActive = activeTab === it.id;
          return (
            <button key={it.id} onClick={() => setScreen(it.id === 'scan' ? 'scan' : it.id)} style={{
              flex: 1, background: isActive ? 'var(--bone)' : 'transparent',
              color: isActive ? 'var(--ink)' : 'rgba(244,239,231,0.6)',
              border: 'none', borderRadius: 99, padding: '10px 0',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
              fontSize: 10, fontWeight: 500,
              transition: 'all 200ms ease',
            }}>
              {it.icon}
              <span style={{ fontSize: 9, marginTop: 2 }}>{it.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// expose
Object.assign(window, {
  OnboardingScreen, HomeScreen, ScanScreen, RevealScreen,
  IngredientsScreen, SwapScreen, LockScreen, ShareCardScreen, TabBar,
  TONE_GREETINGS, VERDICTS, PRODUCT,
});
