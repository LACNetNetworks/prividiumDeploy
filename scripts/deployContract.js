const { ethers, FetchRequest } = require("ethers");
const fs = require("fs");
const path = require("path");
const axios = require("axios");
require('dotenv').config();

const PROVIDER_RPC_URL = process.env.RPC_NODE_URL;

console.log(`🌐 Provider RPC URL: ${PROVIDER_RPC_URL}`);

const contractAbi = require(`../artifacts/contracts/Storage.sol/Storage.json`);

const originalSend = FetchRequest.prototype.send;
FetchRequest.prototype.send = async function () {
  try {
    const access_token =  await getAuthToken();
    //const access_token = process.env.TOKEN_BEARER;// await getAuthToken();
    this.setHeader("Authorization", `Bearer ${access_token}`);
    
    // Log headers before sending
    console.log("\n📋 Request Headers:");
    console.log("URL:", this.url);
    console.log("Method:", this.method || "POST");
    
    // Access headers directly from the private property
    const headers = {};
    if (this.headers) {
      for (const key of Object.keys(this.headers)) {
        headers[key] = this.headers[key];
      }
    }
    console.log("Headers:", JSON.stringify(headers, null, 2));
    
    // Show body preview if available
    if (this.body) {
      const bodyStr = typeof this.body === 'string' ? this.body : JSON.stringify(this.body);
      console.log("Body preview:", bodyStr.substring(0, 200) + (bodyStr.length > 200 ? "..." : ""));
    }
    console.log("─".repeat(80) + "\n");
    
  } catch (error) {
    console.error("❌ Error setting Authorization header:", error.message);
  }
  
  return originalSend.call(this);
};

async function getAuthToken() {
  try {
    const response = await axios.post(
      'https://keycloak-ppr.l-net.io/realms/ppr-realm/protocol/openid-connect/token',
      new URLSearchParams({
        grant_type: 'password', 
        client_id: process.env.KEYCLOAK_CLIENT_ID,
        client_secret: process.env.KEYCLOAK_CLIENT_SECRET,
        username: process.env.KEYCLOAK_USERNAME,
        password: process.env.KEYCLOAK_PASSWORD,
        scope: "openid email profile"
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'hardhat-deployment-script'
        }
      }
    );
    
    return response.data.id_token;
  } catch (error) {
    console.error("❌ Error obteniendo token JWT:", error.message);
    if (error.response) {
      console.error("Response status:", error.response.status);
      console.error("Response data:", error.response.data);
    }
    throw error;
  }
}

// Main
async function doDeploy(){ 
  console.log("Contract Name: ", contractAbi.contractName);

  const provider = new ethers.JsonRpcProvider(PROVIDER_RPC_URL);

  const signer = new ethers.Wallet(
    process.env.USER_PRIVATE_KEY,
    provider
  );

  const contractFactory = new ethers.ContractFactory(contractAbi.abi, contractAbi.bytecode, signer);
 
  const contract = await contractFactory.deploy();
  const receipt = await contract.deploymentTransaction()?.wait();  
  const contractAddress = receipt?.contractAddress;
  
  return contractAddress;
}

(async () => {
  try {
    console.log("🔄 Getting access token...");
    const token = await getAuthToken();
    console.log("✅ Token:", token.substring(0, 50) + "...");
    
    console.log("\n🔄 Transaction Origin...");
    console.log("✅ Origin Address:", ethers.computeAddress(`0x${process.env.USER_PRIVATE_KEY}`));  
    
    console.log("\n🔄 Deploying contract...");
    const contractAddress = await doDeploy();
    console.log("\n🎉 Deployed! At: ", contractAddress);
  } catch (error) {
    console.error("\n❌ Deployment failed:", error.message);
    process.exit(1);
  }
})();