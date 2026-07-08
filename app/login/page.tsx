'use client'

import { useState, FormEvent } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api/client'
import { Mail, Lock, Eye, EyeOff, MessageCircle, ShieldCheck } from 'lucide-react'
import { AUTH_CSS } from '@/components/homy/authStyles'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const result = await api.auth.login(email, password)
      if (result.success) {
        const redirect = new URLSearchParams(window.location.search).get('redirect')
        router.push(redirect || '/')
        router.refresh()
      } else {
        setError(result.error || 'Не удалось войти')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Неверный email или пароль')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="homy-auth">
      <style dangerouslySetInnerHTML={{ __html: AUTH_CSS }} />
      <div className="authwrap">
        <div className="acard">
          <div className="lg">Ho<span className="m">m</span>y</div>
          <h1>Вход в аккаунт</h1>
          <div className="sub">
            Продолжите там, где остановились — избранное, поиски и переписка сохранены.
          </div>

          {error && <div className="err">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="field">
              <label>Телефон или email</label>
              <div className="inp">
                <Mail size={18} />
                <input
                  type="text"
                  autoComplete="username"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoFocus
                />
              </div>
            </div>

            <div className="field">
              <label>Пароль</label>
              <div className="inp">
                <Lock size={18} />
                <input
                  type={show ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="Ваш пароль"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button type="button" className="eye" onClick={() => setShow((s) => !s)} aria-label="Показать пароль">
                  {show ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            <div className="arow">
              <span />
              <Link href="/forgot-password" className="alink">Забыли пароль?</Link>
            </div>

            <button type="submit" className="abtn" disabled={loading}>
              <span>{loading ? 'Входим…' : 'Войти'}</span>
            </button>
          </form>

          <button type="button" className="altbtn">
            <MessageCircle size={16} />
            Войти по SMS-коду
          </button>

          <div className="afoot">
            Нет аккаунта? <Link href="/register" className="alink">Регистрация</Link>
          </div>

          <div className="trust">
            <ShieldCheck size={14} />
            Homy — слой доверия, а не брокер. Данные не продаём.
          </div>
        </div>
      </div>
    </div>
  )
}
