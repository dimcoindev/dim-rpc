# dim-rpc

[![build status](https://secure.travis-ci.org/gemon297/dim-rpc.svg)](http://travis-ci.org/gemon297/dim-rpc)
[![Coverage Status](https://img.shields.io/coveralls/gemon297/dim-rpc.svg)](https://coveralls.io/r/gemon297/dim-rpc)
[![Version](http://img.shields.io/npm/v/dim-rpc.svg)](https://www.npmjs.org/package/dim-rpc)

[![js-standard-style](https://cdn.rawgit.com/feross/standard/master/badge.svg)](https://github.com/feross/standard)

## RPC server implementation for NEM blockchain with DIMCOIN

## Security Warning
All calls should be made from the server where RPC is running at ( i.e., `localhost` or `127.0.0.1` ). The RPC server should never be publicly accessible. If you wish to access dim-rpc from a remote address, you can whitelist the address with `--allow <address>`. Addresses allow you to use wildcards, eg. `192.168.1.*` or `10.0.*.*`.

If you do want to allow access from all remotes, start dim-rpc with the `--allow-remote` commandline switch. This can be dangerous.

## How To Use It
- install Node.JS ( https://nodejs.org/en/download/package-manager/)
- install forever `npm install -g forever`
- install dim-rpc: `npm install gemon297/dim-rpc#master`
- start RPC server: `dim-rpc --port 8000` (default port is 8080)

### Docker 
If you would like to run from a docker environment, you will first need to build the container by running:
```
docker build -t dim-rpc .
```
You will need to run the container with the `--allow-remote` option to allow the host machine to access the container.
```
docker run -d -p 8080:8080 dim-rpc --allow-remote
```

## API
Supported networks are `mainnet` and `devnet` all calls should start with the network you want to address, for instance,  `/mainnet/account/TA3SH7QUTG6OS4EGHSES426552FAJYZR2PHOBLNA` we call it `:network` in the API description.

### Accounts
- Get account balance from `address`: `GET /:network/account/:address`
- Create (or get if already existing) account and encrypt using bip38: `POST /:network/account` params: `passphrase` (password for encrypted WIF), `userid` (to identify a user)
- Alias call for BIP38 encrypted WIFs: `POST /:network/account/bip38` params: `bip38` (password for encrypted WIF), `userid` (to identify a user)
- Create account with hexadecimal representation of `privateKey`: `POST /:network/account/bip32` params: `privateKey` (32 bytes private key buffer in hexadecimal notation [64 characters])
- Get backup from `userid`: `GET /:network/account/bip38/:userid`
- [**DEPRECATED**] ~Create account from `passphrase` (Brain Wallets): `POST /:network/account/brainwallet` params: `passphrase` (password for private key derivation)~

If you want to create several accounts for one user, you need to use a different userid.

### Transactions
- Get last 25 transactions from `address`: `GET /:network/transactions/:address`
- Create a transaction using `bip38` for `userid`: `POST /:network/transaction` params: `recipient` (NEM Wallet Address), `amount` in DIM Units (smallest possible unit has 6 decimal places), `bip38` (password to encode WIF), `userid` (to identify a user)
- Alias call for Transactions with BIP38 Wallet: `POST /:network/transaction/bip38` params: `recipient` (NEM Wallet Address), `amount` in DIM Units (smallest possible unit has 6 decimal places), `bip38` (password to encode wif), `userid`
- Create a transaction with hexadecimal representation of `privateKey`: `POST /:network/transaction/bip32` params: `recipient` (NEM Wallet Address), `amount` in DIM Units (smallest possible unit has 6 decimal places), `privateKey` (32 bytes private key buffer in hexadecimal notation [64 characters])
- Broadcast transaction: `POST /:network/broadcast` params: `id` of the transaction (Keccak-256 hash with 32 bytes in hexadecimal notation)
- [**DEPRECATED**] ~Create a transaction with a Brain Wallet: `POST /:network/transaction/brainwallet` params: `recipient` (NEM Wallet Address), `amount` in DIM Units, `passphrase` (password for private key derivation)~

Note that if the transaction has been created via the RPC it has been stored internally, as such only the transaction `id` is needed to broadcast/rebroadcast it. Otherwise if created outside of this RPC server, pass the whole transaction body as the POST payload.

## Donations

- DIM & NEM: `NAKSWFKPKVSP5AA7OZO5KUU5AWJYYE55Y6O7OZVE`

## Credits

- Author: @gemon297, [View on Github](https://github.com/gemon297)

## License

The dim-rpc Package is open-sourced software licensed under the [MIT license](http://opensource.org/licenses/MIT)
