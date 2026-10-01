// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./PartioVault.sol";

contract PartioV2 {
    IERC20 public immutable usdc;

    uint256 public paymentCount;
    mapping(uint256 => address) public payments;

    error InvalidUSDC();

    event PaymentCreated(
        uint256 indexed paymentId,
        address indexed owner,
        address indexed vault
    );

    constructor(address usdcAddress) {
        if (usdcAddress == address(0)) revert InvalidUSDC();

        usdc = IERC20(usdcAddress);
    }

    function createPayment()
        external
        returns (uint256 paymentId, address vault)
    {
        paymentId = paymentCount;

        PartioVault newVault = new PartioVault(
            address(usdc),
            msg.sender
        );

        vault = address(newVault);

        payments[paymentId] = vault;
        paymentCount++;

        emit PaymentCreated(
            paymentId,
            msg.sender,
            vault
        );
    }

    function getPaymentVault(uint256 paymentId)
        external
        view
        returns (address)
    {
        return payments[paymentId];
    }
}