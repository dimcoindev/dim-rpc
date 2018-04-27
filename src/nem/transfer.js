
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
var network = require('../network')

async function prepareMosaicTransfer (creds, recipient, amount, currency) {
  if (!currency) { currency = 'dim:coin' }

  // shortcuts
  let [namespace, mosaic] = currency.split(':')
  let netId = network.getNetworkIdFromAddress(recipient)
  var mosaicDefMDP = sdk.model.objects.get('mosaicDefinitionMetaDataPair')
  var mosaicAttachment = sdk.model.objects.create('mosaicAttachment')(namespace, mosaic, amount)

  try {
    // Step 1 : Read Namespace/Mosaic definition data
    var namespaceDefs = await network.getFromNodeAsync(`/namespace/mosaic/definition/page?namespace=${namespace}`)
    namespaceDefs = JSON.parse(namespaceDefs).data

    // interpret mosaic definition page content
    var defs = sdk.utils.helpers.searchMosaicDefinitionArray(namespaceDefs, [mosaic])
    var fqmn = sdk.utils.format.mosaicIdToName(mosaicAttachment.mosaicId)

    if (undefined === defs[fqmn]) {
      throw new Error("Couldn't find mosaic definition for fully qualified mosaic name: " + fqmn)
    }

    // prepare MosaicDefinitionMetaDataPair object to be attached to the transaction
    mosaicDefMDP[fqmn] = {}
    mosaicDefMDP[fqmn].mosaicDefinition = defs[fqmn]

    // Step 2 : Load Mosaic Total Supply
    var mosaicSupply = await network.getFromNodeAsync(`/mosaic/supply?mosaicId=${currency}`)
    mosaicSupply = JSON.parse(mosaicSupply).supply

    // finalize mosaic definition meta data pair
    mosaicDefMDP[fqmn].supply = mosaicSupply

    // Step 3 : Prepare Transaction for network
    var transaction = sdk.model.objects.create('transferTransaction')(recipient, 1, '')
    transaction.mosaics.push(mosaicAttachment)

    // Step 4 : Wrap the transaction content in a prepared Mosaic Transfer Transaction.
    var entity = sdk.model.transactions.prepare('mosaicTransferTransaction')(creds, transaction, mosaicDefMDP, netId)
    return entity
  } catch (e) {
    console.error('An error occured while preparing Transaction: ', e)
    return null
  }
}

module.exports = {
  prepareMosaicTransfer
}
