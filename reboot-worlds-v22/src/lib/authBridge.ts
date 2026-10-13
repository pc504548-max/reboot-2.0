/** In-memory, identity-bound database tokens. No invented refresh sessions. */
export function createTokenBridge(exchange: (idToken: string) => Promise<{access_token: string; expires_at: number}>) {
  let generation = 0
  let cached: {uid: string; token: string; expires: number} | null = null
  let pending: {uid: string; promise: Promise<string>} | null = null
  return {
    clear() { generation++; cached = null; pending = null },
    async token(user: {uid: string; getIdToken: () => Promise<string>} | null): Promise<string | null> {
      if (!user) return null
      if (cached?.uid === user.uid && cached.expires > Date.now() / 1000 + 60) return cached.token
      if (pending?.uid === user.uid) return pending.promise
      const version = generation
      const promise = (async () => {
        const data = await exchange(await user.getIdToken())
        if (!data.access_token || !Number.isFinite(data.expires_at) || data.expires_at <= Date.now()/1000) throw new Error('The account service returned an invalid session.')
        if (version !== generation) throw new Error('Account changed. Please try again.')
        cached = {uid: user.uid, token: data.access_token, expires: data.expires_at}
        return data.access_token
      })()
      pending = {uid: user.uid, promise}
      try { return await promise } finally { if (pending?.promise === promise) pending = null }
    },
  }
}

export function authMessage(error: unknown): string {
  const code = (error as {code?: string})?.code
  const messages: Record<string, string> = {
    'auth/invalid-credential': 'The email or password is incorrect.',
    'auth/email-already-in-use': 'This email already has an account. Sign in or reset your password.',
    'auth/weak-password': 'Choose a password with at least 6 characters.',
    'auth/popup-closed-by-user': 'Sign-in was closed. You can try again.',
    'auth/popup-blocked': 'Allow popups for this site, or sign in with email.',
    'auth/unauthorized-domain': 'Account sign-in is not configured for this site address yet.',
    'auth/operation-not-allowed': 'This sign-in provider is not enabled yet. Try another option.',
    'auth/network-request-failed': 'Could not reach sign-in. Check your connection and retry.',
    'auth/too-many-requests': 'Too many attempts. Please wait before trying again.',
    'auth/account-exists-with-different-credential': 'Use the original sign-in method for this email first.',
  }
  return (code && messages[code]) || (error instanceof Error ? error.message : 'Could not complete sign-in. Please retry.')
}
