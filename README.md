<h2 align="center">Acurast Deployment for AlephZero L2-integration</h2>

<p align="center">
  <em>
    Deploy your NodeJS app to the Acurast Decentralized Serverless Cloud and submit to a smart contract deployed on AlephZero
  </em>
</p>

<p align="center">
  <a href="https://twitter.com/Acurast">
    <img alt="Follow Acurast on Twitter" src="https://img.shields.io/badge/%40Acurast-9f9f9f?style=flat-square&logo=x&labelColor=555"></a>
</p>

This repository contains an example deployment that runs on the _Acurast Decentralized Serverless Cloud_ and submits to a smart contract deployed to [AlephZero](https://alephzero.org/), written in [ink!](https://use.ink/).

To learn more about Acurast please visit the [website](https://acurast.com/) and [documentation](https://docs.acurast.com/).
To learn more about AlephZero please visit the [website](https://alephzero.org/).

## Installation

Choose a node version that is compatible with Acurast Cloud; we use [nvm](https://github.com/nvm-sh/nvm) to switch to different node versions:

```sh
nvm use 18
```

```sh
yarn install
```

## Usage

Change the code in `src/` as you wish, keeping the fulfillment contract call. This example just submits a text to the _consumer_ smart contract, using the Acurast proxy contract as an intermediary. Details of this contracts (written in [ink!](https://use.ink/)):

- **Consumer contract** [[source](https://github.com/Acurast/acurast-substrate/blob/develop/ink/consumer/lib.rs) | [contract json](./acurast_consumer_ink.json)]: receiving and storing text as payload.
- **Acurast Proxy contract** [[source](https://github.com/Acurast/acurast-substrate/blob/develop/ink/proxy/lib.rs) | [contract json](./src/acurast_proxy_ink.json)]: receiving the submission over the `fulfill` message (and handling the rest of L2-integration protocol).



Build and bundle the source files in `src/` to a single JavaScript file in `dist/index.js`: 

```sh
yarn build
```

*NOTE*: you can run `yarn start` to check the bundling succeeded but you will see errors that the `_STD_` global variable is not present since this is only available on Acurast processors.

You can copy the content of `dist/index.js` to the script form field in the [Acurast Console](https://console.acurast.com/).

Alternatively use the [Acurast CLI](https://github.com/Acurast/acurast-cli) to deploy the job:

```sh
acurast deploy
```

It will eventually print the ipfs URL you can enter directly in the [Acurast Console](https://console.acurast.com/).
