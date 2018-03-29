'use strict'

const expect = require('code').expect
const Lab = require('lab')
const lab = exports.lab = Lab.script()
const fs = require('fs')
const asyncify = require('../../lib/asyncify')

function wrapFileOpening (path, names, cb) {
  let promise = null

  if (typeof cb !== 'function') {
    [promise, cb] = asyncify(...(names || []))
  }

  fs.readFile(path, cb)

  return promise
}

lab.experiment('asyncify', () => {
  lab.test('Using callback without errors', (done) => {
    wrapFileOpening('../../package.json', [], (err, contents) => {
      expect(err).not.to.exist()
      expect(contents).be.buffer()
      done()
    })
  })

  lab.test('Using callback with a error', (done) => {
    wrapFileOpening('../../package.json-123', [], (err, contents) => {
      expect(err.message).to.startWith('ENOENT: no such file or directory')
      expect(contents).not.to.exist()
      done()
    })
  })

  lab.test('Using promises, without names and without errors', (done) => {
    wrapFileOpening('../../package.json')
      .then(contents => {
        expect(contents).be.buffer()
        done()
      })
      .catch(done)
  })

  lab.test('Using promises, with names and without errors', (done) => {
    wrapFileOpening('../../package.json', ['file'])
      .then(contents => {
        expect(contents).be.object()
        expect(contents.file).be.buffer()
        done()
      })
      .catch(done)
  })

  lab.test('Using promises with a error', (done) => {
    wrapFileOpening('../../package.json-123')
      .catch(err => {
        expect(err.message).to.startWith('ENOENT: no such file or directory')
        done()
      })
      .catch(done)
  })
})
