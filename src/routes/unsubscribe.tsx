import { createFileRoute, useSearch } from '@tanstack/react-router'
import { useEffect, useState } from 'react'

type Search = { token?: string }

export const Route = createFileRoute('/unsubscribe')({
  validateSearch: (s: Record<string, unknown>): Search => ({
    token: typeof s.token === 'string' ? s.token : undefined,
  }),
  head: () => ({ meta: [{ title: 'Unsubscribe — Luxx Touch Aesthetics' }] }),
  component: UnsubscribePage,
})

function UnsubscribePage() {
  const { token } = useSearch({ from: '/unsubscribe' })
  const [state, setState] = useState<'loading' | 'valid' | 'used' | 'invalid' | 'done' | 'error'>('loading')
  const [email, setEmail] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!token) { setState('invalid'); return }
    fetch(`/email/unsubscribe?token=${encodeURIComponent(token)}`)
      .then(async (r) => {
        const j = await r.json().catch(() => ({}))
        if (!r.ok) { setState('invalid'); return }
        if (j.used) { setState('used'); return }
        setEmail(j.email ?? null)
        setState('valid')
      })
      .catch(() => setState('error'))
  }, [token])

  const confirm = async () => {
    if (!token) return
    setSubmitting(true)
    try {
      const r = await fetch('/email/unsubscribe', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      })
      if (!r.ok) throw new Error()
      setState('done')
    } catch { setState('error') } finally { setSubmitting(false) }
  }

  return (
    <div className="mx-auto max-w-md px-5 py-24 text-center">
      <h1 className="font-display text-3xl">Email preferences</h1>
      {state === 'loading' && <p className="mt-4 text-sm text-muted-foreground">Loading…</p>}
      {state === 'invalid' && <p className="mt-4 text-sm text-muted-foreground">This unsubscribe link is invalid or expired.</p>}
      {state === 'used' && <p className="mt-4 text-sm text-muted-foreground">You're already unsubscribed.</p>}
      {state === 'error' && <p className="mt-4 text-sm text-muted-foreground">Something went wrong. Please try again.</p>}
      {state === 'valid' && (
        <>
          <p className="mt-4 text-sm text-muted-foreground">
            Confirm you'd like to unsubscribe{email ? ` ${email}` : ''} from Luxx Touch Aesthetics emails.
          </p>
          <button onClick={confirm} disabled={submitting} className="mt-6 btn-luxe">
            {submitting ? 'PROCESSING…' : 'CONFIRM UNSUBSCRIBE'}
          </button>
        </>
      )}
      {state === 'done' && <p className="mt-4 text-sm text-muted-foreground">You've been unsubscribed.</p>}
    </div>
  )
}
