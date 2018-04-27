
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

var request = require('request')
var async = require('async')
var sdk = require('nem-sdk').default

var network = null
var server = null

var networks = {
  testnet: {
    name: 'testnet',
    id: -104,
    peers: [
      'bigalice2.nem.ninja:7890',
      '23.228.67.85:7890',
      '50.3.87.123:7890',
      '37.120.188.83:7890'
    ]
  },
  mainnet: {
    name: 'mainnet',
    id: 104,
    peers: [
      'hugealice.nem.ninja:7890',
      'alice2.nem.ninja:7890',
      'alice3.nem.ninja:7890',
      'alice4.nem.ninja:7890',
      'alice5.nem.ninja:7890',
      'alice6.nem.ninja:7890'
    ]
  },
  mijin: {
    name: 'mijin',
    id: 96,
    peers: [
      'b1.nem.foundation:7891'
    ]
  }
}

function getFromNode (url, cb) {
  if (!url.startsWith('http')) {
    url = `http://${server}${url}`
  }
  request(
    {
      url,
      headers: {
        version: '1.0.0',
        port: 1
      },
      timeout: 5000
    },
    function (error, response, body) {
      if (error) {
        if (network.peers) {
          server = network.peers[Math.floor(Math.random() * 1000) % network.peers.length]
        }
      }
      cb(error, response, body)
    }
  )
}

function getFromNodeAsync (url) {
  if (!url.startsWith('http')) {
    url = `http://${server}${url}`
  }

  return new Promise(function (resolve, reject) {
    request({
      url,
      headers: {
        version: '1.0.0',
        port: 1
      },
      timeout: 5000
    }, function (err, response, body) {
      if (err) {
        if (network.peers) {
          server = network.peers[Math.floor(Math.random() * 1000) % network.peers.length]
        }
        return reject(new Error(err))
      }

      let res = response.toJSON()
      return resolve(res.body)
    })
  })
}

function getNetworkId (name) {
  if (name && sdk.model.network.data[name]) {
    return sdk.model.network.data[name].id
  }

  if (network.config) {
    return network.config
  }

  return sdk.model.network.data['mainnet'].id
}

function getNetworkIdFromAddress (address) {
  let char = address.substr(0, 1).toUpperCase()
  switch (char) {
    default:
    case 'N':
      return sdk.model.network.data['mainnet'].id

    case 'T':
      return sdk.model.network.data['testnet'].id

    case 'M':
      return sdk.model.network.data['mijin'].id
  }
}

function findEnabledPeers (cb) {
  var peers = []
  getFromNode('/node/peer-list/reachable', function (err, response, body) {
    if (err || body === 'undefined') {
      return cb(peers)
    }

    try {
      var respeers = JSON.parse(body).data.map(function (peer) {
        return `${peer.ip}:${peer.port}`
      })
      async.each(respeers, function (peer, eachcb) {
        getFromNode(`http://${peer}/chain/height`, function (error, res, body2) {
          if (!error && body2 !== 'Forbidden') {
            peers.push(peer)
          }
          eachcb()
        })
      }, function (error) {
        if (error) return cb(error)

        return cb(peers)
      })
    } catch (e) {
      return cb(peers)
    }
  })
}

/**
 * @internal It is highly recommended to AVOID USING THIS METHOD.
 * @internal Please use the Transaction.create method to sign transactions
 *           locally before broadcasting them to NIS nodes.
 */
function postTransaction (transaction, cb) {
  request(
    {
      url: `http://${server}/transaction/prepare-announce`,
      headers: {
        version: '1.0.0',
        port: 1
      },
      method: 'POST',
      json: true,
      body: {transactions: [transaction]}
    },
    cb
  )
}

function broadcast (serializedTx, signature, callback) {
  network.peers.slice(0, 10).forEach(function (peer) {
    request({
      url: `http://${peer}/transaction/announce`,
      headers: {
        version: '1.0.0',
        port: 1
      },
      method: 'POST',
      json: true,
      body: {
        data: serializedTx.toString(), // hexadecimal notation
        signature: signature.toString() // hexadecimal notation
      }
    })
  })
  callback()
}

function connect2network (netw, callback) {
  network = netw
  server = netw.peers[Math.floor(Math.random() * 1000) % netw.peers.length]
  findEnabledPeers(function (peers) {
    if (peers.length > 0) {
      [server] = peers
      netw.peers = peers
    }
    callback()
  })
  if (network.name !== 'mijin') {
    getFromNode('/node/extended-info', function (err, response, body) {
      if (err) return
      if (!body || !body.startsWith('{')) { connect2network(netw, callback) } else {
        netw.config = JSON.parse(body).node.metaData.networkId
      }
    })
  }
}

function connect (req, res, next) {
  if (!server || !network || network.name !== req.params.network) {
    network = networks[req.params.network] ? networks[req.params.network] : {}

    if (networks[req.params.network]) {
      connect2network(networks[req.params.network], next)
    } else {
      res.send({
        success: false,
        error: `Could not find network ${req.params.network}`
      })
      res.end()
    }
  } else {
    next()
  }
}

module.exports = {
  broadcast,
  connect,
  getFromNode,
  postTransaction,
  getFromNodeAsync,
  getNetworkId,
  getNetworkIdFromAddress
}
