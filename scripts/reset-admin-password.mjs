import { MongoClient } from "mongodb";
import bcrypt from "bcryptjs";
import readline from "node:readline/promises";
import { stdin, stdout } from "node:process";

const rl = readline.createInterface({ input: stdin, output: stdout });

async function main() {
  const email = "gskaboagye@gmail.com";

  const password = await rl.question("Enter your new administrator password: ");
  const confirmation = await rl.question("Confirm your new password: ");

  if (password !== confirmation) {
    throw new Error("Passwords do not match.");
  }

  if (password.length < 12 || Buffer.byteLength(password, "utf8") > 72) {
    throw new Error("Password must contain at least 12 characters and not exceed 72 UTF-8 bytes.");
  }

  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error("MONGODB_URI is not configured.");
  }

  const client = new MongoClient(uri);

  try {
    await client.connect();

    const db = client.db(process.env.MONGODB_DB || "agrivanta");
    const administrators = db.collection("administrators");

    const admin = await administrators.findOne({ email });

    if (!admin) {
      throw new Error("Administrator account was not found.");
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const result = await administrators.updateOne(
      { _id: admin._id },
      { $set: { passwordHash, updatedAt: new Date() } }
    );

    if (result.modifiedCount !== 1) {
      throw new Error("Password update could not be confirmed.");
    }

    console.log("\nAdministrator password successfully updated.");
    console.log("Account email:", email);
    console.log("Account status:", admin.status);
  } finally {
    await client.close();
  }
}

main()
  .catch((error) => {
    console.error("\nPassword reset failed:", error.message);
    process.exitCode = 1;
  })
  .finally(() => rl.close());