
/**
 * Part of the gemon297/dim-rpc package.
 *
 * NOTICE OF LICENSE
 *
 * Licensed under the MIT License.
 *
 * This source file is subject to the MIT License that is
 * bundled with this package in the LICENSE file.
 *
 * @package    gemon297/dim-rpc
 * @version    1.0.0
 * @author     gemon297 <gemon@tuta.io>
 * @license    MIT License
 * @copyright  (c) 2018, DIM Ecosystem
 */

// Require the dev-dependencies
const chai = require('chai')
const chaiHttp = require('chai-http')
const server = require('../server')

chai.should()
chai.use(chaiHttp)

describe('Accounts', () => {
  describe('/GET account', () => {
    it('it should GET account with a given address on mainnet', (done) => {
      chai.request(server)
        .get('/mainnet/account/NAKSWFKPKVSP5AA7OZO5KUU5AWJYYE55Y6O7OZVE')
        .end((err, res) => {
          res.should.have.status(200)
          res.body.should.have.property('meta')
          res.body.should.have.property('account')
          res.body.account.address.should.be.equal('NAKSWFKPKVSP5AA7OZO5KUU5AWJYYE55Y6O7OZVE')
          done()
        })
    })

    it('it should GET account with a given address on testnet', (done) => {
      chai.request(server)
        .get('/testnet/account/TBEQWJXWKTS6664QRVK73XICZSCMYCONQXFKDZKS')
        .end((err, res) => {
          res.should.have.status(200)
          res.body.should.have.property('meta')
          res.body.should.have.property('account')
          res.body.account.address.should.be.equal('TBEQWJXWKTS6664QRVK73XICZSCMYCONQXFKDZKS')
          done()
        })
    })
  })

  describe('/POST account', () => {
    var bip38address = null
    var bip38backup = null
    var userid = require('crypto').randomBytes(32).toString('hex')

    it('it should create an account on mainnet using BIP38 encryption', (done) => {
      chai.request(server)
        .post('/mainnet/account')
        .send({
          bip38: 'master password',
          userid
        })
        .end((err, res) => {
          res.should.have.status(200)
          res.body.success.should.be.equal(true)
          res.body.should.have.property('address')
          res.body.should.have.property('wif')
          bip38address = res.body.address
          bip38backup = res.body.wif
          done()
        })
    })

    it('it should find BIP38 backup from userid', (done) => {
      chai.request(server)
        .get(`/mainnet/account/bip38/${userid}`)
        .end((err, res) => {
          res.should.have.status(200)
          res.body.success.should.be.equal(true)
          res.body.should.have.property('wif')
          bip38backup = res.body.wif.should.equal(bip38backup)
          done()
        })
    })

    it('it should create a simplewallet account on mainnet using a PRNG', (done) => {
      chai.request(server)
        .post('/mainnet/account/bip32')
        .send({
          privateKey: 'dd19f3f3178c0867771eed180310a484e1b76527f7a271e3c8b5264e4a5aa414'
        })
        .end((err, res) => {
          res.should.have.status(200)
          res.body.success.should.be.equal(true)
          res.body.account.address.should.be.equal('NA3SH7QUTG6OS4EGHSES426552FAJYZR2NRCQQGW')
          res.body.account.publicKey.should.be.equal('5645ea5b6bfc9bce6e69eab6002281d0e9c52fc0405ab99533d28e497b96ed81')
          bip38address = res.body.address
          bip38backup = res.body.wif
          done()
        })
    })

    /**
     * @internal WARNING: Following is unrecommended practice. You should not use brainwallets!
     */
    it('it should create a brainwallet account on mainnet', (done) => {
      chai.request(server)
        .post('/mainnet/account/brainwallet')
        .send({
          passphrase: 'this is a test'
        })
        .end((err, res) => {
          res.should.have.status(200)
          res.body.success.should.be.equal(true)
          res.body.account.address.should.be.equal('ND23FHYZQPYUEIZ67VN5LHLGYGABGSGZLIYC76BH')
          res.body.account.publicKey.should.be.equal('355915247974c80bd7d216dbb289edfb84e996809b6e141dc153f88d2591f934')
          done()
        })
    })

    /**
     * @internal WARNING: Following is unrecommended practice. You should not use brainwallets!
     */
    it('it should create a brainwallet account on testnet', (done) => {
      chai.request(server)
        .post('/testnet/account/brainwallet')
        .send({
          passphrase: 'this is a test'
        })
        .end((err, res) => {
          res.should.have.status(200)
          res.body.success.should.be.equal(true)
          res.body.account.address.should.be.equal('TD23FHYZQPYUEIZ67VN5LHLGYGABGSGZLL7VVX44')
          res.body.account.publicKey.should.be.equal('355915247974c80bd7d216dbb289edfb84e996809b6e141dc153f88d2591f934')
          done()
        })
    })

    /**
     * @internal WARNING: Following is unrecommended practice. You should not use brainwallets!
     */
    it('it should create a brainwallet account on mijin', (done) => {
      chai.request(server)
        .post('/mijin/account/brainwallet')
        .send({
          passphrase: 'this is a test'
        })
        .end((err, res) => {
          res.should.have.status(200)
          res.body.success.should.be.equal(true)
          res.body.account.address.should.be.equal('MD23FHYZQPYUEIZ67VN5LHLGYGABGSGZLISVYLLK')
          res.body.account.publicKey.should.be.equal('355915247974c80bd7d216dbb289edfb84e996809b6e141dc153f88d2591f934')
          done()
        })
    })
  })
})
