import type { Metadata } from "next"
import { LegalPage } from "@/components/v3/LegalPage"

export const metadata: Metadata = { title: "Privacy policy | SkinLens" }

const CONTACT = "anannyashree2514@gmail.com"

export default function Privacy() {
  return (
    <LegalPage title="Privacy policy" updated="12 October 2026">
      <p>This explains what SkinLens collects, why, and what you can do about it, in plain language. It covers the SkinLens apps for iPhone and Android and the website.</p>

      <h2>The short version</h2>
      <ul>
        <li>You can use SkinLens fully without an account. Your routine, skin profile and saved checks then stay on your device.</li>
        <li>An account is optional. If you create one, we keep your email address and your SkinLens data so it follows you to a new phone and to the website.</li>
        <li>Ingredient lists you check are sent to our server to be read. They aren&apos;t linked to you unless you&apos;re signed in and choose to save the check.</li>
        <li>We count a few anonymous events to see whether SkinLens is working. No advertising, no third-party tracking, and we never sell your data.</li>
        <li>You can delete your account and everything in it from the app or the website at any time.</li>
      </ul>

      <h2>Without an account</h2>
      <p>These stay on your device, in its normal app storage (or your browser&apos;s storage on the website):</p>
      <ul>
        <li>Where you live, your skin type and up to two skin concerns, if you enter them</li>
        <li>Your routine: step names, when and how often you use them, and which days you completed it</li>
        <li>Reminder times, tone and on/off settings (reminders are scheduled on your phone)</li>
        <li>Checks you choose to save, and their results</li>
      </ul>
      <p>Uninstalling the app or clearing the browser&apos;s site data deletes them. We have no copy.</p>

      <h2>With an account</h2>
      <p>Creating an account is optional. We collect:</p>
      <ul>
        <li><strong>Your email address</strong>, to send a one-time sign-in code and to identify your account. We don&apos;t ask for a name or a password.</li>
        <li><strong>Your SkinLens data</strong>: country, skin type and concerns, routine, completed days and streak, and checks you save. When you sign in, what&apos;s already on your device moves into your account.</li>
        <li><strong>A sign-in token</strong> kept in your device&apos;s secure storage (the Keychain on iPhone) so you stay signed in.</li>
      </ul>

      <h2>Checking a label</h2>
      <p>When you search for a product or paste an ingredient list, it&apos;s sent to our server, which looks each ingredient up and sends back a reading. Your skin profile isn&apos;t sent; the reading is personalised on your device. We may count which ingredient names we didn&apos;t recognise, without anything about you, to fill gaps in our data.</p>

      <h2>Sharing a check</h2>
      <p>If you share a check, the link contains the product or its ingredient list and a name. It never contains your skin profile; whoever opens it sees the reading for their own skin.</p>

      <h2>Anonymous usage counts</h2>
      <p>To know whether SkinLens is useful, the apps and website send five kinds of event: first opened, label checked (with its verdict), routine step ticked, routine completed, and account created. Each comes with a random ID made on your device, the platform, and sometimes your country or which routine. No ingredient lists, names or email addresses. If you&apos;re signed in, events are linked to your account. We use them only to measure SkinLens and never share them.</p>

      <h2>Who processes data for us</h2>
      <ul>
        <li>Supabase (database hosting) stores account data.</li>
        <li>Our server host runs the SkinLens service.</li>
        <li>Resend sends sign-in code emails.</li>
      </ul>
      <p>They process data only to provide these services to us.</p>

      <h2>Deleting your data</h2>
      <p>
        In the app: Me → Delete my account. On the website: Me → Delete my account. This permanently deletes your account and everything in it from our servers. Anonymous
        usage counts stay, no longer linked to anything. Without an account, uninstall the app or clear the site&apos;s data. You can also email us to ask what we hold
        about you or to have it deleted.
      </p>

      <h2>Age</h2>
      <p>SkinLens is for people aged 16 and over. We don&apos;t knowingly collect data from anyone younger; if you think a child has given us data, contact us and we&apos;ll delete it.</p>

      <h2>Changes</h2>
      <p>If this policy changes in a way that affects your data, we&apos;ll update the date above and, for significant changes, tell you in the app.</p>

      <h2>Contact</h2>
      <p>
        Questions or requests about your data: <a href={`mailto:${CONTACT}`}>{CONTACT}</a>
      </p>
    </LegalPage>
  )
}
