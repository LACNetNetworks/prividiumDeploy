const { ethers, FetchRequest } = require("ethers");
const fs = require("fs");
const path = require("path");
const axios = require("axios");
require("dotenv").config();

let token = null;

const PROVIDER_RPC_URL = process.env.RPC_NODE_URL;

console.log(`🌐 Provider RPC URL: ${PROVIDER_RPC_URL}`);

const contractAbi = require(`../artifacts/contracts/Storage.sol/Storage.json`);

const originalSend = FetchRequest.prototype.send;
FetchRequest.prototype.send = async function () {
  try {
    this.setHeader("Authorization", `Bearer ${token}`);

    // Log headers before sending
    console.log("\n📋 Request Headers:");
    console.log("URL:", this.url);
    console.log("Method:", this.method || "POST");

    const headers = {};
    if (this.headers) {
      for (const key of Object.keys(this.headers)) {
        headers[key] = this.headers[key];
      }
    }
    console.log("Headers:", JSON.stringify(headers, null, 2));

    const raw = this.body.toString("utf8");

    // Convert byte array to readable body string
    const byteArray = raw.split(",").map(Number);
    const buf = Buffer.from(byteArray);
    const text = buf.toString("utf8");
    console.log("Body:", text);
  } catch (error) {
    console.error("❌ Error setting Authorization header:", error.message);
  }

  return originalSend.call(this);
};

async function getAuthToken() {
  try {
    // Step 1: Auth Keycloak
    const r1 = await axios.post(
      process.env.KEYCLOACK_URL,
      new URLSearchParams({
        grant_type: "password",
        client_id: process.env.KEYCLOAK_CLIENT_ID,
        username: process.env.KEYCLOAK_USERNAME,
        password: process.env.KEYCLOAK_PASSWORD,
        scope: "openid email profile"
      }),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "User-Agent": "hardhat-deployment-script"
        }
      }
    );

    const id_token = r1.data.id_token;
    console.log("✅ Keycloak ID Token obtained:", id_token);

    // Step 2: Auth Prividium
    const priv_auth_url = process.env.PRIVIDIUM_PERMISSION_SERVICE_URL;
    const data = { jwt: id_token };

    const r2 = await axios.post(priv_auth_url, data, {
      headers: { "content-type": "application/json" }
    });

    const token = r2.data.token;
    console.log("✅ Prividium JWT Token obtained:", token);

    return token;
  } catch (error) {
    console.error("❌ Error obteniendo token JWT:", error.message);
    if (error.response) {
      console.error("Response status:", error.response.status);
      console.error("Response data:", error.response.data);
    }
    throw error;
  }
}

async function doDeploy() {
  console.log("Contract Name:", contractAbi.contractName);

  const provider = new ethers.JsonRpcProvider(PROVIDER_RPC_URL);

  const signer = new ethers.Wallet(
    process.env.USER_PRIVATE_KEY,
    provider
  );

  const contractFactory = new ethers.ContractFactory(
    contractAbi.abi,
    contractAbi.bytecode,
    signer
  );

  const contract = await contractFactory.deploy();
  const receipt = await contract.deploymentTransaction()?.wait();
  const contractAddress = receipt?.contractAddress;

  return contractAddress;
}

(async () => {
  try {
    console.log("🔄 Getting access token...");
    token = await getAuthToken();
    console.log("✅ Token:", token);

    console.log("\n🔄 Transaction Origin...");
    console.log(
      "✅ Origin Address:",
      ethers.computeAddress(`0x${process.env.USER_PRIVATE_KEY}`)
    );

    console.log("\n🔄 Deploying contract...");
    const contractAddress = await doDeploy();
    console.log("\n🎉 Deployed! At:", contractAddress);
  } catch (error) {
    console.error("\n❌ Deployment failed:", error.message);
    process.exit(1);
  }
})();