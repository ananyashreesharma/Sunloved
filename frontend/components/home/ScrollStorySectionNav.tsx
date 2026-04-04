"use client"

const NAV = [
  { name: "masthead", label: "masthead" },
  { name: "tiles", label: "tiles" },
  { name: "text", label: "text" },
  { name: "two-columns", label: "two-columns" },
  { name: "subscribe", label: "subscribe" },
] as const

export function ScrollStorySectionNav() {
  return (
    <div className="ss-story-header">
      <label className="ss-menu" htmlFor="ss-burger">
        <input id="ss-burger" type="checkbox" />
        <svg className="ss-burger" viewBox="0 0 100 100" width={48} height={48} aria-hidden>
          <path
            className="top"
            d="m 30,33 h 40 c 13.100415,0 14.380204,31.80258 6.899646,33.421777 -24.612039,5.327373 9.016154,-52.337577 -12.75751,-30.563913 l -28.284272,28.284272"
          />
          <path
            className="middle"
            d="m 70,50 c 0,0 -32.213436,0 -40,0 -7.786564,0 -6.428571,-4.640244 -6.428571,-8.571429 0,-5.895471 6.073743,-11.783399 12.286435,-5.570707 6.212692,6.212692 28.284272,28.284272 28.284272,28.284272"
          />
          <path
            className="bottom"
            d="m 69.575405,67.073826 h -40 c -13.100415,0 -14.380204,-31.80258 -6.899646,-33.421777 24.612039,-5.327373 -9.016154,52.337577 12.75751,30.563913 l 28.284272,-28.284272"
          />
        </svg>
      </label>
      <nav aria-label="On this page">
        <ul>
          {NAV.map((l) => (
            <li key={l.name}>
              <a
                href={`#${l.name}`}
                title={l.label}
                style={
                  {
                    "--ss-an": `--${l.name}`,
                    "--ss-at": `--${l.name}-s`,
                  } as React.CSSProperties
                }
              >
                {l.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  )
}
