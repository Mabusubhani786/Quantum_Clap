import { useEffect, useMemo, useState, type FormEvent } from "react"
import { createFileRoute } from "@tanstack/react-router"
import { CalendarDays, LockKeyhole, Mail, UserRound } from "lucide-react"

import backendApiEndPoints from "@/api-fetch-endpoints/backendApiEndPoints.json"
import { UserMediaSections } from "@/components/UserMediaSections"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { backendApiData } from "@/service/backendApiData"

export const Route = createFileRoute("/__mainLayout/profile/")({
  component: RouteComponent,
})

type BackendApiEndPoints = {
  user: {
    base: string
  }
}

type ProfileUser = {
  _id?: string
  first_name?: string
  middle_name?: string
  last_name?: string
  user_name?: string
  email?: string
  is_active?: boolean
  is_verify_opt?: boolean
  created_date?: string
  updated_date?: string
}

type BackendResponse<T> = {
  data?: T[]
}

const endpoints = backendApiEndPoints as BackendApiEndPoints

function readStoredUser(): ProfileUser | null {
  try {
    const storedUser = sessionStorage.getItem("user")
    return storedUser ? (JSON.parse(storedUser) as ProfileUser) : null
  } catch {
    return null
  }
}

function getFullName(user: ProfileUser | null) {
  return [user?.first_name, user?.middle_name, user?.last_name]
    .filter(Boolean)
    .join(" ")
}

function getInitials(user: ProfileUser | null) {
  const firstInitial = user?.first_name?.trim().charAt(0)
  const lastInitial = user?.last_name?.trim().charAt(0)
  const fallbackInitial = user?.user_name?.trim().charAt(0) ?? "U"

  return `${firstInitial ?? fallbackInitial}${lastInitial ?? ""}`.toUpperCase()
}

function formatDate(value?: string) {
  if (!value) {
    return "Not available"
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value))
}

function getProfileBackground(user: ProfileUser | null) {
  const seed = encodeURIComponent(
    user?._id ?? user?.user_name ?? user?.email ?? "quantum-clap"
  )

  return `https://api.dicebear.com/9.x/shapes/svg?seed=${seed}&backgroundColor=0f172a,111827,1e1b4b,312e81&radius=8`
}

function RouteComponent() {
  const [user, setUser] = useState<ProfileUser | null>(() => readStoredUser())
  const [passwordForm, setPasswordForm] = useState({
    new_password: "",
    confirm_password: "",
  })
  const [passwordMessage, setPasswordMessage] = useState("")
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false)
  const fullName = getFullName(user) || user?.user_name || "Quantum Clap User"
  const initials = getInitials(user)
  const backgroundImage = useMemo(() => getProfileBackground(user), [user])

  async function handlePasswordUpdate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPasswordMessage("")

    if (!user?._id) {
      setPasswordMessage("Please sign in again before updating your password.")
      return
    }

    if (passwordForm.new_password.length < 8) {
      setPasswordMessage("Password must be at least 8 characters.")
      return
    }

    if (passwordForm.new_password !== passwordForm.confirm_password) {
      setPasswordMessage("Passwords do not match.")
      return
    }

    setIsUpdatingPassword(true)
    const response = await backendApiData<BackendResponse<ProfileUser>>({
      method: "PATCH",
      url: endpoints.user.base,
      params: { id: user._id },
      payload: {
        password: passwordForm.new_password,
      },
    })
    setIsUpdatingPassword(false)

    if (!response) {
      setPasswordMessage("Password update failed. Please try again.")
      return
    }

    setPasswordForm({ new_password: "", confirm_password: "" })
    setPasswordMessage("Password updated successfully.")
  }

  useEffect(() => {
    const storedUser = readStoredUser()
    const userId = storedUser?._id

    if (!userId) {
      return
    }

    async function loadUser() {
      const response = await backendApiData<BackendResponse<ProfileUser>>({
        method: "GET",
        url: endpoints.user.base,
        params: { id: userId },
      })

      const latestUser = response?.data?.[0]
      if (latestUser) {
        setUser(latestUser)
        sessionStorage.setItem("user", JSON.stringify(latestUser))
      }
    }

    void loadUser()
  }, [])

  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="relative min-h-[460px] overflow-hidden pt-24 text-white sm:min-h-[520px]">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${backgroundImage})` }}
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,0.86),rgba(0,0,0,0.48),rgba(0,0,0,0.82))]" />
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-background to-transparent" />

        <div className="relative flex min-h-[360px] w-full items-end justify-start px-3 pb-6 sm:min-h-[420px] sm:px-4 sm:pb-8 md:px-6 lg:px-8">
          <Card className="w-full max-w-[min(100%,420px)] rounded-xl border-white/14 bg-white/[0.075] text-white shadow-2xl ring-1 shadow-black/35 ring-white/10 backdrop-blur-2xl">
            <CardContent className="space-y-4 p-4 sm:space-y-5 sm:p-6">
              <div className="flex min-w-0 items-center gap-3 sm:gap-4">
                <div className="flex size-16 shrink-0 items-center justify-center rounded-xl border border-white/18 bg-[linear-gradient(135deg,rgba(255,255,255,0.22),rgba(255,255,255,0.06))] text-2xl font-semibold shadow-[inset_0_1px_0_rgba(255,255,255,0.18),0_18px_45px_rgba(0,0,0,0.24)] sm:size-20 sm:text-3xl">
                  {initials}
                </div>

                <div className="min-w-0">
                  <h1 className="truncate text-xl font-semibold tracking-normal sm:text-3xl">
                    {fullName}
                  </h1>
                  <p className="mt-1 truncate text-xs text-white/64 sm:text-sm">
                    @{user?.user_name ?? "user"}
                  </p>
                </div>
              </div>

              <div className="space-y-2 border-t border-white/10 pt-3 sm:space-y-3 sm:pt-4">
                <div className="min-w-0 rounded-lg border border-white/10 bg-black/16 p-3 shadow-inner shadow-white/5">
                  <div className="flex items-center gap-2 text-xs font-medium tracking-wide text-white/46 uppercase">
                    <Mail className="size-3.5" />
                    Email
                  </div>
                  <p className="mt-1 min-w-0 truncate text-sm font-medium text-white/92">
                    {user?.email ?? "Not available"}
                  </p>
                </div>

                <div className="min-w-0 rounded-lg border border-white/10 bg-black/16 p-3 shadow-inner shadow-white/5">
                  <div className="flex items-center gap-2 text-xs font-medium tracking-wide text-white/46 uppercase">
                    <CalendarDays className="size-3.5" />
                    Joined
                  </div>
                  <p className="mt-1 text-sm font-medium text-white/92">
                    {formatDate(user?.created_date)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="w-full px-3 py-6 sm:px-4 sm:py-8 md:px-6 lg:px-8">
        <div className="grid w-full gap-4 lg:grid-cols-3">
          <Card className="rounded-xl border-border/70 bg-card/90 shadow-sm">
            <CardContent className="space-y-3 p-5">
              <div className="flex size-9 items-center justify-center rounded-lg bg-primary/8 text-foreground">
                <UserRound className="size-5" />
              </div>
              <div>
                <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                  Account
                </p>
                <h2 className="mt-1 text-lg font-semibold">
                  {user?.is_active ? "Active profile" : "Inactive profile"}
                </h2>
              </div>
              <p className="text-sm leading-6 text-muted-foreground">
                Your profile details are synced from the Quantum Clap user
                record.
              </p>
            </CardContent>
          </Card>

          <Card className="rounded-xl border-border/70 bg-card/90 shadow-sm">
            <CardContent className="space-y-3 p-5">
              <div className="flex size-9 items-center justify-center rounded-lg bg-primary/8 text-foreground">
                <Mail className="size-5" />
              </div>
              <div>
                <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                  Contact
                </p>
                <h2 className="mt-1 truncate text-lg font-semibold">
                  {user?.email ?? "Not available"}
                </h2>
              </div>
              <p className="text-sm leading-6 text-muted-foreground">
                Used for sign-in, account recovery, and profile verification.
              </p>
            </CardContent>
          </Card>

          <Card className="rounded-xl border-border/70 bg-card/90 shadow-sm">
            <CardContent className="space-y-3 p-5">
              <div className="flex size-9 items-center justify-center rounded-lg bg-primary/8 text-foreground">
                <CalendarDays className="size-5" />
              </div>
              <div>
                <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                  Joined
                </p>
                <h2 className="mt-1 text-lg font-semibold">
                  {formatDate(user?.created_date)}
                </h2>
              </div>
              <p className="text-sm leading-6 text-muted-foreground">
                Member profile created in the Quantum Clap workspace.
              </p>
            </CardContent>
          </Card>

          <Card className="rounded-xl border-border/70 bg-card/95 shadow-sm lg:col-span-3">
            <CardContent className="p-0">
              <Accordion collapsible type="single">
                <AccordionItem className="border-b-0" value="update-password">
                  <AccordionTrigger className="px-5 py-5 hover:no-underline sm:px-6">
                    <div className="flex min-w-0 items-center gap-4">
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/8 text-foreground">
                        <LockKeyhole className="size-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                          Security
                        </p>
                        <h2 className="mt-1 text-lg font-semibold sm:text-xl">
                          Update password
                        </h2>
                      </div>
                    </div>
                  </AccordionTrigger>

                  <AccordionContent className="px-5 pb-5 sm:px-6 sm:pb-6">
                    <div className="grid gap-5 border-t border-border/70 pt-5 lg:grid-cols-[0.9fr_1.4fr] lg:items-start">
                      <p className="max-w-md text-sm leading-6 text-muted-foreground">
                        Choose a strong password for your Quantum Clap account.
                        The update is saved directly to your user profile.
                      </p>

                      <form
                        className="grid gap-4 sm:grid-cols-2"
                        onSubmit={handlePasswordUpdate}
                      >
                        <div className="space-y-2">
                          <label
                            className="text-sm font-medium text-foreground"
                            htmlFor="new_password"
                          >
                            New password
                          </label>
                          <Input
                            id="new_password"
                            autoComplete="new-password"
                            className="h-11 rounded-lg"
                            minLength={8}
                            name="new_password"
                            onChange={(event) =>
                              setPasswordForm((currentForm) => ({
                                ...currentForm,
                                new_password: event.target.value,
                              }))
                            }
                            placeholder="Enter new password"
                            type="password"
                            value={passwordForm.new_password}
                          />
                        </div>

                        <div className="space-y-2">
                          <label
                            className="text-sm font-medium text-foreground"
                            htmlFor="confirm_password"
                          >
                            Confirm password
                          </label>
                          <Input
                            id="confirm_password"
                            autoComplete="new-password"
                            className="h-11 rounded-lg"
                            minLength={8}
                            name="confirm_password"
                            onChange={(event) =>
                              setPasswordForm((currentForm) => ({
                                ...currentForm,
                                confirm_password: event.target.value,
                              }))
                            }
                            placeholder="Confirm new password"
                            type="password"
                            value={passwordForm.confirm_password}
                          />
                        </div>

                        <div className="flex flex-col gap-3 sm:col-span-2 sm:flex-row sm:items-center sm:justify-between">
                          <p className="min-h-5 text-sm text-muted-foreground">
                            {passwordMessage}
                          </p>
                          <Button
                            className="h-11 rounded-lg px-5 sm:w-auto"
                            disabled={isUpdatingPassword}
                            type="submit"
                          >
                            {isUpdatingPassword
                              ? "Updating..."
                              : "Update password"}
                          </Button>
                        </div>
                      </form>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
        </div>

        <UserMediaSections className="mt-8 space-y-8" />
      </section>
    </main>
  )
}
