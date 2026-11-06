import { atom, read, update } from 'claude-code'
import type { Elements, EngineInterface, Register, RenderElement } from 'claude-code'

import type { LayoutMode, Prefs, RecentCall, RenderMode, SetName, View } from '../types'
import { SET as CLASSIC } from './frames-classic'
import { EXTRA } from './frames-extra'
import { SET as SMOOTH } from './frames-smooth'
import { pickState, type Flags } from './mood'
import {
  makeCellCache,
  spriteRows,
  type AnimName,
  type ExtraName,
  type SheetSet,
  type SizeName,
  type SpriteSet,
  type StateFrames,
  type StateName,
} from './sprite'

// ─── constants ──────────────────────────────────────────────────────────────

const PANE = 'chibi'
const PANE_TITLE = 'Claude ちゃん'
const PANE_COLUMNS = 52
// Theme: a warm "café" dark palette taken from her own colours (hair orange,
// cream dress, brown book). Every text/background pair is >= 5.5:1 (WCAG AA),
// and every state is told by icon + words, never by colour alone.
const THEME = {
  surface: '#1C1714', // the panel itself
  stage: '#26201B', // the backdrop she stands on
  bubble: '#33261E', // the speech bubble
  text: '#F3E5D3', // cream
  muted: '#B9A48F', // secondary text
  accent: '#F08A4B', // her hair
  ok: '#9CC98A',
  err: '#F07E6E',
  info: '#8FC1E3',
  amber: '#F2C35B',
  onChip: '#1C1714', // text on a coloured chip
}
const hex = (c: string) => parseInt(c.slice(1), 16)
/**
 * A colour as a Raster paints it: the engine draws Raster cells in 4 bits a
 * channel (each to the nearest multiple of 0x11), so a Box behind cells takes
 * the same colour or shows a seam around them. Pictures and text keep 24 bits.
 */
const cellColor = (c: string) =>
  '#' + [1, 3, 5].map(i => (Math.round(parseInt(c.slice(i, i + 2), 16) / 17) * 17).toString(16).padStart(2, '0')).join('')
const ACCENT = THEME.accent
/** Each state's chip colour. */
const CHIP: Record<StateName, string> = {
  idle: THEME.muted,
  waving: THEME.accent,
  jumping: THEME.accent,
  running: THEME.amber,
  'running-left': THEME.amber,
  'running-right': THEME.amber,
  waiting: THEME.info,
  failed: THEME.err,
  review: THEME.ok,
  angry: THEME.err,
}
const DOZE_AFTER_MS = 2 * 60_000 // idle this long: she dozes off (a yawn, then sleep)
const WALK_EVERY_MS = 40_000 // while working, a stroll across the band this often
const SWAMPED_AT = 30 // tool calls in one turn: she strolls under a pile of books
const DIZZY_AT = 3 // failed tool calls in one turn: she is dizzy
const LONG_TURN_MS = 3 * 60_000 // a turn this long ends in 'happy-2' rather than 'proud'
const EXTRA_REPEAT = 2 // a shared action plays its slower loop twice as a one-shot
const IDLE_BASE_LOOPS = 2 // 'idle-1' loops between two of the rotation's others
/** What the idle rotation picks from after 'idle-1', with weights; 'idle' is the set's own. */
const IDLE_ROTATION: { anim: AnimName; weight: number; loops: number }[] = [
  { anim: 'idle', weight: 2, loops: 1 },
  { anim: 'idle-2', weight: 2, loops: 1 },
  { anim: 'idle-3', weight: 2, loops: 1 },
  { anim: 'idle-blink', weight: 2, loops: 1 },
  { anim: 'hum', weight: 2, loops: 2 },
  { anim: 'clawd', weight: 1, loops: 2 },
]
/** The pose each tool puts her in; a tool not named keeps the set's 'running'. Bash alternates busy_left / busy_right. */
const TOOL_ANIM: Record<string, AnimName> = {
  Read: 'running',
  Grep: 'searching',
  Glob: 'searching',
  WebSearch: 'searching',
  WebFetch: 'searching',
  Edit: 'writing',
  MultiEdit: 'writing',
  Write: 'writing',
  NotebookEdit: 'writing',
  Agent: 'delegating',
  Task: 'delegating',
}
/** Poses that mean she is working: the band's stroll starts from these. */
const WORK_ANIMS = new Set<AnimName>(['running', 'thinking', 'searching', 'writing', 'busy_left', 'busy_right', 'delegating', 'tired'])
const WALK_MAX = 16 // columns of room the stroll may use
const BUBBLE_MIN = 30 // columns the band keeps for the speech bubble
// A picture scales to the room it has: the band takes this share of the
// terminal's rows (within the bounds); in the dock it takes at most these
// shares of the pane's width and height, and keeps rows for the chip,
// bubble, stats and a few recent calls.
// The band's rows count its frame; the cap keeps it well under what a
// 46-row pane used to give it (14 rows): 7 rows inside the frame.
const BAND_ROWS_SHARE = 0.3
const BAND_ROWS_MIN = 5
const BAND_ROWS_MAX = 9
const BAND_FRAME = 2 // the band's rounded frame: a row above and below, a column each side
const DOCK_WIDTH_SHARE = 0.6
const DOCK_ROWS_SHARE = 0.4
const DOCK_TEXT_ROWS = 8 // name (2) · bubble (3) · stats (1) · recent heading (2)
const DOCK_RECENT_MIN = 4
const IMAGE_ROWS_MIN = 5 // below this the band draws its mini row: a small face beside one line
const MINI_ROWS_MIN = 2
const PANE_POLL_MS = 1_000
const DOCK_MIN_COLUMNS = 110 // the fullscreen layout docks a pane from this width
// Every blit moves the terminal's cursor away and back, which reads as a
// flickering caret: faster states skip frames to draw at most this often.
const MIN_FRAME_MS = 240
const REPEAT = 3 // one-shot states play three loops, as in the Codex app
// A click on her plays one reaction; this many inside the window and she gets cross.
const POKE_WINDOW_MS = 4_000
const POKE_ANGRY_AT = 3
const POKE_MIN_MS = 1_500
const POKES: { anim: AnimName; text: string }[] = [
  { anim: 'surprised', text: '嗨～找我嗎？' },
  { anim: 'pat-2', text: '嘿嘿，被你發現了！' },
  { anim: 'coaxed', text: '在看什麼呢？我也要看' },
  { anim: 'hum', text: '……要我做什麼嗎？' },
]
const POKE_WARNING = '唔…別一直戳啦'
const WAKE_LINE = '啊…被你看到我在打瞌睡了！'
const ANGRY_LINES = ['生氣了！不准再戳了！', '哼！', '還戳！', '不理你了啦！']

const TITLE: Record<StateName, string> = {
  idle: '待命中',
  waving: '你好！',
  jumping: '收到！',
  running: '工作中',
  'running-left': '工作中',
  'running-right': '工作中',
  waiting: '等你決定',
  failed: '出錯了',
  review: '完成了',
  angry: '生氣了',
}
const ICON: Record<StateName, string> = {
  idle: '✿',
  waving: '♪',
  jumping: '!',
  running: '✎',
  'running-left': '✎',
  'running-right': '✎',
  waiting: '?',
  failed: '✗',
  review: '✓',
  angry: '#',
}
/** Each shared action's chip: the state whose colour and icon it takes, and its own words. */
const EXTRA_LOOK: Record<ExtraName, { as: StateName; title: string }> = {
  'idle-1': { as: 'idle', title: '待命中' },
  'idle-2': { as: 'idle', title: '待命中' },
  'idle-3': { as: 'idle', title: '待命中' },
  'idle-blink': { as: 'idle', title: '待命中' },
  hum: { as: 'idle', title: '哼歌中' },
  clawd: { as: 'idle', title: '待命中' },
  yawn: { as: 'idle', title: '打瞌睡' },
  'sleeping-2': { as: 'idle', title: '打瞌睡' },
  stretch: { as: 'jumping', title: '醒來了' },
  surprised: { as: 'waving', title: '你好！' },
  'pat-2': { as: 'waving', title: '你好！' },
  coaxed: { as: 'waving', title: '你好！' },
  redhot: { as: 'jumping', title: '醒來了' },
  annoyed: { as: 'angry', title: '別戳了' },
  forgiven: { as: 'review', title: '原諒你了' },
  thinking: { as: 'running', title: '思考中' },
  searching: { as: 'running', title: '搜尋中' },
  writing: { as: 'running', title: '寫入中' },
  busy_left: { as: 'running', title: '執行中' },
  busy_right: { as: 'running', title: '執行中' },
  delegating: { as: 'running', title: '派工中' },
  swamped_left: { as: 'running', title: '工作中' },
  swamped_right: { as: 'running', title: '工作中' },
  tired: { as: 'running', title: '有點累了' },
  listening: { as: 'jumping', title: '收到！' },
  proud: { as: 'review', title: '完成了' },
  'happy-2': { as: 'review', title: '完成了' },
  oops: { as: 'failed', title: '失敗了' },
  sulk: { as: 'failed', title: '被拒絕了' },
  dizzy: { as: 'failed', title: '頭暈了' },
  sorry: { as: 'failed', title: '被打斷了' },
  compact: { as: 'running', title: '整理中' },
}
/** An animation's chip: colour, icon and words. */
function lookOf(anim: AnimName): { chip: string; icon: string; title: string } {
  const extra = EXTRA_LOOK[anim as ExtraName]
  const as = extra?.as ?? (anim as StateName)
  return { chip: CHIP[as], icon: ICON[as], title: extra?.title ?? TITLE[as] }
}

/**
 * Each shared action's frame times. image26 times every frame 120 ms; the
 * mod slows them so no frame is skipped (MIN_FRAME_MS) and the quiet ones
 * read as quiet: the idle poses hold their open eyes and blink quickly.
 */
const EVEN = (ms: number) => (n: number) => Array<number>(n).fill(ms)
const EXTRA_TIMING: Partial<Record<ExtraName, (n: number) => number[]>> = {
  'idle-1': () => [1000, 400, 240, 240, 240, 1000], // open, open, half, shut, half, open
  'idle-2': () => [1000, 400, 240, 240, 240, 1000],
  'idle-3': () => [1000, 400, 240, 240, 240, 1000],
  'idle-blink': () => [240, 240, 1300, 1000, 240, 240], // shut at both ends
  hum: EVEN(320),
  clawd: EVEN(320),
  yawn: EVEN(320),
  'sleeping-2': EVEN(900),
}
const SETS: Record<SetName, SpriteSet> = { smooth: withExtras(withAngry(SMOOTH)), classic: withExtras(withAngry(CLASSIC)) }

// ─── state the drawings read ($.state: survives a hot reload) ───────────────

const INITIAL_VIEW: View = {
  state: 'idle',
  bubble: '待命中',
  tools: 0,
  lastTurnSeconds: null,
  isDozing: false,
  isBandOpen: true,
  recent: [],
}
const view = atom({ plugin: 'claudechan-chibi', key: 'view' } as const, INITIAL_VIEW, { shape: 'view-1' })
const DEFAULT_PREFS: Prefs = { mode: 'auto', set: 'smooth', render: 'auto' }
const prefs = atom({ plugin: 'claudechan-chibi', key: 'prefs' } as const, DEFAULT_PREFS, { shape: 'prefs-2' })
const paneShown = atom({ plugin: 'claudechan-chibi', key: 'paneShown' } as const, false)
/** Set once this terminal drew an Image's alt instead of its picture. */
const imageFailed = atom({ plugin: 'claudechan-chibi', key: 'imageFailed' } as const, false)

// ─── module state (animation bookkeeping; starts over on reload) ────────────

/** Where a sprite is mounted: a Raster of cells, or an Image of PNG frames. */
type Site = { kind: 'cells' | 'image'; requestId: string; size: SizeName; width: number; rows: number; fill: number }

let flags: Flags = {
  now: 0,
  isWorking: false,
  turnStartedAt: 0,
  workAnim: 'thinking',
  isWaiting: false,
  greetUntil: 0,
  wakeUntil: 0,
  ackUntil: 0,
  failedUntil: 0,
  failedAnim: 'failed',
  compactUntil: 0,
  reviewUntil: 0,
  reviewAnim: 'proud',
  pokeUntil: 0,
  pokeAnim: 'surprised',
  angryUntil: 0,
  forgivenUntil: 0,
}
let lastActivity = 0
/** This turn's tool calls and failed ones (main loop only), and which way Bash's busy pose faces next. */
let turnTools = 0
let turnFailures = 0
let busyRight = false
/** The idle rotation: what plays and how many loops of it are left. */
let idleAnim: AnimName = 'idle-1'
let idleLoopsLeft = IDLE_BASE_LOOPS
/** When the doze began: a yawn first, then sleep. */
let dozeStartedAt = 0
/** Clicks on her, recent first out: too many inside POKE_WINDOW_MS and she gets cross. */
let pokes: number[] = []
let pokeTurn = 0
/** The bubble a click replaced, and what the click said: put back once she calms down. */
let bubbleBeforePoke: string | null = null
let pokeBubble = ''
let turnStartedAt = 0
/** What pickState chose; 'idle' is drawn as `idleAnim` or the doze (see animNow). */
let shown: AnimName = 'idle'
/** The animation the last blit drew: a change restarts it at its first frame. */
let drawn: AnimName = 'idle-1'
let frame = 0
let stride = 1 // frames each blit moves on
let isDozing = false
/** The stroll: from her resting place in the middle to the right end, the left end, and back. */
let walk: { dir: 1 | -1; offset: number; room: number; hasTurned: boolean } | null = null
let lastWalkAt = 0
let lastPanePoll = 0
let activeSet: SpriteSet = SETS.smooth
let mode: LayoutMode = 'auto'
let renderPref: RenderMode = 'auto'
let imageBroken = false
let timer: { cancel: () => void } | null = null
let clockGen = 0
/** Whether the screen docks a pane at the side, as last measured; undefined before. */
let canDock: boolean | undefined
/** Set when the pane docked while the band was asked for: the clock closes it. */
let isDockedInBand = false
const sites: { pane?: Site; band?: Site } = {}
const cellsOf = makeCellCache()
const pngCache = new Map<string, string | null>()
const PNG_CACHE_MAX = 300 // frames kept as base64: a few states at both sizes

// ─── helpers ────────────────────────────────────────────────────────────────

type $T = EngineInterface

/**
 * The set with 'angry' sure to be there: tools/build_corrected.py writes its
 * cells from the angry PNGs; a set built without them pouts with the
 * 'failed' cells instead.
 */
function withAngry(set: SheetSet): BaseSet {
  if (set.states.angry) return { ...set, states: { ...set.states, angry: set.states.angry } }
  const durations = [...Array(7).fill(120), 240]
  const { big, small } = set.states.failed
  const sample = (frames: string[]) => durations.map((_, i) => frames[Math.floor(i * frames.length / durations.length)]!)
  return { ...set, states: { ...set.states, angry: { big: sample(big), small: sample(small), durations } } }
}

/** A set's own states, 'angry' included, before the shared actions join it. */
type BaseSet = Omit<SpriteSet, 'states'> & { states: Record<StateName, StateFrames> }

/** The set with the shared image26 actions added, in their own palette and assets folder. */
function withExtras(set: BaseSet): SpriteSet {
  const states = { ...set.states } as Record<AnimName, StateFrames>
  for (const [name, f] of Object.entries(EXTRA.states) as [ExtraName, { big: string[]; small: string[] }][]) {
    const durations = (EXTRA_TIMING[name] ?? EVEN(240))(f.big.length)
    states[name] = { ...f, durations, palette: EXTRA.palette, dir: 'extra' } satisfies StateFrames
  }
  return { ...set, states }
}

const isExtra = (anim: AnimName) => anim in EXTRA.states

/** One loop of an animation, in ms. */
function loopMs(anim: AnimName): number {
  return SETS.smooth.states[anim].durations.reduce((a, b) => a + b, 0)
}

/** How long a one-shot plays: three loops of a set's state, two of a (slower) shared action. */
function oneShotMs(anim: AnimName): number {
  return loopMs(anim) * (isExtra(anim) ? EXTRA_REPEAT : REPEAT)
}

/** A click on her: the next reaction in turn, a blush if she was caught dozing, or anger when the clicks come too fast. */
async function poke($: $T) {
  const now = await $.clock.now()
  lastActivity = now
  pokes = [...pokes.filter(t => now - t < POKE_WINDOW_MS), now]
  const isPoked = flags.pokeUntil > now || flags.angryUntil > now
  if (!isPoked) bubbleBeforePoke = (await read($, view)).bubble
  let bubble: string
  if (flags.angryUntil > now || pokes.length >= POKE_ANGRY_AT) {
    const isNew = flags.angryUntil <= now
    const angryUntil = now + oneShotMs('angry')
    flags = { ...flags, now, angryUntil, forgivenUntil: angryUntil + loopMs('forgiven'), pokeUntil: 0 }
    bubble = (isNew ? ANGRY_LINES[0] : ANGRY_LINES[1 + (pokes.length % (ANGRY_LINES.length - 1))]) ?? '哼！'
  } else if (isDozing) {
    flags = { ...flags, now, pokeAnim: 'redhot', pokeUntil: now + Math.max(POKE_MIN_MS, loopMs('redhot')) }
    bubble = WAKE_LINE
  } else if (pokes.length === POKE_ANGRY_AT - 1) {
    flags = { ...flags, now, pokeAnim: 'annoyed', pokeUntil: now + Math.max(POKE_MIN_MS, loopMs('annoyed')) }
    bubble = POKE_WARNING
  } else {
    const r = POKES[pokeTurn++ % POKES.length] ?? { anim: 'surprised' as const, text: '嗨～' }
    flags = { ...flags, now, pokeAnim: r.anim, pokeUntil: now + Math.max(POKE_MIN_MS, loopMs(r.anim)) }
    bubble = r.text
  }
  pokeBubble = bubble
  await setView($, { bubble, isDozing: false })
  await wake($)
}

/** Whether a pane opened on this screen docks at the side rather than sitting above the prompt. */
function dockable(isFullscreen: boolean | undefined, columns: number | undefined): boolean {
  return isFullscreen !== false && (columns ?? DOCK_MIN_COLUMNS) >= DOCK_MIN_COLUMNS
}

function fmtSeconds(s: number): string {
  return s < 60 ? `${s}s` : `${Math.floor(s / 60)}m${String(s % 60).padStart(2, '0')}s`
}

function baseName(p: unknown): string {
  return typeof p === 'string' ? (p.split(/[\\/]/).pop() ?? p) : ''
}

function clip(text: string, n: number): string {
  const one = text.replace(/\s+/g, ' ').trim()
  return one.length > n ? one.slice(0, n - 1) + '…' : one
}

/** Her pose while a tool runs: TOOL_ANIM, Bash's busy pose facing the other way each time. */
function toolAnim(tool: string): AnimName {
  if (tool === 'Bash' || tool === 'PowerShell') {
    busyRight = !busyRight
    return busyRight ? 'busy_right' : 'busy_left'
  }
  return TOOL_ANIM[tool] ?? 'running'
}

function describeTool(tool: string, e: Record<string, unknown>): { verb: string; target: string } {
  switch (tool) {
    case 'Read':
      return { verb: '正在讀', target: baseName(e.file_path) }
    case 'Edit':
    case 'MultiEdit':
      return { verb: '正在改', target: baseName(e.file_path) }
    case 'Write':
      return { verb: '正在寫', target: baseName(e.file_path) }
    case 'NotebookEdit':
      return { verb: '正在改', target: baseName(e.notebook_path) }
    case 'Grep':
    case 'Glob':
      return { verb: '正在找', target: clip(String(e.pattern ?? ''), 24) }
    case 'Bash':
    case 'PowerShell':
      return { verb: '正在執行', target: clip(String(e.description ?? e.command ?? ''), 28) }
    case 'WebSearch':
      return { verb: '正在搜尋', target: clip(String(e.query ?? ''), 24) }
    case 'WebFetch':
      return { verb: '正在讀網頁', target: clip(String(e.url ?? ''), 24) }
    case 'Agent':
    case 'Task':
      return { verb: '派出助手', target: clip(String(e.description ?? ''), 24) }
    case 'AskUserQuestion':
      return { verb: '有問題想問你', target: '' }
    case 'ExitPlanMode':
      return { verb: '計畫好了，請確認', target: '' }
    default:
      return { verb: '使用', target: tool.replace(/^mcp__/, '') }
  }
}

function normalizePrefs(raw: unknown): Prefs {
  const r = (raw ?? {}) as Partial<Prefs>
  const modes: LayoutMode[] = ['auto', 'pane', 'band', 'off']
  const renders: RenderMode[] = ['auto', 'image', 'cells']
  return {
    mode: modes.includes(r.mode as LayoutMode) ? (r.mode as LayoutMode) : 'auto',
    set: r.set === 'classic' ? 'classic' : 'smooth',
    render: renders.includes(r.render as RenderMode) ? (r.render as RenderMode) : 'auto',
  }
}

/**
 * What stands between this terminal and the docked, true-colour companion:
 * inside tmux Claude Code lowers colours to 256 (her warm browns turn grey)
 * and keeps the main-screen layout, where a pane cannot dock at the side.
 */
async function screenHints($: $T, isFullscreen: boolean): Promise<string[]> {
  const hints: string[] = []
  const inTmux = (await $.env.get('TMUX')) !== undefined
  if (inTmux && (await $.env.get('CLAUDE_CODE_TMUX_TRUECOLOR')) === undefined)
    hints.push('⚠ 在 tmux 裡 Claude Code 只用 256 色，配色會偏灰：在 ~/.claude/settings.json 的 "env" 加 "CLAUDE_CODE_TMUX_TRUECOLOR": "1" 後重開')
  if (!isFullscreen)
    hints.push(
      `⚠ 目前不是 fullscreen 畫面${inTmux ? '（tmux 預設如此）' : ''}，面板無法停靠在右側：執行 /tui fullscreen，或在 "env" 加 "CLAUDE_CODE_NO_FLICKER": "1" 後重開`,
    )
  return hints
}

/**
 * The pane as opened: docked it is PANE_COLUMNS wide; seated inline above the
 * prompt it asks for as many rows as the band takes, so both look alike
 * (cells ask for the bust's rows plus two, so it is not cut off).
 */
function paneArgs() {
  // A picture takes the band's cap (frame included); cells keep their one size.
  const rows = wantsImage()
    ? BAND_ROWS_MAX - BAND_FRAME
    : Math.max(activeSet.imageSizes.small.rows, spriteRows(activeSet, 'small')) + 2
  // 'transparent', not a colour: a colour stops at the body, and the rows the
  // engine draws around it (the title with ×, the foot) keep its grey sidebar
  // backdrop. Transparent drops that fill; the body paints its own surface.
  return { id: PANE, title: PANE_TITLE, columns: PANE_COLUMNS, rows, backgroundColor: 'transparent' }
}

const kindLabel = (site?: Site) => (site === undefined ? '未顯示' : site.kind === 'image' ? '原圖' : '字元')

/** Real pixels unless the person chose cells, or this terminal showed it cannot draw them. */
function wantsImage(): boolean {
  return renderPref === 'image' || (renderPref === 'auto' && !imageBroken)
}

/** One PNG frame of the plugin's own, as base64; null where it cannot be read. */
async function loadPng($: $T, set: SpriteSet, state: AnimName, f: number, size: SizeName): Promise<string | null> {
  const frames = set.states[state]
  const n = frames.big.length
  // The band ('small') shows a head-and-shoulders crop; the pane the full figure.
  const path = `${$.plugin.root}/assets/${frames.dir ?? set.name}/${state}/${f % n}${size === 'small' ? '-bust' : ''}.png`
  if (pngCache.has(path)) return pngCache.get(path) ?? null
  let png: string | null = null
  try {
    png = (await $.fs.read(path, { as: 'bytes' })).base64
  } catch {
    png = null
  }
  if (pngCache.size > PNG_CACHE_MAX) pngCache.clear() // 400+ shared frames: keep the long-lived process small
  pngCache.set(path, png)
  return png
}

type SpriteElements = Pick<Elements['terminal'], 'Raster' | 'Image'>

/** The largest box of cells within `maxColumns` x `maxRows` that keeps the picture's aspect. */
/** The backdrop behind a site's sprite: the stage, as the Raster paints it where the sprite is cells. */
function stageOf(slot: 'pane' | 'band'): string {
  return sites[slot]?.kind === 'cells' ? cellColor(THEME.stage) : THEME.stage
}

function imageBox(size: SizeName, maxColumns: number, maxRows: number): { columns: number; rows: number } {
  const base = activeSet.imageSizes[size]
  const perRow = base.columns / base.rows // columns per row of the picture
  const rows = Math.max(1, Math.min(255, Math.floor(maxRows), Math.floor(maxColumns / perRow)))
  return { columns: Math.max(1, Math.min(255, Math.round(rows * perRow))), rows }
}

/**
 * The sprite of one site: an Image of the PNG frame where the terminal draws
 * pictures, sized to `room`, else a Raster of quadrant cells (fixed sizes).
 * Records the site for the clock.
 */
async function drawSprite(
  $: $T,
  els: SpriteElements,
  slot: 'pane' | 'band',
  requestId: string,
  size: SizeName,
  width: number,
  state: AnimName,
  offset: number,
  room: { columns: number; rows: number },
) {
  const { Raster, Image } = els
  if (wantsImage()) {
    const png = await loadPng($, activeSet, state, frame, size)
    if (png !== null) {
      const { columns, rows } = imageBox(size, room.columns, room.rows)
      sites[slot] = { kind: 'image', requestId, size, width: columns, rows, fill: hex(THEME.stage) }
      const alt = renderPref === 'image' ? 'Claude ちゃん（這個終端機不支援圖片）' : ' '
      return <Image key="sprite" source={{ png }} columns={columns} rows={rows} alt={alt} />
    }
  }
  const rows = spriteRows(activeSet, size)
  const fill = hex(cellColor(THEME.stage))
  sites[slot] = { kind: 'cells', requestId, size, width, rows, fill }
  const cells = cellsOf(activeSet, state, size, frame, width, offset, fill)
  return <Raster key="sprite" columns={width} rows={rows} cells={cells} />
}

async function setView($: $T, patch: Partial<View>) {
  await update($, view, v => ({ ...v, ...patch }))
}

/** What the band draws right now: the walk overrides the mood while it lasts. */
function bandSprite(room: number): { state: AnimName; offset: number } {
  if (walk) return { state: walkAnim(walk.dir), offset: Math.min(walk.offset, room) }
  return { state: animNow(), offset: restOffset(room) }
}

/** The stroll's frames: a pile of books on a busy turn. */
function walkAnim(dir: 1 | -1): AnimName {
  if (turnTools >= SWAMPED_AT) return dir > 0 ? 'swamped_right' : 'swamped_left'
  return dir > 0 ? 'running-right' : 'running-left'
}

/** What she plays now, the stroll aside: 'idle' is the rotation's pose, or the doze's. */
function animNow(): AnimName {
  if (shown !== 'idle') return shown
  if (!isDozing) return idleAnim
  return flags.now - dozeStartedAt < loopMs('yawn') ? 'yawn' : 'sleeping-2'
}

/** Cells keep room beside her for the stroll: at rest she stands in the middle of it. */
const restOffset = (room: number) => Math.floor(room / 2)

// ─── the animation clock ────────────────────────────────────────────────────

function nextDelay(): number {
  const state = walk ? walkAnim(walk.dir) : animNow()
  const d = activeSet.states[state].durations
  const ms = d[frame % d.length] ?? 150
  stride = state !== 'failed' && ms < MIN_FRAME_MS ? Math.round(MIN_FRAME_MS / ms) : 1
  return ms * stride
}

async function blitAll($: $T) {
  const f = frame
  for (const name of ['pane', 'band'] as const) {
    const site = sites[name]
    if (!site) continue
    const { state, offset } = name === 'band' && site.kind === 'cells' ? bandSprite(site.width - activeSet.sizes[site.size].columns) : { state: animNow(), offset: 0 }
    const where = { requestId: site.requestId, key: 'sprite', columns: site.width, rows: site.rows }
    let r
    if (site.kind === 'image') {
      const png = await loadPng($, activeSet, state, f, site.size)
      if (png === null) continue
      r = await $.ui.blit({ ...where, source: { png } })
    } else {
      r = await $.ui.blit({ ...where, cells: cellsOf(activeSet, state, site.size, f, site.width, offset, site.fill) })
    }
    if (r.deny === undefined) continue
    sites[name] = undefined
    if (site.kind === 'image' && /alt/i.test(r.deny) && renderPref === 'auto') {
      // This terminal draws the alt text, not pictures: fall back to cells.
      imageBroken = true
      await update($, imageFailed, () => true)
    }
  }
}

async function tick($: $T) {
  const now = await $.clock.now()
  flags = { ...flags, now }

  const want = pickState(flags)
  const dozing = want === 'idle' && now - lastActivity > DOZE_AFTER_MS

  if (now - lastPanePoll >= PANE_POLL_MS) {
    lastPanePoll = now
    if (isDockedInBand) {
      // The band was asked for: a docked pane gives the room back to it.
      isDockedInBand = false
      if (mode === 'band') await $.ui.close({ id: PANE })
    }
    const panes = await $.ui.panes()
    const isUp = panes.some(p => p.id === PANE && p.isPlaced && p.isShown)
    if (isUp !== (await read($, paneShown))) await update($, paneShown, () => isUp)
  }

  if (want !== shown || dozing !== isDozing) {
    const changedMood = want !== shown
    if (dozing && !isDozing) dozeStartedAt = now
    if (changedMood && want === 'idle') {
      idleAnim = 'idle-1'
      idleLoopsLeft = IDLE_BASE_LOOPS
    }
    const isCalm = flags.pokeUntil <= now && flags.angryUntil <= now
    if (changedMood && isCalm && bubbleBeforePoke !== null) {
      // Back to what she was saying, unless something new was said meanwhile.
      if ((await read($, view)).bubble === pokeBubble) await setView($, { bubble: bubbleBeforePoke })
      bubbleBeforePoke = null
      pokes = []
    }
    shown = want
    isDozing = dozing
    frame = 0
    if (changedMood) walk = null
    drawn = animNow()
    await setView($, { state: want, isDozing: dozing, ...(dozing ? { bubble: 'zzz…' } : {}) })
    if (mode === 'off') $.ui.status(`${lookOf(want).icon} Claude ちゃん：${dozing ? '打瞌睡' : lookOf(want).title}`)
    return // the redraw paints this frame
  }

  // A stroll across the band now and then while she works.
  const band = sites.band
  if (walk) {
    walk.offset += walk.dir
    if (walk.offset >= walk.room) walk.dir = -1
    if (walk.offset <= 0) {
      walk.dir = 1
      walk.hasTurned = true
    }
    if (walk.hasTurned && walk.dir > 0 && walk.offset >= restOffset(walk.room)) {
      walk = null // back in the middle
      lastWalkAt = now
    }
  } else if (flags.isWorking && WORK_ANIMS.has(shown) && band?.kind === 'cells' && band.width - activeSet.sizes.small.columns >= 8) {
    if (lastWalkAt === 0) lastWalkAt = now
    if (now - lastWalkAt > WALK_EVERY_MS) {
      const room = band.width - activeSet.sizes.small.columns
      walk = { dir: 1, offset: restOffset(room), room, hasTurned: false }
    }
  }

  frame += stride
  if (shown === 'idle' && !isDozing) {
    // The rotation: 'idle-1' a few loops, then one of the others, then back.
    const n = activeSet.states[idleAnim].big.length
    if (frame >= n) {
      frame %= n
      if (--idleLoopsLeft <= 0) {
        const next = idleAnim === 'idle-1' ? pickIdle() : { anim: 'idle-1' as AnimName, loops: IDLE_BASE_LOOPS }
        idleAnim = next.anim
        idleLoopsLeft = next.loops
        frame = 0
      }
    }
  }
  // A new animation without a new mood (the yawn turning to sleep, the rotation) starts at its first frame.
  const anim = walk ? walkAnim(walk.dir) : animNow()
  if (anim !== drawn) {
    drawn = anim
    if (!walk) frame = 0
  }
  await blitAll($)
}

/** The next pose of the idle rotation, by weight. */
function pickIdle(): { anim: AnimName; loops: number } {
  const total = IDLE_ROTATION.reduce((a, r) => a + r.weight, 0)
  let at = Math.random() * total
  for (const r of IDLE_ROTATION) {
    at -= r.weight
    if (at < 0) return r
  }
  return IDLE_ROTATION[0]!
}

function startClock($: $T) {
  timer?.cancel()
  const gen = ++clockGen // a restarted clock leaves the old loop to end
  const step = async () => {
    try {
      await tick($)
    } catch {
      // a lost frame is fine; the next tick draws again
    }
    if (gen !== clockGen) return
    timer = $.clock.after(nextDelay(), () => void step())
  }
  void step()
}

/**
 * Draw a change of mood now rather than at the next tick: asleep the clock
 * waits a slow sleeping frame, and an idle pose holds its open eyes a second.
 */
async function wake($: $T) {
  if (timer === null) return
  const now = await $.clock.now()
  if (isDozing || pickState({ ...flags, now }) !== shown) startClock($)
}

// ─── hooks ──────────────────────────────────────────────────────────────────

// A mascot must never stand in the way: if one of its hooks throws, the
// event goes on as if the mod were not there (next(e) replays a call that
// already ran rather than running it twice).
const passThrough = <E, R>(_$: unknown, e: E, next: (e: E) => R): R => next(e)

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    const started = await next(e)
    if (!e.isInteractive) return started

    await $.command.register({
      name: 'chibi',
      description: 'Claude ちゃん：auto | pane | band | off，set smooth | classic，render auto | image | cells',
      argumentHint: '[auto|pane|band|off|set <smooth|classic>|render <auto|image|cells>]',
      immediate: true,
    })

    const p = normalizePrefs(await $.store.get('prefs'))
    await update($, prefs, () => p)
    mode = p.mode
    activeSet = SETS[p.set]
    renderPref = p.render
    imageBroken = await read($, imageFailed)

    const now = await $.clock.now()
    lastActivity = now
    flags = { ...flags, now, greetUntil: now + oneShotMs('waving') }
    await setView($, { bubble: '嗨！今天要做什麼？', isBandOpen: true })

    if (p.mode === 'auto' || p.mode === 'pane') void $.ui.open(paneArgs())
    startClock($)
    return started
  })

  on('prompt.submit', async ($, e, next) => {
    if (e.command || e.isMeta) return next(e)
    const now = await $.clock.now()
    lastActivity = now
    // Caught dozing she blushes first, then listens.
    const wakeUntil = isDozing ? now + loopMs('redhot') : 0
    flags = { ...flags, wakeUntil, ackUntil: Math.max(now, wakeUntil) + oneShotMs('listening'), failedUntil: 0, reviewUntil: 0 }
    await setView($, { bubble: '收到！馬上開始', isDozing: false })
    await wake($)
    // A pane opened unasked waits below the dock's width; opened now, at the
    // person's prompt, it is placed at any width: framed above the prompt on a
    // narrow screen, which reads better than the band. The band mode takes
    // that framed pane too, where it cannot dock.
    if (mode === 'auto' || mode === 'pane' || (mode === 'band' && canDock === false)) {
      const panes = await $.ui.panes()
      if (!panes.some(p => p.id === PANE && p.isPlaced)) void $.ui.open(paneArgs())
    }
    return next(e)
  }).catch(passThrough)

  on('turn.start', async ($, e, next) => {
    if (e.agentId !== undefined) return next(e)
    const now = await $.clock.now()
    lastActivity = now
    turnStartedAt = now
    turnTools = 0
    turnFailures = 0
    flags = { ...flags, isWorking: true, turnStartedAt: now, workAnim: 'thinking' }
    await wake($)
    await setView($, { tools: 0 })
    return next(e)
  })

  on('classic.PermissionRequest', async ($, e, next) => {
    flags = { ...flags, isWaiting: true }
    lastActivity = await $.clock.now()
    await setView($, { bubble: `想用 ${e.tool_name}，可以嗎？` })
    await wake($)
    return next(e)
  }).catch(passThrough)

  on('tool.call', async ($, e, next) => {
    const fields = e as unknown as Record<string, unknown>
    if (typeof fields.agentId === 'string') return next(e) // a subagent's call: leave the main mood alone

    const tool = String(e.tool)
    const { verb, target } = describeTool(tool, fields)
    const asksPerson = tool === 'AskUserQuestion' || tool === 'ExitPlanMode'
    const id = e.tool_use_id ?? `${tool}:${await $.clock.now()}`
    lastActivity = await $.clock.now()
    turnTools += 1
    if (asksPerson) flags = { ...flags, isWaiting: true }
    else flags = { ...flags, workAnim: toolAnim(tool) }
    await update($, view, v => ({
      ...v,
      bubble: target ? `${verb} ${target}…` : `${verb}…`,
      tools: v.tools + 1,
      recent: [...v.recent, { id, tool, target, isOk: null } as RecentCall].slice(-8),
    }))
    await wake($) // a new pose, or the dialog

    const result = await next(e)

    const now = await $.clock.now()
    lastActivity = now
    const isDenied = result.deny !== undefined
    const isFailed = isDenied || result.isError === true
    if (isFailed) {
      if (!isDenied) turnFailures += 1
      const failedAnim: AnimName = isDenied ? 'sulk' : turnFailures >= DIZZY_AT ? 'dizzy' : 'oops'
      flags = { ...flags, isWaiting: false, failedAnim, failedUntil: now + oneShotMs(failedAnim) }
    } else {
      flags = { ...flags, isWaiting: false }
    }
    await wake($)
    await update($, view, v => ({
      ...v,
      ...(isFailed ? { bubble: result.deny !== undefined ? `${tool} 被拒絕了…` : `唔… ${tool} 失敗了` } : {}),
      recent: v.recent.map(r => (r.id === id ? { ...r, isOk: !isFailed } : r)),
    }))
    return result
  }).catch(passThrough)

  on('turn.complete', async ($, e, next) => {
    const done = await next(e)
    if (e.agentId !== undefined) return done
    const now = await $.clock.now()
    lastActivity = now
    const seconds = Math.round((e.durationMs || now - turnStartedAt) / 1000)
    if (e.reason === 'answer') {
      const reviewAnim: AnimName = seconds * 1000 >= LONG_TURN_MS ? 'happy-2' : 'proud'
      flags = { ...flags, isWorking: false, isWaiting: false, reviewAnim, reviewUntil: now + oneShotMs(reviewAnim) }
      await setView($, { bubble: `完成了！用時 ${fmtSeconds(seconds)} ✿`, lastTurnSeconds: seconds })
    } else {
      const failedAnim: AnimName = e.reason === 'aborted' ? 'sorry' : 'failed'
      flags = { ...flags, isWorking: false, isWaiting: false, failedAnim, failedUntil: now + oneShotMs(failedAnim) }
      const why = e.reason === 'aborted' ? '被打斷了…需要再叫我' : '唔…這輪出錯了'
      await setView($, { bubble: why, lastTurnSeconds: seconds })
    }
    await wake($)
    return done
  })

  // Compacting the conversation: she packs it up while it runs, and a moment after.
  on('session.compact', async ($, e, next) => {
    if (e.agentId !== undefined || e.trigger === 'precompute') return next(e)
    lastActivity = await $.clock.now()
    flags = { ...flags, compactUntil: Number.MAX_SAFE_INTEGER }
    await setView($, { bubble: '整理一下對話…', isDozing: false })
    await wake($)
    try {
      return await next(e)
    } finally {
      const now = await $.clock.now()
      lastActivity = now
      flags = { ...flags, compactUntil: now + loopMs('compact') }
      await wake($)
    }
  }).catch(passThrough)

  on('command.run', { command: 'chibi' }, async ($, e) => {
    const [word, arg] = e.args.trim().split(/\s+/)
    const p = await read($, prefs)
    const hints = await screenHints($, e.presentation?.isFullscreen !== false)
    const save = async (next: Prefs) => {
      await update($, prefs, () => next)
      await $.store.set('prefs', next)
      mode = next.mode
      activeSet = SETS[next.set]
      renderPref = next.render
      $.ui.status(undefined)
    }

    if (word === 'render') {
      if (arg !== 'auto' && arg !== 'image' && arg !== 'cells') return { text: '用法：/chibi render auto | image | cells' }
      imageBroken = false // give the terminal another try
      await update($, imageFailed, () => false)
      await save({ ...p, render: arg })
      const label = { auto: '自動（能畫圖就用原圖，否則用字元）', image: '原圖（kitty / Ghostty / iTerm2）', cells: '字元畫' }[arg]
      return { text: `Claude ちゃん繪製方式：${label}` }
    }
    if (word === 'set') {
      if (arg !== 'smooth' && arg !== 'classic') return { text: '用法：/chibi set smooth | classic' }
      await save({ ...p, set: arg })
      return { text: `Claude ちゃん圖庫：${arg === 'smooth' ? '流暢版 (native-smooth)' : '經典版 (claude-chibi)'}` }
    }
    if (word === 'auto' || word === 'pane' || word === 'band' || word === 'off') {
      await save({ ...p, mode: word })
      canDock = dockable(e.presentation?.isFullscreen, e.presentation?.columns)
      if (word === 'auto' || word === 'pane' || (word === 'band' && !canDock)) {
        const opened = await $.ui.open(paneArgs())
        if (!opened.isPlaced && word === 'pane')
          return { text: [`面板還沒放上：${opened.reason ?? '畫面太窄'}`, ...hints].join('\n') }
      } else {
        await $.ui.close({ id: PANE })
      }
      if (word === 'off') $.ui.status(`${lookOf(shown).icon} Claude ちゃん：${lookOf(shown).title}`)
      const label = {
        auto: '自動（寬螢幕停靠右側，窄螢幕框在輸入框上方）',
        pane: '面板（寬螢幕停靠右側，窄螢幕框在輸入框上方）',
        band: '輸入框上方（窄螢幕用有 × 的框，寬螢幕用上方列）',
        off: '只用狀態列',
      }[word]
      return { text: [`Claude ちゃん顯示方式：${label}`, ...(word === 'auto' || word === 'pane' ? hints : [])].join('\n') }
    }
    return {
      text: [
        `Claude ちゃん — 顯示：${p.mode}，圖庫：${p.set}，繪製：${p.render}${p.render === 'auto' ? (imageBroken ? '（字元）' : '（原圖）') : ''}，狀態：${lookOf(shown).title}`,
        `目前畫面 — 面板：${kindLabel(sites.pane)}，上方列：${kindLabel(sites.band)}`,
        '/chibi auto | pane | band | off     切換顯示方式',
        '/chibi set smooth | classic         切換圖庫',
        '/chibi render auto | image | cells  切換繪製方式',
        ...hints,
      ].join('\n'),
    }
  })

  // ── the side pane (wide terminals) ──
  // A click on her picture (poke.tsx posts it).
  on('ui.message', async ($, e, next) => {
    if (e.module.endsWith('poke.tsx') && (e.data as { poke?: unknown } | null)?.poke === true) await poke($)
    return next(e)
  }).catch(passThrough)

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    if (e.surface !== 'terminal') {
      const { Text } = $.ui.resolve(e)
      return <Text dimColor>Claude ちゃん只畫在終端機上。</Text>
    }
    const { Box, Text, Raster, Image, Client } = $.ui.resolve(e)
    const els = { Box, Text }
    const v = await read($, view)
    const p = await read($, prefs)
    activeSet = SETS[p.set]
    renderPref = p.render
    imageBroken = await read($, imageFailed)
    const cols = e.props.bodyColumns
    const isDock = e.props.placement === 'dock'
    if (isDock && p.mode === 'band') isDockedInBand = true
    const size: SizeName = isDock && cols >= activeSet.sizes.big.columns ? 'big' : 'small'
    const sc = activeSet.sizes[size].columns
    const bodyRows = e.props.scroll.bodyRows
    const spriteRoom = isDock
      ? {
          columns: Math.floor(cols * DOCK_WIDTH_SHARE),
          rows: Math.min(Math.floor(bodyRows * DOCK_ROWS_SHARE), bodyRows - DOCK_TEXT_ROWS - DOCK_RECENT_MIN),
        }
      : { columns: cols - BUBBLE_MIN - 6, rows: bodyRows } // inline: fit the rows the pane has
    const sprite = pokeable({ Box, Client }, await drawSprite($, { Raster, Image }, 'pane', e.requestId, size, sc, animNow(), 0, spriteRoom), 'pane')
    const shownRows = sites.pane?.rows ?? spriteRows(activeSet, size)

    if (!isDock) return compact(els, sprite, v, cols, false, stageOf('pane')) // seated inline above the prompt

    const room = Math.max(0, bodyRows - shownRows - DOCK_TEXT_ROWS)
    const recent = v.recent.slice(-room)
    return (
      <Box flexDirection="column" width={cols} height={bodyRows} backgroundColor={THEME.surface}>
        <Box backgroundColor={stageOf('pane')} justifyContent="center">
          {sprite}
        </Box>
        <Box paddingX={1} marginTop={1}>
          {chip(els, v)}
          <Text bold color={THEME.accent}>
            {'  '}Claude ちゃん
          </Text>
        </Box>
        <Box paddingX={1}>{bubble(els, v.bubble)}</Box>
        <Box paddingX={1}>
          <Text color={THEME.muted}>本輪 </Text>
          <Text bold color={THEME.text}>
            {v.tools}
          </Text>
          <Text color={THEME.muted}> 次工具</Text>
          {v.lastTurnSeconds !== null && <Text color={THEME.muted}> · 上輪 </Text>}
          {v.lastTurnSeconds !== null && (
            <Text bold color={THEME.text}>
              {fmtSeconds(v.lastTurnSeconds)}
            </Text>
          )}
        </Box>
        {recent.length > 0 && (
          <Box paddingX={1} marginTop={1}>
            <Text bold color={THEME.accent}>
              最近{' '}
            </Text>
            <Text color={THEME.muted} wrap="truncate-end">
              {'─'.repeat(Math.max(0, cols - 8))}
            </Text>
          </Box>
        )}
        {recent.map(r => (
          <Box key={r.id} paddingX={1}>
            <Text wrap="truncate-end">
              <Text bold color={r.isOk === false ? THEME.err : r.isOk === null ? THEME.amber : THEME.ok}>
                {r.isOk === null ? '…' : r.isOk ? '✓' : '✗'}
              </Text>{' '}
              <Text color={THEME.text}>{r.tool}</Text> <Text color={THEME.muted}>{r.target}</Text>
            </Text>
          </Box>
        ))}
      </Box>
    )
  })

  // ── the band above the prompt (narrow terminals) ──
  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    if (e.surface !== 'terminal') return next(e)
    const p = await read($, prefs)
    const v = await read($, view)
    const isPaneUp = await read($, paneShown)
    if (e.viewport !== undefined) canDock = dockable(e.viewport.isFullscreen, e.viewport.columns)
    if (e.props.hasSurvey || p.mode === 'off' || p.mode === 'pane' || isPaneUp) {
      sites.band = undefined
      return next(e)
    }
    const { Box, Text, Raster, Image, Client } = $.ui.resolve(e)
    const els = { Box, Text }
    activeSet = SETS[p.set]
    renderPref = p.render
    imageBroken = await read($, imageFailed)
    const sc = activeSet.sizes.small.columns
    const sr = spriteRows(activeSet, 'small')
    const cols = e.props.bodyColumns

    // A picture takes a share of the terminal's height; cells keep their one size.
    const termRows = e.viewport?.rows ?? 40
    const bandRows = Math.min(e.props.maxRows, Math.max(BAND_ROWS_MIN, Math.min(BAND_ROWS_MAX, Math.round(termRows * BAND_ROWS_SHARE))))
    const inner = cols - BAND_FRAME // inside the frame
    const spriteRoom = { columns: inner - BUBBLE_MIN - 6, rows: bandRows - BAND_FRAME }
    const { state } = bandSprite(0)
    const isImage = wantsImage() && (await loadPng($, activeSet, state, frame, 'small')) !== null
    const tooSmall = isImage ? spriteRoom.rows < IMAGE_ROWS_MIN || spriteRoom.columns < 8 : e.props.maxRows < sr + BAND_FRAME

    // A short band (a small split, a tall status line): her face as tall as
    // the rows left, beside the one-line status.
    if (isImage && tooSmall && bandRows >= MINI_ROWS_MIN && cols >= 40) {
      const face = pokeable({ Box, Client }, await drawSprite($, { Raster, Image }, 'band', e.requestId, 'small', sc, state, 0, { columns: 12, rows: bandRows }), 'band')
      return (
        <Box flexDirection="row" width={cols} alignItems="center" backgroundColor={THEME.surface}>
          <Box backgroundColor={stageOf('band')}>{face}</Box>
          <Box marginLeft={1} flexShrink={1}>
            <Text wrap="truncate-end">
              {chip(els, v)}
              <Text bold color={THEME.accent}> Claude ちゃん</Text>
              <Text color={THEME.muted}> {v.bubble}</Text>
            </Text>
          </Box>
        </Box>
      )
    }
    if (tooSmall || inner < sc + 16) {
      sites.band = undefined
      return (
        <Text wrap="truncate-end">
          {chip(els, v)}
          <Text bold color={THEME.accent}> Claude ちゃん</Text>
          <Text color={THEME.muted}> {v.bubble}</Text>
        </Text>
      )
    }

    // Cells get room to stroll; a picture stays put (moving it would mean a redraw per step).
    const room = isImage ? 0 : Math.max(0, Math.min(WALK_MAX, inner - sc - BUBBLE_MIN - 4))
    const { offset } = bandSprite(room)
    const sprite = pokeable({ Box, Client }, await drawSprite($, { Raster, Image }, 'band', e.requestId, 'small', sc + room, state, offset, spriteRoom), 'band')
    // Framed like the pane seated above the prompt.
    return (
      <Box borderStyle="round" borderColor={THEME.muted} width={cols} backgroundColor={THEME.surface}>
        {compact(els, sprite, v, inner, true, stageOf('band'))}
      </Box>
    )
  })
}

// ─── shared pieces of the two layouts ───────────────────────────────────────

type TextEls = Pick<Elements['terminal'], 'Box' | 'Text'>
type Sprite = Awaited<ReturnType<typeof drawSprite>>

/** The state as a coloured chip: icon + words on the state's colour. */
function chip({ Text }: TextEls, v: View) {
  const look = lookOf(v.isDozing ? 'idle' : shown)
  const title = v.isDozing ? '打瞌睡' : look.title
  return (
    <Text bold backgroundColor={look.chip} color={THEME.onChip}>
      {' '}
      {v.isDozing ? 'z' : look.icon} {title}{' '}
    </Text>
  )
}

/** What she says, in a rounded bubble edged in her hair colour. */
function bubble({ Box, Text }: TextEls, text: string) {
  return (
    <Box borderStyle="round" borderColor={THEME.accent} backgroundColor={THEME.bubble} paddingX={1} flexShrink={1}>
      <Text color={THEME.text} backgroundColor={THEME.bubble} wrap="wrap">
        {text}
      </Text>
    </Box>
  )
}

/**
 * The sprite with a click target laid over it: a Client region that draws
 * nothing (the picture shows through) and posts each left click to `ui.message`.
 */
function pokeable({ Box, Client }: Pick<Elements['terminal'], 'Box' | 'Client'>, sprite: Sprite, slot: 'pane' | 'band'): RenderElement {
  const site = sites[slot]
  if (site === undefined) return sprite
  return (
    <Box>
      {sprite}
      <Box position="absolute" top={0} left={0}>
        <Client key={`poke-${slot}`} module="./poke.tsx" width={site.width} height={site.rows} />
      </Box>
    </Box>
  )
}

/** Sprite on its stage, beside the chip, the bubble and (in the band) a hint. */
function compact({ Box, Text }: TextEls, sprite: RenderElement, v: View, cols: number, withHint: boolean, stage: string) {
  const els = { Box, Text }
  return (
    <Box flexDirection="row" width={cols} alignItems="center" backgroundColor={THEME.surface}>
      <Box backgroundColor={stage} paddingX={1}>
        {sprite}
      </Box>
      <Box flexDirection="column" marginLeft={2} paddingRight={1} flexShrink={1}>
        <Box>
          {chip(els, v)}
          <Text bold color={THEME.accent}>
            {'  '}Claude ちゃん
          </Text>
        </Box>
        {bubble(els, v.bubble)}
        {withHint && <Text color={THEME.muted}> /chibi 切換顯示方式</Text>}
      </Box>
    </Box>
  )
}
