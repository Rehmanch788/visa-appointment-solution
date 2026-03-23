const { chromium } = require("playwright");
const DownloadCaptcha = require("./src/utils/captchaDownloader");
const solveCaptcha = require("./src/utils/captcha_solver");
const { passport_number, visa_number } = require("./src/vaiable");

async function run(path) {
    try {
        return await solveCaptcha(path);
    } catch (error) {
        return "";
    }
}

async function inspect() {
    console.log("Starting inspection...");
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    try {
        await page.goto("https://www.qatarvisacenter.com/");
        await page.locator('div[data-bs-toggle="dropdown"]').click();
        await page.getByText("English").click();
        await page.locator('input[placeholder="-- Select Country --"]').click();
        await page.getByText("Pakistan").click();
        await page.locator('a.card-box:has-text("Book Appointment")').click();
        
        await page.waitForTimeout(4000);
        try { await page.locator('img[class="mod-close"]').click({timeout: 2000}); } catch(e) {}
        
        const src = await page.locator('img[id="captchaImage"]').getAttribute("src");
        const code = await run(await DownloadCaptcha(src));
        
        await page.locator('input[placeholder="Passport Number"]').fill(passport_number);
        await page.locator('input[placeholder="Visa Number"]').fill(visa_number);
        await page.locator('input[placeholder="Enter Captcha"]').fill(code.toUpperCase());
        await page.locator('button[class="btn-brand-arrow mb-25 mt-25"]').click();
        
        const okButton = page.locator('button[translate="manage.ok"]', { hasText: "OK" });
        try {
            await okButton.waitFor({ state: "visible", timeout: 3000 });
            await okButton.click();
            await page.waitForTimeout(3000);
            const src2 = await page.locator('img[id="captchaImage"]').getAttribute("src");
            const code2 = await run(await DownloadCaptcha(src2));
            await page.locator('input[placeholder="Enter Captcha"]').fill(code2.toUpperCase());
            await page.locator("button.btn-brand-arrow.mb-25.mt-25").click();
        } catch (err) {}

        await page.locator(".modal-footer").locator('button.cir-em-btn:has-text("ok")').click({timeout: 3000}).catch(() => {});

        await page.locator('input[id="phone"]').fill("00923015284950");
        await page.locator('input[id="email"]').fill("asshikrani66@gmail.com");
        await page.locator('input[id="checkVal"]').check();

        // Let's get the innerHTML of the form or buttons to see how to proceed to the calendar
        console.log("Evaluating page buttons...");
        const buttons = await page.evaluate(() => {
            return Array.from(document.querySelectorAll('button')).map(b => ({text: b.innerText, class: b.className, id: b.id}));
        });
        console.log(buttons);

    } catch (e) {
        console.error(e);
    } finally {
        await browser.close();
    }
}
inspect();
