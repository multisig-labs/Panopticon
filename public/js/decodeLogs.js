import { parseEventLogs } from "viem";
import { base58_to_binary, binary_to_base58 } from "base58-js";

async function sha256(message) {
  const buffer = await window.crypto.subtle.digest("SHA-256", message.buffer);
  return new Uint8Array(buffer);
}

async function encodeBase58(data) {
  if (typeof data === "string" && data.startsWith("0x")) {
    data = new Uint8Array(
      data
        .slice(2)
        .match(/.{1,2}/g)
        .map((byte) => parseInt(byte, 16)),
    );
  }
  const checksum = await sha256(data);
  const buffer = new Uint8Array(data.length + 4);
  buffer.set(data);
  buffer.set(checksum.slice(-4), data.length);
  return binary_to_base58(buffer);
}

async function decodeBase58(data) {
  const buffer = base58_to_binary(data);
  const payload = buffer.slice(0, -4);
  const checksum = buffer.slice(-4);
  const newChecksum = (await sha256(payload)).slice(-4);

  if (
    (checksum[0] ^ newChecksum[0]) |
    (checksum[1] ^ newChecksum[1]) |
    (checksum[2] ^ newChecksum[2]) |
    (checksum[3] ^ newChecksum[3])
  )
    throw new Error("Invalid checksum");
  return payload;
}

function toHex(bytes) {
  return (
    "0x" +
    Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("")
  );
}

async function formatLog(log) {
  if (log.args.validationID) log.args.validationID = await encodeBase58(log.args.validationID);
  if (log.args.delegationID) log.args.delegationID = await encodeBase58(log.args.delegationID);
  return log;
}

export class DecodeLogs {
  /**
   * @param {object} publicClient - Viem Public Client (e.g., from createPublicClient)
   * @param {Array<object>} eventABIs
   */
  constructor(publicClient, eventABIs) {
    this.publicClient = publicClient;
    this.eventABIs = eventABIs;
  }

  async scanAndWatchChainLogs(onDecodedLogCallback) {
    if (!this.publicClient) {
      console.error("Public client is not initialized.");
      return () => {}; // Return a no-op unwatch function
    }
    if (!this.eventABIs || this.eventABIs.length === 0) {
      console.warn("No event ABIs provided to DecodeLogs class.");
      return () => {};
    }

    const validEventABIs = this.eventABIs.filter((abi) => abi.type === "event");

    if (validEventABIs.length === 0) {
      console.warn("No valid event ABIs found to process.");
      return () => {};
    }

    const unwatchFunctions = [];

    // 1. Fetch and decode historical logs for all events at once
    try {
      console.log(`Fetching historical logs for events: ${validEventABIs.map((abi) => abi.name).join(", ")}`);
      const historicalLogs = await this.publicClient.getLogs({
        events: validEventABIs, // Pass all valid event ABIs
        fromBlock: 0n,
        toBlock: "latest",
        strict: true,
      });

      console.log(`Found ${historicalLogs.length} total historical logs. Decoding...`);
      const historicalLogsDecoded = parseEventLogs({
        abi: this.eventABIs,
        logs: historicalLogs,
      });

      for (const log of historicalLogsDecoded) {
        console.log(log);
        onDecodedLogCallback(await formatLog(log));
      }
    } catch (error) {
      console.error("Error fetching or decoding historical logs:", error);
    }

    console.log(`Watching for new logs...`);
    const filter = await this.publicClient.createContractEventFilter({
      abi: this.eventABIs,
    });

    // Watch for new logs every 2 seconds
    const intervalId = setInterval(async () => {
      try {
        const newLogs = await this.publicClient.getFilterChanges({ filter });

        if (newLogs.length > 0) {
          const decodedLogs = parseEventLogs({
            abi: this.eventABIs,
            logs: newLogs,
          });

          for (const log of decodedLogs) {
            onDecodedLogCallback(await formatLog(log));
          }
        }
      } catch (error) {
        console.error("Error getting filter changes:", error);
      }
    }, 2000);

    // Add cleanup function to unwatchFunctions array
    unwatchFunctions.push(() => {
      clearInterval(intervalId);
    });

    // Return composite unwatch function that cleans up all watchers
    return () => {
      unwatchFunctions.forEach((unwatch) => unwatch());
    };
  }
}

export default DecodeLogs;
