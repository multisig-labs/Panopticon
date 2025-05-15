/**
 * Service class to query NFTStakingManager contract data using Viem.
 */
export class NftStakingManagerService {
  /**
   * @param {object} publicClient - Viem Public Client (e.g., from createPublicClient)
   * @param {string} contractAddress - Address of the NFTStakingManager contract (e.g., "0x...")
   * @param {Array<object>} contractAbi - ABI of the NFTStakingManager contract
   */
  constructor(publicClient, contractAddress, contractAbi) {
    this.publicClient = publicClient;
    this.contractAddress = contractAddress;
    this.contractAbi = contractAbi;
  }

  /**
   * Fetches all validation IDs, their info, their delegations, and info for each delegation.
   * Uses Viem's multicall for batching read operations.
   * @returns {Promise<object>} A promise that resolves to an object structured as:
   * {
   *   [validationID]: {
   *     validationInfo: object, // Result of getValidationInfoView
   *     delegations: {
   *       [delegationID]: object // Result of getDelegationInfoView
   *     }
   *   }
   * }
   */
  async fetchAllData() {
    // 1. Get all validation IDs
    const validationIDs = await this.publicClient.readContract({
      address: this.contractAddress,
      abi: this.contractAbi,
      functionName: "getValidationIDs",
      args: [],
    });

    if (!validationIDs || validationIDs.length === 0) {
      console.log("No validation IDs found.");
      return {};
    }

    // 2. Prepare multicall for validation info and delegations list for each validation ID
    const firstPassContracts = [];
    validationIDs.forEach((validationID) => {
      firstPassContracts.push({
        address: this.contractAddress,
        abi: this.contractAbi,
        functionName: "getValidationInfoView",
        args: [validationID],
      });
      firstPassContracts.push({
        address: this.contractAddress,
        abi: this.contractAbi,
        functionName: "getDelegations",
        args: [validationID],
      });
    });

    const firstPassResults = await this.publicClient.multicall({
      contracts: firstPassContracts,
      allowFailure: false, // If any call fails, the entire multicall promise rejects
    });

    // 3. Process first pass results and prepare calls for delegation details
    const structuredData = {};
    const delegationDetailContracts = [];
    // To help map results from the second multicall back to the correct validator and delegation
    const delegationCallIndexToPath = [];

    for (let i = 0; i < validationIDs.length; i++) {
      const validationID = validationIDs[i];
      const validationInfo = firstPassResults[i * 2];
      const delegationsForValidator = firstPassResults[i * 2 + 1];

      structuredData[validationID] = {
        validationInfo: validationInfo,
        delegations: {}, // To be filled by the second multicall
      };

      if (delegationsForValidator && delegationsForValidator.length > 0) {
        delegationsForValidator.forEach((delegationID) => {
          delegationDetailContracts.push({
            address: this.contractAddress,
            abi: this.contractAbi,
            functionName: "getDelegationInfoView",
            args: [delegationID],
          });
          // Store where this result should go
          delegationCallIndexToPath.push({ validationID, delegationID });
        });
      }
    }

    // 4. If there are delegation details to fetch, perform the second multicall
    if (delegationDetailContracts.length > 0) {
      const delegationInfoResults = await this.publicClient.multicall({
        contracts: delegationDetailContracts,
        allowFailure: false,
      });

      // 5. Populate delegation details into the structuredData
      delegationInfoResults.forEach((delegationInfo, index) => {
        const { validationID, delegationID } = delegationCallIndexToPath[index];
        if (structuredData[validationID]) {
          structuredData[validationID].delegations[delegationID] = delegationInfo;
        }
      });
    }

    return structuredData;
  }
}
