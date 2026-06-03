"use server"

import { signIn } from '@/lib/auth'

type LoginType = 'google'

export async function handleRegister(provider: LoginType) {
  await signIn(provider, { redirectTo: "/dashboard" })
}