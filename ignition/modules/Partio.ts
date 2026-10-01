import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const USDC =
  "0x3600000000000000000000000000000000000000";

const PartioV2Module = buildModule(
  "PartioV2Module",
  (m) => {
    const partioV2 = m.contract(
      "PartioV2",
      [USDC]
    );

    return {
      partioV2,
    };
  }
);

export default PartioV2Module;