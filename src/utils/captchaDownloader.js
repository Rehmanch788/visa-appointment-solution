const fs = require("fs");
const path = require("path");

// async function DownloadCaptcha(url) {
//     const splittedURL = url.split(",")[1];

//     const buffer = Buffer.from(splittedURL, "base64");
//     fs.rm('../images', { recursive: true, force: true })
//     const path = `../images/image.jpg`
//     fs.writeFileSync(path, buffer);
//     return path;
// }

// module.exports = DownloadCaptcha;
(async () => {
    await fs.mkdir("../images");
})();

async function broom() {
    try {
        await fs.mkdir(
            path.join(__dirname, "../images"),
            { recursive: true },
            (err, data) => {
                console.log("Directory created (or already existed)!");
            }
        );
    } catch (err) {
        console.error("Error creating directory:", err);
    }
}

broom();
