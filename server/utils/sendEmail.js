import nodemailer from 'nodemailer'
import dotenv from 'dotenv'

// Load env BEFORE creating the transporter, since imports are hoisted and
// server.js's dotenv.config() runs too late for this module.
dotenv.config()

console.log(
  'EMAIL_USER set:',
  !!process.env.EMAIL_USER,
  '| EMAIL_PASS set:',
  !!process.env.EMAIL_PASS,
)

const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
})

// One-time startup check: confirms Gmail accepts the credentials independently
// of the contact form.
transporter
  .verify()
  .then(() => console.log('Email transporter ready'))
  .catch((err) =>
    console.error('Email transporter verification failed:', err.message),
  )

export async function sendEmail({ to, subject, text, html }) {
  return transporter.sendMail({
    from: process.env.EMAIL_USER,
    to,
    subject,
    text,
    html,
  })
}

export default sendEmail
