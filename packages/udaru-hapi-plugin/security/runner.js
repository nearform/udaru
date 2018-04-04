'use strict'

const jsonfile = require('jsonfile')
const spawn = require('child_process').spawn
const exec = require('child_process').exec
const path = require('path')
const source = path.join(__dirname, 'fixtures/injection-endpoints.json')
const chalk = require('chalk')
const hapi = spawn('node', [path.join(__dirname, '../start.js')])

const endpoints = jsonfile.readFileSync(source, { throws: false })

if (!endpoints) {
  console.error('Invalid JSON file.')
  process.exit(1)
}

function findPython2 (pythonCommand, done) {
  return new Promise((resolve, reject) => {
    exec(`${pythonCommand} --version`, function (_err, stdout, stderr) {
      if (stderr.indexOf('Python 2.') >= 0) {
        console.log(chalk.green(`'${pythonCommand}' is a valid Python2 ✔️`))
        return resolve(pythonCommand)
      }

      resolve(false)
    })
  })
}

function executeMap (command, config, urlDescription) {
  console.log('Python command that will be used:', command)

  return new Promise((resolve, reject) => {
    const params = [
      `./node_modules/sqlmap/sqlmap.py`,
      `--url=${urlDescription.url}`,
      `--method=${urlDescription.method}`,
      `--headers=${urlDescription.headers}`,
      `--level=${config.level}`,
      `--risk=${config.risk}`,
      `--dbms=${config.dbms}`,
      `--timeout=${config.timeout}`,
      `-v`, `${config.verbose}`,
      `--flush-session`,
      `--batch`
    ]
    if (urlDescription.params) {
      params.push(`-p`)
      params.push(`${urlDescription.params}`)
    }
    if (urlDescription.data) {
      params.push(`--data=${urlDescription.data}`)
    }

    console.log(chalk.green('executing sqlmap with: ', (['' + command].concat(params)).join(' ')))

    const sql = spawn(command, params)
    let vulnerabilities = false

    sql.stdout.on('data', (data) => {
      if (data.length > 1) {
        console.log(`sqlmap: ${data}`)
      }
      if (data.indexOf('identified the following injection') >= 0) {
        vulnerabilities = true
      }
    })

    sql.stderr.on('data', (data) => {
      reject(data)
    })

    sql.on('error', (error) => {
      console.error(chalk.red(error))
      reject(new Error('failed to start child process'))
    })

    sql.on('close', (code) => {
      console.log(chalk.green(`child process exited with code ${code}\n`))
      resolve(vulnerabilities)
    })
  })
}

async function runner () {
  try {
    const pythons = await Promise.all([
      findPython2('python2'),
      findPython2('python')
    ])

    const python = pythons.find(f => f)

    hapi.stdout.once('data', async (data) => {
      console.log(chalk.green(`hapi: ${data}`))
      let vulnerabilities
      let endpointError

      for (const urlDescription of endpoints.urls) {
        try {
          const v = await executeMap(python, endpoints, urlDescription)

          if (v) {
            vulnerabilities = v
            break
          }
        } catch (err) {
          endpointError = err
          break
        }
      }

      if (endpointError) {
        console.error(chalk.red(endpointError))
      } else if (vulnerabilities) {
        console.error(chalk.red('[CRITICAL] FOUND injection vulnerabilities\n\n'))
      } else {
        console.log(chalk.green('no injection vulnerabilities found\n\n`'))
      }

      hapi.kill()
      return process.exit(endpointError || vulnerabilities ? 1 : 0)
    })

    hapi.stderr.on('data', (data) => {
      console.error(chalk.red(`stderr: ${data}`))
    })

    hapi.on('close', (code) => {
      console.log(chalk.green(`child process exited with code ${code}`))
    })
  } catch (err) {
    console.error(chalk.red(err))
  }
}

runner().catch(console.error)
