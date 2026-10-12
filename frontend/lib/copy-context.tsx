"use client"

// The page's language for the public checker and its parts.
import { createContext, useContext } from "react"
import { CHECKER_COPY, type CheckerCopy, type Lang } from "./checker-copy"

const CopyContext = createContext<{ lang: Lang; copy: CheckerCopy }>({ lang: "en", copy: CHECKER_COPY.en })

export function CopyProvider({ lang, children }: { lang: Lang; children: React.ReactNode }) {
  return <CopyContext.Provider value={{ lang, copy: CHECKER_COPY[lang] }}>{children}</CopyContext.Provider>
}

export function useCopy(): CheckerCopy {
  return useContext(CopyContext).copy
}

export function useLang(): Lang {
  return useContext(CopyContext).lang
}
