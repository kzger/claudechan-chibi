export type LayoutMode = 'auto' | 'pane' | 'band' | 'off'
export type SetName = 'smooth' | 'classic'

/** One tool call in the pane's "recent" list; `isOk` null while it runs. */
export type RecentCall = { id: string; tool: string; target: string; isOk: boolean | null }

/** What the drawings show besides the sprite; written on events, never per frame. */
export type View = {
  state: string
  bubble: string
  tools: number
  lastTurnSeconds: number | null
  isDozing: boolean
  isBandOpen: boolean
  recent: RecentCall[]
}

/** How the sprite is drawn: real PNG pixels, quadrant characters, or pick by what the terminal can do. */
export type RenderMode = 'auto' | 'image' | 'cells'

export type Prefs = { mode: LayoutMode; set: SetName; render: RenderMode }

declare module 'claude-code' {
  interface PluginState {
    'chibi-companion': {
      view: Shaped<View>
      prefs: Shaped<Prefs>
      paneShown: boolean
      imageFailed: boolean
    }
  }
}
