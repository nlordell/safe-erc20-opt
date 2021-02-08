const solc = require("solc");
const fs = require("fs").promises;
const path = require("path");

async function main() {
  const root = path.join(__dirname, "..");

  const source = path.join(root, "src/SafeERC20.sol");
  const { errors, contracts } = JSON.parse(
    solc.compile(
      JSON.stringify({
        language: "Solidity",
        sources: {
          "SafeERC20.sol": {
            content: await fs.readFile(source, "utf-8"),
          },
        },
        settings: {
          optimizer: {
            enabled: true,
            runs: 10000,
          },
          outputSelection: {
            "SafeERC20.sol": {
              SafeERC20: ["irOptimized", "evm.deployedBytecode.opcodes"],
            },
          },
        },
      })
    )
  );

  if (!contracts) {
    for (const { formattedMessage } of errors) {
      console.error(formattedMessage);
    }
    throw new Error("compilation error");
  }

  const { irOptimized } = contracts["SafeERC20.sol"].SafeERC20;

  const outdir = path.join(root, "out");
  await fs.mkdir(outdir, { recursive: true });

  for (const [
    name,
    {
      irOptimized,
      evm: {
        deployedBytecode: { opcodes },
      },
    },
  ] of Object.entries(contracts["SafeERC20.sol"])) {
    await fs.writeFile(
      path.join(outdir, `${name}.evm`),
      opcodes.replace(/ /g, "\n")
    );
    await fs.writeFile(path.join(outdir, `${name}.yul`), irOptimized);
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
