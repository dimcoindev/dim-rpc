# Development Proposal: DIMCOIN RPC Server

<pre>
  Project: DIMCOIN RPC Server
  Layer: Exchanges Integrations
  Title: RPC server to connect to NEM blockchain with DIMCOIN
  Author: DIM Developers
  Status: Proposed
  Type: Project Proposal
  Created: 2018-04-16
</pre>

## Summary

This document defines a proposal for the development of a project for the DIM Ecosystem, to implement a RPC server which will forward NIS API requests (NEM Blockchain) to remote servers while also allowing to manage Wallets and pull/push Transactions to the NEM Blockchain, containing DIM Currencies (Coin, Eur, Usd, etc.)

Exchanges which want to list DIMCOIN, always struggle on the hurdle that is the NEM Blockchain compared to Bitcoin or Ethereum projects, which all work the same. The NEM Blockchain comes with specific features such as an easy-to-use HTTP API, which exchanges usually **have to implement**.

It will make it easier for exchanges to work with DIMCOIN, if we provide them with a RPC server because they are use to work with RPC when they work with Bitcoin/Forks or Ethereum Tokens.

## Project Scope

The `DIMCOIN RPC Server` project will require a **timeframe of 1 week** for the completion of the development period, with an additional 1 week of integration period. The timeframe needed for the *completion of each Exchange Integration proposed* is not included in this pre-evaluation.

The `DIMCOIN RPC Server` project should provide with the following features:

- RPC server connected to NEM Blockchain Nodes
    - `GET /:network/account/:address`: List DIM Account Details.
    - `GET /:network/transactions/:address`: List DIM Account Transactions.
    - `POST /:network/account`: Create a new Account for said `userId` and `passphrase` BIP38 Master Password.
    - `POST /:network/account/bip32`: Create an Accont with said `privateKey`.
    - `POST /:network/broadcast`: Broadcast a locally signed Transaction to the NEM Blockchain.

- HTTP API for testing and development/integration purposes
- Unit Tests for DIM Exchanges Integrations
- End-to-End Tests for DIM Exchanges Integrations
- [Docker](https://docker.io) Container for the RPC Server.

The implemented features will be documented accordingly and Documentation will be provided with the package after Installation.

The package will be open-sourced under the [MIT License](https://opensource.org/licenses/MIT).

## Development Terms

Following is a Proposal of Development Milestones for the `DIMCOIN RPC Server` Project.

*Bounties build for the DIM Ecosystem can use this first Proposal as a Template. This will make it a seamless approach to build tools and extend the DIM Ecosystem in a recurring a d continuous manner.*

With the aim that this package may be integrated very easily for any Exchanges to work with DIMCOIN, it is important to separate the Integration Process from the Development Process. As such the Project will be built in 2 Steps, as listed below:

### Milestone #1: RPC Server Setup

This first Milestone aims to provide with **a fully functional RPC Server connected to the NEM Blockchain, allowing its users to work with DIMCOIN Accounts and Transactions**.

The released package should provide with 100% Unit Test Coverage and Integration Tests.

When this milestone is reached, Exchanges will already be able to use the dim-rpc package for their DIMCOIN Listing Implementations.

### Milestone #2: Exchange Integration

Each exchange, in the cryptocurrency branch, comes with its own Integrations and Experiences. This makes it complicated for Cryptocurrency developers to provide with a one-package-for-them-all Solution.

With more and more exchanges listing DIMCOIN, the list of different Integrations is getting long and it is hard to keep an Overview about each exchanges Implementation.

This second milestone should take care of testing the Integration of this Project (dim-rpc) with several pre-defined exchanges.

<hr/>
<pre>
  Title: RPC server to connect to NEM blockchain with DIMCOIN
  Author: DIM Developers
</pre>
