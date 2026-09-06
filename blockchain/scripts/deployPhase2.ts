import { ethers, network } from "hardhat";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

async function main() {
  const [deployer] = await ethers.getSigners();
  const certificateFactory = await ethers.getContractFactory("ArtShieldCertificate");
  const certificate = await certificateFactory.deploy();
  await certificate.waitForDeployment();

  const ownershipFactory = await ethers.getContractFactory("ArtShieldOwnership");
  const ownership = await ownershipFactory.deploy();
  await ownership.waitForDeployment();

  const rightsFactory = await ethers.getContractFactory("UsageRightsToken");
  const rights = await rightsFactory.deploy(await ownership.getAddress());
  await rights.waitForDeployment();

  const chain = await ethers.provider.getNetwork();
  const deployment = {
    network: network.name,
    chainId: chain.chainId.toString(),
    deployer: deployer.address,
    certificate: await certificate.getAddress(),
    ownership: await ownership.getAddress(),
    rights: await rights.getAddress(),
  };
  const directory = join(process.cwd(), "deployments");
  await mkdir(directory, { recursive: true });
  await writeFile(join(directory, `${network.name}.json`), `${JSON.stringify(deployment, null, 2)}\n`, { encoding: "utf8", flag: "wx" });
  console.log(JSON.stringify(deployment, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
