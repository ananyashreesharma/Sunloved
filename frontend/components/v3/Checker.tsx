"use client"

// V3 web checker: the public front door. Paste a label on the left; read it on the right: the
// verdict with its key word highlighted, the block strip with the 70% line, the label annotated in
// place, and notes in the margin. Same reading as the apps (annotateLabel in @skinlens/shared), so
// a label reads the same everywhere. The skin profile lives in this browser only.

import { useEffect, useRef, useState } from "react"
import {
  annotateLabel,
  CONCERNS,
  COVERAGE_THRESHOLD,
  guessCountry,
  labelDirection,
  SAMPLE_LABELS,
  SKIN_TYPES,
  type AnnotatedLabel,
  type ItemState,
  type LabelItem,
  type Zone,
} from "@skinlens/shared"
import { analyzeIngredients, completeOnboarding, getMe } from "@/lib/api"
import { useIsGuest } from "@/lib/use-guest"
import { initAnalytics, track } from "@/lib/analytics"
import { checkUrl } from "@/lib/shared-check"
import { loadGuestData, saveGuestScan, updateGuestData } from "@/lib/guest-store"
import { SiteFooter, SiteHeader } from "./SiteChrome"
import { countryLabel, ProfileEditor, ProfileSentence, type Profile } from "./Profile"
import { ProductSearch } from "./ProductSearch"

const COPY = {
  title: "Check any skincare label, free.",
  sub: "Search a product or paste its ingredients. Get a plain-language reading for your skin, and find hidden steroids, mercury and hydroquinone that some creams don't advertise.",
  orPaste: "Or paste the ingredient list",
  placeholder: "Aqua, Glycerin, Niacinamide…",
  samples: { sampleFairness: "Fairness cream", sampleNiacinamide: "Niacinamide serum", sampleSunscreen: "Sunscreen", sampleCream: "Night cream" },
  yourSkin: "Your skin",
  skinNote: "Verdicts are personal: change these and the same label can read differently. Saved in this browser only.",
  skinNoteAccount: "Verdicts are personal: change these and the same label can read differently. Saved to your account.",
  read: "Read ingredients",
  reading: "Reading the label…",
  yourLabel: "Your label",
  basedOn: "Based on: ",
  verdict: {
    GREEN: ["Looks ", "fine", "."],
    YELLOW: ["Use with ", "caution", "."],
    RED: ["", "Avoid", " this one."],
  } as Record<Zone, [string, string, string]>,
  rated: (a: number, b: number, none: number) => `${a} of ${b} rated` + (none ? ` · ${none} with no information` : ""),
  needed: "70% needed for a verdict",
  annotated: "The label, annotated",
  margin: "In the margin",
  nothingFlagged: "Nothing flagged for you.",
  hint: "Click any ingredient for its one-line explanation.",
  forYou: "For you",
  inGeneral: "In general",
  noDataLong: "We have no data on this ingredient. That doesn't make it safe or unsafe. We just can't say.",
  tags: { caution: "Caution", nfy: "Not for you", avoid: "Avoid", fine: "Fine", none: "No information" } as Record<ItemState, string>,
  noVerdict: "No verdict",
  cantT: "We can't judge this one yet.",
  cantBody: (a: number, b: number, c: number) => `We could rate ${a} of ${b} ingredients. We need ${c} before we give a verdict, so we're not giving one.`,
  errT: "We couldn't check this.",
  errBody: "The check needs a connection to our ingredient data. Nothing was judged. Try again in a moment.",
  tryAgain: "Try again",
  save: "Save this check",
  saved: "Saved in this browser",
  appCard: "Keep a routine that knows what's in it. Try it on the web now; the iPhone and Android apps are on their way.",
  appCta: "Start a routine",
  done: "Done",
  country: "Where you live",
  skinType: "Skin type",
  concerns: "Up to two concerns",
  hazardT: "If you've been using this",
  hazard: [
    "Stop using it. Don't share it with anyone.",
    "If you've used it for weeks, stopping can cause a short flare of redness or spots. That settles; a doctor or pharmacist can help with it.",
    "See a doctor if your skin is thin, burning, or has stretch marks or patches that won't fade.",
    "For dark spots, gentler options include niacinamide, azelaic acid and sunscreen every day.",
  ],
  hazardNote: "This is general information, not medical advice.",
  empty: "Paste a label, or try one of the samples, and the reading appears here.",
}

const MARK: Partial<Record<ItemState, string>> = { caution: "var(--hi-caution)", nfy: "var(--hi-nfy)", avoid: "var(--hi-avoid)" }
const VERDICT_MARK: Record<Zone, string> = { GREEN: "var(--hi-fine)", YELLOW: "var(--hi-caution)", RED: "var(--hi-avoid)" }

type State = { kind: "idle" } | { kind: "reading" } | { kind: "error" } | { kind: "done"; label: AnnotatedLabel; name: string; inci: string; run: number }


/** `initial`: a label opened from a shared link (/c?…), read for this visitor's own skin. */
export function Checker({ initial }: { initial?: { name: string; inci: string } } = {}) {
  const [text, setText] = useState("")
  const [sampleKey, setSampleKey] = useState<string | null>(null)
  // Set when the list came from a searched product, so the result carries its name.
  const [productName, setProductName] = useState<string | null>(null)
  const [productId, setProductId] = useState<string | null>(null)
  const [shared, setShared] = useState(false)
  const [profile, setProfile] = useState<Profile>({ country: null, skinType: null, concerns: [] })
  const [editing, setEditing] = useState(false)
  const [state, setState] = useState<State>({ kind: "idle" })
  const [active, setActive] = useState<LabelItem | null>(null)
  const [saved, setSaved] = useState(false)
  // The last reading stays on screen (dimmed) while the next one loads, so the page doesn't jump.
  const [last, setLast] = useState<Extract<State, { kind: "done" }> | null>(null)
  const runs = useRef(0)
  const resultRef = useRef<HTMLElement>(null)
  const isGuest = useIsGuest()
  const lastRef = useRef<{ inci: string; name: string } | null>(null)

  // Signed in: the profile comes from the account (the browser copy moves there at sign-up).
  useEffect(() => {
    if (isGuest) return
    getMe()
      .then((me) => {
        const p = { country: me.country, skinType: me.skinType?.code ?? null, concerns: me.concerns.map((c) => c.code) }
        setProfile(p)
        // Re-read what's on screen for this person's skin.
        if (lastRef.current) run(lastRef.current.inci, lastRef.current.name, p, false)
      })
      .catch(() => {})
  }, [isGuest])

  // Profile from this browser; the first visit opens on a sample so the page shows what it does.
  useEffect(() => {
    initAnalytics()
    const g = loadGuestData()
    const p = { country: g.country ?? guessCountry(navigator.language), skinType: g.skinType, concerns: g.concerns }
    setProfile(p)
    if (initial) {
      // Opened from a shared link: read that label for this visitor.
      setText(initial.inci)
      setProductName(initial.name)
      run(initial.inci, initial.name, p, false)
      return
    }
    // The fairness cream: shows a first-time visitor exactly what SkinLens catches.
    const first = SAMPLE_LABELS[0]
    setText(first.inci)
    setSampleKey(first.key)
    run(first.inci, COPY.samples[first.key], p, false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function run(inci = text, name = sampleKey ? COPY.samples[sampleKey as keyof typeof COPY.samples] : (productName ?? COPY.yourLabel), p = profile, reveal = true) {
    if (!inci.trim()) return
    const id = ++runs.current
    setState({ kind: "reading" })
    setActive(null)
    setSaved(false)
    try {
      const api = await analyzeIngredients(inci)
      if (id !== runs.current) return
      const done = { kind: "done" as const, label: annotateLabel(api, p), name, inci, run: id }
      // The automatic sample on first load isn't a check the person made.
      if (reveal) track("label_checked", done.label.verdict ?? "NONE", p.country)
      setState(done)
      setLast(done)
      lastRef.current = { inci, name }
      // On a phone the reading sits below the form: bring it into view for runs the person started.
      if (reveal && window.matchMedia("(max-width: 960px)").matches) {
        resultRef.current?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" })
      }
    } catch {
      if (id === runs.current) setState({ kind: "error" })
    }
  }

  function saveProfile(next: Profile) {
    setProfile(next)
    if (isGuest) updateGuestData({ country: next.country, skinType: next.skinType, concerns: next.concerns })
  }

  // Changing the profile re-reads the current label, so the effect of the change is visible.
  function finishEditing() {
    setEditing(false)
    if (!isGuest && profile.skinType) {
      completeOnboarding({ skinType: profile.skinType, concerns: profile.concerns, country: profile.country ?? undefined }).catch(() => {})
    }
    if (state.kind === "done") run(state.inci, state.name, profile)
  }

  /** Share a link to this check. Whoever opens it gets the reading for their own skin. */
  async function share() {
    if (state.kind !== "done") return
    const url = checkUrl({ productId, inci: state.inci, name: state.name })
    const text = `${state.name}, checked with SkinLens. Check it for your own skin:`
    try {
      if (navigator.share) await navigator.share({ title: "SkinLens", text, url })
      else {
        await navigator.clipboard.writeText(`${text} ${url}`)
        setShared(true)
        setTimeout(() => setShared(false), 2500)
      }
    } catch {
      /* cancelled */
    }
  }

  function save() {
    if (state.kind !== "done") return
    saveGuestScan({
      title: state.name,
      brand: "",
      flagCount: state.label.flagged.length,
      coverage: state.label.coverage,
      score: state.label.score,
      rawIngredientText: state.inci,
      verdict: state.label.verdict,
    })
    setSaved(true)
  }

  return (
    <div className="v3" style={{ display: "flex", flexDirection: "column" }}>
      <SiteHeader current="check" />
      <main className="v3-checker">
        {/* ── Input ── */}
        <section style={{ display: "flex", flexDirection: "column", gap: 20, minWidth: 0 }}>
          <h1 style={{ margin: 0, fontSize: "clamp(40px, 4.6vw, 68px)", fontWeight: 600, letterSpacing: "-0.045em", lineHeight: 0.98 }}>{COPY.title}</h1>
          <p style={{ margin: 0, fontSize: 18, lineHeight: 1.55, color: "var(--ink2)", maxWidth: 480 }}>{COPY.sub}</p>
          <ProductSearch
            country={profile.country}
            onPick={(title, inci, id) => {
              setText(inci)
              setSampleKey(null)
              setProductName(title)
              setProductId(id)
              run(inci, title)
            }}
          />
          <div style={{ fontSize: 14, color: "var(--ink2)", marginBottom: -8 }}>{COPY.orPaste}</div>
          <textarea
            value={text}
            onChange={(e) => {
              setText(e.target.value)
              setSampleKey(null)
              setProductName(null)
              setProductId(null)
            }}
            dir="auto"
            aria-label="Ingredient list"
            placeholder={COPY.placeholder}
            style={{
              minHeight: 180,
              resize: "vertical",
              border: "none",
              borderTop: "1px solid var(--line)",
              borderBottom: "1px solid var(--line)",
              background: "transparent",
              padding: "18px 0",
              font: "inherit",
              fontSize: 20,
              fontWeight: 300,
              lineHeight: 1.55,
              color: "var(--ink)",
              outline: "none",
            }}
          />
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {SAMPLE_LABELS.map((s) => (
              <button
                key={s.key}
                className="v3-chip"
                aria-pressed={sampleKey === s.key}
                onClick={() => {
                  setText(s.inci)
                  setSampleKey(s.key)
                  setProductName(null)
                  setProductId(null)
                  run(s.inci, COPY.samples[s.key])
                }}
              >
                {COPY.samples[s.key]}
              </button>
            ))}
          </div>

          <div style={{ padding: "20px 0", borderTop: "1px solid var(--line)", display: "flex", flexDirection: "column", gap: 12 }}>
            <div className="v3-label">{COPY.yourSkin}</div>
            <ProfileSentence profile={profile} onEdit={() => setEditing(true)} />
            {editing ? (
              <ProfileEditor profile={profile} onChange={saveProfile} onDone={finishEditing} />
            ) : (
              <div style={{ fontSize: 14, color: "var(--ink2)", lineHeight: 1.5 }}>{isGuest ? COPY.skinNote : COPY.skinNoteAccount}</div>
            )}
          </div>

          <button className="v3-btn" style={{ maxWidth: 320 }} onClick={() => run()} disabled={!text.trim() || state.kind === "reading"}>
            {COPY.read}
          </button>
        </section>

        {/* ── Reading ── */}
        <section ref={resultRef} className="v3-result" aria-live="polite" style={{ scrollMarginTop: 16 }}>
          {state.kind === "idle" && <p style={{ fontSize: 18, color: "var(--ink2)" }}>{COPY.empty}</p>}
          {state.kind === "reading" &&
            (last ? (
              <div style={{ opacity: 0.35, transition: "opacity 160ms", pointerEvents: "none" }} aria-busy>
                <Result key={last.run} label={last.label} name={last.name} profile={profile} active={null} onPick={() => {}} saved={false} onSave={() => {}} onShare={() => {}} shared={false} />
              </div>
            ) : (
              <p style={{ fontSize: 20, fontWeight: 300, color: "var(--ink2)" }}>{COPY.reading}</p>
            ))}
          {state.kind === "error" && (
            <div className="v3-up">
              <h2 style={{ margin: 0, fontSize: 40, fontWeight: 600, letterSpacing: "-0.03em" }}>{COPY.errT}</h2>
              <p style={{ fontSize: 19, lineHeight: 1.5 }}>{COPY.errBody}</p>
              <button className="v3-btn" onClick={() => run()}>
                {COPY.tryAgain}
              </button>
            </div>
          )}
          {state.kind === "done" && (
            <Result key={state.run} label={state.label} name={state.name} profile={profile} active={active} onPick={setActive} saved={saved} onSave={save} onShare={share} shared={shared} />
          )}
        </section>
      </main>
      <SiteFooter />
    </div>
  )
}

function profileLine(p: Profile): string {
  const type = SKIN_TYPES.find((s) => s.code === p.skinType)
  const parts = [
    countryLabel(p.country)?.replace(/^the /, ""),
    type && p.skinType !== "unsure" ? `${type.label.toLowerCase()} skin` : null,
    p.concerns.map((c) => CONCERNS.find((x) => x.code === c)?.label.toLowerCase() ?? c).join(", ") || null,
  ].filter(Boolean)
  return parts.length ? COPY.basedOn + parts.join(" · ") : ""
}

function Tag({ state }: { state: ItemState }) {
  const bg = state === "fine" ? "var(--hi-fine)" : MARK[state]
  return (
    <span
      style={{
        fontSize: 12,
        fontWeight: 600,
        padding: bg ? "2px 8px" : "1px 7px",
        borderRadius: 4,
        whiteSpace: "nowrap",
        ...(bg ? { background: bg } : { border: "1px dashed var(--ink2)", color: "var(--ink2)" }),
      }}
    >
      {COPY.tags[state]}
    </span>
  )
}

function Badge({ n, size = 26 }: { n: number; size?: number }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        minWidth: size,
        height: size,
        borderRadius: size / 2,
        padding: "0 6px",
        background: "var(--ink)",
        color: "var(--bg)",
        fontSize: size * 0.5,
        fontWeight: 700,
        flex: "none",
      }}
    >
      {n}
    </span>
  )
}

function Result({
  label,
  name,
  profile,
  active,
  onPick,
  saved,
  onSave,
  onShare,
  shared,
}: {
  label: AnnotatedLabel
  name: string
  profile: Profile
  active: LabelItem | null
  onPick: (i: LabelItem | null) => void
  saved: boolean
  onSave: () => void
  onShare: () => void
  shared: boolean
}) {
  const N = label.items.length
  const step = Math.min(50, 700 / Math.max(N, 1))
  // The label reads in its own script's direction (an Arabic label right to left).
  const dir = labelDirection(label.items.map((i) => i.name))
  const start = dir === "rtl" ? "right" : "left"
  const sepComma = dir === "rtl" ? "،" : ","
  const notes = [...label.flagged, ...label.noData]
  const ratedLine = COPY.rated(label.rated, label.total, label.noData.length)

  const strip = (
    <div style={{ marginTop: 32, maxWidth: 640 }} aria-label={ratedLine}>
      <div dir={dir} style={{ position: "relative", height: 16, marginBottom: 4 }} aria-hidden>
        {label.items.map((it, i) =>
          it.num && it.state !== "none" ? (
            <span key={i} style={{ position: "absolute", [start]: `calc(${((i + 0.5) / N) * 100}% - 8px)`, width: 16, textAlign: "center", fontSize: 11, fontWeight: 700 }}>
              {it.num}
            </span>
          ) : null,
        )}
      </div>
      <div dir={dir} style={{ position: "relative" }} aria-hidden>
        <div style={{ display: "flex", gap: 3, alignItems: "flex-end" }}>
          {label.items.map((it, i) => (
            <div
              key={i}
              className="v3-grow"
              style={{
                flex: 1,
                height: 34,
                borderRadius: N > 20 ? 2 : 4,
                animationDelay: `${300 + i * step}ms`,
                ...(it.state === "none" ? { border: "1.5px dashed var(--ink)" } : { background: "var(--ink)" }),
              }}
            />
          ))}
        </div>
        <div style={{ position: "absolute", [start]: `${COVERAGE_THRESHOLD * 100}%`, top: -7, bottom: -7, width: 2, background: "var(--ink)", opacity: 0.5 }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "var(--ink2)", marginTop: 10, gap: 12, flexWrap: "wrap" }}>
        <span>{ratedLine}</span>
        <span>{COPY.needed}</span>
      </div>
    </div>
  )

  const words = (
    <div dir={dir} style={{ fontSize: 24, fontWeight: 300, lineHeight: 2 }}>
      {label.items.map((it, i) => {
        const mark = MARK[it.state]
        const style: React.CSSProperties = mark
          ? { backgroundImage: `linear-gradient(${mark},${mark})`, animationDelay: `${600 + Math.min(i, 14) * 60}ms` }
          : it.state === "fine"
            ? { backgroundImage: "linear-gradient(var(--hi-fine),var(--hi-fine))", animationDelay: `${600 + Math.min(i, 14) * 60}ms` }
            : {}
        const cls = mark ? "v3-mark" : it.state === "fine" ? "v3-under" : "v3-nodata"
        return (
          // Name, footnote and comma stay together, so a comma never starts a line.
          <span key={i} style={{ whiteSpace: "nowrap" }}>
            <button
              className={cls}
              onClick={() => onPick(active === it ? null : it)}
              onMouseEnter={() => onPick(it)}
              aria-label={`${it.name}: ${COPY.tags[it.state]}`}
              style={{
                ...style,
                font: "inherit",
                color: "inherit",
                border: "none",
                padding: "0.15em 0",
                cursor: "pointer",
                backgroundColor: active === it ? "var(--surface2)" : "transparent",
                borderRadius: 3,
              }}
            >
              {it.name}
            </button>
            {it.num ? (
              <span style={{ marginInlineStart: "0.2em", verticalAlign: "0.55em", fontSize: "0.55em" }}>
                <Badge n={it.num} size={20} />
              </span>
            ) : null}
            {i < N - 1 ? sepComma : "."}
          </span>
        )
      }).flatMap((el, i) => (i < N - 1 ? [el, " "] : [el]))}
    </div>
  )

  const activeCard = active ? (
    <div className="v3-fade" style={{ padding: 16, borderRadius: 16, background: "var(--surface)" }}>
      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
        {active.num ? <Badge n={active.num} /> : null}
        <span style={{ fontSize: 17, fontWeight: 600 }}>{active.name}</span>
        <Tag state={active.state} />
      </div>
      {active.state === "none" ? (
        <p style={{ margin: "8px 0 0", fontSize: 15, lineHeight: 1.5 }}>{COPY.noDataLong}</p>
      ) : (
        <>
          {active.general && <div className="v3-label" style={{ marginTop: 10, fontSize: 11, color: "var(--ink2)" }}>{COPY.forYou}</div>}
          <p style={{ margin: "4px 0 0", fontSize: 15, lineHeight: 1.5 }}>{active.line}</p>
          {active.general && active.general !== active.line && (
            <>
              <div className="v3-label" style={{ marginTop: 10, fontSize: 11, color: "var(--ink2)" }}>{COPY.inGeneral}</div>
              <p style={{ margin: "4px 0 0", fontSize: 14, lineHeight: 1.5, color: "var(--ink2)" }}>{active.general}</p>
            </>
          )}
        </>
      )}
      {active.source && <p style={{ margin: "10px 0 0", fontSize: 13, color: "var(--ink2)" }}>{active.source}</p>}
    </div>
  ) : null

  const margin = (
    <aside style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div className="v3-label">{COPY.margin}</div>
      {activeCard}
      {label.flagged.length === 0 && <p style={{ margin: 0, fontSize: 17 }}>{COPY.nothingFlagged}</p>}
      {notes.map((it, i) => (
        <button
          key={`${it.name}-${i}`}
          className="v3-up"
          onClick={() => onPick(it)}
          style={{ display: "flex", gap: 12, textAlign: "start", font: "inherit", color: "inherit", background: "none", border: "none", padding: 0, cursor: "pointer", animationDelay: `${900 + i * 80}ms` }}
        >
          <Badge n={it.num!} />
          <span>
            <span style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              <span style={{ fontSize: 17, fontWeight: 600 }}>{it.name}</span>
              <Tag state={it.state} />
            </span>
            <span style={{ display: "block", fontSize: 15, lineHeight: 1.5, color: "var(--ink2)", marginTop: 4 }}>{it.line}</span>
          </span>
        </button>
      ))}
      <div style={{ fontSize: 14, color: "var(--ink2)", lineHeight: 1.5, paddingTop: 14, borderTop: "1px solid var(--line)" }}>{COPY.hint}</div>
    </aside>
  )

  const head = (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 16, flexWrap: "wrap", fontSize: 14, color: "var(--ink2)" }}>
      <span>{name}</span>
      <span>{profileLine(profile)}</span>
    </div>
  )

  if (!label.verdict) {
    return (
      <div>
        {head}
        <div className="v3-label v3-up" style={{ marginTop: 18 }}>
          {COPY.noVerdict}
        </div>
        <h2 className="v3-up" style={{ margin: "8px 0 0", fontSize: "clamp(36px, 4vw, 56px)", fontWeight: 600, letterSpacing: "-0.04em", lineHeight: 1 }}>
          {COPY.cantT}
        </h2>
        <p className="v3-fade" style={{ fontSize: 20, lineHeight: 1.5, maxWidth: 640, animationDelay: "380ms" }}>
          {COPY.cantBody(label.rated, label.total, Math.ceil(COVERAGE_THRESHOLD * label.total))}
        </p>
        {strip}
        <div className="v3-twocol">
          <div>
            <div className="v3-label" style={{ marginBottom: 8 }}>
              {COPY.annotated}
            </div>
            {words}
          </div>
          {margin}
        </div>
      </div>
    )
  }

  const [pre, key, post] = COPY.verdict[label.verdict]
  return (
    <div>
      {head}
      <h2 className="v3-up" style={{ margin: "14px 0 0", fontSize: "clamp(48px, 5.4vw, 84px)", fontWeight: 600, letterSpacing: "-0.05em", lineHeight: 0.96, animationDelay: "60ms" }}>
        {pre}
        <span className="v3-mark" style={{ backgroundImage: `linear-gradient(${VERDICT_MARK[label.verdict]},${VERDICT_MARK[label.verdict]})`, backgroundSize: "100% 42%", animationDelay: "500ms" }}>
          {key}
        </span>
        {post}
      </h2>
      {label.summary && (
        <p className="v3-fade" style={{ fontSize: 21, lineHeight: 1.5, marginTop: 20, maxWidth: 640, animationDelay: "380ms" }}>
          {label.summary}
        </p>
      )}
      {strip}
      {label.lighteningHazard && (
        <section className="v3-up" style={{ marginTop: 32, maxWidth: 640, padding: "20px 24px", borderRadius: 18, background: "var(--surface)", borderInlineStart: "3px solid var(--t-avoid)", animationDelay: "700ms" }}>
          <h3 style={{ margin: 0, fontSize: 19, fontWeight: 600 }}>{COPY.hazardT}</h3>
          <ul style={{ margin: "10px 0 0", paddingInlineStart: 20, fontSize: 17, lineHeight: 1.5 }}>
            {COPY.hazard.map((h) => (
              <li key={h} style={{ marginTop: 6 }}>
                {h}
              </li>
            ))}
          </ul>
          <p style={{ margin: "12px 0 0", fontSize: 13, color: "var(--ink2)" }}>{COPY.hazardNote}</p>
        </section>
      )}
      <div className="v3-twocol">
        <div>
          <div className="v3-label" style={{ marginBottom: 8 }}>
            {COPY.annotated}
          </div>
          {words}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 20 }}>
            <button className="v3-chip" onClick={onSave} disabled={saved}>
              {saved ? COPY.saved : COPY.save}
            </button>
            <button className="v3-chip" onClick={onShare}>
              {shared ? "Link copied" : "Share this check"}
            </button>
          </div>
        </div>
        {margin}
      </div>
      <div style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap", marginTop: 40, padding: "24px 28px", borderRadius: 20, background: "var(--surface2)" }}>
        <div style={{ flex: "1 1 280px", fontSize: 17, lineHeight: 1.5 }}>{COPY.appCard}</div>
        <a
          href="/app/routine"
          style={{ minHeight: 48, padding: "0 20px", borderRadius: 14, border: "1.5px solid var(--ink)", display: "inline-flex", alignItems: "center", fontSize: 15, fontWeight: 600, textDecoration: "none" }}
        >
          {COPY.appCta}
        </a>
      </div>
    </div>
  )
}
