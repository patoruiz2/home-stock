import { execSync } from 'node:child_process'
import { cpSync, existsSync, readdirSync, rmSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const tmp = path.join(root, '.gh-pages-tmp')
const dist = path.join(root, 'dist')

function git(args, cwd = root) {
  execSync(`git ${args}`, { cwd, stdio: 'inherit' })
}

if (!existsSync(dist)) {
  throw new Error('dist/ missing. Run pnpm build first.')
}

if (existsSync(tmp)) {
  try {
    git('worktree remove -f .gh-pages-tmp')
  } catch {
    rmSync(tmp, { recursive: true, force: true })
  }
}

git('fetch origin gh-pages')
git('worktree add .gh-pages-tmp origin/gh-pages')

for (const entry of readdirSync(tmp, { withFileTypes: true })) {
  if (entry.name === '.git') continue
  rmSync(path.join(tmp, entry.name), { recursive: true, force: true })
}

for (const entry of readdirSync(dist, { withFileTypes: true })) {
  cpSync(path.join(dist, entry.name), path.join(tmp, entry.name), {
    recursive: true,
  })
}

git('add -A', tmp)
try {
  git('commit -m "Deploy classic GitHub Pages site"', tmp)
} catch {
  console.log('Nothing to commit')
}
git('push origin HEAD:gh-pages', tmp)
git('worktree remove .gh-pages-tmp')
