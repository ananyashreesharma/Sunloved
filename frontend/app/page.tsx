import { Checker } from "@/components/v3/Checker"
import { CopyProvider } from "@/lib/copy-context"
import { pageLang } from "@/lib/page-lang"

// The public front door: check any label, free. Signed-in people get the same page; their
// routine is one click away in the header. In the visitor's language (English, Spanish, Arabic).
export default function Home() {
  return (
    <CopyProvider lang={pageLang()}>
      <Checker />
    </CopyProvider>
  )
}
