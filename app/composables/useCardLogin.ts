/** Inloggen met de (geprinte) ledenpas: server maakt een eenmalig token, de browser wisselt het in. */
export function useCardLogin() {
  const supabase = useSupabaseClient()
  const session = useSupabaseSession()
  const { ask } = useConfirm()

  async function loginWithCard(code: string): Promise<string | null> {
    if (session.value) {
      const ok = await ask({
        title: 'Andere ledenpas',
        body: 'Je bent al ingelogd op deze telefoon. Wil je inloggen met deze pas?',
        confirmLabel: 'Ja, inloggen met deze pas',
        cancelLabel: 'Nee, blijf ingelogd',
      })
      if (!ok) return null
      await supabase.auth.signOut()
    }

    const { tokenHash, householdName } = await $fetch<{ tokenHash: string, householdName: string }>('/api/auth/card', {
      method: 'POST',
      body: { code },
    })
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: 'email' })
    if (error) throw error
    useState('overview').value = null
    return householdName
  }

  /** Pad waar de gebruiker heen wilde voordat inloggen nodig was. */
  function redirectAfterLogin(): string {
    const saved = useSupabaseCookieRedirect().pluck()
    return saved && saved.startsWith('/') && !saved.startsWith('//') && !saved.startsWith('/login') ? saved : '/'
  }

  return { loginWithCard, redirectAfterLogin }
}
