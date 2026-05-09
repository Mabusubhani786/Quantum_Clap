import { Link } from "@tanstack/react-router"
import { ArrowRight, LockKeyhole, Mail } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

export function SignInForm() {
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

        <form className="space-y-5">
          <div className="space-y-2">
            <label
              className="text-sm font-medium text-white/86"
              htmlFor="signin-email"
            >
              Email
            </label>
            <div className="relative">
              <Mail className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-white/45" />
              <Input
                id="signin-email"
                type="email"
                placeholder="you@quantumclap.com"
                className="h-11 border-white/10 bg-black/12 pl-9 text-white shadow-inner shadow-white/5 placeholder:text-white/38 focus-visible:border-white/45 focus-visible:ring-white/20"
                autoComplete="email"
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
                className="h-11 border-white/10 bg-black/12 pl-9 text-white shadow-inner shadow-white/5 placeholder:text-white/38 focus-visible:border-white/45 focus-visible:ring-white/20"
                autoComplete="current-password"
              />
            </div>
          </div>

          <Button
            type="submit"
            className="h-11 w-full bg-white text-sm text-[#111111] shadow-lg shadow-black/20 hover:bg-white/90"
          >
            Sign in
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
