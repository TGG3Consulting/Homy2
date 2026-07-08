'use client'

import { useState, useRef, FormEvent, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api/client'
import { User, Mail, Lock, Eye, EyeOff, Check } from 'lucide-react'
import { AUTH_CSS } from '@/components/homy/authStyles'

export default function RegisterPage() {
  const router = useRouter()
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [patronymic, setPatronymic] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [agree, setAgree] = useState(true)
  const [show, setShow] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showOtp, setShowOtp] = useState(false)
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [cooldown, setCooldown] = useState(0)
  const otpRefs = useRef<Array<HTMLInputElement | null>>([])

  useEffect(() => {
    if (cooldown <= 0) return
    const id = setInterval(() => setCooldown((c) => Math.max(0, c - 1)), 1000)
    return () => clearInterval(id)
  }, [cooldown])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    if (!firstName.trim()) return setError('Укажите имя')
    if (!lastName.trim()) return setError('Укажите фамилию')
    if (password.length < 8) return setError('Пароль минимум 8 символов')
    if (password !== confirmPassword) return setError('Пароли не совпадают')
    if (!agree) return setError('Примите условия использования')
    setLoading(true)
    try {
      await api.auth.register(email, password, {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        patronymic: patronymic.trim() || undefined,
      })
      setShowOtp(true)
      setCooldown(45)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось зарегистрироваться')
    } finally {
      setLoading(false)
    }
  }

  const handleVerify = async () => {
    setError('')
    setLoading(true)
    try {
      const result = await api.auth.verifyOtp(email, otp.join(''))
      if (result?.success) {
        router.push('/')
        router.refresh()
      } else {
        setError(result?.error || 'Неверный код')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Неверный код подтверждения')
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    if (cooldown > 0) return
    setError('')
    try {
      await api.auth.resendOtp(email)
      setCooldown(45)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось отправить код')
    }
  }

  const setDigit = (i: number, v: string) => {
    const d = v.replace(/\D/g, '').slice(-1)
    setOtp((prev) => {
      const next = [...prev]
      next[i] = d
      return next
    })
    if (d && i < 5) otpRefs.current[i + 1]?.focus()
  }
  const onOtpKey = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[i] && i > 0) otpRefs.current[i - 1]?.focus()
  }

  const field = (label: string, node: React.ReactNode) => (
    <div className="field">
      <label>{label}</label>
      <div className="inp">{node}</div>
    </div>
  )

  if (showOtp) {
    return (
      <div className="homy-auth">
        <style dangerouslySetInnerHTML={{ __html: AUTH_CSS }} />
        <div className="authwrap">
          <div className="acard">
            <div className="lg">Ho<span className="m">m</span>y</div>
            <h1>Введите код</h1>
            <div className="sub">
              Отправили 6-значный код на <b style={{ color: 'var(--soft)' }}>{email}</b>. Код действует 5 минут.
            </div>
            {error && <div className="err">{error}</div>}
            <div className="otp">
              {otp.map((d, i) => (
                <input
                  key={i}
                  ref={(el) => (otpRefs.current[i] = el)}
                  inputMode="numeric"
                  maxLength={1}
                  value={d}
                  onChange={(e) => setDigit(i, e.target.value)}
                  onKeyDown={(e) => onOtpKey(i, e)}
                  autoFocus={i === 0}
                />
              ))}
            </div>
            <button
              type="button"
              className="abtn"
              onClick={handleVerify}
              disabled={loading || otp.join('').length < 6}
            >
              <span>{loading ? 'Проверяем…' : 'Подтвердить'}</span>
            </button>
            <div className="resend">
              Не пришёл код?{' '}
              {cooldown > 0 ? (
                <b>Отправить снова через 0:{String(cooldown).padStart(2, '0')}</b>
              ) : (
                <button type="button" className="alink" style={{ background: 'none', border: 0 }} onClick={handleResend}>
                  Отправить снова
                </button>
              )}
            </div>
            <div className="afoot">
              <button
                type="button"
                className="alink"
                style={{ background: 'none', border: 0 }}
                onClick={() => setShowOtp(false)}
              >
                ← Изменить данные
              </button>
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
          <h1>Создать аккаунт</h1>
          <div className="sub">
            Займёт минуту. Homy подберёт объекты и будет честно показывать плюсы и минусы.
          </div>

          {error && <div className="err">{error}</div>}

          <form onSubmit={handleSubmit}>
            {field('Имя', (
              <>
                <User size={18} />
                <input type="text" autoComplete="given-name" placeholder="Как к вам обращаться" value={firstName} onChange={(e) => setFirstName(e.target.value)} required autoFocus />
              </>
            ))}
            {field('Фамилия', (
              <>
                <User size={18} />
                <input type="text" autoComplete="family-name" placeholder="Фамилия" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
              </>
            ))}
            {field('Отчество (необязательно)', (
              <>
                <User size={18} />
                <input type="text" autoComplete="additional-name" placeholder="Отчество" value={patronymic} onChange={(e) => setPatronymic(e.target.value)} />
              </>
            ))}
            {field('Email', (
              <>
                <Mail size={18} />
                <input type="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </>
            ))}
            {field('Пароль', (
              <>
                <Lock size={18} />
                <input type={show ? 'text' : 'password'} autoComplete="new-password" placeholder="Придумайте пароль" value={password} onChange={(e) => setPassword(e.target.value)} required />
                <button type="button" className="eye" onClick={() => setShow((s) => !s)} aria-label="Показать пароль">
                  {show ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </>
            ))}
            {field('Повторите пароль', (
              <>
                <Lock size={18} />
                <input type={show ? 'text' : 'password'} autoComplete="new-password" placeholder="Ещё раз" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
              </>
            ))}

            <label style={{ display: 'flex', alignItems: 'flex-start', gap: 9, marginTop: 16, fontSize: 12, color: 'var(--soft)', lineHeight: 1.5, cursor: 'pointer' }}>
              <span
                onClick={() => setAgree((a) => !a)}
                style={{
                  width: 18, height: 18, borderRadius: 5, flex: 'none', marginTop: 1,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: agree ? '0' : '1px solid var(--hair)',
                  background: agree ? 'radial-gradient(120% 160% at 50% 18%,var(--em-hi),var(--em))' : 'transparent',
                  color: '#fff',
                }}
              >
                {agree && <Check size={13} />}
              </span>
              <span>Принимаю условия использования и политику конфиденциальности Homy.</span>
            </label>

            <button type="submit" className="abtn" disabled={loading}>
              <span>{loading ? 'Создаём…' : 'Создать аккаунт'}</span>
            </button>
          </form>

          <div className="afoot">
            Уже есть аккаунт? <Link href="/login" className="alink">Войти</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
