// Turns the generated frames into Raster cells.
//
// A frame is `columns x rows` cells, 3 bytes each: the quadrant glyph's mask
// (bit 0 top-left, 1 top-right, 2 bottom-left, 3 bottom-right), the
// foreground colour index and the background colour index; index 0 is the
// terminal's own colour (transparent), n is palette[n - 1]. The glyph and
// colours were picked offline (tools/build_frames.py), so this only packs.

export type StateName =
  | 'idle'
  | 'running-right'
  | 'running-left'
  | 'waving'
  | 'jumping'
  | 'failed'
  | 'waiting'
  | 'running'
  | 'review'
  | 'angry'

/** The states every frames-<set>.ts holds; 'angry' (PNG-drawn, tools/build_angry.py) may have cells too. */
export type SheetState = Exclude<StateName, 'angry'>

/**
 * The image26 actions both sets share (tools/build_extra.py): frames of
 * their own under assets/extra/, cells in a palette of their own.
 * 'idle-1' is image26's idle; 'idle' stays each set's original.
 */
export type ExtraName =
  | 'idle-1'
  | 'idle-2'
  | 'idle-3'
  | 'idle-blink'
  | 'hum'
  | 'clawd'
  | 'yawn'
  | 'sleeping-2'
  | 'stretch'
  | 'surprised'
  | 'pat-2'
  | 'coaxed'
  | 'redhot'
  | 'annoyed'
  | 'forgiven'
  | 'thinking'
  | 'searching'
  | 'writing'
  | 'busy_left'
  | 'busy_right'
  | 'delegating'
  | 'swamped_left'
  | 'swamped_right'
  | 'tired'
  | 'listening'
  | 'proud'
  | 'happy-2'
  | 'oops'
  | 'sulk'
  | 'dizzy'
  | 'sorry'
  | 'compact'

/** Anything she can play: a set's own state or a shared action. */
export type AnimName = StateName | ExtraName

export type SizeName = 'big' | 'small'

export type SpriteSet = {
  name: string
  palette: number[]
  sizes: Record<SizeName, { columns: number; rows: number }>
  /** The Image box (cells) that keeps the PNG frames' aspect. */
  imageSizes: Record<SizeName, { columns: number; rows: number }>
  states: Record<AnimName, StateFrames>
}

/**
 * One animation's frames. A shared action carries its own `palette` (its
 * cells index that one, not the set's) and `dir`, the assets folder of its PNGs.
 */
export type StateFrames = { durations: number[]; big: string[]; small: string[]; palette?: number[]; dir?: string }

/** A set as tools/build_corrected.py (or the older build_frames.py, without 'angry') writes it. */
export type SheetSet = Omit<SpriteSet, 'states'> & { states: Record<SheetState, StateFrames> & { angry?: StateFrames } }

/** The shared actions as tools/build_extra.py writes them; their timing is set in register.tsx. */
export type ExtraSheet = { palette: number[]; states: Record<ExtraName, { big: string[]; small: string[] }> }

// mask -> glyph: ' ▘▝▀▖▌▞▛▗▚▐▜▄▙▟█'
const GLYPHS = [
  0x20, 0x2598, 0x259d, 0x2580, 0x2596, 0x258c, 0x259e, 0x259b, 0x2597, 0x259a, 0x2590, 0x259c, 0x2584, 0x2599,
  0x259f, 0x2588,
]
const DEFAULT = 0x01000000 // the terminal's own colour

const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
const B64_INDEX = new Uint8Array(128)
for (let i = 0; i < B64.length; i++) B64_INDEX[B64.charCodeAt(i)] = i

function fromBase64(text: string): Uint8Array {
  const clean = text.replace(/=+$/, '')
  const out = new Uint8Array(Math.floor((clean.length * 3) / 4))
  let o = 0
  for (let i = 0; i < clean.length; i += 4) {
    const a = B64_INDEX[clean.charCodeAt(i)] ?? 0
    const b = B64_INDEX[clean.charCodeAt(i + 1)] ?? 0
    const c = B64_INDEX[clean.charCodeAt(i + 2)] ?? 0
    const d = B64_INDEX[clean.charCodeAt(i + 3)] ?? 0
    const n = (a << 18) | (b << 12) | (c << 6) | d
    if (o < out.length) out[o++] = (n >> 16) & 255
    if (o < out.length) out[o++] = (n >> 8) & 255
    if (o < out.length) out[o++] = n & 255
  }
  return out
}

function toBase64(bytes: Uint8Array): string {
  let out = ''
  for (let i = 0; i < bytes.length; i += 3) {
    const a = bytes[i] ?? 0
    const b = bytes[i + 1] ?? 0
    const c = bytes[i + 2] ?? 0
    const n = (a << 16) | (b << 8) | c
    out += B64[(n >> 18) & 63]! + B64[(n >> 12) & 63]!
    out += i + 1 < bytes.length ? B64[(n >> 6) & 63]! : '='
    out += i + 2 < bytes.length ? B64[n & 63]! : '='
  }
  return out
}

const topBlank = new Map<string, number>()

/**
 * Rows at the top that no frame of the set ever paints at this size: the
 * frames share one box sized for the highest pose, so these stay empty.
 */
function blankTop(set: SpriteSet, size: SizeName): number {
  const id = `${set.name}|${size}`
  let top = topBlank.get(id)
  if (top !== undefined) return top
  const { columns, rows } = set.sizes[size]
  top = rows - 1
  for (const s of Object.values(set.states)) {
    for (const f of s[size]) {
      const bytes = fromBase64(f)
      let r = 0
      while (r < top && bytes.subarray(r * columns * 3, (r + 1) * columns * 3).every(b => b === 0)) r++
      top = r
    }
  }
  topBlank.set(id, top)
  return top
}

/** The rows a frame takes once the never-painted top rows are dropped. */
export function spriteRows(set: SpriteSet, size: SizeName): number {
  return set.sizes[size].rows - blankTop(set, size)
}

/**
 * The Raster `cells` for one frame, drawn `offset` columns into a raster
 * `width` columns wide (wider than the sprite only while it walks).
 * Transparent pixels take `fill` (0x00RRGGBB), the backdrop the sprite stands on.
 */
export function frameCells(
  set: SpriteSet,
  state: AnimName,
  size: SizeName,
  frame: number,
  width: number,
  offset: number,
  fill: number = DEFAULT,
): string {
  const { columns } = set.sizes[size]
  const top = blankTop(set, size)
  const rows = spriteRows(set, size)
  const frames = set.states[state][size]
  const palette = set.states[state].palette ?? set.palette
  const bytes = fromBase64(frames[frame % frames.length] ?? '')
  const colour = (i: number) => (i === 0 ? fill : (palette[i - 1] ?? fill))
  const words = new Uint32Array(width * rows * 3)
  for (let r = 0; r < rows; r++) {
    for (let x = 0; x < width; x++) {
      const at = (r * width + x) * 3
      const sx = x - offset
      if (sx < 0 || sx >= columns) {
        words[at] = 0x20
        words[at + 1] = fill
        words[at + 2] = fill
        continue
      }
      const src = ((r + top) * columns + sx) * 3
      words[at] = GLYPHS[bytes[src] ?? 0] ?? 0x20
      words[at + 1] = colour(bytes[src + 1] ?? 0)
      words[at + 2] = colour(bytes[src + 2] ?? 0)
    }
  }
  return toBase64(new Uint8Array(words.buffer))
}

/** Frames are packed once per (set, state, size, frame, width, offset, fill). */
export function makeCellCache() {
  const cache = new Map<string, string>()
  return (
    set: SpriteSet,
    state: AnimName,
    size: SizeName,
    frame: number,
    width: number,
    offset: number,
    fill: number = DEFAULT,
  ) => {
    const n = set.states[state][size].length
    const id = `${set.name}|${state}|${size}|${frame % n}|${width}|${offset}|${fill}`
    let cells = cache.get(id)
    if (cells === undefined) {
      cells = frameCells(set, state, size, frame, width, offset, fill)
      if (cache.size >= CELL_CACHE_MAX) cache.delete(cache.keys().next().value!) // the least recently used
    } else {
      cache.delete(id) // to the back: recently used
    }
    cache.set(id, cells)
    return cells
  }
}

const CELL_CACHE_MAX = 600

/**
 * One step of the clock from frame `at`: frames shorter than `minMs` are
 * merged with the ones after them so no draw comes sooner than `minMs`, but
 * a loop's last frame (often a held pose) is always drawn.
 * Returns how many frames to move on and how long to wait.
 */
export function frameStep(durations: number[], at: number, minMs: number): { frames: number; ms: number } {
  const n = durations.length
  const f = ((at % n) + n) % n
  let ms = durations[f] ?? minMs
  let frames = 1
  while (ms < minMs && f + frames < n - 1) {
    ms += durations[f + frames] ?? 0
    frames += 1
  }
  return { frames, ms: Math.max(ms, minMs) }
}

/** One loop as the clock draws it, in ms. */
export function drawnLoopMs(durations: number[], minMs: number): number {
  let total = 0
  for (let f = 0; f < durations.length; ) {
    const step = frameStep(durations, f, minMs)
    total += step.ms
    f += step.frames
  }
  return total
}
