import { expect, test } from 'claude-code/testing'
import { shellWork } from '../hooks/shell'

const CASES: [string, ReturnType<typeof shellWork>][] = [
  // writing: redirects, tee, in-place edits, file moves, scripts that write
  ['cat > notes.md <<EOF\nhello > world\nEOF', 'writing'],
  ['echo done >> log.txt', 'writing'],
  ["sed -i '' 's/0.5.1/0.5.2/' plugin/.claude-plugin/plugin.json", 'writing'],
  ['git ls-files | tee files.txt', 'writing'],
  ['mkdir -p out && cp a.png out/', 'writing'],
  ["python3 - <<'EOF'\np='README.md';s=open(p).read()\nopen(p,'w').write(s)\nEOF", 'writing'],
  ["cd repo && python3 - <<'EOF'\nfrom pathlib import Path\nPath('x').write_text('y')\nEOF", 'writing'],
  ['python3 -c "open(\'a\',\'w\').write(\'b\')"', 'writing'],
  ['Set-Content -Path a.txt -Value hi', 'writing'],
  // searching: grep / find / ls / git look commands
  ['grep -rn "stretch\\|redhot" plugin/hooks | head', 'searching'],
  ['cd /repo && git status --short | grep -v image26', 'searching'],
  ['git log --oneline -5', 'searching'],
  ["find . -name '*.png' | wc -l", 'searching'],
  ['ls docs/', 'searching'],
  ['git diff --stat', 'searching'],
  ['git ls-files -z | xargs -0 du -ck 2>/dev/null | tail -1', 'running'], // xargs runs du: a command, not a look
  // reading: only shows files
  ['cat README.md', 'reading'],
  ['sed -n 40,80p plugin/hooks/register.tsx', 'reading'],
  ['head -c 600 frames.ts; echo', 'reading'],
  ['tail -6 plugin/ATTRIBUTION.txt 2>/dev/null', 'reading'],
  // running: builds, tests, installs, commits, scripts that do not write files
  ['npm test 2>&1 | tail -5', 'running'],
  ['claude plugin validate plugin && claude plugin test plugin', 'running'],
  ['git commit -q -m "fix: a > b in the message" && git push -q origin main', 'running'],
  ['uv run --with pillow python tools/build_corrected.py', 'running'],
  ["python3 - <<'EOF'\nimport json\nprint(json.load(open('v.json'))['errors'])\nEOF", 'running'],
  ['set -e; export X=1; make build', 'running'],
  ['timeout 600 uv run python verify.py', 'running'],
  // what each step skips or weighs
  ['', 'running'],
  ['export X=1; cat a.txt', 'reading'],
  ['cd repo && cat a.txt', 'reading'],
  ['FOO=1 sudo cat a.txt', 'reading'],
  ['timeout 30 rg TODO', 'searching'],
  ['git push && git status', 'running'],
  ['git status && cat a.txt', 'searching'],
  ["perl -pi -e 's/a/b/' f.txt", 'writing'],
  ['perl -ne print f.txt', 'running'],
  ['grep x a 2>&1 | head', 'searching'],
]

test('a shell command gets the pose of what it does', () => {
  for (const [command, work] of CASES) {
    expect([command, shellWork(command)]).toEqual([command, work])
  }
})

test('a huge or hostile command is judged quickly', () => {
  const start = Date.now()
  shellWork('cat <<EOF\n' + ' \n'.repeat(200_000))
  shellWork('python3 -c "open(' + '('.repeat(100_000) + '"')
  shellWork('x'.repeat(1_000_000))
  expect(Date.now() - start < 1_000).toBe(true)
})
