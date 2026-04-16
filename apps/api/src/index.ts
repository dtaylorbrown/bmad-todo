import { serve } from '@hono/node-server'
import { Hono } from 'hono'

export const app = new Hono()

app.get('/health', (c) => {
  return c.json({ status: 'ok' })
})

app.get('/', (c) => {
  return c.text('Hello Hono!')
})

const isDirectExecution =
  process.argv[1] && import.meta.url === new URL(process.argv[1], 'file:').href

if (isDirectExecution) {
  serve(
    {
      fetch: app.fetch,
      port: Number(process.env.PORT ?? 3000),
    },
    (info) => {
      console.log(`Server is running on http://localhost:${info.port}`)
    },
  )
}
