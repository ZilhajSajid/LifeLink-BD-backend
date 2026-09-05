import app from "./app";
import config from "./app/config";
const Port = config.port;
const main = async () => {
    try {
        app.listen(Port, () => {
            console.log(`LifeLink server is running on ${Port}`);
        });
    }
    catch (error) {
        console.error("Error Starting the server", error);
        process.exit(1);
    }
};
main();
