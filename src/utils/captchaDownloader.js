const fs = require("fs").promises;
const path = require("path");

async function DownloadCaptcha(url) {
    const dir = path.join(__dirname, "../images");
    const filePath = path.join(dir, "image.jpg");

    try {
        // remove directory if exists
        await fs.rm(dir, { recursive: true, force: true });
        console.log("Removed Dir");

        // create directory
        await fs.mkdir(dir);
        console.log("Created Dir");

        // process base64
        const splittedURL = url.split(",")[1];
        const buffer = Buffer.from(splittedURL, "base64");

        // write file
        await fs.writeFile(filePath, buffer);

        return filePath; // ✅ NOW THIS WORKS

    } catch (err) {
        console.error("Error in DownloadCaptcha:", err);
        throw err;
    }
}


// DownloadCaptcha('data:image/jpeg;base64,R0lGODlhZAAjAPcAAAAAAAAAMwAAZgAAmQAAzAAA/wArAAArMwArZgArmQArzAAr/wBVAABVMwBVZgBVmQBVzABV/wCAAACAMwCAZgCAmQCAzACA/wCqAACqMwCqZgCqmQCqzACq/wDVAADVMwDVZgDVmQDVzADV/wD/AAD/MwD/ZgD/mQD/zAD//zMAADMAMzMAZjMAmTMAzDMA/zMrADMrMzMrZjMrmTMrzDMr/zNVADNVMzNVZjNVmTNVzDNV/zOAADOAMzOAZjOAmTOAzDOA/zOqADOqMzOqZjOqmTOqzDOq/zPVADPVMzPVZjPVmTPVzDPV/zP/ADP/MzP/ZjP/mTP/zDP//2YAAGYAM2YAZmYAmWYAzGYA/2YrAGYrM2YrZmYrmWYrzGYr/2ZVAGZVM2ZVZmZVmWZVzGZV/2aAAGaAM2aAZmaAmWaAzGaA/2aqAGaqM2aqZmaqmWaqzGaq/2bVAGbVM2bVZmbVmWbVzGbV/2b/AGb/M2b/Zmb/mWb/zGb//5kAAJkAM5kAZpkAmZkAzJkA/5krAJkrM5krZpkrmZkrzJkr/5lVAJlVM5lVZplVmZlVzJlV/5mAAJmAM5mAZpmAmZmAzJmA/5mqAJmqM5mqZpmqmZmqzJmq/5nVAJnVM5nVZpnVmZnVzJnV/5n/AJn/M5n/Zpn/mZn/zJn//8wAAMwAM8wAZswAmcwAzMwA/8wrAMwrM8wrZswrmcwrzMwr/8xVAMxVM8xVZsxVmcxVzMxV/8yAAMyAM8yAZsyAmcyAzMyA/8yqAMyqM8yqZsyqmcyqzMyq/8zVAMzVM8zVZszVmczVzMzV/8z/AMz/M8z/Zsz/mcz/zMz///8AAP8AM/8AZv8Amf8AzP8A//8rAP8rM/8rZv8rmf8rzP8r//9VAP9VM/9VZv9Vmf9VzP9V//+AAP+AM/+AZv+Amf+AzP+A//+qAP+qM/+qZv+qmf+qzP+q///VAP/VM//VZv/Vmf/VzP/V////AP//M///Zv//mf//zP///wAAAAAAAAAAAAAAACwAAAAAZAAjAEcI/wD3CRxIsIvBgwi7EFzIsKHDhxAjSpwoUSFFhgb3WWTIpSOXhR4/XhxJcaPAkBQnqVzJcqVGhChROkyIUGBCkhJlSmS5kCfOiDV/Ch1KtKhRoxmPKj1qcqJBlgmhwvQ4UOfSkg6t2my6z+dAryBRJt1K8+DVs2gXljWbVujYgWvjxm07lKtTuHbpps37EGxXl1WpErQ6dy9NrX1dIgRrMKZHuXrhchT88KBfvydDduTLNnLYji8jXgZ88a3Ggp3patbsuXTq1rBjy54tWy5kpoVpYyVbtmJu3QVHmg4NXClf33YR71MO/DhQ1JNBD6ZcXDLJ0SotNn68fXNQ3RZD2mC2vNKkV4Xiu4usbpI5Q55moX7+6N72Uq7ue7bcPwnj6vUNvXZWctShthF2/UUn1ncvOVfXQzoJKBCCWUUY4Fqe5UcQhTgdx2BaGrIn4VX/FRhbUx9WVxtNKrbo4otLBQQAOw==') 

// OUTPUT:
// LMv5 somthing

module.exports = DownloadCaptcha;
