import { Link } from "@tanstack/react-router"
import { ArrowRight, LockKeyhole, Mail, User } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

export function SignUpForm() {
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

        <form className="space-y-5">
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
                  className="h-11 border-white/10 bg-black/12 pl-9 text-white shadow-inner shadow-white/5 placeholder:text-white/38 focus-visible:border-white/45 focus-visible:ring-white/20"
                  autoComplete="given-name"
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
                className="h-11 border-white/10 bg-black/12 text-white shadow-inner shadow-white/5 placeholder:text-white/38 focus-visible:border-white/45 focus-visible:ring-white/20"
                autoComplete="family-name"
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
                className="h-11 border-white/10 bg-black/12 pl-9 text-white shadow-inner shadow-white/5 placeholder:text-white/38 focus-visible:border-white/45 focus-visible:ring-white/20"
                autoComplete="email"
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
                className="h-11 border-white/10 bg-black/12 pl-9 text-white shadow-inner shadow-white/5 placeholder:text-white/38 focus-visible:border-white/45 focus-visible:ring-white/20"
                autoComplete="new-password"
              />
            </div>
          </div>

          <Button
            type="submit"
            className="h-11 w-full bg-white text-sm text-[#111111] shadow-lg shadow-black/20 hover:bg-white/90"
          >
            Create account
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
