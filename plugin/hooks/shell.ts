/**
 * What a shell command is doing, from its text, so Bash / PowerShell get the
 * pose of the work rather than always the busy one:
 *
 * - 'writing'   it changes files: a redirect into a file, tee, sed -i, cp/mv/
 *               mkdir…, Set-Content, or a script (heredoc / -c) that writes;
 * - 'searching' it looks for things: grep, rg, find, ls, git status/log/diff…;
 * - 'reading'   it only shows files: cat, head, tail, sed -n, jq…;
 * - 'running'   anything else (builds, tests, installs, git commit, scripts).
 *
 * Writing wins over everything; otherwise one command that runs something
 * makes the whole line 'running' (`npm test | tail` runs a test), and a line
 * of searches and reads is a search. Pure and cheap: called once per call.
 */
export type ShellWork = 'writing' | 'searching' | 'reading' | 'running'

const SEARCH = new Set([
  'grep', 'egrep', 'fgrep', 'rg', 'ag', 'ack', 'find', 'fd', 'ls', 'tree', 'locate', 'which', 'whereis',
  'du', 'df', 'wc', 'codegraph',
  // PowerShell
  'select-string', 'get-childitem', 'gci', 'dir', 'get-command', 'where-object',
])
const READ = new Set([
  'cat', 'head', 'tail', 'less', 'more', 'bat', 'nl', 'jq', 'yq', 'file', 'stat', 'od', 'xxd', 'hexdump', 'strings',
  'diff', 'cmp', 'column', 'sort', 'uniq', 'cut', 'tr', 'awk', 'sed', 'echo', 'printf', 'pwd', 'date', 'realpath',
  'basename', 'dirname', 'readlink', 'shasum', 'sha256sum', 'md5', 'md5sum', 'magick', 'identify',
  // PowerShell
  'get-content', 'gc', 'type', 'select-object', 'format-list', 'format-table', 'write-output', 'write-host',
])
/** Commands that only set up the next one: skipped when finding what a segment runs. */
const PREFIX = new Set(['cd', 'pushd', 'popd', 'sudo', 'time', 'nice', 'env', 'command', 'builtin', 'exec', 'true', ':'])
/** Segments that only set the shell up (set -e, export X=…): ignored. */
const SETUP = new Set(['set', 'export', 'source', '.', 'unset', 'alias', 'setopt', 'shopt', 'trap'])
const WRITE = new Set([
  'tee', 'cp', 'mv', 'rm', 'mkdir', 'rmdir', 'touch', 'ln', 'chmod', 'install', 'patch', 'truncate', 'rsync',
  // PowerShell
  'set-content', 'add-content', 'out-file', 'new-item', 'remove-item', 'copy-item', 'move-item', 'rename-item',
])
/** git subcommands that only look: the rest (commit, push, checkout…) run. */
const GIT_LOOK = new Set(['status', 'log', 'diff', 'show', 'blame', 'grep', 'ls-files', 'branch', 'remote', 'rev-parse', 'describe', 'shortlog', 'reflog', 'count-objects', 'cat-file', 'ls-tree'])
/** A script that writes: Python / Node / Ruby file writes, in a heredoc or -c / -e. */
const SCRIPT_WRITES = /\.write_text\(|\.write_bytes\(|\.write\(|open\([^)\n]{0,200}['"][wax]b?\+?['"]|shutil\.(copy|move)|os\.(replace|rename|remove)|writeFileSync|writeFile\(|File\.write/

/** Longer commands are judged on their start: keeps every regex below cheap on any input. */
const MAX_COMMAND = 8192

export function shellWork(command: string): ShellWork {
  command = command.slice(0, MAX_COMMAND)
  // Heredoc bodies hold scripts or text, not shell: judge them apart.
  const bodies: string[] = []
  let text = command.replace(/<<-?\s*(['"]?)([A-Za-z_][\w]*)\1([^\n]*)\n([\s\S]*?)\n[ \t]*\2[ \t]*(?=\n|$)/g, (_m, _q, _tag, rest: string, body: string) => {
    bodies.push(body)
    return ` ${rest}`
  })
  if (SCRIPT_WRITES.test(bodies.join('\n'))) return 'writing'
  // Quoted strings are arguments (patterns, messages, -c scripts): drop them, but a -c script may write.
  const quoted = text.match(/'[^']*'|"(?:[^"\\]|\\.)*"/g) ?? []
  if (quoted.some(q => SCRIPT_WRITES.test(q)) && /\b(python3?|node|ruby|perl|uv|deno|bun)\b/.test(text)) return 'writing'
  text = text.replace(/'[^']*'|"(?:[^"\\]|\\.)*"/g, '""')

  // A redirect into a file (not 2>&1, not /dev/null).
  for (const m of text.matchAll(/(^|[^\d&<>])(\d?)>>?\s*([^\s&|;<>]+)/g)) {
    const target = m[3] ?? ''
    if (target && !target.startsWith('&') && !/^\/dev\/(null|stderr|stdout|tty)$/.test(target) && target !== '$null') return 'writing'
  }

  let runs = false
  let searches = false
  let reads = false
  for (const segment of text.split(/&&|\|\||[;|\n]/)) {
    const words = segment.trim().split(/\s+/).filter(Boolean)
    if (words[0] !== undefined && SETUP.has(words[0])) continue
    let i = 0
    while (i < words.length && (PREFIX.has(words[i]!) || /^\w+=/.test(words[i]!) || (i > 0 && PREFIX.has(words[i - 1]!) && words[i - 1] === 'cd'))) i++
    if (words[i] === 'timeout') i += 2 // timeout <seconds> <command>
    const word = words[i]
    if (word === undefined) continue
    const cmd = word.replace(/^.*[\\/]/, '').toLowerCase()
    const args = words.slice(i + 1)
    if (cmd === 'sed' && args.some(a => /^-[a-z]*i/.test(a) || a === '--in-place')) return 'writing'
    if (cmd === 'perl' && args.some(a => /^-[a-z]*i/.test(a))) return 'writing'
    if (WRITE.has(cmd)) return 'writing'
    if (cmd === 'git') {
      const sub = args.find(a => !a.startsWith('-'))
      if (sub !== undefined && GIT_LOOK.has(sub)) searches = true
      else runs = true
    } else if (SEARCH.has(cmd)) searches = true
    else if (READ.has(cmd)) reads = true
    else runs = true
  }
  if (runs) return 'running'
  if (searches) return 'searching'
  if (reads) return 'reading'
  return 'running'
}
