import { cookies, headers } from "next/headers"
import { pickLang, type Lang } from "./checker-copy"

/** The visitor's language for a public page: their saved choice, else their browser's. */
export function pageLang(): Lang {
  return pickLang(cookies().get("lang")?.value, headers().get("accept-language"))
}
