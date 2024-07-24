import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);

  const Coprocessor = await ethers.getContractFactory("Coprocessor");
  const evmAddress = process.env.EVM_ADDRESS;

  const contract = await Coprocessor.deploy(evmAddress);

  console.log("Contract deployed at:", contract.address);

  const etherValue = ethers.utils.parseEther("0.01");

  for (let i = 0; i < 3; i++) {
    const tx = await contract.newJob({ value: etherValue });
    await tx.wait();
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
