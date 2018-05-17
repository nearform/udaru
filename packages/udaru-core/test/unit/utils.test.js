const Lab = require('lab')
const lab = exports.lab = Lab.script()
const expect = require('code').expect
const utils = require('../../lib/ops/utils.js')

lab.describe('tsquery tests', () => {
  lab.test('empty string', done => {
    const query = utils.toTsQuery('')
    expect(query).to.equal(``)
    done()
  })

  lab.test('single space', done => {
    const query = utils.toTsQuery(' ')
    expect(query).to.equal(``)
    done()
  })

  lab.test('single phrase', done => {
    const query = utils.toTsQuery('test')
    expect(query).to.equal(`'test':*`)
    done()
  })

  lab.test('multiple phrases', done => {
    const query = utils.toTsQuery('this   is   a   test')
    expect(query).to.equal(`'this':* & 'is':* & 'a':* & 'test':*`)
    done()
  })

  lab.test('multiple phrases with extra whitespace', done => {
    const query = utils.toTsQuery('this   is   a   test')
    expect(query).to.equal(`'this':* & 'is':* & 'a':* & 'test':*`)
    done()
  })

  lab.test('multiple phrases with in need of trim', done => {
    const query = utils.toTsQuery(' this   is   a   test ')
    expect(query).to.equal(`'this':* & 'is':* & 'a':* & 'test':*`)
    done()
  })

  lab.test('multiple phrases with quotes', done => {
    const query = utils.toTsQuery("it's got quotes")
    expect(query).to.equal(`'it''s':* & 'got':* & 'quotes':*`)
    done()
  })

  lab.test('multiple phrases with backslash', done => {
    const query = utils.toTsQuery('yes\\no maybe')
    expect(query).to.equal(`'yes\\\\no':* & 'maybe':*`)
    done()
  })

  lab.test('sql injection', done => {
    const query = utils.toTsQuery('Wonka\'); drop database authorization;')
    expect(query).to.equal(`'Wonka'');':* & 'drop':* & 'database':* & 'authorization;':*`)
    done()
  })
})
