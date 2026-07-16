import { useState } from 'react'
import { FiCode } from 'react-icons/fi'
import {
  Network,
  Workflow,
  FlaskConical,
  Repeat,
  LayoutDashboard,
  GitBranch,
  Boxes,
  Braces,
} from 'lucide-react'
import { useTheme } from '../../context/ThemeContext'
import deviconData from 'devicon/devicon.json'

const CONCEPT_ICON_MAP = {
  Network,
  Workflow,
  FlaskConical,
  Repeat,
  LayoutDashboard,
  GitBranch,
  Boxes,
  Braces,
}

const hasPlain = new Set(
  deviconData
    .filter((e) => e.versions?.font?.includes('plain'))
    .map((e) => e.name),
)

export default function TechIcon({ iconName, conceptIcon, size = 16, className = '' }) {
  const { theme } = useTheme()

  if (conceptIcon && CONCEPT_ICON_MAP[conceptIcon]) {
    const Icon = CONCEPT_ICON_MAP[conceptIcon]
    return <Icon size={size} className={className} />
  }

  if (!iconName) {
    return <FiCode size={size} className={className} />
  }

  const variant = hasPlain.has(iconName) ? 'plain' : 'original'
  const cls = `devicon-${iconName}-${variant} colored ${className}`

  return <i className={cls} style={{ fontSize: size }} />
}
