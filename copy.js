
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
        .fill(code.toUpperCase()?? 'ABCV');
    await page.locator('button[type="button"]').nth(1).click();

    // I want that either clidk this one
    // await page.locator('button[translate="manage.ok"]').click();
    // or click this one
    // await page
    //     .locator(".modal-footer")
    //     .locator('button.cir-em-btn:has-text("ok")')
    //     .click();

    await page.locator('input[id="phone"]').fill("00923015284950");
    await page.locator('input[id="email"]').fill("asshikrani66@gmail.com");
    await page.locator('input[id="checkVal"]').check();

    await page.waitForTimeout(6000);
    await browser.close();
}

playWrightUpdate();

module.exports = playWrightUpdate;
