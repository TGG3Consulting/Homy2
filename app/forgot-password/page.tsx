'use client'

import { useState, FormEvent } from 'react'
import Link from 'next/link'
import { api } from '@/lib/api/client'
import { Mail, CheckCircle2 } from 'lucide-react'
import { AUTH_CSS } from '@/components/homy/authStyles'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await api.auth.resetPasswordRequest(email)
    } catch {
      // всегда показываем успех (защита от перебора email)
    } finally {
      setLoading(false)
      setSent(true)
    }
  }

  return (
    <div className="homy-auth">
      <style dangerouslySetInnerHTML={{ __html: AUTH_CSS }} />
      <div className="authwrap">
        <div className="acard">
          <div className="lg">Ho<span className="m">m</span>y</div>
          <h1>Сброс пароля</h1>
          <div className="sub">Укажите email или телефон — пришлём ссылку для восстановления доступа.</div>

          {sent ? (
            <div style={{ marginTop: 18, textAlign: 'center' }}>
              <div style={{ display: 'flex', justifyContent: 'center', color: 'var(--em)', marginBottom: 10 }}>
                <CheckCircle2 />
              </div>
              <p className="sub">
                Если аккаунт с таким email существует, вы получите ссылку для восстановления в течение пары минут.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="field">
                <label>Телефон или email</label>
                <div className="inp">
                  <Mail size={18} />
                  <input
                    type="text"
                    autoComplete="email"
                    autoFocus
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>
              <button type="submit" className="abtn" disabled={loading}>
                <span>{loading ? 'Отправляем…' : 'Отправить ссылку'}</span>
              </button>
            </form>
          )}

          <div className="afoot">
            <Link href="/login" className="alink">← Вернуться ко входу</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
