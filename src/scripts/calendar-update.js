const { chromium } = require("playwright");
const DownloadCaptcha = require("../utils/captchaDownloader");
const solveCaptcha = require("../utils/captcha_solver");
const { passport_number, visa_number } = require("../vaiable");

async function run(path) {
    console.log("Starting Captcha Recognition using Python CNN Engine...");
    try {
        const result = await solveCaptcha(path);
        return result;
    } catch (error) {
        console.error("Failed to solve captcha:\n", error);
        return "";
    }
}

async function playWrightUpdate() {
    const browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();

    await page.goto("https://www.qatarvisacenter.com/");
    await page.locator('div[data-bs-toggle="dropdown"]').click();
    await page.getByText("English").click();
    await page.locator('input[placeholder="-- Select Country --"]').click();
    await page.getByText("Pakistan").click();
    await page.locator('a.card-box:has-text("Book Appointment")').click();
    await page.waitForTimeout(4000);
    try {
        await page.locator('img[class="mod-close"]').click();
    } catch (error) {
        console.log("no close here");
    }
    const src = await page
        .locator('img[id="captchaImage"]')
        .getAttribute("src");
    const path = await DownloadCaptcha(src);
    const code = await run(path);

    await page
        .locator('input[placeholder="Passport Number"]')
        .fill(passport_number);
    await page.locator('input[placeholder="Visa Number"]').fill(visa_number);
    await page
        .locator('input[placeholder="Enter Captcha"]')
        .fill(code.toUpperCase());
    await page.locator('button[class="btn-brand-arrow mb-25 mt-25"]').click();

    // const btn1 = await page.locator('button[translate="manage.ok"]');
    // const btn2 = await page
    //     .locator(".modal-footer")
    //     .locator('button.cir-em-btn:has-text("ok")');

    // if (await btn1.isVisible()) {
    //     await btn1.click();
    //     console.log("Clicked the first OK button");
    // } else if (await btn2.isVisible()) {
    //     await btn2.click();
    //     console.log("Clicked the second OK button");
    // } else {
    //     console.log("No OK button found!");
    // }

    // // Do you want to clear the current active session? this is text in dialog box so that mean dialog appeared
    // // <button type="button" translate="manage.ok" class="btn cir-em-btn">OK</button> then click this button I want target it like that no one else can ba selected and clicked other that that
    // const check = await page.locator('button[translate="manage.ok"]').isVisible();
    // if (check) {
    //     console.log("Yes it is visible");
    //     await page.locator('button[translate="manage.ok"]').click();
    //     const src2 = await page
    //         .locator('img[id="captchaImage"]')
    //         .getAttribute("src");
    //     const path2 = await DownloadCaptcha(src2);
    //     const code2 = await run(path2);
    //     await page
    //         .locator('button[class="btn-brand-arrow mb-25 mt-25"]')
    //         .click();
    // } else {
    //     console.log("IT is not visilbe");
    // }

    // Target the OK button inside the dialog with exact text
    const okButton = page.locator('button[translate="manage.ok"]', {
        hasText: "OK",
    });

    try {
        // Wait for the button to appear (up to 3 seconds)
        await okButton.waitFor({ state: "visible", timeout: 3000 });

        console.log("Dialog appeared — clicking OK button");
        await okButton.click();

        // Now handle captcha
        await page.waitForTimeout(3000)
        const src2 = await page
            .locator('img[id="captchaImage"]')
            .getAttribute("src");
        const path2 = await DownloadCaptcha(src2);
        const code2 = await run(path2);

        // Click the next button safely
        await page.locator("button.btn-brand-arrow.mb-25.mt-25").click();
    } catch (err) {
        console.log("Dialog did not appear, OK button not found");
    }

    await page
        .locator(".modal-footer")
        .locator('button.cir-em-btn:has-text("ok")')
        .click();

    await page.locator('input[id="phone"]').fill("00923015284950");
    await page.locator('input[id="email"]').fill("asshikrani66@gmail.com");
    await page.locator('input[id="checkVal"]').check();

    await page.waitForTimeout(6000);
    await browser.close();
}

playWrightUpdate();

module.exports = playWrightUpdate;
