// SPDX-License-Identifier: CC0-1.0
pragma solidity >=0.7.0 <0.9.0;

interface ERC20 {
    function transfer(address to, uint256 value) external returns (bool);
}

contract SafeERC20 {
    function safeTransfer1(ERC20 token, address to, uint256 value) external returns (bool success) {
        bytes memory returndata;
        (success, returndata) = address(token).call(
            abi.encodeWithSelector(token.transfer.selector, to, value)
        );

        if (!success) {
            assembly {
                revert(add(returndata, 0x20), mload(returndata))
            }
        }
        if (returndata.length > 0) {
            success = abi.decode(returndata, (bool));
        }
    }

    function safeTransfer2(ERC20 token, address to, uint256 value) external returns (bool success) {
        bytes4 selector_ = token.transfer.selector;

        // solhint-disable-next-line no-inline-assembly
        assembly {
            let freeMemoryPointer := mload(0x40)
            mstore(freeMemoryPointer, selector_)
            mstore(add(freeMemoryPointer, 4), and(to, 0xffffffffffffffffffffffffffffffffffffffff))
            mstore(add(freeMemoryPointer, 36), value)

            if iszero(call(gas(), token, 0, freeMemoryPointer, 68, 0, 0)) {
                returndatacopy(0, 0, returndatasize())
                revert(0, returndatasize())
            }
            switch returndatasize()
                case 0 {
                    success := 1
                }
                case 32 {
                    returndatacopy(0, 0, returndatasize())
                    success := mload(0)
                }
                default {
                    success := 0
                }
        }
    }
}

