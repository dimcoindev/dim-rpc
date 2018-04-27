
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

var levelup = require('levelup')
var leveldown = require('leveldown')
var db = levelup(leveldown(`${__dirname}/../storage.leveldb`))

function getUTF8 (id) {
  return db.get(id).then(function (value) {
    return Promise.resolve(value.toString('UTF8'))
  })
}

function getObject (id) {
  return db.get(id).then(function (value) {
    return Promise.resolve(JSON.parse(value.toString('UTF8')))
  })
}

function setUTF8 (id, value) {
  return db.put(id, value)
}

function setObject (id, value) {
  return db.put(id, JSON.stringify(value))
}

module.exports = {
  getObject,
  getUTF8,
  setObject,
  setUTF8
}
