'use strict'

/**
 * This script will run the coding standard only for the staged files that are about to be committed
 */

const uuid = require('uuid/v4')
const git = require('simple-git')()
const linter = require('spacey-standard')
const sgf = require('staged-git-files')
const stashIdentifier = 'linterStash' + uuid()

function done (err, exitStatus = 0) {
  if (err) console.log(err)

  git.stash({ 'list': null }, (err, list) => {
    if (err) {
      console.log(err)
      process.exit(1)
    }

    if (list.indexOf(stashIdentifier) === -1) {
      console.log('Notice: Will not run git stash pop, nothing to pop')
      return process.exit(exitStatus)
    }

    git.stash({'pop': null}, (err) => {
      if (err) console.log(err)
      process.exit(exitStatus)
    })
  })
}

git.stash({ 'save': null, '-k': null, [stashIdentifier]: null }, (err, res) => {
  if (err) {
    console.log(err)
    process.exit(1)
  }

  sgf(function (err, files) {
    let exitStatus = 0

    if (err) {
      return done(err, 1)
    }

    files = files.map(f => f.filename).filter(f => f.endsWith('.js'))

    linter.lintFiles(files, (err, result) => {
      if (err) {
        done(err, 1)
      }

      const errors = []
      if (result.results.length > 0) {
        result.results.forEach((res) => {
          res.messages.forEach((message) => {
            errors.push(`${res.filePath}:${message.line || 0}:${message.column || 0}  ${message.message}`)
          })
        })
      }

      if (errors.length > 0) {
        exitStatus = 1
        console.log('Linter errors:')
        errors.forEach(e => console.log(e))
      }

      done(null, exitStatus)
    })
  })
})

