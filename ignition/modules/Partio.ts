import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const USDC =
  "0x3600000000000000000000000000000000000000";

const PartioModule = buildModule(
  "PartioModule",
  (m) => {
    const partio = m.contract(
      "Partio",
      [USDC]
    );

    return {
      partio,
    };
  }
);

export default PartioModule;