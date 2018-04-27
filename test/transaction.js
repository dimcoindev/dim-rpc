
// Require the dev-dependencies
const chai = require('chai')
const chaiHttp = require('chai-http')
const server = require('../server')
const sdk = require('nem-sdk')
chai.should()

chai.use(chaiHttp)

describe('Transactions', () => {
  describe('/GET transaction', () => {
    it('it should GET last account transactions on mainnet', (done) => {
      chai.request(server)
        .get('/mainnet/transactions/NAKSWFKPKVSP5AA7OZO5KUU5AWJYYE55Y6O7OZVE')
        .end((err, res) => {
          res.should.have.status(200)
          res.body.should.have.property('data')
          done()
        })
    })

    it('it should GET last account transactions on testnet', (done) => {
      chai.request(server)
        .get('/testnet/transactions/TA3SH7QUTG6OS4EGHSES426552FAJYZR2PHOBLNA')
        .end((err, res) => {
          res.should.have.status(200)
          res.body.should.have.property('data')
          res.body.data.length.should.be.above(21) // there is 22 tx in the account by the time of writing.
          done()
        })
    })
  })

  var bip38address = null
  var bip38backup = null
  let userid = require('crypto').randomBytes(32).toString('hex')

  describe('/POST transaction', () => {
    it('it should create transaction from BIP38 backup using userid', (done) => {
      chai.request(server)
        .post('/mainnet/transaction')
        .send({
          bip38: 'master password',
          userid,
          amount: 1000000000,
          recipient: 'NAKSWFKPKVSP5AA7OZO5KUU5AWJYYE55Y6O7OZVE'
        })
        .end((err, res) => {
          res.should.have.status(200)
          res.body.success.should.be.equal(true)

          res.body.transaction.type.should.equal(257) // NEM Transfer Transaction
          res.body.transaction.recipient.should.equal('NAKSWFKPKVSP5AA7OZO5KUU5AWJYYE55Y6O7OZVE')
          done()
        })
    })

    /**
     * @internal WARNING: Following is unrecommended practice. You should not use brainwallets!
     */
    it('it should create tx on mainnet and tx should verify', (done) => {
      chai.request(server)
        .post('/mainnet/transaction/brainwallet')
        .send({
          amount: 100000000,
          recipient: 'NAKSWFKPKVSP5AA7OZO5KUU5AWJYYE55Y6O7OZVE',
          passphrase: 'This is a test'
        })
        .end((err, res) => {
          res.should.have.status(200)
          res.body.success.should.be.equal(true)

          res.body.transaction.type.should.equal(257) // NEM Transfer Transaction
          res.body.transaction.recipient.should.equal('NAKSWFKPKVSP5AA7OZO5KUU5AWJYYE55Y6O7OZVE')
          res.body.transaction.signer.should.equal('c47cc79bbbb90dcf681db5650ca969f051fee583e7d826fbd2aadf9e38a79931')
          done()
        })
    })

    /**
     * @internal WARNING: Following is unrecommended practice. You should not use brainwallets!
     */
    it('it should create tx on testnet and tx should verify', (done) => {
      chai.request(server)
        .post('/testnet/transaction/brainwallet')
        .send({
          amount: 100000000,
          recipient: 'TBEQWJXWKTS6664QRVK73XICZSCMYCONQXFKDZKS',
          passphrase: 'This is a test'
        })
        .end((err, res) => {
          res.should.have.status(200)
          res.body.success.should.be.equal(true)
          res.body.transaction.recipient.should.equal('TBEQWJXWKTS6664QRVK73XICZSCMYCONQXFKDZKS')
          done()
        })
    })

    // XXX broadcast unit test
  })
})
