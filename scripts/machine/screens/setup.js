import { version } from '../../config.js'
import { get, set } from 'idb-keyval'

let settings = null

const RootFolderMessage = 'CHOOSE DEFAULT PROGRAM FOLDER'
const NewFolderMessage = 'CHOOSE NEW FOLDER'
const LoadFileMessage = 'CHOOSE FILE TO LOAD'
const SaveFileMessage = 'CHOOSE SAVE FILE'

export default class SetupScreen {
  constructor() {
    this.div = document.createElement('div')
    this.div.id = 'setup-screen'
    this.div.classList.add('setup')
    document.body.appendChild(this.div)

    const h1 = document.createElement('h1')
    h1.innerHTML = `weBASIC v${version}`
    this.div.appendChild(h1)

    const configFileSystem = document.createElement('button')
    configFileSystem.innerHTML = RootFolderMessage
    this.div.appendChild(configFileSystem)
    configFileSystem.addEventListener('click', () => { this.doConfigFileSystem() })

    const noFileSystem = document.createElement('button')
    noFileSystem.innerHTML = 'NO DEFAULT PROGRAM FOLDER'
    noFileSystem.classList.add('alternate')
    this.div.appendChild(noFileSystem)
    noFileSystem.addEventListener('click', () => { this.doNoFileSystem() })

    this.fileSystemDiv = document.createElement('div')
    this.fileSystemDiv.id = 'file-system-action'
    this.fileSystemDiv.classList.add('setup')
    document.body.appendChild(this.fileSystemDiv)

    this.fileSystemAction = document.createElement('button')
    this.fileSystemDiv.appendChild(this.fileSystemAction)
    this.fileSystemAction.addEventListener('click', () => { () => this.doFileSystemAction() })

    this.fileSystemCancel = document.createElement('button')
    this.fileSystemCancel.classList.add('alternate')
    this.fileSystemCancel.innerHTML = 'CANCEL'
    this.fileSystemDiv.appendChild(this.fileSystemCancel)
    this.fileSystemCancel.addEventListener('click', () => { this.doFileSystemCancel() })

    this.listeners = []
    this.prepSettings()
  }

  addSettingsListener(listener) {
    this.listeners.push(listener)

    if (settings !== null) {
      listener(this.getSettings())
    }
  }

  settingsUpdated() {
    const newSettings = this.getSettings()
    for (const listener of this.listeners) {
      listener(newSettings)
    }
  }

  async prepSettings() {
    const rootFolder = await get('rootFolder')
    if (rootFolder) {
      settings = { rootFolder }
    }

    if (settings === null) {
      this.div.style.display = 'block'
    }
  }

  getSettings(){
    if (settings === null) { return null }
    const settingsCopy = { ...settings }
    settingsCopy.freeze()
    return settingsCopy
  }

  async doConfigFileSystem() {
    try {
      const dirHandle = await window.showDirectoryPicker();
      settings = { rootFolder: dirHandle }
      set('rootFolder', dirHandle)
      this.settingsUpdated()
      this.div.style.display = 'none' // hide it now that it is done
    } catch (e) {
      // eat cancel and just wait for one of the options to be selected
    }
  }

  doNoFileSystem() {
    settings = { noFileSystem: true }
    this.div.style.display = 'none'
    this.settingsUpdated()
  }

  async getFileSystemAction(action) {
    this.fileSystemDiv.style.display = 'block'
    this.fileSystemActionToTake = action
    let self = this
    const returnPromise = new Promise( (resolve) => {
      self.fileSystemActionResolve = resolve
    })
    switch (action) {
      case 'root-restore':
        if (settings.rootFolder) {
          this.fileSystemActionResolve(settings.rootFolder)
          break
        }
      // note: fallthrough
      case 'root' :
        this.fileSystemActionToTake = 'root'
        this.fileSystemAction.innerHTML = RootFolderMessage
        break
      case 'dir' :
        this.fileSystemAction.innerHTML = NewFolderMessage
        break
      case 'file-load':
        this.fileSystemAction.innerHTML = LoadFileMessage
      case 'file-save':
        this.fileSystemAction.innerHTML = SaveFileMessage
        break
    }
    return returnPromise
  }

  async doFileSystemAction() {
    try {
      if (this.fileSystemActionToTake === 'root' || this.fileSystemActionToTake === 'dir') {
        const dirHandle = await window.showDirectoryPicker();
        this.fileSystemDiv.style.display = 'none'
        if (this.fileSystemActionToTake === 'root') {
          settings = { rootFolder: dirHandle }
          set('rootFolder', dirHandle)
          this.settingsUpdated()
        }
        this.fileSystemActionResolve(dirHandle)
      } else if (this.fileSystemActionToTake === 'file-save') {
        // TODO
      } else { // file-load
        // TODO
      }
    } catch (e) {
      // ignore cancels and keep the screen waiting
    }
  }

  doFileSystemCancel() {
    this.fileSystemDiv.style.display = 'none'
    this.fileSystemActionResolve(null)
  }
}
