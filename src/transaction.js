
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

var sdk = require('nem-sdk').default
var account = require('./account')
var network = require('./network')
var leveldb = require('./leveldb')
var transfer = require('./nem/transfer')

/**
 * Transaction::get()
 *
 * Get the transaction associated to the `req.params.hash` NEM
 * Transaction Hash. The transaction hash is a 64 characters
 * hexadecimal string.
 *
 * This method will issue a NIS API request to the following
 * endpoint(s) :
 * - /transaction/get
 *
 * Following parameters list is accepted :
 * - `req.params.hash`: (Required) The transaction hash to search
 *
 * @param   {*}   req
 * @param   {*}   res
 * @param   {*}   next
 * @return  void
 */
function get (req, res, next) {
  network.getFromNode(`/transaction/get?hash=${req.params.hash}`, function (err, response, body) {
    if (err) next()
    else {
      body = JSON.parse(body)
      res.send(body)
      next()
    }
  })
}

function createWithBip38Wallet (req, res, next) {
  account.getBip38Keys(req.params.userid, req.params.bip38)
    .catch(function () {
      let {keys, wif} = account.generateBip38WIF(req.params.userid, req.params.bip38)
      return Promise.resolve({keys, wif})
    })
    .then(async function (account) {
      let amount = req.params.amount ? parseInt(req.params.amount) : 0
      let currency = req.params.currency ? req.params.currency : 'dim:coin'
      let creds = {password: '', privateKey: account.keys.privateKey}
      let transaction = await transfer.prepareMosaicTransfer(creds, req.params.recipient, amount, currency)

      // serialize and sign (locally)
      let keypair = sdk.crypto.keyPair.create(account.keys.privateKey)
      let serialized = sdk.utils.serialization.serializeTransaction(transaction)
      let signature = keypair.sign(serialized)
      let txId = sdk.crypto.js.SHA3(sdk.utils.convert.ua2hex(serialized), {outputLength: 256})

      leveldb
        .setObject(txId, {
          serialized: sdk.utils.convert.ua2hex(serialized),
          tx: transaction,
          signature: signature.toString()
        })
        .then(function () {
          res.send({
            success: true,
            transaction
          })
          next()
        })
        .catch(function (err) {
          res.send({
            success: false,
            err
          })
          next()
        })
    })
    .catch(function (err) {
      res.send({
        success: false,
        err
      })
      next()
    })
}

async function createWithPrivateKeyWallet (req, res, next) {
  var amount = parseInt(req.params.amount)
  var currency = req.params.currency ? req.params.currency : 'dim:coin'

  var privateKey = req.params.privateKey
  var creds = {password: '', privateKey: privateKey}
  var transaction = await transfer.prepareMosaicTransfer(creds, req.params.recipient, amount, currency)

  // serialize and sign (locally)
  var keypair = sdk.crypto.keyPair.create(privateKey)
  var serialized = sdk.utils.serialization.serializeTransaction(transaction)
  var signature = keypair.sign(serialized)
  var txId = sdk.crypto.js.SHA3(sdk.utils.convert.ua2hex(serialized), {outputLength: 256})

  leveldb
    .setObject(txId, {
      serialized: sdk.utils.convert.ua2hex(serialized),
      tx: transaction,
      signature: signature.toString()
    })
    .then(function () {
      res.send({
        success: true,
        transaction
      })
      next()
    })
    .catch(function (err) {
      res.send({
        success: false,
        err
      })
      next()
    })
}

async function createWithBrainWallet (req, res, next) {
  var amount = parseInt(req.params.amount)
  var currency = req.params.currency ? req.params.currency : 'dim:coin'

  var privateKey = sdk.crypto.helpers.derivePassSha(req.params.passphrase, 6000).priv
  var creds = {password: '', privateKey: privateKey}
  var transaction = await transfer.prepareMosaicTransfer(creds, req.params.recipient, amount, currency)

  // serialize and sign (locally)
  var keypair = sdk.crypto.keyPair.create(privateKey)
  var serialized = sdk.utils.serialization.serializeTransaction(transaction)
  var signature = keypair.sign(serialized)
  var txId = sdk.crypto.js.SHA3(sdk.utils.convert.ua2hex(serialized), {outputLength: 256})

  leveldb
    .setObject(txId, {
      serialized: sdk.utils.convert.ua2hex(serialized),
      tx: transaction,
      signature: signature.toString()
    })
    .then(function () {
      res.send({
        success: true,
        transaction
      })
      next()
    })
    .catch(function (err) {
      res.send({
        success: false,
        err
      })
      next()
    })
}

function broadcast (req, res, next) {
  leveldb.getObject(req.params.id)
    .then(function (transaction) {
      transaction = transaction || req.params
      let serialized = transaction.serialized || null
      let signature = transaction.signature || null

      network.broadcast(serialized, signature, function () {
        res.send({
          success: true,
          transaction
        })
        next()
      })
    })
    .catch(function (err) {
      res.send({
        success: false,
        err
      })
      next()
    })
}

module.exports = {
  createWithPrivateKeyWallet,
  createWithBip38Wallet,
  createWithBrainWallet,
  get,
  broadcast
}
