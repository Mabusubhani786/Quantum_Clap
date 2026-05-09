import { useState, type ChangeEvent, type FormEvent } from "react"
import { Link } from "@tanstack/react-router"
import { ArrowRight, LockKeyhole, Mail, User } from "lucide-react"

import backendApiEndPoints from "@/api-fetch-endpoints/backendApiEndPoints.json"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { backendApiData } from "@/service/backendApiData"

type BackendApiEndPoints = {
  auth: {
    sign_up: string
  }
}

type SignUpPayload = {
  first_name: string
  last_name: string
  user_name: string
  email: string
  password: string
}

const endpoints = backendApiEndPoints as BackendApiEndPoints

const initialPayload: SignUpPayload = {
  first_name: "",
  last_name: "",
  user_name: "",
  email: "",
  password: "",
}

export function SignUpForm() {
  const [payload, setPayload] = useState<SignUpPayload>(initialPayload)
  const [message, setMessage] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handlePayloadChange =
    (field: keyof SignUpPayload) => (event: ChangeEvent<HTMLInputElement>) => {
      setPayload((currentPayload) => ({
        ...currentPayload,
        [field]: event.target.value,
      }))
    }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSubmitting(true)
    setMessage("")

    const response = await backendApiData({
      method: "POST",
      url: endpoints.auth.sign_up,
      payload,
    })

    if (response) {
      setPayload(initialPayload)
      setMessage("Account created successfully.")
    } else {
      setMessage("Unable to create account. Please check the details.")
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
          <h2 className="text-3xl font-semibold tracking-normal">
            Create account
          </h2>
          <p className="text-sm leading-6 text-white/62">
            Start organizing your catalog, roles, and release workflow.
          </p>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label
                className="text-sm font-medium text-white/86"
                htmlFor="signup-first-name"
              >
                First name
              </label>
              <div className="relative">
                <User className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-white/45" />
                <Input
                  id="signup-first-name"
                  type="text"
                  placeholder="Ava"
                  value={payload.first_name}
                  onChange={handlePayloadChange("first_name")}
                  className="h-11 border-white/10 bg-black/12 pl-9 text-white shadow-inner shadow-white/5 placeholder:text-white/38 focus-visible:border-white/45 focus-visible:ring-white/20"
                  autoComplete="given-name"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label
                className="text-sm font-medium text-white/86"
                htmlFor="signup-last-name"
              >
                Last name
              </label>
              <Input
                id="signup-last-name"
                type="text"
                placeholder="Stone"
                value={payload.last_name}
                onChange={handlePayloadChange("last_name")}
                className="h-11 border-white/10 bg-black/12 text-white shadow-inner shadow-white/5 placeholder:text-white/38 focus-visible:border-white/45 focus-visible:ring-white/20"
                autoComplete="family-name"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label
              className="text-sm font-medium text-white/86"
              htmlFor="signup-user-name"
            >
              User name
            </label>
            <div className="relative">
              <User className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-white/45" />
              <Input
                id="signup-user-name"
                type="text"
                placeholder="ava_stone"
                value={payload.user_name}
                onChange={handlePayloadChange("user_name")}
                className="h-11 border-white/10 bg-black/12 pl-9 text-white shadow-inner shadow-white/5 placeholder:text-white/38 focus-visible:border-white/45 focus-visible:ring-white/20"
                autoComplete="username"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label
              className="text-sm font-medium text-white/86"
              htmlFor="signup-email"
            >
              Email
            </label>
            <div className="relative">
              <Mail className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-white/45" />
              <Input
                id="signup-email"
                type="email"
                placeholder="you@quantumclap.com"
                value={payload.email}
                onChange={handlePayloadChange("email")}
                className="h-11 border-white/10 bg-black/12 pl-9 text-white shadow-inner shadow-white/5 placeholder:text-white/38 focus-visible:border-white/45 focus-visible:ring-white/20"
                autoComplete="email"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label
              className="text-sm font-medium text-white/86"
              htmlFor="signup-password"
            >
              Password
            </label>
            <div className="relative">
              <LockKeyhole className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-white/45" />
              <Input
                id="signup-password"
                type="password"
                placeholder="Create a strong password"
                value={payload.password}
                onChange={handlePayloadChange("password")}
                className="h-11 border-white/10 bg-black/12 pl-9 text-white shadow-inner shadow-white/5 placeholder:text-white/38 focus-visible:border-white/45 focus-visible:ring-white/20"
                autoComplete="new-password"
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
            {isSubmitting ? "Creating..." : "Create account"}
            <ArrowRight className="size-4" />
          </Button>
        </form>

        <p className="text-center text-sm text-white/60">
          Already have an account?{" "}
          <Link
            to="/sign-in"
            className="font-medium text-white underline-offset-4 hover:underline"
          >
            Sign in
          </Link>
        </p>
      </CardContent>
    </Card>
  )
}
