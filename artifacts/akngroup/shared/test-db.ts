import { connectDB, disconnectDB } from "../server/lib/db";
import { UserModel, MembershipPackageModel } from "../server/lib/models";

const test = async () => {
  await connectDB();

  const users = await UserModel.find();
  const packages = await MembershipPackageModel.find();

  console.log("👤 Users:", users);
  console.log("📦 Packages:", packages);

  await disconnectDB();
};

test();