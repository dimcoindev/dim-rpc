
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
var bip39 = require('bip39')
var bip38 = require('bip38')
var network = require('./network')
var leveldb = require('./leveldb')
var HDNode = require('./hdnode')

/**
 * Account::get()
 *
 * Get the account associated to the `req.params.address` NEM
 * Wallet Address.
 *
 * This method will issue a NIS API request to the following
 * endpoint(s) :
 * - /account/get
 *
 * Following parameters list is accepted :
 * - `req.params.address`: (Required) The related NEM wallet address
 *
 * @param   {*}   req
 * @param   {*}   res
 * @param   {*}   next
 * @return  void
 */
function get (req, res, next) {
  network.getFromNode(`/account/get?address=${req.params.address}`, function (err, response, body) {
    if (err) next()
    else {
      body = JSON.parse(body)
      res.send(body)
      next()
    }
  })
}

/**
 * Account::getTransactions()
 *
 * Get the transactions of the Account with `req.params.address`
 * NEM Wallet Address.
 *
 * This method will issue a NIS API request to the following
 * endpoint(s) :
 * - /account/transfers/all
 *
 * Following parameters list is accepted :
 * - `req.params.address`: (Required) The related NEM wallet address.
 * - `req.params.id`: (Optional) The transaction id to start history retrieval.
 *
 * @param   {*}   req
 * @param   {*}   res
 * @param   {*}   next
 * @return  void
 */
function getTransactions (req, res, next) {
  const id = req.query.id || 0
  let query = `address=${req.params.address}`
  if (id > 0) {
    query += `&id=${id}`
  }

  network.getFromNode(`/account/transfers/all?${query}`, function (err, response, body) {
    if (err) next()
    else {
      body = JSON.parse(body)
      res.send(body)
      next()
    }
  })
}

/**
 * Account::getBip38Account()
 *
 * Get a BIP38 Account for the given `req.params.userid`
 * User ID.
 *
 * If the BIP38 Account cannot be retrieved from the leveldb
 * storage, the method `Account::getBip38Keys()` will be executed
 * to generate an encrypted WIF and store it with the User ID.
 *
 * Following parameters list is accepted :
 * - `req.params.userid`: (Required) The related User ID.
 *
 * @see https://github.com/bitcoin/bips/blob/master/bip-0038.mediawiki
 * @see Account::getBip38Keys()
 * @param   {*}   req
 * @param   {*}   res
 * @param   {*}   next
 * @return  void
 */
function getBip38Account (req, res, next) {
  let uid = Buffer.from(req.params.userid)
  let uuid = sdk.crypto.js.SHA3(uid.toString(), {outputLength: 256})

  leveldb
    .getUTF8(uuid.toString())
    .then(function (wif) {
      res.send({
        success: true,
        wif
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

/**
 * Account::getBip38Keys()
 *
 * Generate a BIP38 encrypted Private Key WIF and store it in
 * combination with the User ID in our leveldb storage.
 *
 * Use the parameters `userid` and `bip38password` to secure
 * your private key storages.
 *
 * @see https://github.com/bitcoin/bips/blob/master/bip-0038.mediawiki
 * @see https://github.com/bitcoinjs/bip38
 * @param   {string}   userid
 * @param   {string}   bip38password
 * @return  void
 */
function getBip38Keys (userid, bip38password) {
  let uuid = sdk.crypto.js.SHA3(userid, {outputLength: 256})

  return leveldb
    .getUTF8(uuid.toString())
    .then(function (wif) {
      if (wif) {
        var decrypted = bip38.decrypt(wif.toString(), bip38password + userid)
        var kp = sdk.crypto.keyPair.create(decrypted.privateKey.toString())
        var keys = {
          privateKey: decrypted.privateKey.toString(),
          publicKey: kp.publicKey.toString()
        }

        return Promise.resolve({
          keys,
          wif
        })
      }

      return Promise.reject(new Error('Could not find Private Key'))
    })
}

/**
 *
 * @param {*} userId
 * @param {*} passphrase
 */
function generateBip38WIF (userId, passphrase) {
  let m = bip39.generateMnemonic()
  let seed = bip39.mnemonicToSeed(m, passphrase)
  let node = HDNode.fromSeedBuffer(seed)

  let uuid = sdk.crypto.js.SHA3(userId, {outputLength: 256})
  let kp = sdk.crypto.keyPair.create(node.getPrivateKeyHex())
  let keys = {
    privateKey: node.getPrivateKeyHex(),
    publicKey: kp.publicKey.toString()
  }

  // generate BIP38 encrypted Private Key WIF
  let encryptedWif = bip38.encrypt(node.getPrivateKeyBin(), true, passphrase + userId)

  // store BIP38 encrypted WIF
  leveldb.setUTF8(uuid.toString(), encryptedWif)

  return {
    keys,
    wif: encryptedWif
  }
}

/**
 * Account::createBip38Wallet()
 *
 * The creation of BIP38 encrypted Private Key WIFs is divided in the
 * following steps:
 *
 * Step 1: BIP39 Mnemonic generation and securing with the BIP38 Password.
 * Step 2: BIP32/BIP44 Hierarchical Deterministic Wallet creation
 * Step 3: BIP38 encrypted Private Key WIF generation and storage
 *
 * Following parameters list is accepted :
 * - `req.params.userid`: (Required) The related User ID.
 * - `req.params.bip38`: (Required) The Master Password to use for BIP38 Encryption.
 *
 * @see https://github.com/bitcoin/bips/blob/master/bip-0032.mediawiki
 * @see https://github.com/bitcoin/bips/blob/master/bip-0038.mediawiki
 * @see https://github.com/bitcoin/bips/blob/master/bip-0039.mediawiki
 * @see https://github.com/bitcoin/bips/blob/master/bip-0044.mediawiki
 * @see https://github.com/bitcoinjs/bip38
 * @see https://github.com/bitcoinjs/bip39
 * @param   {*}   req
 * @param   {*}   res
 * @param   {*}   next
 * @return  void
 */
function createBip38Wallet (req, res, next) {
  if (req.params.bip38 && req.params.userid) {
    getBip38Keys(req.params.userid, req.params.bip38)
      .catch(function () {
        let {keys, wif} = generateBip38WIF(req.params.userid, req.params.bip38)
        return Promise.resolve({keys, wif})
      })
      .then(function (account) {
        let netId = network.getNetworkId()

        res.send({
          success: true,
          publicKey: account.keys.publicKey,
          address: sdk.model.address.toAddress(account.keys.publicKey, netId),
          wif: account.wif
        })
        next()
      })
      .catch(function (err) {
        if (err) {
          res.send({
            success: false,
            err
          })
        }
        next()
      })
  } else {
    res.send({
      success: false,
      err: 'Wrong parameters'
    })
    next()
  }
}

/**
 * Account::createPrivateKeyWallet()
 *
 * Create a Private Key wallet for the NEM Blockchain. The
 * `req.params.privateKey` parameters must contain 32 bytes
 * formatted in hexadecimal notation (64 characters).
 *
 * Following parameters list is accepted :
 * - `req.params.privateKey`: (Required) The private key in hexadecimal notation (32 Bytes).
 *
 * @param   {*}   req
 * @param   {*}   res
 * @param   {*}   next
 * @return  void
 */
function createPrivateKeyWallet (req, res, next) {
  if (!req.params.privateKey || !req.params.privateKey.length) {
    res.send({
      success: false,
      err: 'Wrong parameters'
    })
    return next()
  }

  let priv = req.params.privateKey
  let account = sdk.crypto.keyPair.create(priv.toString())
  let pubKey = account.publicKey.toString()
  let netId = network.getNetworkId()

  res.send({
    success: true,
    account: {
      publicKey: pubKey,
      address: sdk.model.address.toAddress(pubKey, netId)
    }
  })
  return next()
}

/**
 * Account::createBrainWallet()
 *
 * /!\--------------------------------------------------------------/!\
 * /!\ WARNING: DO NOT USE BRAIN WALLETS, THEY ARE EVIL AND UNSAFE! /!\
 * /!\--------------------------------------------------------------/!\
 *
 * Create a brain wallet for the NEM Blockchain. The
 * `req.params.passphrase` will be derived with Keccak-256
 * hashes 6000 times (count iterations).
 *
 * Brain wallets *create your private key* without specific encryption
 * mechanism. This is unsafe because anyone reproducing your password
 * will be able to create your Wallet's Private Key. If you use passwords
 * with at least *32 bytes*, it is ok to use Brainwallets for the comfort
 * but you should never base Company Integrations on top of Brain Wallets
 * as this is still very unsafe and **unrecommended**.
 *
 * Following parameters list is accepted :
 * - `req.params.passphrase`: (Required) The passphrase to use for private key derivation.
 *
 * @internal WARNING: DO NOT USE BRAIN WALLETS, THEY ARE EVIL AND UNSAFE!
 * @internal You should not use this RPC Call.
 *
 * @param   {*}   req
 * @param   {*}   res
 * @param   {*}   next
 * @return  void
 */
function createBrainWallet (req, res, next) {
  if (req.params.passphrase) {
    // BRAIN WALLET
    let privKey = sdk.crypto.helpers.derivePassSha(req.params.passphrase, 6000).priv
    let account = sdk.crypto.keyPair.create(privKey.toString())
    let pubKey = account.publicKey.toString()
    let netId = network.getNetworkId(req.params.network)

    res.send({
      success: true,
      account: {
        publicKey: pubKey,
        address: sdk.model.address.toAddress(pubKey, netId)
      }
    })
    next()
  } else {
    res.send({
      success: false,
      err: 'Wrong parameters'
    })
    next()
  }
}

module.exports = {
  get,
  getBip38Account,
  getBip38Keys,
  getTransactions,
  createBrainWallet,
  createBip38Wallet,
  createPrivateKeyWallet,
  generateBip38WIF
}
