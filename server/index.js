import express from "express"
import cors from "cors"

import path from "path"
import fs from "fs"
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const fileRoot = path.resolve(__dirname, '..', 'examples') // temporary for now
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

function normalizeDirPath(dirPath) {
  dirPath = path.relative(fileRoot, dirPath) + '/'
  if (dirPath.startsWith('..')) { return { error: 'Invalid Path' } }
  if (dirPath !== '/') { dirPath = '/' + dirPath } // make "absolute" from fileroot
  return dirPath
}

function denormalizeFilename(filename) {
  return filename.startsWith('/') ?
    path.resolve(fileRoot, filename.substring(1)) :
    path.resolve(currentDirectory, filename)
}

function createPathIfNeeded(dirPath) {
  let created = false
  if (!fs.existsSync(dirPath)) {
    // start seeing if we can build a new directory
    let pathSegments = path.relative(fileRoot, dirPath).split(path.sep)
    let explorePath = fileRoot
    for (const segment of pathSegments) {
      explorePath = path.resolve(explorePath, segment)
      const stats = fs.lstatSync(explorePath, { throwIfNoEntry: false })
      if (!stats) {
        fs.mkdirSync(explorePath)
        created = true
      } else if (stats.isFile()) {
        return { error: 'Invalid Directory Path' }
      }
    }
  }
  return created
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
    const normalDirPath = normalizeDirPath(dirPath)
    if (normalDirPath.error) {
      res.send(normalDirPath)
      return
    }
    const directory = getDirectoryEntries(dirPath, prefix, suffix, recurse)
    res.send({ path: normalDirPath, files: directory })
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
  let created = createPathIfNeeded(dirPath)
  if (created.error) {
    res.send(created)
    return
  }
  const normalDirPath = normalizeDirPath(dirPath)
  if (normalDirPath.error) {
    res.send(normalDirPath)
    return
  }
  currentDirectory = dirPath
  res.send({ done: true, path: normalDirPath, created })
})

app.post('/save', (req, res) => {
  const { filename, fileContents } = req.body
  const filepath = denormalizeFilename(filename)
  const pathInfo = path.parse(filepath)
  const created = createPathIfNeeded(pathInfo.dir)
  if (created.error) {
    res.send(created)
    return
  }
  const stats = fs.lstatSync(filepath, { throwIfNoEntry: false })
  if (stats && stats.isDirectory()) {
    res.send({ error: 'Invalid Filename' })
    return
  }
  let changeDir = false
  const fileDir = path.relative(fileRoot, pathInfo.dir)
  if (fileDir.startsWith('..')) {
    res.send({ error: 'Invalid Path' })
    return
  }
  fs.writeFileSync(filepath, fileContents)
  if (fileDir !== path.relative(fileRoot, currentDirectory)) {
    changeDir = true
    currentDirectory = path.resolve(fileRoot, fileDir)
  }
  res.send({ saved: true, path: fileDir, changeDir, filepath: fileDir + '/' + pathInfo.base })
})

app.get('/load', (req, res) => {
  const { filename } = req.query
  const filepath = denormalizeFilename(filename)
  const stats = fs.lstatSync(filepath, { throwIfNoEntry: false })
  if (!stats) {
    res.send({ error: 'Unknown File' })
    return
  } else if (stats.isDirectory()) {
    res.send({ error: 'Invalid Filename' })
    return
  }
  const pathInfo = path.parse(filepath)
  let changeDir = false
  const fileDir = path.relative(fileRoot, pathInfo.dir)
  if (fileDir.startsWith('..')) {
    res.send({ error: 'Invalid Path' })
    return
  }
  if (fileDir !== path.relative(fileRoot, currentDirectory)) {
    changeDir = true
    currentDirectory = path.resolve(fileRoot, fileDir)
  }
  const fileContents = fs.readFileSync(filepath, 'utf8')
  res.send({ fileContents, path: fileDir, changeDir, filepath: fileDir + '/' + pathInfo.base })
})

app.post('/scratch', (req, res) => {
  const { filename } = req.body
  const filepath = denormalizeFilename(filename)
  const stats = fs.lstatSync(filepath, { throwIfNoEntry: false })
  if (!stats) {
    res.send({ error: 'Unknown File' })
    return
  } else if (stats.isDirectory()) {
    // make sure directory is empty
    const dirContents = fs.readdirSync(filepath, { withFileTypes: true })
    if (dirContents.length > 0) {
      res.send({error: 'Directory Not Empty'})
      return
    }
  }
  if (filepath === currentDirectory) {
    res.send({ error: 'Cannot Scratch Current Directory' })
    return
  }
  const pathInfo = path.parse(filepath)
  const fileDir = path.relative(fileRoot, pathInfo.dir)
  if (fileDir.startsWith('..')) {
    res.send({ error: 'Invalid Path' })
    return
  }
  let scratchFile = fileDir + '/' + pathInfo.base
  if (stats.isDirectory()) {
    fs.rmdirSync(filepath)
    scratchFile += '/'
  } else {
    fs.unlinkSync(filepath)
  }
  res.send({ scratched: true, filepath: scratchFile })
})

function prepFileCopyMove(req) {
  const { filename, newfile } = req.body
  const filepath = denormalizeFilename(filename)
  let newpath = denormalizeFilename(newfile)

  const fileStats = fs.lstatSync(filepath, { throwIfNoEntry: false })
  if (!fileStats) {
    return { error: 'Unknown File' }
  } else if (fileStats.isDirectory()) {
    return { error: 'Invalid Filename' }
  }

  let pathInfo = path.parse(filepath)
  const fileDir = path.relative(fileRoot, pathInfo.dir)
  if (fileDir.startsWith('..')) {
    return { error: 'Invalid Path'}
  }
  let sourceFile = fileDir + '/' + pathInfo.base

  const newStats = fs.lstatSync(newpath, { throwIfNoEntry: false })
  if (!newStats && newfile.endsWith('/')) {
    const createDir = createPathIfNeeded(newpath)
    if (createDir.error) {
      return createDir
    }
    newpath = path.resolve(newpath, pathInfo.base)
  } else if (newStats && newStats.isDirectory()) {
    newpath = path.resolve(newpath, pathInfo.base)
  } else if (newStats) {
    return { error: 'File Exists' }
  }

  pathInfo = path.parse(newpath)
  const newDir = path.relative(fileRoot, pathInfo.dir)
  if (newDir.startsWith('..')) {
    return { error: 'Invalid Path' }
  }
  let destFile = newDir + '/' + pathInfo.base

  return { filepath, newpath, sourceFile, destFile }
}

app.post('/copy', (req, res) => {
  const result = prepFileCopyMove(req, res)
  if (result.error) {
    res.send(result)
    return
  }

  fs.cpSync(result.filepath, result.newpath)
  res.send({ copied: true, filepath: result.sourceFile, newpath: result.destFile })
})

app.post('/rename', (req, res) => {
  const result = prepFileCopyMove(req, res)
  if (result.error) {
    res.send(result)
    return
  }

  fs.cpSync(result.filepath, result.newpath)
  fs.unlinkSync(result.filepath)
  res.send({ copied: true, filepath: result.sourceFile, newpath: result.destFile })
})

app.listen(port, () => {
  console.log(`Server is running on port ${port}`)
})
