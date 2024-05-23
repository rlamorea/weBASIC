import express from "express"
import cors from "cors"

import path from "path"
import fs from "fs"
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const fileRoot = path.resolve(__dirname, '..', 'examples')

const app = express()
const port = 6511

app.use(cors())
app.use(express.json())

app.get('/', (req, res) => {
  res.send({ webasic: true })
});

app.get('/catalog', (req, res) => {
  const contents = fs.readdirSync(fileRoot)
  res.send(contents)
})

app.post('/save', (req, res) => {
  console.dir(req)
  const { filename, fileContents } = req.body
  fs.writeFileSync(path.resolve(fileRoot, filename), fileContents)
  res.send({ saved: true })
})

app.get('/load', (req, res) => {
  const { filename } = req.query
  const fileContents = fs.readFileSync(path.resolve(fileRoot, filename), 'utf8')
  res.send({ fileContents })
})

app.listen(port, () => {
  console.log(`Server is running on port ${port}`)
})
