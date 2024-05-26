import express from "express"
import cors from "cors"

import path from "path"
import fs from "fs"
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const fileRoot = path.resolve(__dirname, '..') //, 'examples') temporary for now
let currentDirectory = fileRoot

const app = express()
const port = 6511

app.use(cors())
app.use(express.json())

// helpers
function cleanDirPath(dirPath) {
  if (dirPath.length > 1 && dirPath.endsWith('/')) {
    dirPath = dirPath.substring(0, dirPath.length - 1)
  }
  if (dirPath === '.' || dirPath === '') {
    dirPath = currentDirectory
  } else if (dirPath === '/') {
    dirPath = fileRoot
  } else if (dirPath.startsWith('/')) {
    dirPath = `${fileRoot}${dirPath}`
  } else if (dirPath.startsWith('./')) {
    dirPath = `${currentDirectory}/${dirPath.substring(2)}`
  } else if (dirPath === '..' || dirPath.startsWith('../')) {
    if (currentDirectory === fileRoot || currentDirectory === fileRoot + '/') {
      return null
    }
    dirPath = path.resolve(currentDirectory, '..', dirPath.substring(2))
  } else {
    dirPath = `${currentDirectory}/${dirPath}`
  }
  return dirPath
}

function getDirectoryEntries(dirPath, prefix = null, suffix = null, recurse = false, recursePath = null) {
  let pathToRead = dirPath
  if (recursePath && !dirPath.endsWith('/')) {
    pathToRead += '/'
  }
  pathToRead += (recursePath || '')
  const dirContents = fs.readdirSync(pathToRead, { withFileTypes: true })
  let directoryEntries = []
  for (const entry of dirContents) {
    let dirEntry = entry.name
    const matching =
      (!prefix || dirEntry.startsWith(prefix)) &&
      (!suffix || dirEntry.endsWith(suffix))
    dirEntry = (recursePath || '') + dirEntry + (entry.isDirectory() ? '/' : '')
    let pathEntries = null
    if (entry.isDirectory() && recurse) {
      pathEntries = getDirectoryEntries(dirPath, prefix, suffix, recurse, dirEntry)
      if (pathEntries.length === 0) {
        pathEntries = null
      } else {
        pathEntries.map((x) => `${dirEntry}${x}`)
      }
    }
    if (matching) { directoryEntries.push(dirEntry) }
    if (pathEntries) { directoryEntries.push(...pathEntries) }
  }
  return directoryEntries
}

app.get('/', (req, res) => {
  res.send({ webasic: true })
});

app.get('/catalog', (req, res) => {
  let { path: dirPath, prefix, suffix } = req.query
  dirPath = dirPath || '.'
  let recurse = false
  if (dirPath.endsWith('...')) {
    dirPath = dirPath.substring(0, dirPath.length - 3)
    recurse = true
  }
  dirPath = cleanDirPath(dirPath)
  if (dirPath === null) {
    res.send({ error: 'Invalid Directory' })
    return
  }
  try {
    const directory = getDirectoryEntries(dirPath, prefix, suffix, recurse)
    dirPath = dirPath.replace(fileRoot, '/')
    if (dirPath.startsWith('//')) { dirPath = dirPath.substring(1) }
    res.send({ path: dirPath, files: directory })
  } catch (e) {
    if (e.code === 'ENOENT') {
      res.send({ error: 'Invalid Directory' })
      // let message = e.message.substring(8)
      // let commaIdx = message.indexOf(',')
      // if (commaIdx >= 0) { message = message.substring(0, commaIdx) }
      // res.send({ error: message })
    }
  }
})

app.post('/setdir', (req, res) => {
  let { path: dirPath } = req.body
  dirPath = cleanDirPath(dirPath)
  if (dirPath === null) {
    res.send({ error: 'Invalid Directory' })
    return
  }
  if (!fs.existsSync(dirPath)) {
    res.send({ error: 'Invalid Directory'})
    return
  }
  currentDirectory = dirPath
  let newPath = dirPath.replace(fileRoot, '/')
  if (newPath.startsWith('//')) { newPath = newPath.substring(1) }
  res.send({ done: true, newPath })
})

app.post('/save', (req, res) => {
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
