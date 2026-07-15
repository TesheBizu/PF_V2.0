import {
  SiReact,
  SiNextdotjs,
  SiTypescript,
  SiTailwindcss,
  SiFramer,
  SiRedux,
  SiNodedotjs,
  SiExpress,
  SiPython,
  SiGraphql,
  SiMongodb,
  SiPostgresql,
  SiRedis,
  SiMongoose,
  SiGit,
  SiDocker,
  SiVite,
  SiLinux,
  SiPostman,
} from 'react-icons/si'
import { FiCode, FiGlobe } from 'react-icons/fi'
import { LuDatabase } from 'react-icons/lu'
import { useTheme } from '../../context/ThemeContext'

const ICON_MAP = {
  SiReact,
  SiNextdotjs,
  SiTypescript,
  SiTailwindcss,
  SiFramer,
  SiRedux,
  SiNodedotjs,
  SiExpress,
  SiPython,
  SiGraphql,
  SiMongodb,
  SiPostgresql,
  SiRedis,
  SiMongoose,
  SiGit,
  SiDocker,
  SiVite,
  SiLinux,
  SiPostman,
  FiCode,
  FiGlobe,
  LuDatabase,
}

const DEFAULT_ICON = FiCode

export default function TechIcon({ icon, size = 16, className = '', brandColor }) {
  const { theme } = useTheme()
  const IconComponent = (icon && ICON_MAP[icon]) || DEFAULT_ICON
  const style = theme === 'bluepill' && brandColor ? { color: brandColor } : undefined
  return <IconComponent size={size} className={className} style={style} />
}
