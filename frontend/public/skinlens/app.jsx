// SkinLens — main app: device frame + tweaks + screen orchestration

const TONES = ['Gentle', 'Bold', 'Spiritual', 'Playful'];
const VERDICT_OPTIONS = ['RED', 'YELLOW', 'GREEN'];
const SCREENS = [
  { id: 'onboarding', label: 'Onboarding' },
  { id: 'home', label: 'Home' },
  { id: 'scan', label: 'Scan' },
  { id: 'reveal', label: 'Reveal' },
  { id: 'ingredients', label: 'Ingredients' },
  { id: 'swap', label: 'Smart Swaps' },
  { id: 'lockScreen', label: 'Lock Screen' },
  { id: 'share', label: 'Share Card' },
];

function App() {
  const defaults = window.__SKINLENS_TWEAKS__ || {};
  const [tweaks, setTweak] = useTweaks(defaults);

  // local screen state — persists tweak's screen as starting point
  const [screen, setScreen] = React.useState(defaults.screen || 'home');
  const [tone, setTone] = React.useState(defaults.tone || 'Gentle');
  const [verdict, setVerdict] = React.useState(defaults.verdict || 'RED');

  // sync tone/verdict from tweaks
  React.useEffect(() => { if (tweaks.tone) setTone(tweaks.tone); }, [tweaks.tone]);
  React.useEffect(() => { if (tweaks.verdict) setVerdict(tweaks.verdict); }, [tweaks.verdict]);
  React.useEffect(() => { if (tweaks.screen && tweaks.screen !== screen) setScreen(tweaks.screen); }, [tweaks.screen]);

  const streak = tweaks.streak ?? 23;

  // pick screen content
  let content;
  switch (screen) {
    case 'onboarding': content = <OnboardingScreen tone={tone} setTone={(t) => { setTone(t); setTweak('tone', t); }} />; break;
    case 'home': content = <HomeScreen tone={tone} streak={streak} setScreen={setScreen} />; break;
    case 'scan': content = <ScanScreen setScreen={setScreen} />; break;
    case 'reveal': content = <RevealScreen verdict={verdict} setScreen={setScreen} />; break;
    case 'ingredients': content = <IngredientsScreen verdict={verdict} setScreen={setScreen} />; break;
    case 'swap': content = <SwapScreen setScreen={setScreen} />; break;
    case 'lockScreen': content = <LockScreen tone={tone} />; break;
    case 'share': content = <ShareCardScreen verdict={verdict} setScreen={setScreen} />; break;
    default: content = <HomeScreen tone={tone} streak={streak} setScreen={setScreen} />;
  }

  const showTabBar = ['home', 'scan', 'reveal', 'ingredients', 'swap'].includes(screen);

  // device + caption
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24 }}>
      {/* caption above */}
      <div style={{ textAlign: 'center', color: 'rgba(244,239,231,0.55)' }}>
        <div className="mono" style={{ fontSize: 10, letterSpacing: 2.5 }}>SKINLENS · {(SCREENS.find(s => s.id === screen)?.label || screen).toUpperCase()}</div>
        <div className="serif" style={{ fontSize: 22, color: 'rgba(244,239,231,0.85)', marginTop: 6, fontStyle: 'italic' }}>
          Know what's on your skin.
        </div>
      </div>

      <div style={{ position: 'relative' }}>
        <IOSDevice width={390} height={844} dark={false}>
          <div style={{ height: '100%', position: 'relative', overflow: 'hidden' }}>
            <div style={{ height: '100%', overflow: 'auto' }} className="scroll-hide">
              {content}
            </div>
            {showTabBar && <TabBar active={screen} setScreen={setScreen} />}
          </div>
        </IOSDevice>
      </div>

      {/* screen quicknav row */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center', maxWidth: 460 }}>
        {SCREENS.map(s => (
          <button key={s.id} onClick={() => { setScreen(s.id); setTweak('screen', s.id); }} style={{
            padding: '6px 11px', borderRadius: 99, fontSize: 11,
            background: screen === s.id ? 'rgba(244,239,231,0.95)' : 'rgba(244,239,231,0.08)',
            color: screen === s.id ? '#1A1714' : 'rgba(244,239,231,0.7)',
            border: '1px solid rgba(244,239,231,0.14)',
            fontFamily: 'JetBrains Mono', letterSpacing: 0.5,
          }}>{s.label}</button>
        ))}
      </div>

      <Tweaks tweaks={tweaks} setTweak={setTweak} screen={screen} setScreen={setScreen} />
    </div>
  );
}

function Tweaks({ tweaks, setTweak, screen, setScreen }) {
  return (
    <TweaksPanel title="Tweaks">
      <TweakSection label="Screen">
        <TweakSelect
          label="Active screen"
          value={screen}
          options={SCREENS.map(s => ({ value: s.id, label: s.label }))}
          onChange={(v) => { setScreen(v); setTweak('screen', v); }}
        />
      </TweakSection>

      <TweakSection label="Voice & Verdict">
        <TweakRadio
          label="Affirmation tone"
          value={tweaks.tone || 'Gentle'}
          options={TONES.map(t => ({ value: t, label: t }))}
          onChange={(v) => setTweak('tone', v)}
        />
        <TweakRadio
          label="Scan verdict"
          value={tweaks.verdict || 'RED'}
          options={VERDICT_OPTIONS.map(v => ({ value: v, label: v }))}
          onChange={(v) => setTweak('verdict', v)}
        />
      </TweakSection>

      <TweakSection label="Numbers">
        <TweakSlider
          label="Current streak (days)"
          value={tweaks.streak ?? 23}
          min={1} max={365} step={1}
          onChange={(v) => setTweak('streak', v)}
        />
      </TweakSection>
    </TweaksPanel>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
