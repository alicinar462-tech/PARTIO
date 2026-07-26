// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract Partio {
    error InvalidRecipients();
    error InvalidAmounts();
    error InvalidValue();
    error TransferFailed(address recipient);

    event PaymentSent(
        address indexed sender,
        address indexed recipient,
        uint256 amount
    );

    event PaymentPartitioned(
        address indexed sender,
        uint256 totalAmount,
        uint256 recipientCount
    );

    function partition(
        address[] calldata recipients,
        uint256[] calldata amounts
    ) external payable {
        if (recipients.length == 0) revert InvalidRecipients();
        if (recipients.length != amounts.length) revert InvalidAmounts();

        uint256 total;

        unchecked {
            for (uint256 i = 0; i < amounts.length; i++) {
                if (recipients[i] == address(0)) revert InvalidRecipients();
                if (amounts[i] == 0) revert InvalidAmounts();

                total += amounts[i];
            }
        }

        if (msg.value != total) revert InvalidValue();

        unchecked {
            for (uint256 i = 0; i < recipients.length; i++) {
                (bool success, ) = payable(recipients[i]).call{
                    value: amounts[i]
                }("");

                if (!success) revert TransferFailed(recipients[i]);

                emit PaymentSent(
                    msg.sender,
                    recipients[i],
                    amounts[i]
                );
            }
        }

        emit PaymentPartitioned(
            msg.sender,
            total,
            recipients.length
        );
    }
}   