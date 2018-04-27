#! /usr/bin/env forever

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

var restify = require('restify')
var account = require('./src/account')
var transaction = require('./src/transaction')
var network = require('./src/network')
var program = require('commander')

const allowedRemotes = [
  '::1',
  '127.0.0.1',
  '::ffff:127.0.0.1'
]

var server = null

function restrictHost (req, res, next) {
  var remote = req.connection.remoteAddress
  if (remote.startsWith('::ffff:')) remote = remote.replace('::ffff:', '')
  if (program.allowRemote) return next()
  else
  if (req.getRoute().path === '/:network/broadcast') return next()
  else
  if (program.allow.includes(remote)) return next()
  else {
    for (let item of program.allow) {
      let mask = item.split(/[:.]/)
      let address = remote.split(/[:.]/)
      let ok = true
      for (let i = 0; i < mask.length; i++) {
        if (mask[i] === '*') continue
        else
        if (mask[i] !== address[i]) { ok = false; break } else continue
      }
      if (ok) return next()
    }
  };
  res.end()
}

function startServer (port) {
  if (program.allowRemote) console.log('Warning! dim-rpc allows remote connections, this is potentially insecure!')

  server = restify.createServer()
    .use(restrictHost)
    .use(restify.plugins.bodyParser({mapParams: true}))
    .use(restify.plugins.queryParser({mapParams: true}))
    .use(network.connect)

  server.get('/:network/account/bip38/:userid', account.getBip38Account)
  server.get('/:network/account/:address', account.get)
  server.post('/:network/account', account.createBip38Wallet)
  server.post('/:network/account/bip32', account.createPrivateKeyWallet)
  server.post('/:network/account/bip38', account.createBip38Wallet)
  server.post('/:network/account/brainwallet', account.createBrainWallet)
  server.get('/:network/transactions/:address', account.getTransactions)
  server.post('/:network/transaction', transaction.createWithBip38Wallet)
  server.post('/:network/transaction/bip32', transaction.createWithPrivateKeyWallet)
  server.post('/:network/transaction/bip38', transaction.createWithBip38Wallet)
  server.post('/:network/transaction/brainwallet', transaction.createWithBrainWallet)
  server.post('/:network/broadcast', transaction.broadcast)

  server.listen(port, function () {
    console.log('dim-rpc listening at %s', server.url)
  })
}

program
  .option('-p, --port <port>', 'The port to start server')
  .option('--allow-remote', 'Allow all connections from sources other than localhost')
  .option('--allow <address>', 'Add addresses to the whitelist. Allows usage of * for placeholder in addresses, eg. 192.168.178.* or 10.0.*.*.', (val, memo) => {
    memo.push(val)
    return memo
  }, allowedRemotes)
  .parse(process.argv)

if (program.port) { startServer(program.port) } else { startServer(8080) }

// For testing purpose
module.exports = server
