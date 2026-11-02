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

export type SizeName = 'big' | 'small'

export type SpriteSet = {
  name: string
  palette: number[]
  sizes: Record<SizeName, { columns: number; rows: number }>
  /** The Image box (cells) that keeps the PNG frames' aspect. */
  imageSizes: Record<SizeName, { columns: number; rows: number }>
  states: Record<StateName, { durations: number[]; big: string[]; small: string[] }>
}

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

/**
 * The Raster `cells` for one frame, drawn `offset` columns into a raster
 * `width` columns wide (wider than the sprite only while it walks).
 * Transparent pixels take `fill` (0x00RRGGBB), the backdrop the sprite stands on.
 */
export function frameCells(
  set: SpriteSet,
  state: StateName,
  size: SizeName,
  frame: number,
  width: number,
  offset: number,
  fill: number = DEFAULT,
): string {
  const { columns, rows } = set.sizes[size]
  const frames = set.states[state][size]
  const bytes = fromBase64(frames[frame % frames.length] ?? '')
  const colour = (i: number) => (i === 0 ? fill : (set.palette[i - 1] ?? fill))
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
      const src = (r * columns + sx) * 3
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
    state: StateName,
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
      if (cache.size > 600) cache.clear()
      cache.set(id, cells)
    }
    return cells
  }
}
