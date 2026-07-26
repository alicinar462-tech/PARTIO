import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const PartioModule = buildModule("PartioModule", (m) => {
  const partio = m.contract("Partio");

  return { partio };
});

export default PartioModule;