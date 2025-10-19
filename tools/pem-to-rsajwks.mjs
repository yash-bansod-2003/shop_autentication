import fs from "node:fs";
import rsaPemToJwk from "rsa-pem-to-jwk";

const publicKey = fs.readFileSync("./certificates/public.pem");

const jwk = rsaPemToJwk(
  publicKey,
  {
    use: "sig",
  },
  "public",
);

console.log(JSON.stringify(jwk));