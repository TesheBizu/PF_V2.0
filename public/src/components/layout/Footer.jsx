import { useTheme } from "../../context/ThemeContext";
import { useSettings } from "../../context/SettingsContext";
import { GitHubIcon, LinkedInIcon, TwitterIcon } from "../ui/icons";

const SOCIAL_CONFIG = [
  { key: "github", label: "GitHub", Icon: GitHubIcon },
  { key: "linkedin", label: "LinkedIn", Icon: LinkedInIcon },
  { key: "twitter", label: "Twitter / X", Icon: TwitterIcon },
];

export default function Footer() {
  const { theme } = useTheme();
  const { settings } = useSettings();
  const isMatrix = theme === "matrix";
  const year = new Date().getFullYear();
  const socialLinks = settings?.socialLinks || {};
  const copyrightName = settings?.footerCopyrightName || "";

  const muted = isMatrix ? "text-text-primary/50" : "text-bluepill-text/60";
  const socialColor = isMatrix
    ? "text-text-primary/60 hover:text-matrix-green"
    : "text-bluepill-text/60 hover:text-bluepill-accent";
  const glow = isMatrix ? "via-matrix-green/40" : "via-bluepill-accent/40";
  const statusColor = isMatrix ? "text-matrix-green" : "text-bluepill-accent";

  return (
    <footer className="relative px-6 py-8">
      <div
        className={`absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent ${glow} to-transparent`}
        aria-hidden="true"
      />

      <div className="mx-auto flex w-full max-w-5xl flex-col items-center gap-6 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        {/* social links — left on desktop */}
        <div className="order-2 flex items-center gap-4 sm:order-1">
          {SOCIAL_CONFIG.map(({ key, label, Icon }) => {
            const href = socialLinks[key];
            if (!href) return null;
            return (
              <a
                key={key}
                href={href}
                target="_blank"
                rel="noreferrer"
                aria-label={label}
                className={`p-2.5 transition-colors ${socialColor}`}
              >
                <Icon />
              </a>
            );
          })}
        </div>

        {/* copyright + status — right on desktop */}
        <div className="order-3 flex flex-col items-center gap-1 font-mono text-xs sm:items-end">
          <p className={muted}>
            © {year}
            {copyrightName ? ` ${copyrightName}.` : ""} All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
