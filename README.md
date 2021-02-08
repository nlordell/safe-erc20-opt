Sample code to demonstrate calldata copying loop.
Specifically, using `address.call(abi.encodeWithSelector(...))` seems to generate an additional loop to copy the intermediate ABI encoded calldata past the free memory pointer for executing the `CALL`.

Here is the generated EVM opcodes for the code without assembly.

```
JUMPDEST

PUSH1
0x40
DUP1
MLOAD # read free memory pointer

PUSH20
0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF
DUP5
DUP2
AND
PUSH1
0x24
DUP4
ADD
MSTORE # append `to` parameter

PUSH1
0x44
DUP1
DUP4
ADD
DUP6
SWAP1
MSTORE # append `value` parameter

DUP4
MLOAD
DUP1
DUP5
SUB
SWAP1
SWAP2
ADD
DUP2
MSTORE

PUSH1
0x64
SWAP1
SWAP3
ADD
DUP4
MSTORE # update the free memory pointer

PUSH1
0x20
DUP3
ADD
DUP1
MLOAD
PUSH28
0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF
AND
PUSH32
0xA9059CBB00000000000000000000000000000000000000000000000000000000
OR
DUP2
MSTORE # add selector to masked first word
       # (preserving the most significant 28 bytes of the first paramter)

SWAP3
MLOAD
DUP3
MLOAD
PUSH1
0x0
SWAP5
PUSH1
0x60
SWAP5
SWAP4
DUP10
AND
SWAP4
SWAP3
SWAP2
DUP3
SWAP2
SWAP1
DUP1
DUP4
DUP4

JUMPDEST # loop: copy memory 
PUSH1
0x20
DUP4
LT
PUSH2
0x1AB
JUMPI # loop: while there are more the 32 bytes to copy
DUP1
MLOAD
DUP3
MSTORE
PUSH32
0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFE0 # fancy way of saying -32
SWAP1
SWAP3
ADD # one word was copied, so + (-32) bytes remaining to copy
SWAP2
PUSH1
0x20
SWAP2
DUP3
ADD
SWAP2
ADD
PUSH2
0x16E
JUMP
JUMPDEST # loop: end

PUSH1
0x1
DUP4
PUSH1
0x20
SUB
PUSH2
0x100
EXP # compute mask for remaining number (<32) bytes to copy

SUB
DUP1
NOT
DUP3
MLOAD
AND
DUP2
DUP5
MLOAD
AND
DUP1
DUP3
OR
DUP6
MSTORE # mask and copy remaining trailing bytes from memory

POP
POP
POP
POP
POP
POP
SWAP1
POP
ADD
SWAP2
POP
POP # fix stack

PUSH1
0x0
PUSH1
0x40
MLOAD
DUP1
DUP4
SUB
DUP2
PUSH1
0x0
DUP7
GAS
CALL
```

The result is that the non-assembly version of encoding and calling a `transfer` costs ~600 gas more.
For comparison, here is the complete generated EVM assembly for encoding and calling `transfer` with the hand-optimized assembly:

```
JUMPDEST

PUSH1
0x40
MLOAD # read free memory pointer

PUSH32
0xA9059CBB00000000000000000000000000000000000000000000000000000000
DUP1
DUP3
MSTORE # write selector past free memory pointer

PUSH20
0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF
DUP5
AND
PUSH1
0x4
DUP4
ADD
MSTORE # append `to` parameter

PUSH1
0x24
DUP3
ADD
DUP4
SWAP1
MSTORE # append `value` parameter

PUSH1
0x0
SWAP2
DUP3
DUP1
PUSH1
0x44
DUP4
DUP3
DUP11
GAS
CALL
```
