import { useState, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useTheme } from '../../context/ThemeContext'
import { useSettings } from '../../context/SettingsContext'
import api from '../../lib/api'
import TerminalReveal from '../ui/TerminalReveal'
import Toast from '../ui/Toast'
import { Phone, MapPin } from 'lucide-react'
import { GitHubIcon, LinkedInIcon, TwitterIcon } from '../ui/icons'

const schema = z.object({
  name: z.string().trim().min(1, 'Please enter your name'),
  email: z
    .string()
    .trim()
    .min(1, 'Please enter your email')
    .email('Please enter a valid email'),
  message: z.string().trim().min(10, 'Message must be at least 10 characters'),
})

const SOCIAL_CONFIG = [
  { key: 'github', label: 'GitHub', Icon: GitHubIcon },
  { key: 'linkedin', label: 'LinkedIn', Icon: LinkedInIcon },
  { key: 'twitter', label: 'Twitter / X', Icon: TwitterIcon },
]

export default function Contact() {
  const { theme } = useTheme()
  const { settings } = useSettings()
  const isMatrix = theme === 'matrix'
  const [submitting, setSubmitting] = useState(false)
  const [toast, setToast] = useState({ message: '', type: 'success', key: 0 })
  const contactEmail = settings?.contactEmail || ''
  const contactPhone = settings?.contactPhone || ''
  const contactLocation = settings?.contactLocation || ''
  const socialLinks = settings?.socialLinks || {}

  const headingColor = isMatrix ? 'text-matrix-green' : 'text-bluepill-accent'
  const accent = isMatrix ? 'text-matrix-green/60' : 'text-bluepill-accent-dark'
  const muted = isMatrix ? 'text-text-primary/50' : 'text-bluepill-text/60'

  const labelColor = isMatrix ? 'text-matrix-green/70' : 'text-bluepill-accent-dark'
  const inputBase =
    'w-full bg-transparent font-mono text-sm outline-none py-2 placeholder:text-current/30'
  const inputBorder = isMatrix
    ? 'border-0 border-b border-matrix-green/40 focus:border-matrix-green text-text-primary/90'
    : 'border-0 border-b border-bluepill-accent/40 focus:border-bluepill-accent text-bluepill-text'
  const errorColor = 'text-alert'

  const textColor = isMatrix ? 'text-text-primary' : 'text-bluepill-text'
  const subColor = isMatrix ? 'text-matrix-green/70' : 'text-bluepill-accent-dark'
  const linkColor = isMatrix
    ? 'text-matrix-green/80 hover:text-matrix-green'
    : 'text-bluepill-accent-dark/80 hover:text-bluepill-accent-dark'

  const btnClass = isMatrix
    ? 'border-matrix-green/50 text-matrix-green hover:bg-matrix-green/10'
    : 'border-bluepill-accent/50 text-bluepill-accent-dark hover:bg-bluepill-accent/10'

  const infoBox = isMatrix
    ? 'border-matrix-green/20 bg-bg-void/60'
    : 'border-bluepill-accent/20 bg-white/60'

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({ resolver: zodResolver(schema), mode: 'onTouched' })

  const onSubmit = async (data) => {
    setSubmitting(true)
    try {
      await api.post('/contact', data)
      reset()
      setToast((t) => ({
        message: 'message.sent successfully',
        type: 'success',
        key: t.key + 1,
      }))
    } catch (err) {
      setToast({
        message:
          err.response?.data?.message ||
          'transmission failed — try again or email directly',
        type: 'error',
        key: toast.key + 1,
      })
    } finally {
      setSubmitting(false)
    }
  }

  const dismissToast = useCallback(() => {
    setToast((t) => ({ ...t, message: '' }))
  }, [])

  return (
    <section id="contact" className="px-6 py-24">
      <div className="mx-auto max-w-5xl">
        <h2 className={`mb-3 font-mono text-2xl sm:text-3xl ${headingColor}`}>
          <span className={accent}>&gt;</span>{' '}
          <TerminalReveal mode="type" text="send_message.sh" as="span" />
        </h2>
        <p className={`mb-12 font-mono text-sm ${muted}`}>
          <span className="opacity-60">$</span> initializing secure channel...
        </p>

        <div className="grid gap-10 md:grid-cols-2">
          {/* left: form */}
          <div>
            <form onSubmit={handleSubmit(onSubmit)} noValidate className="font-mono">
                <div className="mb-6">
                  <label htmlFor="name" className={`block text-sm ${labelColor}`}>
                    &gt; enter your name:
                  </label>
                  <input
                    id="name"
                    type="text"
                    autoComplete="name"
                    placeholder="Ada Lovelace"
                    aria-invalid={!!errors.name}
                    aria-describedby={errors.name ? 'name-error' : undefined}
                    className={`mt-1 ${inputBase} ${inputBorder}`}
                    {...register('name')}
                  />
                  {errors.name && (
                    <p id="name-error" className={`mt-1 text-xs ${errorColor}`}>
                      {errors.name.message}
                    </p>
                  )}
                </div>

                <div className="mb-6">
                  <label htmlFor="email" className={`block text-sm ${labelColor}`}>
                    &gt; enter your email:
                  </label>
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="ada@example.com"
                    aria-invalid={!!errors.email}
                    aria-describedby={errors.email ? 'email-error' : undefined}
                    className={`mt-1 ${inputBase} ${inputBorder}`}
                    {...register('email')}
                  />
                  {errors.email && (
                    <p id="email-error" className={`mt-1 text-xs ${errorColor}`}>
                      {errors.email.message}
                    </p>
                  )}
                </div>

                <div className="mb-6">
                  <label htmlFor="message" className={`block text-sm ${labelColor}`}>
                    &gt; enter your message:
                  </label>
                  <textarea
                    id="message"
                    rows={5}
                    placeholder="Type your message here (min 10 characters)..."
                    aria-invalid={!!errors.message}
                    aria-describedby={errors.message ? 'message-error' : undefined}
                    className={`mt-1 resize-none ${inputBase} ${inputBorder}`}
                    {...register('message')}
                  />
                  {errors.message && (
                    <p id="message-error" className={`mt-1 text-xs ${errorColor}`}>
                      {errors.message.message}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className={`inline-flex items-center gap-2 rounded border px-5 py-2.5 font-mono text-sm transition-colors disabled:opacity-60 ${btnClass}`}
                >
                  {submitting ? (
                    <>
                      <svg
                        className="h-3.5 w-3.5 animate-spin"
                        viewBox="0 0 24 24"
                        fill="none"
                        aria-hidden="true"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4z"
                        />
                      </svg>
                      &gt; transmitting...
                    </>
                  ) : (
                    '> transmit_message'
                  )}
                </button>
              </form>
          </div>

          {/* right: info + socials */}
          <div className={`rounded-lg border p-8 font-mono ${infoBox}`}>
            <h3 className={`mb-4 text-lg ${subColor}`}>// contact_info</h3>
            <dl className="space-y-3 text-sm">
              {contactEmail && (
                <div>
                  <dt className={`opacity-70 ${labelColor}`}>email:</dt>
                  <dd className={textColor}>
                    <a href={`mailto:${contactEmail}`} className={linkColor}>
                      {contactEmail}
                    </a>
                  </dd>
                </div>
              )}
              {contactPhone && (
                <div>
                  <dt className={`opacity-70 ${labelColor}`}>phone:</dt>
                  <dd>
                    <a
                      href={`tel:${contactPhone}`}
                      className={`inline-flex items-center gap-2 text-sm ${linkColor}`}
                    >
                      <Phone className="h-4 w-4" />
                      {contactPhone}
                    </a>
                  </dd>
                </div>
              )}
              {contactLocation && (
                <div>
                  <dt className={`opacity-70 ${labelColor}`}>location:</dt>
                  <dd>
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(contactLocation)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`inline-flex items-center gap-2 text-sm ${linkColor}`}
                    >
                      <MapPin className="h-4 w-4" />
                      {contactLocation}
                    </a>
                  </dd>
                </div>
              )}
            </dl>

            <h3 className={`mb-3 mt-8 text-lg ${subColor}`}>// socials</h3>
            <div className="flex flex-col gap-3">
              {SOCIAL_CONFIG.map(({ key, label, Icon }) => {
                const href = socialLinks[key]
                if (!href) return null
                return (
                  <a
                    key={key}
                    href={href}
                    target="_blank"
                    rel="noreferrer"
                    className={`inline-flex items-center gap-3 text-sm ${linkColor}`}
                  >
                    <Icon />
                    {label}
                  </a>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      <Toast
        key={toast.key}
        message={toast.message}
        type={toast.type}
        onDismiss={dismissToast}
      />
    </section>
  )
}
