import { atom, read, update } from 'claude-code'
import type { Elements, EngineInterface, Register } from 'claude-code'

import type { LayoutMode, Prefs, RecentCall, RenderMode, SetName, View } from '../types'
import { SET as CLASSIC } from './frames-classic'
import { SET as SMOOTH } from './frames-smooth'
import { pickState, type Flags } from './mood'
import { makeCellCache, spriteRows, type SizeName, type SpriteSet, type StateName } from './sprite'

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
}
const SETS: Record<SetName, SpriteSet> = { smooth: SMOOTH, classic: CLASSIC }

const DOZE_AFTER_MS = 5 * 60_000 // idle this long: she dozes off
const DOZE_FRAME = 3 // the idle frame with closed eyes
const DOZE_TICK_MS = 4_000
const WALK_EVERY_MS = 40_000 // while working, a stroll across the band this often
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
// Every blit moves the terminal's cursor away and back, which reads as a
// flickering caret: faster states skip frames to draw at most this often.
const MIN_FRAME_MS = 240
const REPEAT = 3 // one-shot states play three loops, as in the Codex app

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
}

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
const view = atom({ plugin: 'chibi-companion', key: 'view' } as const, INITIAL_VIEW, { shape: 'view-1' })
const DEFAULT_PREFS: Prefs = { mode: 'auto', set: 'smooth', render: 'auto' }
const prefs = atom({ plugin: 'chibi-companion', key: 'prefs' } as const, DEFAULT_PREFS, { shape: 'prefs-2' })
const paneShown = atom({ plugin: 'chibi-companion', key: 'paneShown' } as const, false)
/** Set once this terminal drew an Image's alt instead of its picture. */
const imageFailed = atom({ plugin: 'chibi-companion', key: 'imageFailed' } as const, false)

// ─── module state (animation bookkeeping; starts over on reload) ────────────

/** Where a sprite is mounted: a Raster of cells, or an Image of PNG frames. */
type Site = { kind: 'cells' | 'image'; requestId: string; size: SizeName; width: number; rows: number; fill: number }

let flags: Flags = {
  now: 0,
  isWorking: false,
  isWaiting: false,
  greetUntil: 0,
  ackUntil: 0,
  failedUntil: 0,
  reviewUntil: 0,
}
let lastActivity = 0
let turnStartedAt = 0
let shown: StateName = 'idle'
let frame = 0
let stride = 1 // frames each blit moves on
let isDozing = false
let walk: { dir: 1 | -1; offset: number; room: number } | null = null
let lastWalkAt = 0
let lastPanePoll = 0
let activeSet: SpriteSet = SMOOTH
let mode: LayoutMode = 'auto'
let renderPref: RenderMode = 'auto'
let imageBroken = false
let timer: { cancel: () => void } | null = null
const sites: { pane?: Site; band?: Site } = {}
const cellsOf = makeCellCache()
const pngCache = new Map<string, string | null>()

// ─── helpers ────────────────────────────────────────────────────────────────

type $T = EngineInterface

function oneShotMs(state: StateName): number {
  return SMOOTH.states[state].durations.reduce((a, b) => a + b, 0) * REPEAT
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
  return { id: PANE, title: PANE_TITLE, columns: PANE_COLUMNS, rows, backgroundColor: THEME.surface }
}

const kindLabel = (site?: Site) => (site === undefined ? '未顯示' : site.kind === 'image' ? '原圖' : '字元')

/** Real pixels unless the person chose cells, or this terminal showed it cannot draw them. */
function wantsImage(): boolean {
  return renderPref === 'image' || (renderPref === 'auto' && !imageBroken)
}

/** One PNG frame of the plugin's own, as base64; null where it cannot be read. */
async function loadPng($: $T, set: SpriteSet, state: StateName, f: number, size: SizeName): Promise<string | null> {
  const n = set.states[state].big.length
  // The band ('small') shows a head-and-shoulders crop; the pane the full figure.
  const path = `${$.plugin.root}/assets/${set.name}/${state}/${f % n}${size === 'small' ? '-bust' : ''}.png`
  if (pngCache.has(path)) return pngCache.get(path) ?? null
  let png: string | null = null
  try {
    png = (await $.fs.read(path, { as: 'bytes' })).base64
  } catch {
    png = null
  }
  pngCache.set(path, png)
  return png
}

type SpriteElements = Pick<Elements['terminal'], 'Raster' | 'Image'>

/** The largest box of cells within `maxColumns` x `maxRows` that keeps the picture's aspect. */
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
  state: StateName,
  offset: number,
  room: { columns: number; rows: number },
) {
  const { Raster, Image } = els
  if (wantsImage()) {
    const png = await loadPng($, activeSet, state, frameIndex(), size)
    if (png !== null) {
      const { columns, rows } = imageBox(size, room.columns, room.rows)
      sites[slot] = { kind: 'image', requestId, size, width: columns, rows, fill: hex(THEME.stage) }
      const alt = renderPref === 'image' ? 'Claude ちゃん（這個終端機不支援圖片）' : ' '
      return <Image key="sprite" source={{ png }} columns={columns} rows={rows} alt={alt} />
    }
  }
  const rows = spriteRows(activeSet, size)
  const fill = hex(THEME.stage)
  sites[slot] = { kind: 'cells', requestId, size, width, rows, fill }
  const cells = cellsOf(activeSet, state, size, frameIndex(), width, offset, fill)
  return <Raster key="sprite" columns={width} rows={rows} cells={cells} />
}

async function setView($: $T, patch: Partial<View>) {
  await update($, view, v => ({ ...v, ...patch }))
}

/** What the band draws right now: the walk overrides the mood while it lasts. */
function bandSprite(): { state: StateName; offset: number } {
  if (walk) return { state: walk.dir > 0 ? 'running-right' : 'running-left', offset: walk.offset }
  return { state: shown, offset: 0 }
}

function frameIndex(): number {
  return isDozing ? DOZE_FRAME : frame
}

// ─── the animation clock ────────────────────────────────────────────────────

function nextDelay(): number {
  if (isDozing) return DOZE_TICK_MS
  const state = walk ? (walk.dir > 0 ? 'running-right' : 'running-left') : shown
  const d = activeSet.states[state].durations
  const ms = d[frame % d.length] ?? 150
  stride = ms < MIN_FRAME_MS ? Math.round(MIN_FRAME_MS / ms) : 1
  return ms * stride
}

async function blitAll($: $T) {
  const f = frameIndex()
  for (const name of ['pane', 'band'] as const) {
    const site = sites[name]
    if (!site) continue
    const { state, offset } = name === 'band' && site.kind === 'cells' ? bandSprite() : { state: shown, offset: 0 }
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
    const panes = await $.ui.panes()
    const isUp = panes.some(p => p.id === PANE && p.isPlaced && p.isShown)
    if (isUp !== (await read($, paneShown))) await update($, paneShown, () => isUp)
  }

  if (want !== shown || dozing !== isDozing) {
    const changedMood = want !== shown
    shown = want
    isDozing = dozing
    if (changedMood) {
      frame = 0
      walk = null
    }
    await setView($, { state: want, isDozing: dozing, ...(dozing ? { bubble: 'zzz…' } : {}) })
    if (mode === 'off') $.ui.status(`${ICON[want]} Claude ちゃん：${dozing ? '打瞌睡' : TITLE[want]}`)
    return // the redraw paints this frame
  }
  if (isDozing) return

  // A stroll across the band now and then while she works.
  const band = sites.band
  if (walk) {
    walk.offset += walk.dir
    if (walk.offset >= walk.room) walk.dir = -1
    if (walk.offset <= 0 && walk.dir < 0) {
      walk = null
      lastWalkAt = now
    }
  } else if (shown === 'running' && band?.kind === 'cells' && band.width - activeSet.sizes.small.columns >= 8) {
    if (lastWalkAt === 0) lastWalkAt = now
    if (now - lastWalkAt > WALK_EVERY_MS) walk = { dir: 1, offset: 0, room: band.width - activeSet.sizes.small.columns }
  }

  frame += stride
  await blitAll($)
}

function startClock($: $T) {
  timer?.cancel()
  const step = async () => {
    try {
      await tick($)
    } catch {
      // a lost frame is fine; the next tick draws again
    }
    timer = $.clock.after(nextDelay(), () => void step())
  }
  void step()
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
    flags = { ...flags, ackUntil: now + oneShotMs('jumping'), failedUntil: 0, reviewUntil: 0 }
    await setView($, { bubble: '收到！馬上開始', isDozing: false })
    // A pane opened unasked waits below the dock's width; opened now, at the
    // person's prompt, it is placed at any width: framed above the prompt on a
    // narrow screen, which reads better than the band.
    if (mode === 'auto' || mode === 'pane') {
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
    flags = { ...flags, isWorking: true }
    await setView($, { tools: 0 })
    return next(e)
  })

  on('classic.PermissionRequest', async ($, e, next) => {
    flags = { ...flags, isWaiting: true }
    lastActivity = await $.clock.now()
    await setView($, { bubble: `想用 ${e.tool_name}，可以嗎？` })
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
    if (asksPerson) flags = { ...flags, isWaiting: true }
    await update($, view, v => ({
      ...v,
      bubble: target ? `${verb} ${target}…` : `${verb}…`,
      tools: v.tools + 1,
      recent: [...v.recent, { id, tool, target, isOk: null } as RecentCall].slice(-8),
    }))

    const result = await next(e)

    const now = await $.clock.now()
    lastActivity = now
    const isFailed = result.deny !== undefined || result.isError === true
    flags = { ...flags, isWaiting: false, ...(isFailed ? { failedUntil: now + oneShotMs('failed') } : {}) }
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
      flags = { ...flags, isWorking: false, isWaiting: false, reviewUntil: now + oneShotMs('review') }
      await setView($, { bubble: `完成了！用時 ${fmtSeconds(seconds)} ✿`, lastTurnSeconds: seconds })
    } else {
      flags = { ...flags, isWorking: false, isWaiting: false, failedUntil: now + oneShotMs('failed') }
      const why = e.reason === 'aborted' ? '被打斷了…需要再叫我' : '唔…這輪出錯了'
      await setView($, { bubble: why, lastTurnSeconds: seconds })
    }
    return done
  })

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
      if (word === 'auto' || word === 'pane') {
        const opened = await $.ui.open(paneArgs())
        if (!opened.isPlaced && word === 'pane')
          return { text: [`面板還沒放上：${opened.reason ?? '畫面太窄'}`, ...hints].join('\n') }
      } else {
        await $.ui.close({ id: PANE })
      }
      if (word === 'off') $.ui.status(`${ICON[shown]} Claude ちゃん：${TITLE[shown]}`)
      const label = { auto: '自動（寬用面板、窄用上方列）', pane: '側面板', band: '輸入框上方列', off: '只用狀態列' }[word]
      return { text: [`Claude ちゃん顯示方式：${label}`, ...(word === 'auto' || word === 'pane' ? hints : [])].join('\n') }
    }
    return {
      text: [
        `Claude ちゃん — 顯示：${p.mode}，圖庫：${p.set}，繪製：${p.render}${p.render === 'auto' ? (imageBroken ? '（字元）' : '（原圖）') : ''}，狀態：${TITLE[shown]}`,
        `目前畫面 — 面板：${kindLabel(sites.pane)}，上方列：${kindLabel(sites.band)}`,
        '/chibi auto | pane | band | off     切換顯示方式',
        '/chibi set smooth | classic         切換圖庫',
        '/chibi render auto | image | cells  切換繪製方式',
        ...hints,
      ].join('\n'),
    }
  })

  // ── the side pane (wide terminals) ──
  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    if (e.surface !== 'terminal') {
      const { Text } = $.ui.resolve(e)
      return <Text dimColor>Claude ちゃん只畫在終端機上。</Text>
    }
    const { Box, Text, Raster, Image } = $.ui.resolve(e)
    const els = { Box, Text }
    const v = await read($, view)
    const p = await read($, prefs)
    activeSet = SETS[p.set]
    renderPref = p.render
    imageBroken = await read($, imageFailed)
    const cols = e.props.bodyColumns
    const isDock = e.props.placement === 'dock'
    const size: SizeName = isDock && cols >= activeSet.sizes.big.columns ? 'big' : 'small'
    const sc = activeSet.sizes[size].columns
    const bodyRows = e.props.scroll.bodyRows
    const spriteRoom = isDock
      ? {
          columns: Math.floor(cols * DOCK_WIDTH_SHARE),
          rows: Math.min(Math.floor(bodyRows * DOCK_ROWS_SHARE), bodyRows - DOCK_TEXT_ROWS - DOCK_RECENT_MIN),
        }
      : { columns: cols - BUBBLE_MIN - 6, rows: bodyRows } // inline: fit the rows the pane has
    const sprite = await drawSprite($, { Raster, Image }, 'pane', e.requestId, size, sc, shown, 0, spriteRoom)
    const shownRows = sites.pane?.rows ?? spriteRows(activeSet, size)

    if (!isDock) return compact(els, sprite, v, cols, false) // seated inline above the prompt

    const room = Math.max(0, bodyRows - shownRows - DOCK_TEXT_ROWS)
    const recent = v.recent.slice(-room)
    return (
      <Box flexDirection="column">
        <Box backgroundColor={THEME.stage} justifyContent="center">
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
    if (e.props.hasSurvey || p.mode === 'off' || p.mode === 'pane' || isPaneUp) {
      sites.band = undefined
      return next(e)
    }
    const { Box, Text, Raster, Image } = $.ui.resolve(e)
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
    const { state, offset } = bandSprite()
    const isImage = wantsImage() && (await loadPng($, activeSet, state, frameIndex(), 'small')) !== null
    const tooSmall = isImage ? spriteRoom.rows < IMAGE_ROWS_MIN || spriteRoom.columns < 8 : e.props.maxRows < sr + BAND_FRAME

    // A short band (a small split, a tall status line): her face as tall as
    // the rows left, beside the one-line status.
    if (isImage && tooSmall && bandRows >= MINI_ROWS_MIN && cols >= 40) {
      const face = await drawSprite($, { Raster, Image }, 'band', e.requestId, 'small', sc, state, 0, { columns: 12, rows: bandRows })
      return (
        <Box flexDirection="row" width={cols} alignItems="center" backgroundColor={THEME.surface}>
          <Box backgroundColor={THEME.stage}>{face}</Box>
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
    const sprite = await drawSprite($, { Raster, Image }, 'band', e.requestId, 'small', sc + room, state, Math.min(offset, room), spriteRoom)
    // Framed like the pane seated above the prompt.
    return (
      <Box borderStyle="round" borderColor={THEME.muted} width={cols} backgroundColor={THEME.surface}>
        {compact(els, sprite, v, inner, true)}
      </Box>
    )
  })
}

// ─── shared pieces of the two layouts ───────────────────────────────────────

type TextEls = Pick<Elements['terminal'], 'Box' | 'Text'>
type Sprite = Awaited<ReturnType<typeof drawSprite>>

/** The state as a coloured chip: icon + words on the state's colour. */
function chip({ Text }: TextEls, v: View) {
  const state = (v.isDozing ? 'idle' : shown) as StateName
  const title = v.isDozing ? '打瞌睡' : TITLE[shown]
  return (
    <Text bold backgroundColor={CHIP[state]} color={THEME.onChip}>
      {' '}
      {v.isDozing ? 'z' : ICON[shown]} {title}{' '}
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

/** Sprite on its stage, beside the chip, the bubble and (in the band) a hint. */
function compact({ Box, Text }: TextEls, sprite: Sprite, v: View, cols: number, withHint: boolean) {
  const els = { Box, Text }
  return (
    <Box flexDirection="row" width={cols} alignItems="center" backgroundColor={THEME.surface}>
      <Box backgroundColor={THEME.stage} paddingX={1}>
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
