'use strict'

const spawn = require('child_process').spawn
const path = require('path')
const chalk = require('chalk')

const cmdArguments = process.argv.slice(2).join(' ').toLowerCase()

const doApiScan = cmdArguments.includes('api')
const doBaselineScan = cmdArguments.includes('baseline')

if (!(doBaselineScan || doApiScan)) {
  console.log(chalk.green('No scans specified for the runner. Exiting.'))
  process.exit(0)
}

const server = require('../../index')

// Due to the fact Docker does networking differently on OSX and this script might be runt manually
// we need to compensate for the host part of the test endpoint
const isOSX = process.platform === 'darwin'
const baseEndpoint = `${server.info.protocol}://${isOSX ? 'docker.for.mac.localhost' : server.info.host}:${server.info.port}`
const swaggerEndpoint = `${baseEndpoint}/swagger.json`
const reportNameDatePart = new Date().toISOString()
const baselineReportName = `udaru-basline-scan-${reportNameDatePart}.html`
const apiReportName = `udaru-api-scan-${reportNameDatePart}.html`
const reportDestination = path.join(process.cwd(), path.join('docs', 'udaru', 'pentests'))

const command = `sh`
const params = ['runner.sh', baseEndpoint, swaggerEndpoint, baselineReportName, apiReportName, reportDestination, `--baseline=${doBaselineScan}`, `--api=${doApiScan}`]

function executeMap (command, params, done) {
  console.log('Command that will be used:', command)

  console.log(chalk.green('executing with: ', ([command].concat(params)).join(' ')))

  const docker = spawn(command, params, {cwd: __dirname, env: process.env})

  docker.stdout.on('data', (data) => {
    console.log(`docker: ${data}`)
  })

  docker.stderr.on('data', (data) => {
    console.log('error', data.toString())
    console.error(data.toString())
  })

  docker.on('error', (error) => {
    console.error(chalk.red(error))
    done(new Error('failed to start child process'))
  })

  docker.on('close', (code) => {
    console.log(chalk.green(`child process exited with code ${code}\n`))
    done(null)
  })
}

executeMap(command, params, async (err) => {
  await server.stop()
  if (err) {
    console.error(chalk.red(err))
    return process.exit(1)
  }

  console.log(chalk.green(`HTML reports should be at ${reportDestination}. Commit to master to publish on gh-pages.`))
  return process.exit()
})
