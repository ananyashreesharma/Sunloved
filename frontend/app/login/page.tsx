import { Suspense } from "react"
import { LoginPage } from "@/components/v3/LoginPage"

export default function Login() {
  return (
    <Suspense>
      <LoginPage />
    </Suspense>
  )
}
