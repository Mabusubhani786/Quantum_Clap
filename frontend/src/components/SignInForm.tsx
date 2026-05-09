import { useState, type ChangeEvent, type FormEvent } from "react"
import { Link, useNavigate } from "@tanstack/react-router"
import { ArrowRight, LockKeyhole, Mail } from "lucide-react"

import backendApiEndPoints from "@/api-fetch-endpoints/backendApiEndPoints.json"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { backendApiData } from "@/service/backendApiData"

type BackendApiEndPoints = {
  auth: {
    sign_in: string
  }
}

type SignInPayload = {
  login: string
  password: string
}

type SignInResponse = {
  data?: Array<{
    access_expires_at?: string
    access_token?: string
    refresh_expires_at?: string
    refresh_token?: string
    user?: unknown
  }>
}

type AuthSession = {
  access_expires_at: string
  access_token: string
  refresh_expires_at: string
  refresh_token: string
  user: unknown
  decoded_token: Record<string, unknown>
}

const endpoints = backendApiEndPoints as BackendApiEndPoints
const initialPayload: SignInPayload = {
  login: "",
  password: "",
}

const decodeAccessToken = (token: string): Record<string, unknown> => {
  try {
    const payloadPart = token.split(".")[1]
    if (!payloadPart) {
      return {}
    }

    const base64 = payloadPart.replace(/-/g, "+").replace(/_/g, "/")
    const decodedPayload = decodeURIComponent(
      window
        .atob(base64)
        .split("")
        .map((character) => {
          return `%${`00${character.charCodeAt(0).toString(16)}`.slice(-2)}`
        })
        .join("")
    )

    return JSON.parse(decodedPayload) as Record<string, unknown>
  } catch {
    return {}
  }
}

const storeAuthSession = (session: AuthSession) => {
  sessionStorage.setItem("auth_session", JSON.stringify(session))
  sessionStorage.setItem("access_expires_at", session.access_expires_at)
  sessionStorage.setItem("access_token", session.access_token)
  sessionStorage.setItem("refresh_expires_at", session.refresh_expires_at)
  sessionStorage.setItem("refresh_token", session.refresh_token)
  sessionStorage.setItem("user", JSON.stringify(session.user))
  sessionStorage.setItem("decoded_token", JSON.stringify(session.decoded_token))
}

export function SignInForm() {
  const navigate = useNavigate()
  const [payload, setPayload] = useState<SignInPayload>(initialPayload)
  const [message, setMessage] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handlePayloadChange =
    (field: keyof SignInPayload) => (event: ChangeEvent<HTMLInputElement>) => {
      setPayload((currentPayload) => ({
        ...currentPayload,
        [field]: event.target.value,
      }))
    }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSubmitting(true)
    setMessage("")

    const response = await backendApiData<SignInResponse>({
      method: "POST",
      url: endpoints.auth.sign_in,
      payload,
    })

    const tokenData = response?.data?.[0]
    if (
      tokenData?.access_expires_at &&
      tokenData.access_token &&
      tokenData.refresh_expires_at &&
      tokenData.refresh_token &&
      tokenData.user
    ) {
      storeAuthSession({
        access_expires_at: tokenData.access_expires_at,
        access_token: tokenData.access_token,
        refresh_expires_at: tokenData.refresh_expires_at,
        refresh_token: tokenData.refresh_token,
        user: tokenData.user,
        decoded_token: decodeAccessToken(tokenData.access_token),
      })

      setPayload(initialPayload)
      setMessage("Signed in successfully.")
      await navigate({ to: "/home" })
    } else {
      setMessage("Invalid user name/email or password.")
    }

    setIsSubmitting(false)
  }

  return (
    <Card className="mx-auto w-full max-w-[440px] rounded-xl border-white/10 bg-white/[0.018] text-white shadow-2xl ring-1 shadow-black/25 ring-white/5 backdrop-blur-[6px]">
      <CardContent className="space-y-7 p-6 sm:p-8">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <img
              src="/assets/quantum_clap_logo.png"
              alt="Quantum Clap"
              className="size-10 rounded-lg bg-white object-contain p-1"
            />
            <p className="text-sm font-medium text-white/70">Quantum Clap</p>
          </div>
          <h2 className="text-3xl font-semibold tracking-normal">Sign in</h2>
          <p className="text-sm leading-6 text-white/62">
            Access your dashboard, projects, and creator tools.
          </p>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label
              className="text-sm font-medium text-white/86"
              htmlFor="signin-login"
            >
              User name or email
            </label>
            <div className="relative">
              <Mail className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-white/45" />
              <Input
                id="signin-login"
                type="text"
                placeholder="mabusubhani_shaik or you@quantumclap.com"
                value={payload.login}
                onChange={handlePayloadChange("login")}
                className="h-11 border-white/10 bg-black/12 pl-9 text-white shadow-inner shadow-white/5 placeholder:text-white/38 focus-visible:border-white/45 focus-visible:ring-white/20"
                autoComplete="username"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <label className="text-sm font-medium" htmlFor="signin-password">
                Password
              </label>
              <button
                type="button"
                className="text-sm font-medium text-white/55 transition-colors hover:text-white"
              >
                Forgot?
              </button>
            </div>
            <div className="relative">
              <LockKeyhole className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-white/45" />
              <Input
                id="signin-password"
                type="password"
                placeholder="Enter your password"
                value={payload.password}
                onChange={handlePayloadChange("password")}
                className="h-11 border-white/10 bg-black/12 pl-9 text-white shadow-inner shadow-white/5 placeholder:text-white/38 focus-visible:border-white/45 focus-visible:ring-white/20"
                autoComplete="current-password"
                required
              />
            </div>
          </div>

          {message ? (
            <p className="rounded-lg border border-white/10 bg-black/18 px-3 py-2 text-sm text-white/72">
              {message}
            </p>
          ) : null}

          <Button
            type="submit"
            disabled={isSubmitting}
            className="h-11 w-full bg-white text-sm text-[#111111] shadow-lg shadow-black/20 hover:bg-white/90"
          >
            {isSubmitting ? "Signing in..." : "Sign in"}
            <ArrowRight className="size-4" />
          </Button>
        </form>

        <p className="text-center text-sm text-white/60">
          New to Quantum Clap?{" "}
          <Link
            to="/sign-up"
            className="font-medium text-white underline-offset-4 hover:underline"
          >
            Create account
          </Link>
        </p>
      </CardContent>
    </Card>
  )
}
