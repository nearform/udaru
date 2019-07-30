const Lab = require('lab')
const lab = exports.lab = Lab.script()
const expect = require('code').expect
const utils = require('../../lib/ops/utils.js')
const config = require('../../config')()
const buildDb = require('../../lib/db')

var clientThrow = {
  on: () => {},
  query: function (sql, callback) {
    callback(Error('ERROR'))
  },
  end: () => {}
}

const dbThrow = buildDb(clientThrow, config)

lab.describe('error tests', () => {
  lab.test('unique violation error check', done => {
    const errorIsUV = new Error('Unique Violation'); errorIsUV.code = '23505'
    expect(utils.isUniqueViolationError(errorIsUV)).to.equal(true)
    const errorNotUV = new Error('Unique Violation'); errorNotUV.code = '12345'
    expect(utils.isUniqueViolationError(errorNotUV)).to.not.equal(true)
    expect(utils.isUniqueViolationError(null)).to.not.equal(true)
    done()
  })

  lab.test('foreign key violation error check', done => {
    const errorIsFKV = new Error('Foreign Key Violation'); errorIsFKV.code = '23503'
    expect(utils.isForeignKeyViolationError(errorIsFKV)).to.equal(true)
    const errorNotFKV = new Error('Foreign Key Violation'); errorNotFKV.code = '12345'
    expect(utils.isForeignKeyViolationError(errorNotFKV)).to.not.equal(true)
    expect(utils.isForeignKeyViolationError(null)).to.not.equal(true)
    done()
  })

  lab.test('policies query boom error check', done => {
    utils.checkPoliciesOrg(dbThrow, [], 0, err => {
      expect(err).to.exist()
      expect(err.isBoom).to.equal(true)
      done()
    })
  })

  lab.test('policies query boom not found check', done => {
    const client = {
      on: () => {},
      query: function (sql, callback) {
        callback(null, { rowCount: 1, rows: [{ id: 1 }] })
      },
      end: () => {}}
    const db = buildDb(client, config)
    utils.checkPoliciesOrg(db, [{ id: 1 }, { id: 2 }], 0, err => {
      expect(err).to.exist()
      expect(err.isBoom).to.equal(true)
      done()
    })
  })

  lab.test('user query boom error check', done => {
    utils.checkUserOrg(dbThrow, 0, 0, err => {
      expect(err).to.exist()
      expect(err.isBoom).to.equal(true)
      done()
    })
  })

  lab.test('user query boom not found check', done => {
    const client = {
      on: () => {},
      query: function (sql, callback) {
        callback(null, { rowCount: 0 })
      },
      end: () => {}}
    const db = buildDb(client, config)
    utils.checkUserOrg(db, 0, 0, err => {
      expect(err).to.exist()
      expect(err.isBoom).to.equal(true)
      done()
    })
  })

  lab.test('users query boom error check', done => {
    utils.checkUsersOrg(dbThrow, [], 0, err => {
      expect(err).to.exist()
      expect(err.isBoom).to.equal(true)
      done()
    })
  })

  lab.test('users query boom not found check', done => {
    const client = {
      on: () => {},
      query: function (sql, callback) {
        callback(null, { rowCount: 1, rows: [{ id: 1 }] })
      },
      end: () => {}}
    const db = buildDb(client, config)
    utils.checkUsersOrg(db, [{ id: 1 }, { id: 2 }], 0, err => {
      expect(err).to.exist()
      expect(err.isBoom).to.equal(true)
      done()
    })
  })

  lab.test('teams query boom error check', done => {
    utils.checkTeamsOrg(dbThrow, [], 0, err => {
      expect(err).to.exist()
      expect(err.isBoom).to.equal(true)
      done()
    })
  })

  lab.test('org query boom error check', done => {
    utils.checkOrg(dbThrow, 0, err => {
      expect(err).to.exist()
      expect(err.isBoom).to.equal(true)
      done()
    })
  })

  lab.test('org query boom not found check', done => {
    const client = {
      on: () => {},
      query: function (sql, callback) {
        callback(null, { rowCount: 0 })
      },
      end: () => {}}
    const db = buildDb(client, config)
    utils.checkOrg(db, 0, err => {
      expect(err).to.exist()
      expect(err.isBoom).to.equal(true)
      done()
    })
  })
})

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
