import path from 'node:path'
import { fileURLToPath } from 'node:url'
import express from 'express'

const app = express()
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

app.use(express.static(path.join(__dirname, 'dist')))

app.get('*', (req, res) => {
  console.log(`Serving index.html for: ${req.originalUrl}`)
  res.sendFile(path.join(__dirname, 'dist/index.html'))
})

app.listen(3000, () => {
  console.log('Static server started and listening on port 3000')
})
