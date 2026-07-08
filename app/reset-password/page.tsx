'use client'

import { useState, FormEvent, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { api } from '@/lib/api/client'
import { Lock, Eye, EyeOff, AlertTriangle } from 'lucide-react'
import { AUTH_CSS } from '@/components/homy/authStyles'

function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const resetToken = searchParams.get('token')

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [show, setShow] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const strength = (() => {
    let s = 0
    if (newPassword.length >= 8) s++
    if (/[A-Z]/.test(newPassword) && /[a-z]/.test(newPassword)) s++
    if (/\d/.test(newPassword)) s++
    if (/[^A-Za-z0-9]/.test(newPassword)) s++
    return s
  })()
  const strengthLabel = strength <= 1 ? 'слабая' : strength <= 2 ? 'средняя' : strength === 3 ? 'хорошая' : 'высокая'

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    if (newPassword.length < 8) return setError('Пароль минимум 8 символов')
    if (newPassword !== confirmPassword) return setError('Пароли не совпадают')
    if (!resetToken) return setError('Неверная ссылка восстановления')
    setLoading(true)
    try {
      await api.auth.resetPassword(resetToken, newPassword)
      router.push('/login')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось изменить пароль')
    } finally {
      setLoading(false)
    }
  }

  if (!resetToken) {
    return (
      <div className="homy-auth">
        <style dangerouslySetInnerHTML={{ __html: AUTH_CSS }} />
        <div className="authwrap">
          <div className="acard">
            <div style={{ display: 'flex', justifyContent: 'center', color: 'var(--amber)', marginBottom: 6 }}>
              <AlertTriangle />
            </div>
            <h1>Ссылка недействительна</h1>
            <div className="sub">Ссылка для сброса пароля отсутствует или устарела. Запросите новую.</div>
            <div className="afoot">
              <Link href="/forgot-password" className="alink">Запросить новую ссылку</Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="homy-auth">
      <style dangerouslySetInnerHTML={{ __html: AUTH_CSS }} />
      <div className="authwrap">
        <div className="acard">
          <div className="lg">Ho<span className="m">m</span>y</div>
          <h1>Новый пароль</h1>
          <div className="sub">Придумайте новый пароль. Минимум 8 символов, буквы и цифры.</div>

          {error && <div className="err">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="field">
              <label>Новый пароль</label>
              <div className="inp">
                <Lock size={18} />
                <input
                  type={show ? 'text' : 'password'}
                  autoComplete="new-password"
                  autoFocus
                  placeholder="Новый пароль"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
                <button type="button" className="eye" onClick={() => setShow((s) => !s)} aria-label="Показать пароль">
                  {show ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
              {newPassword && (
                <>
                  <div className="pwmeter">
                    {[0, 1, 2, 3].map((i) => (
                      <i key={i} className={i < strength ? (strength >= 3 ? 'on' : 'mid') : ''} />
                    ))}
                  </div>
                  <div className="pwhint">Надёжность: {strengthLabel}</div>
                </>
              )}
            </div>

            <div className="field">
              <label>Повторите пароль</label>
              <div className="inp">
                <Lock size={18} />
                <input
                  type={show ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="Ещё раз"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <button type="submit" className="abtn" disabled={loading}>
              <span>{loading ? 'Сохраняем…' : 'Сохранить пароль'}</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordForm />
    </Suspense>
  )
}
