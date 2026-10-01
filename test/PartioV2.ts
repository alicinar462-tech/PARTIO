import { expect } from "chai";
import { network } from "hardhat";

const { ethers } = await network.connect();

describe("PartioV2", function () {
  async function deployFixture() {
    const [
      signer,
      recipient1,
      recipient2,
      attacker,
      secondSigner,
    ] = await ethers.getSigners();

    const MockUSDC =
      await ethers.getContractFactory("MockUSDC");

    const usdc =
      await MockUSDC.deploy();

    await usdc.waitForDeployment();

    const PartioV2 =
      await ethers.getContractFactory("PartioV2");

    const partio =
      await PartioV2.deploy(
        await usdc.getAddress()
      );

    await partio.waitForDeployment();

    return {
      signer,
      recipient1,
      recipient2,
      attacker,
      secondSigner,
      usdc,
      partio,
    };
  }

  async function createPayment(
    partio: any,
    signer: any
  ) {
    const tx = await partio
      .connect(signer)
      .createPayment();

    const receipt = await tx.wait();

    const event = receipt.logs.find(
      (log: any) => {
        try {
          return (
            partio.interface.parseLog(log)?.name ===
            "PaymentCreated"
          );
        } catch {
          return false;
        }
      }
    );

    const parsed =
      partio.interface.parseLog(event);

    return {
      paymentId: parsed!.args.paymentId,
      vault: parsed!.args.vault,
    };
  }

  async function mintAndSend(
    usdc: any,
    from: any,
    to: string,
    amount: bigint
  ) {
    await usdc.mint(
      await from.getAddress(),
      amount
    );

    await usdc
      .connect(from)
      .transfer(to, amount);
  }

  it(
    "creates a unique payment vault",
    async function () {
      const {
        signer,
        partio,
      } = await deployFixture();

      const payment1 =
        await createPayment(
          partio,
          signer
        );

      const payment2 =
        await createPayment(
          partio,
          signer
        );

      expect(
        payment1.paymentId
      ).to.equal(0);

      expect(
        payment2.paymentId
      ).to.equal(1);

      expect(
        payment1.vault
      ).to.not.equal(
        payment2.vault
      );

      expect(
        await partio.getPaymentVault(0)
      ).to.equal(payment1.vault);

      expect(
        await partio.getPaymentVault(1)
      ).to.equal(payment2.vault);
    }
  );

  it(
    "assigns the payment vault to the creator",
    async function () {
      const {
        signer,
        usdc,
        partio,
      } = await deployFixture();

      const {
        vault,
      } = await createPayment(
        partio,
        signer
      );

      const vaultContract =
        await ethers.getContractAt(
          "PartioVault",
          vault
        );

      expect(
        await vaultContract.owner()
      ).to.equal(
        await signer.getAddress()
      );

      expect(
        await vaultContract.usdc()
      ).to.equal(
        await usdc.getAddress()
      );
    }
  );

  it(
    "receives USDC in the payment vault",
    async function () {
      const {
        signer,
        usdc,
        partio,
      } = await deployFixture();

      const amount =
        ethers.parseUnits(
          "100",
          6
        );

      const {
        vault,
      } = await createPayment(
        partio,
        signer
      );

      await mintAndSend(
        usdc,
        signer,
        vault,
        amount
      );

      const vaultContract =
        await ethers.getContractAt(
          "PartioVault",
          vault
        );

      expect(
        await vaultContract.balance()
      ).to.equal(amount);

      expect(
        await usdc.balanceOf(vault)
      ).to.equal(amount);
    }
  );

  it(
    "executes a payment to multiple recipients",
    async function () {
      const {
        signer,
        recipient1,
        recipient2,
        usdc,
        partio,
      } = await deployFixture();

      const amount1 =
        ethers.parseUnits(
          "30",
          6
        );

      const amount2 =
        ethers.parseUnits(
          "70",
          6
        );

      const totalAmount =
        amount1 + amount2;

      const {
        vault,
      } = await createPayment(
        partio,
        signer
      );

      await mintAndSend(
        usdc,
        signer,
        vault,
        totalAmount
      );

      const vaultContract =
        await ethers.getContractAt(
          "PartioVault",
          vault
        );

      await expect(
        vaultContract
          .connect(signer)
          .execute(
            [
              await recipient1.getAddress(),
              await recipient2.getAddress(),
            ],
            [
              amount1,
              amount2,
            ],
            totalAmount
          )
      )
        .to.emit(
          vaultContract,
          "PaymentExecuted"
        )
        .withArgs(
          await signer.getAddress(),
          totalAmount,
          2
        );

      expect(
        await usdc.balanceOf(
          await recipient1.getAddress()
        )
      ).to.equal(amount1);

      expect(
        await usdc.balanceOf(
          await recipient2.getAddress()
        )
      ).to.equal(amount2);

      expect(
        await vaultContract.balance()
      ).to.equal(0);

      expect(
        await vaultContract.executed()
      ).to.equal(true);
    }
  );

  it(
    "prevents a non-owner from executing a payment",
    async function () {
      const {
        signer,
        attacker,
        recipient1,
        usdc,
        partio,
      } = await deployFixture();

      const amount =
        ethers.parseUnits(
          "50",
          6
        );

      const {
        vault,
      } = await createPayment(
        partio,
        signer
      );

      await mintAndSend(
        usdc,
        signer,
        vault,
        amount
      );

      const vaultContract =
        await ethers.getContractAt(
          "PartioVault",
          vault
        );

      await expect(
        vaultContract
          .connect(attacker)
          .execute(
            [
              await recipient1.getAddress(),
            ],
            [amount],
            amount
          )
      )
        .to.be.revertedWithCustomError(
          vaultContract,
          "InvalidOwner"
        );
    }
  );

  it(
    "rejects execution when the vault has insufficient USDC",
    async function () {
      const {
        signer,
        recipient1,
        partio,
      } = await deployFixture();

      const vaultAmount =
        ethers.parseUnits(
          "50",
          6
        );

      const paymentAmount =
        ethers.parseUnits(
          "60",
          6
        );

      const {
        vault,
      } = await createPayment(
        partio,
        signer
      );

      const vaultContract =
        await ethers.getContractAt(
          "PartioVault",
          vault
        );

      await expect(
        vaultContract
          .connect(signer)
          .execute(
            [
              await recipient1.getAddress(),
            ],
            [paymentAmount],
            paymentAmount
          )
      )
        .to.be.revertedWithCustomError(
          vaultContract,
          "InsufficientBalance"
        );
    }
  );

  it(
    "rejects mismatched recipient and amount lengths",
    async function () {
      const {
        signer,
        partio,
      } = await deployFixture();

      const {
        vault,
      } = await createPayment(
        partio,
        signer
      );

      const vaultContract =
        await ethers.getContractAt(
          "PartioVault",
          vault
        );

      await expect(
        vaultContract
          .connect(signer)
          .execute(
            [
              await signer.getAddress(),
              await signer.getAddress(),
            ],
            [
              ethers.parseUnits(
                "10",
                6
              ),
            ],
            ethers.parseUnits(
              "10",
              6
            )
          )
      )
        .to.be.revertedWithCustomError(
          vaultContract,
          "InvalidAmounts"
        );
    }
  );

  it(
    "rejects an incorrect total amount",
    async function () {
      const {
        signer,
        partio,
      } = await deployFixture();

      const amount1 =
        ethers.parseUnits(
          "10",
          6
        );

      const amount2 =
        ethers.parseUnits(
          "20",
          6
        );

      const wrongTotal =
        ethers.parseUnits(
          "40",
          6
        );

      const {
        vault,
      } = await createPayment(
        partio,
        signer
      );

      const vaultContract =
        await ethers.getContractAt(
          "PartioVault",
          vault
        );

      await expect(
        vaultContract
          .connect(signer)
          .execute(
            [
              await signer.getAddress(),
              await signer.getAddress(),
            ],
            [
              amount1,
              amount2,
            ],
            wrongTotal
          )
      )
        .to.be.revertedWithCustomError(
          vaultContract,
          "InvalidValue"
        );
    }
  );

  it(
    "prevents executing the same payment twice",
    async function () {
      const {
        signer,
        recipient1,
        usdc,
        partio,
      } = await deployFixture();

      const amount =
        ethers.parseUnits(
          "50",
          6
        );

      const {
        vault,
      } = await createPayment(
        partio,
        signer
      );

      await mintAndSend(
        usdc,
        signer,
        vault,
        amount
      );

      const vaultContract =
        await ethers.getContractAt(
          "PartioVault",
          vault
        );

      await vaultContract
        .connect(signer)
        .execute(
          [
            await recipient1.getAddress(),
          ],
          [amount],
          amount
        );

      await expect(
        vaultContract
          .connect(signer)
          .execute(
            [
              await recipient1.getAddress(),
            ],
            [amount],
            amount
          )
      )
        .to.be.revertedWithCustomError(
          vaultContract,
          "AlreadyExecuted"
        );
    }
  );

  it(
    "refunds unused USDC to the owner",
    async function () {
      const {
        signer,
        usdc,
        partio,
      } = await deployFixture();

      const amount =
        ethers.parseUnits(
          "75",
          6
        );

      const {
        vault,
      } = await createPayment(
        partio,
        signer
      );

      await mintAndSend(
        usdc,
        signer,
        vault,
        amount
      );

      const before =
        await usdc.balanceOf(
          await signer.getAddress()
        );

      const vaultContract =
        await ethers.getContractAt(
          "PartioVault",
          vault
        );

      await expect(
        vaultContract
          .connect(signer)
          .refund()
      )
        .to.emit(
          vaultContract,
          "Refunded"
        )
        .withArgs(
          await signer.getAddress(),
          amount
        );

      const after =
        await usdc.balanceOf(
          await signer.getAddress()
        );

      expect(
        after - before
      ).to.equal(amount);

      expect(
        await vaultContract.balance()
      ).to.equal(0);

      expect(
        await vaultContract.executed()
      ).to.equal(true);
    }
  );

  it(
    "prevents a non-owner from refunding",
    async function () {
      const {
        signer,
        attacker,
        usdc,
        partio,
      } = await deployFixture();

      const amount =
        ethers.parseUnits(
          "25",
          6
        );

      const {
        vault,
      } = await createPayment(
        partio,
        signer
      );

      await mintAndSend(
        usdc,
        signer,
        vault,
        amount
      );

      const vaultContract =
        await ethers.getContractAt(
          "PartioVault",
          vault
        );

      await expect(
        vaultContract
          .connect(attacker)
          .refund()
      )
        .to.be.revertedWithCustomError(
          vaultContract,
          "InvalidOwner"
        );
    }
  );

  it(
    "keeps different payment vaults isolated",
    async function () {
      const {
        signer,
        secondSigner,
        recipient1,
        recipient2,
        usdc,
        partio,
      } = await deployFixture();

      const amount1 =
        ethers.parseUnits(
          "40",
          6
        );

      const amount2 =
        ethers.parseUnits(
          "60",
          6
        );

      const payment1 =
        await createPayment(
          partio,
          signer
        );

      const payment2 =
        await createPayment(
          partio,
          secondSigner
        );

      await mintAndSend(
        usdc,
        signer,
        payment1.vault,
        amount1
      );

      await mintAndSend(
        usdc,
        secondSigner,
        payment2.vault,
        amount2
      );

      const vault1 =
        await ethers.getContractAt(
          "PartioVault",
          payment1.vault
        );

      const vault2 =
        await ethers.getContractAt(
          "PartioVault",
          payment2.vault
        );

      await vault1
        .connect(signer)
        .execute(
          [
            await recipient1.getAddress(),
          ],
          [amount1],
          amount1
        );

      await vault2
        .connect(secondSigner)
        .execute(
          [
            await recipient2.getAddress(),
          ],
          [amount2],
          amount2
        );

      expect(
        await usdc.balanceOf(
          await recipient1.getAddress()
        )
      ).to.equal(amount1);

      expect(
        await usdc.balanceOf(
          await recipient2.getAddress()
        )
      ).to.equal(amount2);

      expect(
        await vault1.balance()
      ).to.equal(0);

      expect(
        await vault2.balance()
      ).to.equal(0);
    }
  );

  it(
    "rejects zero recipient",
    async function () {
      const {
        signer,
        partio,
      } = await deployFixture();

      const amount =
        ethers.parseUnits(
          "10",
          6
        );

      const {
        vault,
      } = await createPayment(
        partio,
        signer
      );

      const vaultContract =
        await ethers.getContractAt(
          "PartioVault",
          vault
        );

      await expect(
        vaultContract
          .connect(signer)
          .execute(
            [ethers.ZeroAddress],
            [amount],
            amount
          )
      )
        .to.be.revertedWithCustomError(
          vaultContract,
          "InvalidRecipients"
        );
    }
  );

  it(
    "rejects zero amount",
    async function () {
      const {
        signer,
        recipient1,
        partio,
      } = await deployFixture();

      const {
        vault,
      } = await createPayment(
        partio,
        signer
      );

      const vaultContract =
        await ethers.getContractAt(
          "PartioVault",
          vault
        );

      await expect(
        vaultContract
          .connect(signer)
          .execute(
            [
              await recipient1.getAddress(),
            ],
            [0n],
            ethers.parseUnits(
              "1",
              6
            )
          )
      )
        .to.be.revertedWithCustomError(
          vaultContract,
          "InvalidAmounts"
        );
    }
  );

  it(
    "prevents refund after execution",
    async function () {
      const {
        signer,
        recipient1,
        usdc,
        partio,
      } = await deployFixture();

      const amount =
        ethers.parseUnits(
          "20",
          6
        );

      const {
        vault,
      } = await createPayment(
        partio,
        signer
      );

      await mintAndSend(
        usdc,
        signer,
        vault,
        amount
      );

      const vaultContract =
        await ethers.getContractAt(
          "PartioVault",
          vault
        );

      await vaultContract
        .connect(signer)
        .execute(
          [
            await recipient1.getAddress(),
          ],
          [amount],
          amount
        );

      await expect(
        vaultContract
          .connect(signer)
          .refund()
      )
        .to.be.revertedWithCustomError(
          vaultContract,
          "AlreadyExecuted"
        );
    }
  );
});