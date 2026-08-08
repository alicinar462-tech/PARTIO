// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface IERC20 {
    function transfer(address to, uint256 value)
        external
        returns (bool);

    function balanceOf(address account)
        external
        view
        returns (uint256);
}

contract PartioV2 {
    IERC20 public immutable usdc;

    error InvalidRecipients();
    error InvalidAmounts();
    error TransferFailed(address recipient);

    event PaymentSent(
        address indexed recipient,
        uint256 amount
    );

    event PaymentPartitioned(
        uint256 totalAmount,
        uint256 recipientCount
    );

    constructor(address usdcAddress) {
        usdc = IERC20(usdcAddress);
    }

    function partition(
        address[] calldata recipients,
        uint256[] calldata amounts
    ) external {
        if (recipients.length == 0)
            revert InvalidRecipients();

        if (recipients.length != amounts.length)
            revert InvalidAmounts();

        uint256 total;

        unchecked {
            for (uint256 i; i < amounts.length; ++i) {
                if (
                    recipients[i] == address(0)
                ) {
                    revert InvalidRecipients();
                }

                if (amounts[i] == 0) {
                    revert InvalidAmounts();
                }

                total += amounts[i];
            }
        }

        require(
            usdc.balanceOf(address(this)) >= total,
            "INSUFFICIENT_USDC"
        );

        unchecked {
            for (uint256 i; i < recipients.length; ++i) {
                bool success =
                    usdc.transfer(
                        recipients[i],
                        amounts[i]
                    );

                if (!success) {
                    revert TransferFailed(
                        recipients[i]
                    );
                }

                emit PaymentSent(
                    recipients[i],
                    amounts[i]
                );
            }
        }

        emit PaymentPartitioned(
            total,
            recipients.length
        );
    }

    function balance()
        external
        view
        returns (uint256)
    {
        return usdc.balanceOf(
            address(this)
        );
    }
}