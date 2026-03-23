const DB_Connection = require("./src/connection/connectDB");
const { app, port } = require("./app");
const { startBot } = require("./src/bot");
const playWrightUpdate = require('./src/scripts/calendar-update')

DB_Connection()
    .then(() => {
        
        startBot();
        playWrightUpdate();

        app.listen(port, () => {
            console.log(`App is running on http://localhost:${port}`);
        });
    })
    .catch((err) => {
        console.log("DB connection error: ", err);
    });
