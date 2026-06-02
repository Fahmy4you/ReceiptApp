"use server"

import { signIn, signOut } from "@/lib/auth"

export const signOutFormAction = async () => {
    await signOut({redirectTo: "/"})
}

export const signInWithGoogle = async () => {
    await signIn("google", {
        redirectTo: "/",
    })
}