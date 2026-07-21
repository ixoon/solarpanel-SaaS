"use client"

import { useState } from "react"

import { AdminLogin } from "@/components/admin/AdminLogin"
import { InstallerAdminPanel } from "@/components/admin/InstallerAdminPanel"

type AdminShellProps = {
  initialAuthenticated: boolean
}

export function AdminShell({ initialAuthenticated }: AdminShellProps) {
  const [authenticated, setAuthenticated] = useState(initialAuthenticated)

  if (!authenticated) {
    return <AdminLogin onSuccess={() => setAuthenticated(true)} />
  }

  return <InstallerAdminPanel />
}
