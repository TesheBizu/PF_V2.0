// Command registry for the interactive terminal.
// Each command exposes a `description` (for `help`) and a `run(args, ctx)`
// that returns either a string, an array of lines, or `{ clear: true }`.
// `ctx` is supplied by the terminal component and provides side-effect helpers.

// section keyword -> element id (reuses the same ids the Navbar scrolls to)
const SECTIONS = {
  home: 'home',
  about: 'about',
  skills: 'skills',
  projects: 'projects',
  experience: 'experience',
  testimonials: 'testimonials',
  contact: 'contact',
}

const COMMANDS = {
  help: {
    description: 'show this list of commands',
    run: () => {
      const pad = (s) => s + ' '.repeat(Math.max(0, 14 - s.length))
      const lines = ['Available commands:', '']
      for (const [name, cmd] of Object.entries(COMMANDS)) {
        lines.push(`  ${pad(name)} ${cmd.description}`)
      }
      lines.push('')
      lines.push("Tip: try 'ls', 'cd projects', or 'theme bluepill'.")
      return lines
    },
  },

  whoami: {
    description: 'print a short identity blurb',
    run: () => [
      'visitor@portfolio',
      'role: full-stack developer (MERN stack)',
      'status: open to freelance work & collaboration',
    ],
  },

  ls: {
    description: 'list site sections as files',
    run: () => [
      'about.txt   skills/   projects/   experience.log   contact.sh',
    ],
  },

  cd: {
    description: 'scroll to a section — cd [section]',
    run: (args, ctx) => {
      const target = (args[0] || '').toLowerCase()
      if (!target) return ["usage: cd [section]   (try 'ls' for options)"]
      const id = SECTIONS[target]
      if (!id) return [`cd: no such section: ${target}`]
      ctx.navigate(id)
      return [`// teleporting to ${target}...`]
    },
  },

  clear: {
    description: 'clear the terminal output',
    run: (args, ctx) => {
      ctx.clear()
      return { clear: true }
    },
  },

  theme: {
    description: 'switch theme — theme [matrix|bluepill]',
    run: (args, ctx) => {
      const name = (args[0] || '').toLowerCase()
      if (name !== 'matrix' && name !== 'bluepill') {
        return ['usage: theme [matrix|bluepill]']
      }
      ctx.setTheme(name)
      return [`// theme set to ${name}`]
    },
  },

  sudo: {
    description: 'elevate privileges (probably not)',
    run: (args) => {
      const rest = args.join(' ').toLowerCase()
      if (rest === 'make me a sandwich') {
        return ['Nice try. Permission denied.']
      }
      return ['sudo: permission denied.']
    },
  },
}

export function executeCommand(raw, ctx) {
  const input = (raw || '').trim()
  if (!input) return { output: [] }

  const parts = input.split(/\s+/)
  const name = parts[0].toLowerCase()
  const args = parts.slice(1)

  const cmd = COMMANDS[name]
  if (!cmd) {
    return {
      output: [
        `command not found: ${input}. type 'help' for a list of commands.`,
      ],
    }
  }

  const result = cmd.run(args, ctx)
  if (result && result.clear) return { clear: true, output: [] }

  const output = Array.isArray(result) ? result : [result]
  return { output }
}

export const COMMAND_NAMES = Object.keys(COMMANDS)
