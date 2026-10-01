// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract PartioVault {
    using SafeERC20 for IERC20;

    IERC20 public immutable usdc;
    address public immutable owner;

    bool public executed;

    error InvalidUSDC();
    error InvalidOwner();
    error InvalidRecipients();
    error InvalidAmounts();
    error InvalidValue();
    error InsufficientBalance();
    error AlreadyExecuted();
    error TransferFailed();

    event PaymentExecuted(
        address indexed owner,
        uint256 totalAmount,
        uint256 recipientCount
    );

    event Refunded(
        address indexed owner,
        uint256 amount
    );

    constructor(
        address usdcAddress,
        address ownerAddress
    ) {
        if (usdcAddress == address(0)) {
            revert InvalidUSDC();
        }

        if (ownerAddress == address(0)) {
            revert InvalidOwner();
        }

        usdc = IERC20(usdcAddress);
        owner = ownerAddress;
    }

    modifier onlyOwner() {
        if (msg.sender != owner) {
            revert InvalidOwner();
        }

        _;
    }

    function execute(
        address[] calldata recipients,
        uint256[] calldata amounts,
        uint256 totalAmount
    ) external onlyOwner {
        if (executed) {
            revert AlreadyExecuted();
        }

        if (recipients.length == 0) {
            revert InvalidRecipients();
        }

        if (recipients.length != amounts.length) {
            revert InvalidAmounts();
        }

        if (totalAmount == 0) {
            revert InvalidValue();
        }

        uint256 total;

        for (uint256 i = 0; i < amounts.length; ++i) {
            if (recipients[i] == address(0)) {
                revert InvalidRecipients();
            }

            if (amounts[i] == 0) {
                revert InvalidAmounts();
            }

            total += amounts[i];
        }

        if (total != totalAmount) {
            revert InvalidValue();
        }

        if (usdc.balanceOf(address(this)) < totalAmount) {
            revert InsufficientBalance();
        }

        executed = true;

        for (uint256 i = 0; i < recipients.length; ++i) {
            usdc.safeTransfer(
                recipients[i],
                amounts[i]
            );
        }

        emit PaymentExecuted(
            owner,
            totalAmount,
            recipients.length
        );
    }

    function refund()
        external
        onlyOwner
    {
        if (executed) {
            revert AlreadyExecuted();
        }

        uint256 amount = usdc.balanceOf(
            address(this)
        );

        if (amount == 0) {
            revert InvalidValue();
        }

        executed = true;

        usdc.safeTransfer(
            owner,
            amount
        );

        emit Refunded(
            owner,
            amount
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