import { createContext, useContext, useState, useMemo, type ReactNode } from "react"

type AppChromeContextValue = {
  night: boolean
  setNight: (night: boolean) => void
}

const AppChromeContext = createContext<AppChromeContextValue>({
  night: false,
  setNight: () => {},
})

export function AppChromeProvider({ children }: { children: ReactNode }) {
  const [night, setNight] = useState(false)
  const value = useMemo(() => ({ night, setNight }), [night])
  return <AppChromeContext.Provider value={value}>{children}</AppChromeContext.Provider>
}

/** Lets a screen (e.g. the Routine screen on its PM tab) flip the shared app chrome — tab bar, FAB — to a dark theme. */
export function useAppChrome() {
  return useContext(AppChromeContext)
}
