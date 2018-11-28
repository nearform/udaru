'use strict'

const expect = require('code').expect
const Lab = require('lab')
const lab = exports.lab = Lab.script()
const path = require('path')
const fs = require('fs')
const childProcess = require('child_process')
const chalk = require('chalk')
const _ = require('lodash')

function sendCurl (curl) {
  var response = childProcess.execSync(curl)
  return JSON.parse(removeDynamicVariablesEtc(response))
}

function removeDynamicVariablesEtc (s) {
  s = s.toString('UTF8')
  // removing variables that are dynamic ids and instances
  s = s.replace(/,"instance":\s*\d+/igm, '')
  s = s.replace(/"id":\s*"[A-Za-z0-9-]+",/igm, '')
  // in docs when only section of response is specified we need to remove to parse
  s = s.replace(/\.\./igm, '')
  return s
}

// get all the code sections
// we're looking for curl requests followed by json responses
// if there's no json response we set response to null
function parseFile (fileContents) {
  const matches = fileContents.match(/```([^\0]*?)```/gm)
  const commands = []
  for (let i = 0; i < matches.length; i++) {
    const matchParts = matches[i].split('\n')
    if (matchParts.length > 2) {
      let code = (_.slice(matchParts, 1, matchParts.length - 1)).join('\n')
      if (code.toLowerCase().startsWith('curl')) {
        commands.push({request: code})
      } else if (commands[commands.length - 1] && !commands[commands.length - 1].response) {
        try {
          code = removeDynamicVariablesEtc(code)
          commands[commands.length - 1].response = JSON.parse(code)
        } catch (e) {
          console.log(chalk.yellow('Warning: Cannot parse response: ' + code + '\n' + e))
        }
      }
    }
  }
  return commands
}

// just print the commands to show what we're going to test
// handy for post test run analysis for fixing issues
function printCommands (commands) {
  for (let i = 0; i < commands.length; i++) {
    console.log('\nRequest / response pair: ' + (i + 1))
    console.log(chalk.blue(commands[i].request))
    if (commands[i].response) {
      console.log(chalk.cyan(JSON.stringify(commands[i].response, null, 2)))
    } else {
      console.log(chalk.yellow('Warning: no response specified (will just test for a valid response)'))
    }
  }
}

function killServer (server) {
  if (server) {
    console.log(chalk.red('\nShutting down server...'))
    server.kill()
  }
}

lab.experiment('Test example curl commands', () => {
  let server = null
  let curlCommands = null
  lab.before(() => {
    return new Promise((resolve, reject) => {
      console.log('Starting server: ' + path.join(__dirname, '../index'))
      server = childProcess.fork(path.join(__dirname, '../index'), [], ['ignore', 'ignore', 'ignore', 'ipc'])

      server.on('message', (m) => {
        if (m.indexOf('Server started on:') !== -1) {
          console.log(chalk.green(m))
          console.log('Reading example.md file...')
          // concerned about this line, can only be run in dev
          fs.readFile(path.join(__dirname, '../../../docs/example.md'), 'utf8', function (err, data) {
            if (err) {
              killServer(server)
              reject(err)
            } else {
              try {
                console.log('Parsing test data...')
                curlCommands = parseFile(data)
                printCommands(curlCommands)
                resolve()
              } catch (e) {
                killServer(server)
                reject(e)
              }
            }
          })
        } else {
          reject(Error('Error starting server'))
        }
      })
    })
  })

  lab.test('check that we have commands', async () => {
    expect(curlCommands.length).to.exist()
    // console.log(fileContents)
  })

  lab.test('test requests/responses', async () => {
    for (let i = 0; i < curlCommands.length; i++) {
      console.log('\nTesting command: ' + (i + 1))
      console.log(chalk.blue(curlCommands[i].request))
      let response = sendCurl(curlCommands[i].request)
      console.log('Response received: ')
      console.log(chalk.cyan(JSON.stringify(response, null, 2)))
      expect(response).to.exist()
      if (curlCommands[i].response) {
        if (response.data && !curlCommands[i].response.data) {
          console.log('Response.data should contain:')
          console.log(chalk.cyan(JSON.stringify(curlCommands[i].response, null, 2)))
          expect(response.data).to.contain(curlCommands[i].response)
        } else {
          console.log('Response should contain:')
          console.log(chalk.cyan(JSON.stringify(curlCommands[i].response, null, 2)))
          expect(response).to.contain(curlCommands[i].response)
        }
      } else {
        console.log(chalk.yellow('No response to test against'))
      }
      console.log(chalk.green('Test Passed'))
    }
  })

  lab.after(() => {
    killServer(server)
  })
})
