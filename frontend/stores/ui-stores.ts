"use client"

import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"

/** Which mega-menu category row is open (desktop nav). */
type HeaderNavState = {
  openDropdown: string | null
  setOpenDropdown: (key: string | null) => void
}

export const useHeaderNavStore = create<HeaderNavState>((set) => ({
  openDropdown: null,
  setOpenDropdown: (openDropdown) => set({ openDropdown }),
}))

type SearchHistoryState = {
  recentSearches: string[]
  addRecentSearch: (q: string) => void
  clearRecentSearches: () => void
}

export const useSearchHistoryStore = create<SearchHistoryState>()(
  persist(
    (set, get) => ({
      recentSearches: [],
      addRecentSearch: (q) => {
        const t = q.trim()
        if (!t) return
        const prev = get().recentSearches.filter((x) => x.toLowerCase() !== t.toLowerCase())
        set({ recentSearches: [t, ...prev].slice(0, 8) })
      },
      clearRecentSearches: () => set({ recentSearches: [] }),
    }),
    {
      name: "sunloved-search-history",
      storage: createJSONStorage(() =>
        typeof window !== "undefined"
          ? sessionStorage
          : {
              getItem: () => null,
              setItem: () => {},
              removeItem: () => {},
              length: 0,
              clear: () => {},
              key: () => null,
            }
      ),
    }
  )
)
