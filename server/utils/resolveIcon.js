import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import conceptOverrides from '../data/conceptOverrides.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const deviconData = JSON.parse(
  readFileSync(join(__dirname, '..', 'node_modules', 'devicon', 'devicon.json'), 'utf-8'),
)

const icons = deviconData.map((entry) => ({
  name: entry.name,
  altnames: (entry.altnames || []).map((a) => a.toLowerCase()),
  normalizedAltnames: (entry.altnames || []).map((a) => a.toLowerCase().replace(/[^a-z0-9]/g, '')),
  normalized: entry.name.toLowerCase(),
}))

const FALLBACK = { iconName: null, matched: false }

function normalize(str) {
  return str.toLowerCase().replace(/[^a-z0-9]/g, '')
}

export default function resolveIcon(skillName) {
  if (!skillName || typeof skillName !== 'string') return FALLBACK

  const rawLower = skillName.trim().toLowerCase()
  if (!rawLower) return FALLBACK

  const query = normalize(rawLower)
  if (!query) return FALLBACK

  const conceptMatch = conceptOverrides[query]
  if (conceptMatch) {
    return { iconName: null, matched: true, conceptIcon: conceptMatch }
  }

  for (const icon of icons) {
    if (icon.altnames.includes(rawLower)) {
      return { iconName: icon.name, matched: true }
    }
  }

  for (const icon of icons) {
    if (icon.normalizedAltnames.includes(query)) {
      return { iconName: icon.name, matched: true }
    }
  }

  for (const icon of icons) {
    if (icon.normalized === query) {
      return { iconName: icon.name, matched: true }
    }
  }

  return FALLBACK
}
