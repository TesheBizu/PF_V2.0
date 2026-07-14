import express from 'express'
import rateLimit from 'express-rate-limit'

const router = express.Router()

// Protect the endpoint so a busy public site can't blow through GitHub's rate limit
const githubLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests. Please try again later.' },
})

const GITHUB_GRAPHQL = 'https://api.github.com/graphql'
const CACHE_TTL = 60 * 60 * 1000 // 1 hour

// Simple in-memory cache (no Redis needed): refetch only when empty or stale
let cache = { data: null, fetchedAt: 0 }

// contributionLevel enum -> numeric 0..4 so the client can pick a palette shade
const LEVEL_MAP = {
  NONE: 0,
  FIRST_QUARTILE: 1,
  SECOND_QUARTILE: 2,
  THIRD_QUARTILE: 3,
  FOURTH_QUARTILE: 4,
}

const CONTRIB_QUERY = `
  query ($login: String!) {
    user(login: $login) {
      contributionsCollection {
        contributionCalendar {
          totalContributions
          weeks {
            contributionDays {
              date
              weekday
              contributionCount
              contributionLevel
              color
            }
          }
        }
      }
    }
  }
`

async function fetchContributions() {
  const token = process.env.GITHUB_TOKEN
  const login = process.env.GITHUB_USERNAME

  if (!token || !login) {
    const err = new Error('GITHUB_TOKEN and GITHUB_USERNAME must be set')
    err.status = 503
    throw err
  }

  let res
  try {
    res = await fetch(GITHUB_GRAPHQL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `bearer ${token}`,
      },
      body: JSON.stringify({ query: CONTRIB_QUERY, variables: { login } }),
    })
  } catch (netErr) {
    const err = new Error(`GitHub network request failed: ${netErr.message}`)
    err.status = 502
    throw err
  }

  // 401/403 usually means a bad token or rate limit exhaustion
  if (res.status === 401) {
    const err = new Error('GitHub rejected the token (401 Unauthorized)')
    err.status = 502
    throw err
  }
  if (res.status === 403) {
    const err = new Error('GitHub rate limit hit or token forbidden (403)')
    err.status = 429
    throw err
  }
  if (!res.ok) {
    const err = new Error(`GitHub responded with ${res.status}`)
    err.status = 502
    throw err
  }

  let json
  try {
    json = await res.json()
  } catch (parseErr) {
    const err = new Error(`Failed to parse GitHub response: ${parseErr.message}`)
    err.status = 502
    throw err
  }

  if (json.errors && json.errors.length) {
    const err = new Error(`GitHub GraphQL error: ${json.errors[0].message}`)
    err.status = json.errors.some((e) => e.type === 'NOT_FOUND') ? 404 : 502
    throw err
  }

  const calendar = json?.data?.user?.contributionsCollection?.contributionCalendar
  if (!calendar) {
    const err = new Error('Unexpected GitHub response shape (no contributionCalendar)')
    err.status = 502
    throw err
  }

  const weeks = calendar.weeks.map((week) => ({
    days: week.contributionDays.map((day) => ({
      date: day.date,
      weekday: day.weekday,
      contributionCount: day.contributionCount,
      level: LEVEL_MAP[day.contributionLevel] ?? 0,
      color: day.color,
    })),
  }))

  return {
    username: login,
    totalContributions: calendar.totalContributions,
    weeks,
  }
}

router.get('/contributions', githubLimiter, async (_req, res) => {
  // Serve cached data when fresh
  if (cache.data && Date.now() - cache.fetchedAt < CACHE_TTL) {
    return res.json(cache.data)
  }

  try {
    const data = await fetchContributions()
    cache = { data, fetchedAt: Date.now() }
    return res.json(data)
  } catch (err) {
    // Log the real error server-side for debugging, return a clean message to the client
    console.error('[github] contributions fetch failed:', err.message)
    const status = err.status || 500
    return res.status(status).json({
      message:
        status === 503
          ? 'GitHub activity is not configured on the server.'
          : 'Unable to load GitHub activity right now.',
    })
  }
})

export default router
