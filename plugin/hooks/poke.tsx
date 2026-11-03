// The click target laid over her picture: draws nothing, so the picture shows
// through, and posts each left click to the hooks module (`ui.message`).
import type { ClientModule } from 'claude-code'

const Poke: ClientModule = (_props, surface) => {
  surface.onPointer(e => {
    if (e.type === 'down' && e.button === 'left') surface.post({ poke: true })
  })
  const { Box } = surface.elements
  return <Box />
}

export default Poke
