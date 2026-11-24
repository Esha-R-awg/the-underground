# Spec: Deploy and Polish

Covers milestone **M6**. Depends on all previous milestones.

## Requirements

1. `npm run build` completes without TypeScript errors or Vite build errors.
2. The static output of `apps/web` is deployed to a public URL (Vercel, Netlify, or GitHub Pages — Esha chooses).
3. The public URL loads and works correctly from a different device (not the dev machine).
4. `README.md` at the repo root explains:
   - What The Underground is (one paragraph).
   - How to run it locally (`git clone`, `npm install`, `npm run dev`).
   - How to run the tests (`npm test`).
   - How to run the MCP server.
   - How Kiro was used in the build (links to `docs/kiro-log.md` and the `.kiro` folder).
5. `docs/kiro-log.md` is up to date with an entry for every milestone.
6. `LICENSE` (MIT) is at the repo root and matches the GitHub repo About section.
7. `.kiro` folder is committed and not in `.gitignore`.
8. Demo video is recorded (≤3 minutes, public on YouTube, no copyrighted music) following the script in section 13 of the brief.
9. Devpost submission is drafted with the public URL, video link, and write-up.

## Deployment steps (Vercel, recommended)

```
# From repo root
npm run build        # builds apps/web to apps/web/dist

# Then in Vercel dashboard:
# - New project → import the-underground repo
# - Framework: Vite
# - Root directory: apps/web
# - Build command: npm run build (Vercel runs this in the workspace context)
# - Output directory: apps/web/dist
```

For GitHub Pages: use the `gh-pages` package or a GitHub Actions workflow to publish `apps/web/dist`.

## Final checklist

- [ ] `npm run build` exits 0 with no errors
- [ ] TypeScript strict check clean across all packages (`tsc --noEmit`)
- [ ] Public URL loads from phone or another device
- [ ] README complete
- [ ] `docs/kiro-log.md` complete
- [ ] `LICENSE` present
- [ ] `.kiro` committed, not in `.gitignore`
- [ ] Demo video recorded and URL noted in README / Devpost
- [ ] Devpost draft ready

## Acceptance check (M6 done when)

Public URL works from a different device, README explains setup and Kiro usage, demo video is recorded, Devpost is drafted.
