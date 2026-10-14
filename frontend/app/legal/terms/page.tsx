import type { Metadata } from "next"
import Link from "next/link"
import { LegalPage } from "@/components/v3/LegalPage"

export const metadata: Metadata = { title: "Terms of use | SkinLens" }

const CONTACT = "anannyashree1425@gmail.com"

export default function Terms() {
  return (
    <LegalPage title="Terms of use" updated="12 October 2026">
      <p>These terms cover your use of SkinLens: the apps and the website. By using SkinLens you agree to them.</p>

      <h2>What SkinLens is</h2>
      <p>
        SkinLens helps you keep a skincare routine and read ingredient labels in plain language. <strong>It is not medical advice.</strong> Readings come from our reference data
        and general guidance; they aren&apos;t a diagnosis and don&apos;t know your medical history or allergies. If you have a skin condition, a reaction, are pregnant, or
        have a medical question, talk to a doctor or pharmacist. Patch-test new products whatever SkinLens says.
      </p>

      <h2>Who can use it</h2>
      <p>You must be 16 or older.</p>

      <h2>Your account</h2>
      <p>An account is optional. If you create one, keep your sign-in codes to yourself, and tell us if you think someone else has used your account. You can delete it at any time from Me.</p>

      <h2>Ingredient data and verdicts</h2>
      <p>
        We work to keep our data accurate, but formulas change by country and over time, our data has gaps, and mistakes happen. When we can&apos;t rate enough of a label we
        give no verdict rather than guess. Even a full verdict is our best reading, not a guarantee. You decide what goes on your skin. <Link href="/how-we-rate">How we rate</Link>{" "}
        explains our sources.
      </p>

      <h2>Brands and corrections</h2>
      <p>
        Our verdicts describe ingredients, not companies, and nobody can pay for one. If you make a product and think a label or rating is wrong (an outdated formula, a
        wrong ingredient, a rating you can show is mistaken), email us with the product, what&apos;s wrong, and your evidence. We check every report, correct errors, and reply
        to say what we changed and why.
      </p>

      <h2>Fair use</h2>
      <ul>
        <li>Don&apos;t use SkinLens for anything illegal or to harm the service or other people.</li>
        <li>Don&apos;t try to access other people&apos;s accounts or data.</li>
        <li>Don&apos;t scrape or overload the service beyond normal use.</li>
        <li>Don&apos;t submit false or misleading reports or content.</li>
      </ul>

      <h2>Price</h2>
      <p>SkinLens is free. Checking ingredients will always be free. If we ever add paid features, we&apos;ll say so clearly before anything you use starts costing money.</p>

      <h2>Ownership</h2>
      <p>The apps, the website, their design and our ingredient explanations belong to us or our licensors. What you enter (your routine, lists you paste) stays yours. Reports of unknown ingredients may be used to improve our data.</p>

      <h2>No guarantees, limited liability</h2>
      <p>
        SkinLens is provided as it is. As far as the law allows, we don&apos;t guarantee it will always work or that our data is complete or correct, and we aren&apos;t liable
        for indirect or consequential losses from using it, including reactions to products. Nothing here limits liability where the law doesn&apos;t allow it.
      </p>

      <h2>Changes and ending</h2>
      <p>If we change these terms materially we&apos;ll update the date above. You can stop using SkinLens any time. We may suspend accounts that break these terms.</p>

      <h2>Contact</h2>
      <p>
        <a href={`mailto:${CONTACT}`}>{CONTACT}</a>
      </p>
    </LegalPage>
  )
}
