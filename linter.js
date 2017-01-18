'use strict'

/**
 * This script will run the coding standard only for the staged files that are about to be committed
 */

const git = require('simple-git')()
const linter = require('spacey-standard')
const sgf = require('staged-git-files')

function done (err, exitStatus = 0) {
  if (err) console.log(err)

  return git.stash({'pop': null}, (err) => {
    if (err) console.log(err)
    process.exit(exitStatus)
  })
}

git.stash({ '-k': null }, (err, res) => {
  if (err) {
    console.log(err)
    process.exit(1)
  }

  sgf(function (err, result) {
    if (err) {
      return done(err, 1)
    }

    const files = result.map(f => f.filename).filter(f => f.endsWith('.js'))
    let exitStatus = 0

    linter.lintFiles(files, (err, result) => {
      if (err) {
        done(err, 1)
      }

      if (result.results.length > 0) {
        console.log('Linter errors:')
        result.results.forEach((res) => {
          res.messages.forEach((message) => {
            exitStatus = 1
            console.log(`${res.filePath}:${message.line || 0}:${message.column || 0}  ${message.message}`)
          })
        })
      }

      done(null, exitStatus)
    })
  })
})

