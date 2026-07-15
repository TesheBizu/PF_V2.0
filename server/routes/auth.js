import express from 'express'
import rateLimit from 'express-rate-limit'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import passport from 'passport'
import { Strategy as GoogleStrategy } from 'passport-google-oauth20'
import speakeasy from 'speakeasy'
import QRCode from 'qrcode'
import auth from '../middleware/auth.js'
import Admin from '../models/Admin.js'

const router = express.Router()

const JWT_SECRET = process.env.JWT_SECRET
const ADMIN_EMAIL = process.env.ADMIN_EMAIL?.toLowerCase()
const ADMIN_CLIENT_URL = process.env.ADMIN_CLIENT_URL || 'http://localhost:5174'

// ---------------------------------------------------------------------------
// Passport Google OAuth strategy
// ---------------------------------------------------------------------------
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },
    async (_accessToken, _refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value?.toLowerCase()

        if (email !== ADMIN_EMAIL) {
          return done(null, false)
        }

        const admin = await Admin.findOne({ email })
        if (!admin) {
          return done(null, false)
        }

        if (!admin.googleId) {
          admin.googleId = profile.id
          await admin.save()
        }

        return done(null, admin)
      } catch (err) {
        return done(err)
      }
    },
  ),
)

// ---------------------------------------------------------------------------
// Rate limiters
// ---------------------------------------------------------------------------
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many login attempts. Please try again later.' },
})

const verifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many verification attempts. Please try again later.' },
})

// ---------------------------------------------------------------------------
// Helper: issue session JWT or pending-2FA JWT
// ---------------------------------------------------------------------------
function issueToken(admin, { pending2fa = false, expiresIn = pending2fa ? '5m' : '7d' } = {}) {
  return jwt.sign(
    { sub: admin._id, email: admin.email, ...(pending2fa ? { pending2fa: true } : {}) },
    JWT_SECRET,
    { expiresIn },
  )
}

// ---------------------------------------------------------------------------
// POST /login  —  email + password
// ---------------------------------------------------------------------------
router.post('/login', loginLimiter, async (req, res) => {
  const { email, password } = req.body || {}

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' })
  }

  try {
    const admin = await Admin.findOne({ email: email.toLowerCase() })
    if (!admin) {
      return res.status(401).json({ message: 'Invalid credentials.' })
    }

    const valid = await bcrypt.compare(password, admin.passwordHash)
    if (!valid) {
      return res.status(401).json({ message: 'Invalid credentials.' })
    }

    if (admin.totpEnabled) {
      const pendingToken = issueToken(admin, { pending2fa: true })
      return res.json({ token: pendingToken, twoFactorRequired: true })
    }

    const token = issueToken(admin)
    return res.json({ token, email: admin.email })
  } catch (err) {
    console.error('Login error:', err.message)
    return res.status(500).json({ message: 'An internal error occurred.' })
  }
})

// ---------------------------------------------------------------------------
// GET /google  —  initiate OAuth flow
// ---------------------------------------------------------------------------
router.get(
  '/google',
  passport.authenticate('google', { scope: ['email', 'profile'], session: false }),
)

// ---------------------------------------------------------------------------
// GET /google/callback  —  handle OAuth redirect
// ---------------------------------------------------------------------------
router.get(
  '/google/callback',
  passport.authenticate('google', {
    session: false,
    failureRedirect: `${ADMIN_CLIENT_URL}/login?error=google_auth_failed`,
  }),
  async (req, res) => {
    try {
      const admin = req.user

      if (admin.totpEnabled) {
        const pendingToken = issueToken(admin, { pending2fa: true })
        return res.redirect(`${ADMIN_CLIENT_URL}/auth/callback?pendingToken=${pendingToken}`)
      }

      const token = issueToken(admin)
      return res.redirect(`${ADMIN_CLIENT_URL}/auth/callback?token=${token}`)
    } catch (err) {
      console.error('Google callback error:', err.message)
      return res.redirect(`${ADMIN_CLIENT_URL}/login?error=google_auth_failed`)
    }
  },
)

// ---------------------------------------------------------------------------
// POST /2fa/setup  —  generate TOTP secret + QR code  (protected)
// ---------------------------------------------------------------------------
router.post('/2fa/setup', auth, async (req, res) => {
  if (req.admin.pending2fa) {
    return res.status(403).json({ message: 'Full authentication required.' })
  }

  try {
    const admin = await Admin.findById(req.admin.sub)
    if (!admin) {
      return res.status(404).json({ message: 'Admin not found.' })
    }

    const secret = speakeasy.generateSecret({
      name: `PF_V2.0 Admin (${admin.email})`,
      issuer: 'PF_V2.0',
      length: 20,
    })

    admin.totpSecret = secret.base32
    admin.totpEnabled = false
    await admin.save()

    const qrCode = await QRCode.toDataURL(secret.otpauth_url)

    return res.json({ qrCode, secret: secret.base32 })
  } catch (err) {
    console.error('2FA setup error:', err.message)
    return res.status(500).json({ message: 'Could not generate 2FA setup.' })
  }
})

// ---------------------------------------------------------------------------
// POST /2fa/verify-setup  —  confirm TOTP enrollment  (protected)
// ---------------------------------------------------------------------------
router.post('/2fa/verify-setup', auth, async (req, res) => {
  if (req.admin.pending2fa) {
    return res.status(403).json({ message: 'Full authentication required.' })
  }

  const { code } = req.body || {}

  if (!code || !/^\d{6}$/.test(code)) {
    return res.status(400).json({ message: 'A 6-digit code is required.' })
  }

  try {
    const admin = await Admin.findById(req.admin.sub)
    if (!admin) {
      return res.status(404).json({ message: 'Admin not found.' })
    }

    if (!admin.totpSecret) {
      return res.status(400).json({ message: 'No 2FA setup in progress. Call /2fa/setup first.' })
    }

    const valid = speakeasy.totp.verify({
      secret: admin.totpSecret,
      encoding: 'base32',
      token: code,
      window: 1,
    })

    if (!valid) {
      return res.status(401).json({ message: 'Invalid verification code. Please try again.' })
    }

    admin.totpEnabled = true
    await admin.save()

    return res.json({ message: '2FA has been enabled.' })
  } catch (err) {
    console.error('2FA verify-setup error:', err.message)
    return res.status(500).json({ message: 'An internal error occurred.' })
  }
})

// ---------------------------------------------------------------------------
// POST /2fa/verify  —  verify code with pending token  (unauthenticated)
// ---------------------------------------------------------------------------
router.post('/2fa/verify', verifyLimiter, async (req, res) => {
  const { token, code } = req.body || {}

  if (!token || !code) {
    return res.status(400).json({ message: 'Token and code are required.' })
  }

  if (!/^\d{6}$/.test(code)) {
    return res.status(400).json({ message: 'Code must be exactly 6 digits.' })
  }

  let decoded
  try {
    decoded = jwt.verify(token, JWT_SECRET)
  } catch {
    return res.status(401).json({ message: 'Invalid or expired token.' })
  }

  if (!decoded.pending2fa) {
    return res.status(400).json({ message: 'Invalid token type.' })
  }

  try {
    const admin = await Admin.findById(decoded.sub)
    if (!admin || !admin.totpEnabled || !admin.totpSecret) {
      return res.status(400).json({ message: '2FA is not enabled for this account.' })
    }

    const valid = speakeasy.totp.verify({
      secret: admin.totpSecret,
      encoding: 'base32',
      token: code,
      window: 1,
    })

    if (!valid) {
      return res.status(401).json({ message: 'Invalid verification code.' })
    }

    const sessionToken = issueToken(admin)
    return res.json({ token: sessionToken, email: admin.email })
  } catch (err) {
    console.error('2FA verify error:', err.message)
    return res.status(500).json({ message: 'An internal error occurred.' })
  }
})

export default router
