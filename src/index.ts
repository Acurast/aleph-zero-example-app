import { WsProvider } from "@polkadot/rpc-provider";
import { ApiPromise } from "@polkadot/api";
import { ContractPromise } from "@polkadot/api-contract";
import { WeightV2 } from "@polkadot/types/interfaces";
import { hexToU8a } from "@polkadot/util";
import { blake2AsHex, encodeAddress } from "@polkadot/util-crypto";
import {
  AddressOrPair,
  Signer,
  SubmittableExtrinsic,
} from "@polkadot/api/types";
import { Hash } from "@polkadot/types/interfaces/runtime";
import { SignerPayloadRaw, SignerResult } from "@polkadot/types/types";
import metadata from "./acurast_proxy_ink.json";

declare const _STD_: any;

const provider = new WsProvider("wss://ws.test.azero.dev/");
export const alephZeroApi = ApiPromise.create({
  provider,
});

async function main() {
  const text = new Date().toISOString();
  console.log("Fulfilling with text as payload: ", text);
  await fulfill(
    getJobId(),
    "0x" + Buffer.from(new TextEncoder().encode(text)).toString("hex")
  );
}

function getJobId(): string {
  const jobId: JobId = _STD_.job.getId();
  return jobId.id;
}

async function fulfill(jobId: string, payload: string): Promise<void> {
  const api = await alephZeroApi;

  const keys: PublicKeys = _STD_.job.getPublicKeys();
  const address = encodeAddress(
    hexToU8a(blake2AsHex(hexToU8a(keys.secp256k1), 256)),
    42
  );

  console.log("Address: ", address);

  const contract = await new ContractPromise(
    await alephZeroApi,
    metadata,
    // Acurast Proxy Contract
    // "5Df6i9Ccy9R3bgBDvoWhYp8bTonxEWRqQMYqHisFpEtFUkpo", // devnet
    "5Gn57v4P85q2KaaCJrbuyMVkp4C3zb7VByfBgYyD7vEac7Dg" // canarynet
  );

  const p = [api.createType("u128", jobId), api.createType("Bytes", payload)];

  // Estimate gas
  const refTime = 57993577240 + 100;
  const proofSize = 1147120 + 10;
  const { gasRequired } = await contract.query.fulfill(
    // random account would do actually
    address,
    {
      gasLimit: api.registry.createType("WeightV2", {
        refTime,
        proofSize,
      }) as WeightV2,
    },
    ...p
  );
  const gasLimit = api.registry.createType("WeightV2", gasRequired) as WeightV2;

  const v = contract.tx.fulfill(
    {
      gasLimit,
    },
    ...p
  );

  const hash = await signAndSend(api, address, v, new NativeSigner());
  console.log("TX hash:", hash);
}

type PublicKeys = {
  p256: string;
  secp256k1: string;
  ed25519: string;
};

type JobId = {
  origin: {
    kind: string;
    source: string;
  };
  id: string;
};

class NativeSigner implements Signer {
  public async signRaw(raw: SignerPayloadRaw): Promise<SignerResult> {
    _STD_.chains.substrate.signer.setSigner("SECP256K1");

    const sig: string = _STD_.chains.substrate.signer.sign(raw.data);
    // prefix with the enum index for signature type; 02 corresponds to ecdsa
    const signature = ("0x02" + sig) as any;
    console.log("Signature:", signature);
    return {
      id: 0,
      // signature has to be 0x prefixed
      signature,
    };
  }
}

async function signAndSend(
  api: ApiPromise,
  account: AddressOrPair,
  call: SubmittableExtrinsic<"promise">,
  signer: Signer
): Promise<Hash> {
  return await new Promise((resolve, reject) => {
    try {
      const unsub = call
        .signAndSend(
          account,
          { signer },
          ({ status, txHash, dispatchError }) => {
            if (dispatchError) {
              let errStr = dispatchError.toString();
              if (dispatchError.isModule) {
                // for module errors, we have the section indexed, lookup
                let decoded;
                decoded = api.registry.findMetaError(dispatchError.asModule);
                const { docs, name, section } = decoded;

                errStr = section + "." + name;
              }
              unsub.then((unsub_) => {
                if (unsub_) {
                  unsub_();
                }
                reject(errStr);
              });
            } else if (status.isInBlock) {
              unsub.then((unsub_) => {
                if (unsub_) {
                  unsub_();
                }
                resolve(txHash);
              });
            }
          }
        )
        // this catch catches errors thrown from the callback and reject this function's promise
        .catch(reject);
    } catch (e) {
      reject(e);
    }
  });
}

main().catch((e) => {
  //discconnet
  provider.disconnect();

  throw e;
});
