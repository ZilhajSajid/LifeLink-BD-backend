import app from "./app";
import config from "./app/config";
import { prisma } from "./app/lib/prisma";
import { seedTesterAdmin } from "./app/utils/seed";

const Port = config.port;

const main = async () => {
  try {
    await prisma.$connect();
    console.log("Connected to the database successfully");
    await seedTesterAdmin();
    app.listen(Port, () => {
      console.log(`LifeLink server is running on ${Port}`);
    });
  } catch (error) {
    console.error("Error Starting the server", error);
    await prisma.$disconnect();
    process.exit(1);
  }
};

main();
