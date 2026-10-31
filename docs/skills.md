# Project skills (`.claude/skills/`)

Third-party agent skills installed for this project on 2026-10-31. They are committed so that
git worktrees (used by subagents) contain them. Most source repos ship **no license file** —
check licensing before pushing this repository anywhere public.

| Skills | Source repo | Commit | License |
|---|---|---|---|
| `animate`, `animation-performance`, `animation-vocabulary`, `apple-design`, `break-ui`, `emil-design-eng`, `find-animation-opportunities`, `improve-animations`, `mobile-native`, `remove-animations`, `review-animations` | https://github.com/emilkowalski/skills | `a81dbca07f2217b7103e510c0f13f8d5b017afc9` | none declared |
| `gsap-core`, `gsap-performance`, `gsap-plugins`, `gsap-react`, `gsap-scrolltrigger`, `gsap-timeline`, `gsap-utils` | https://github.com/greensock/gsap-skills | `aed9cfd3277740755f6bfc1155c7aa645403b760` | MIT (per SKILL.md frontmatter) |
| `threejs-*` (13 skills) | https://github.com/CloudAI-X/threejs-skills | `0e181866f095b5f06d005133876e926515390d95` | none declared |
| `baseline-ui`, `improve-ui` | https://github.com/ibelick/ui-skills | `b88b130b87af0570d46692fa9806ccbcbd5afec2` | none declared |
| `impeccable` | https://github.com/pbakaus/impeccable (`.claude/skills/impeccable`) | `2f97a85a4a87a80066a693bd3546b092bd300772` | none declared |

## Notes

- **impeccable** downloads a pinned native engine (`v0.1.18`, `impeccable-windows-x64.exe`) from the
  repo's GitHub releases on first use per session, verified against `scripts/engine-checksums.txt`.
  On Windows run `scripts/impeccable.cmd`. Use only `audit`, `critique`, `polish`; do not run
  `init` or `hooks on` in this project (the design spec is the source of truth).
- **baseline-ui** — use for spacing / typography / layout review only. Its stack and animation rules
  (`motion/react`, "no animation unless requested", "no custom easing") conflict with this
  project's GSAP + Lenis motion system and are not applied.
- Skipped on purpose: `Dammyjay93/interface-design` (its SKILL.md excludes marketing sites),
  `Leonxlnx/taste-skill` (cost, overlaps the chosen direction), Emil's Swift/Expo/Sonner skills.

## Reinstall

```bash
git clone --depth 1 https://github.com/emilkowalski/skills.git && git -C skills checkout a81dbca
# copy the listed skill folders into .claude/skills/ — repeat for each repo above
```
