import { expect, mock, test } from 'claude-code/testing'

const PANE = {
  plugin: 'claudechan-chibi',
  component: 'Pane',
  requestId: 'chibi',
  props: {
    title: 'Claude ちゃん',
    isFocused: false,
    bodyColumns: 52,
    placement: 'dock',
    scroll: { offset: 0, bodyRows: 40 },
    view: {},
  },
} as const

const BAND = {
  plugin: 'claudechan-chibi',
  component: 'AbovePrompt',
  requestId: 'band',
  props: {
    hasSurvey: false,
    isWorking: true,
    maxRows: 20,
    bodyColumns: 90,
    scroll: { offset: 0, bodyRows: 19 },
    view: {},
  },
} as const

function engine(on: Parameters<Parameters<typeof test>[1]>[1]) {
  mock.clock(on)
  mock.store(on)
  on('command.register', () => ({ value: { command: 'chibi' } }))
  on('ui.open', () => ({ value: { isPlaced: true } }))
  on('ui.panes', () => ({ value: [] }))
  on('ui.blit', () => ({ value: {} }))
  on('session.start', (_, e) => ({ cwd: e.cwd }))
  on('tool.call', () => ({ result: {} }))
}

test('the docked pane draws the big sprite and the tool it runs', async ($, on) => {
  engine(on)
  await $.session.start({ cwd: '/', surface: 'terminal', isInteractive: true })
  await $.tool.call({ tool: 'Read', file_path: '/repo/src/auth.ts' })

  const ui = await $.ui.mount({ ...PANE, surface: 'terminal' })
  expect(await ui.find({ type: 'Raster', key: 'sprite' })).toBeDefined()
  expect((await ui.find({ type: 'Text', text: /auth\.ts/ }))?.text).toContain('auth.ts')
  await ui.unmount()
})

test('the band draws the small sprite with a speech bubble', async ($, on) => {
  engine(on)
  await $.session.start({ cwd: '/', surface: 'terminal', isInteractive: true })

  const ui = await $.ui.mount({ ...BAND, surface: 'terminal' })
  expect(await ui.find({ type: 'Raster', key: 'sprite' })).toBeDefined()
  expect(await ui.find({ type: 'Text', text: /chibi/ })).toBeDefined()
  await ui.unmount()
})

test('a band with too little room falls back to one line', async ($, on) => {
  engine(on)
  await $.session.start({ cwd: '/', surface: 'terminal', isInteractive: true })

  const ui = await $.ui.mount({ ...BAND, props: { ...BAND.props, maxRows: 6 }, surface: 'terminal' })
  expect(await ui.find({ type: 'Raster', key: 'sprite' })).toBeUndefined()
  expect(await ui.find({ type: 'Text', text: /Claude ちゃん/ })).toBeDefined()
  await ui.unmount()
})

test('where frames can be read the pane draws the PNG as an Image', async ($, on) => {
  engine(on)
  on('fs.read', () => ({ value: { base64: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==' } }))
  await $.session.start({ cwd: '/', surface: 'terminal', isInteractive: true })

  const ui = await $.ui.mount({ ...PANE, surface: 'terminal' })
  expect(await ui.find({ type: 'Image', key: 'sprite' })).toBeDefined()
  expect(await ui.find({ type: 'Raster', key: 'sprite' })).toBeUndefined()
  await ui.unmount()
})

test('/chibi names the tmux settings that keep colours and the dock', async ($, on) => {
  engine(on)
  mock.env(on, { TMUX: '/tmp/tmux-501/default,1,0' })
  await $.session.start({ cwd: '/', surface: 'terminal', isInteractive: true })

  const out = await $.command.run({ command: 'chibi', args: '' })
  expect(out.text).toContain('CLAUDE_CODE_TMUX_TRUECOLOR')
})

const PNG = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='

test('the picture grows with the room: a wider dock; the band stops at its cap', async ($, on) => {
  engine(on)
  on('fs.read', () => ({ value: { base64: PNG } }))
  await $.session.start({ cwd: '/', surface: 'terminal', isInteractive: true })

  const rowsOf = async (mount: Parameters<typeof $.ui.mount>[0]) => {
    const ui = await $.ui.mount(mount)
    const img = await ui.find({ type: 'Image', key: 'sprite' })
    await ui.unmount()
    return Number(img?.props.rows)
  }
  const narrowDock = await rowsOf({ ...PANE, props: { ...PANE.props, bodyColumns: 40 }, surface: 'terminal' })
  const wideDock = await rowsOf({ ...PANE, props: { ...PANE.props, bodyColumns: 70 }, surface: 'terminal' })
  expect(wideDock).toBeGreaterThan(narrowDock)

  // The band's picture stops growing at its cap: 9 rows, frame included.
  const tallBand = await rowsOf({ ...BAND, viewport: { columns: 95, rows: 60 }, props: { ...BAND.props, maxRows: 30 }, surface: 'terminal' })
  expect(tallBand).toBe(7)
})

test('a short band keeps her face beside one line', async ($, on) => {
  engine(on)
  on('fs.read', () => ({ value: { base64: PNG } }))
  await $.session.start({ cwd: '/', surface: 'terminal', isInteractive: true })

  const ui = await $.ui.mount({ ...BAND, props: { ...BAND.props, maxRows: 3 }, surface: 'terminal' })
  const img = await ui.find({ type: 'Image', key: 'sprite' })
  expect(img).toBeDefined()
  expect(Number(img?.props.rows)).toBe(3)
  expect(await ui.find({ type: 'Text', text: /Claude ちゃん/ })).toBeDefined()
  await ui.unmount()

  const one = await $.ui.mount({ ...BAND, props: { ...BAND.props, maxRows: 1 }, surface: 'terminal' })
  expect(await one.find({ type: 'Image', key: 'sprite' })).toBeUndefined()
  await one.unmount()
})

test('a prompt seats the pane that waited for room', async ($, on) => {
  mock.clock(on)
  mock.store(on)
  on('command.register', () => ({ value: { command: 'chibi' } }))
  on('ui.panes', () => ({ value: [] }))
  on('ui.blit', () => ({ value: {} }))
  on('session.start', (_, e) => ({ cwd: e.cwd }))
  let opens = 0
  on('ui.open', () => {
    opens += 1
    return { value: { isPlaced: true } }
  })
  on('prompt.submit', (_, e) => ({ text: e.text }))
  await $.session.start({ cwd: '/', surface: 'terminal', isInteractive: true })
  const before = opens

  await $.prompt.submit({ text: 'hi' })
  expect(opens).toBe(before + 1)
})

test('the pane seated above the prompt asks for the band height', async ($, on) => {
  mock.clock(on)
  mock.store(on)
  on('command.register', () => ({ value: { command: 'chibi' } }))
  on('ui.panes', () => ({ value: [] }))
  on('ui.blit', () => ({ value: {} }))
  on('session.start', (_, e) => ({ cwd: e.cwd }))
  mock.env(on, {})
  on('ui.close', () => ({ value: {} }))
  const asked: number[] = []
  on('ui.open', (_, e) => {
    if (e.rows !== undefined) asked.push(e.rows)
    return { value: { isPlaced: true } }
  })
  on('fs.read', () => ({ value: { base64: PNG } }))
  await $.session.start({ cwd: '/', surface: 'terminal', isInteractive: true })
  await $.command.run({ command: 'chibi', args: 'pane' })
  expect(asked.at(-1)).toBe(7)

  // Where it cannot dock the band mode takes the framed pane too.
  asked.length = 0
  await $.command.run({ command: 'chibi', args: 'band', presentation: { isFullscreen: true, columns: 90 } })
  expect(asked).toEqual([7])

  // Where it docks, the band mode keeps the band.
  asked.length = 0
  await $.command.run({ command: 'chibi', args: 'band', presentation: { isFullscreen: true, columns: 135 } })
  expect(asked).toEqual([])
})

test('a click on her picture plays a reaction; clicking on and on makes her cross', async ($, on) => {
  engine(on)
  on('fs.read', () => ({ value: { base64: PNG } }))
  await $.session.start({ cwd: '/', surface: 'terminal', isInteractive: true })

  const ui = await $.ui.mount({ ...BAND, surface: 'terminal' })
  const bubble = async () => (await ui.find({ type: 'Text', text: /^(嗨～|嘿嘿|唔|生氣了！)/ }))?.text
  const click = () => ui.pointer({ type: 'down', x: 1, y: 1, button: 'left', in: 'poke-band' })
  await click()
  expect(await bubble()).toBe('嗨～找我嗎？')
  await click()
  expect(await bubble()).toBe('唔…別一直戳啦')
  await click()
  expect(await bubble()).toBe('生氣了！不准再戳了！')
  await ui.unmount()
})

test('a click wakes her at once, not at the dozing clock’s next tick', async ($, on) => {
  const clock = mock.clock(on)
  mock.store(on)
  on('command.register', () => ({ value: { command: 'chibi' } }))
  on('ui.open', () => ({ value: { isPlaced: true } }))
  on('ui.panes', () => ({ value: [] }))
  on('ui.blit', () => ({ value: {} }))
  on('session.start', (_, e) => ({ cwd: e.cwd }))
  on('fs.read', () => ({ value: { base64: PNG } }))
  await $.session.start({ cwd: '/', surface: 'terminal', isInteractive: true })

  const ui = await $.ui.mount({ ...BAND, surface: 'terminal' })
  await clock.advance(125_000)
  expect(await ui.find({ type: 'Text', text: /打瞌睡/ })).toBeDefined()

  await ui.pointer({ type: 'down', x: 1, y: 1, button: 'left', in: 'poke-band' })
  await clock.settle()
  expect(await ui.find({ type: 'Text', text: /醒來了/ })).toBeDefined()
  await ui.unmount()
})

test('she yawns, then sleeps: the doze plays the shared frames', async ($, on) => {
  const clock = mock.clock(on)
  mock.store(on)
  on('command.register', () => ({ value: { command: 'chibi' } }))
  on('ui.open', () => ({ value: { isPlaced: true } }))
  on('ui.panes', () => ({ value: [] }))
  on('ui.blit', () => ({ value: {} }))
  on('session.start', (_, e) => ({ cwd: e.cwd }))
  const paths: string[] = []
  on('fs.read', (_, e) => {
    paths.push(String(e.path))
    return { value: { base64: PNG } }
  })
  await $.session.start({ cwd: '/', surface: 'terminal', isInteractive: true })
  const ui = await $.ui.mount({ ...BAND, surface: 'terminal' })
  await clock.advance(121_000)
  expect(paths.some(p => p.includes('/assets/extra/yawn/'))).toBe(true)
  await clock.advance(10_000)
  expect(paths.some(p => p.includes('/assets/extra/sleeping-2/'))).toBe(true)
  await ui.unmount()
})

test('each tool puts her in its pose; Read keeps the set’s own', async ($, on) => {
  const clock = mock.clock(on)
  mock.store(on)
  on('command.register', () => ({ value: { command: 'chibi' } }))
  on('ui.open', () => ({ value: { isPlaced: true } }))
  on('ui.panes', () => ({ value: [] }))
  on('ui.blit', () => ({ value: {} }))
  on('session.start', (_, e) => ({ cwd: e.cwd }))
  on('turn.start', (_, e) => ({ turnId: e.turnId }))
  on('tool.call', () => ({ result: {} }))
  await $.session.start({ cwd: '/', surface: 'terminal', isInteractive: true })
  const ui = await $.ui.mount({ ...BAND, surface: 'terminal' })
  const title = async (re: RegExp) => {
    await clock.advance(5_000) // past the greeting
    return (await ui.find({ type: 'Text', text: re })) !== undefined
  }

  await $.turn.start({ text: 'go', turnId: 't1' })
  expect(await title(/思考中/)).toBe(true)
  await $.tool.call({ tool: 'Grep', pattern: 'auth' })
  expect(await title(/搜尋中/)).toBe(true)
  await $.tool.call({ tool: 'Edit', file_path: '/a.ts', old_string: 'a', new_string: 'b' })
  expect(await title(/寫入中/)).toBe(true)
  await $.tool.call({ tool: 'Read', file_path: '/a.ts' })
  expect(await title(/工作中/)).toBe(true)
  await ui.unmount()
})

test('a failed tool is an oops; the third in a turn makes her dizzy', async ($, on) => {
  const clock = mock.clock(on)
  mock.store(on)
  on('command.register', () => ({ value: { command: 'chibi' } }))
  on('ui.open', () => ({ value: { isPlaced: true } }))
  on('ui.panes', () => ({ value: [] }))
  on('ui.blit', () => ({ value: {} }))
  on('session.start', (_, e) => ({ cwd: e.cwd }))
  on('turn.start', (_, e) => ({ turnId: e.turnId }))
  on('tool.call', () => ({ result: 'boom', isError: true }))
  await $.session.start({ cwd: '/', surface: 'terminal', isInteractive: true })
  const ui = await $.ui.mount({ ...BAND, surface: 'terminal' })
  await clock.advance(5_000)
  await $.turn.start({ text: 'go', turnId: 't1' })

  await $.tool.call({ tool: 'Bash', command: 'false' })
  await clock.advance(100)
  expect(await ui.find({ type: 'Text', text: /失敗了/ })).toBeDefined()
  await $.tool.call({ tool: 'Bash', command: 'false' })
  await $.tool.call({ tool: 'Bash', command: 'false' })
  await clock.advance(100)
  expect(await ui.find({ type: 'Text', text: /頭暈了/ })).toBeDefined()
  await ui.unmount()
})

/** Every backgroundColor in a drawn tree, and its Rasters. */
function walkTree(node: unknown, out: { bgs: string[]; rasters: { columns: number; rows: number; cells: string }[] }) {
  if (node === null || typeof node !== 'object') return out
  const n = node as { type?: string; props?: Record<string, unknown>; children?: unknown[] }
  const props = n.props ?? {}
  if (typeof props.backgroundColor === 'string') out.bgs.push(props.backgroundColor)
  if (n.type === 'Raster') out.rasters.push(props as never)
  const kids = (n.children ?? props.children ?? []) as unknown
  for (const k of Array.isArray(kids) ? kids : [kids]) walkTree(k, out)
  return out
}

test('cells: the stage takes the Raster’s colour, and she stands in the middle of the band', async ($, on) => {
  engine(on) // no fs.read: no picture, so cells
  await $.session.start({ cwd: '/', surface: 'terminal', isInteractive: true })
  const ui = await $.ui.mount({ ...BAND, props: { ...BAND.props, maxRows: 20, bodyColumns: 120 }, surface: 'terminal' })
  const { bgs, rasters } = walkTree(await ui.drawn(), { bgs: [], rasters: [] })
  expect(bgs).toContain('#222222') // #26201B as a Raster paints it
  expect(bgs).not.toContain('#26201B')
  const r = rasters[0]!
  const words = new Uint32Array(Uint8Array.from(atob(r.cells), c => c.charCodeAt(0)).buffer)
  const blankLeft = Math.min(
    ...Array.from({ length: r.rows }, (_, y) => {
      let x = 0
      while (x < r.columns && words[(y * r.columns + x) * 3] === 0x20) x++
      return x
    }),
  )
  expect(blankLeft).toBeGreaterThanOrEqual(6) // half the stroll's room lies to her left
  await ui.unmount()
})

test('pictures keep the stage colour as it is', async ($, on) => {
  engine(on)
  on('fs.read', () => ({ value: { base64: PNG } }))
  await $.session.start({ cwd: '/', surface: 'terminal', isInteractive: true })
  const ui = await $.ui.mount({ ...BAND, surface: 'terminal' })
  const { bgs } = walkTree(await ui.drawn(), { bgs: [], rasters: [] })
  expect(bgs).toContain('#26201B')
  await ui.unmount()
})
