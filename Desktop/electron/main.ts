import { app, BrowserWindow } from 'electron'
import { spawn, ChildProcess } from 'child_process'
import http from 'http'
// import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

// const require = createRequire(import.meta.url)
const __dirname = path.dirname(fileURLToPath(import.meta.url))

// The built directory structure
//
// ├─┬─┬ dist
// │ │ └── index.html
// │ │
// │ ├─┬ dist-electron
// │ │ ├── main.js
// │ │ └── preload.mjs
// │
process.env.APP_ROOT = path.join(__dirname, '..')

// 🚧 Use ['ENV_NAME'] avoid vite:define plugin - Vite@2.x
export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']
export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron')
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist')

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, 'public') : RENDERER_DIST

let win: BrowserWindow | null
let apiProcess: ChildProcess | null = null

// Function to start the backend API server
function startApiServer() {
  try {
    // Path to your API directory
    let apiPath: string
    
    if (VITE_DEV_SERVER_URL) {
      // Development mode - use the original API path
      apiPath = path.join(process.env.APP_ROOT, '..', 'Api')
    } else {
      // Production mode - use the bundled API path
      const resourcesPath = path.join(path.dirname(app.getPath('exe')), 'resources')
      apiPath = path.join(resourcesPath, 'api-server')
    }
    
    console.log('Starting API server from:', apiPath)
    
    // Start the API server using Node.js
    apiProcess = spawn('node', ['server.js'], {
      cwd: apiPath,
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env, PORT: '3002' } // Set the port explicitly
    })

    if (apiProcess.stdout) {
      apiProcess.stdout.on('data', (data) => {
        console.log(`API Server: ${data}`)
      })
    }

    if (apiProcess.stderr) {
      apiProcess.stderr.on('data', (data) => {
        console.error(`API Server Error: ${data}`)
      })
    }

    apiProcess.on('close', (code) => {
      console.log(`API server process exited with code ${code}`)
      apiProcess = null
    })

    apiProcess.on('error', (error) => {
      console.error('Failed to start API server:', error)
      apiProcess = null
    })

    console.log('API server started with PID:', apiProcess.pid)
  } catch (error) {
    console.error('Error starting API server:', error)
  }
}

// Function to stop the API server
function stopApiServer() {
  if (apiProcess) {
    console.log('Stopping API server...')
    apiProcess.kill('SIGTERM')
    apiProcess = null
  }
}

// Function to check if API is running
function checkApiHealth(): Promise<boolean> {
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: 3002,
      path: '/',
      method: 'GET',
      timeout: 1000
    }

    const req = http.request(options, (res) => {
      resolve(res.statusCode === 200)
    })

    req.on('error', () => {
      resolve(false)
    })

    req.on('timeout', () => {
      resolve(false)
    })

    req.end()
  })
}

// Function to wait for API to be ready
async function waitForApi(maxAttempts = 10): Promise<boolean> {
  for (let i = 0; i < maxAttempts; i++) {
    console.log(`Checking API health, attempt ${i + 1}/${maxAttempts}`)
    
    if (await checkApiHealth()) {
      console.log('API is ready!')
      return true
    }
    
    // Wait 1 second before next attempt
    await new Promise(resolve => setTimeout(resolve, 1000))
  }
  
  console.error('API failed to start after maximum attempts')
  return false
}

function createWindow() {
  win = new BrowserWindow({
    icon: path.join(process.env.VITE_PUBLIC, 'electron-vite.svg'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
    },
  })

  // Test active push message to Renderer-process.
  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', (new Date).toLocaleString())
  })

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
  } else {
    // win.loadFile('dist/index.html')
    win.loadFile(path.join(RENDERER_DIST, 'index.html'))
  }
}

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  stopApiServer() // Stop the API server when app closes
  if (process.platform !== 'darwin') {
    app.quit()
    win = null
  }
})

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

// Handle app termination
app.on('before-quit', () => {
  stopApiServer()
})

app.on('will-quit', () => {
  stopApiServer()
})

// Start the app
app.whenReady().then(async () => {
  // Start API server first
  startApiServer()
  
  // Wait for API to be ready
  const apiReady = await waitForApi()
  
  if (apiReady) {
    console.log('API is ready, creating window...')
    createWindow()
  } else {
    console.error('Failed to start API server, creating window anyway...')
    createWindow()
  }
})
