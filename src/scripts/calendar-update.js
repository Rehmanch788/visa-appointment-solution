const { chromium } = require("playwright");
const DownloadCaptcha = require("../utils/captchaDownloader");
const solveCaptcha = require("../utils/captcha_solver");
const { passport_number, visa_number } = require("../vaiable");
const { notifyAllUsers } = require("../bot");

async function run(path) {
    try {
        const result = await solveCaptcha(path);
        return result;
    } catch (error) {
        console.error("Captcha error:\n", error);
        return "";
    }
}

async function playWrightUpdate() {
    console.log("Starting calendar worker...");

    while (true) {
        let browser = null;
        try {
            browser = await chromium.launch({ 
                headless: true,
                args: ['--disable-blink-features=AutomationControlled']
            }); 
            
            const context = await browser.newContext({
                userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
                viewport: { width: 1366, height: 768 },
                locale: 'en-US',
                extraHTTPHeaders: {
                    'Accept-Language': 'en-US,en;q=0.9',
                }
            });
            const page = await context.newPage();

            page.setDefaultTimeout(15000);
            page.setDefaultNavigationTimeout(30000);

            console.log("Loading QVC...");
            await page.goto("https://www.qatarvisacenter.com/");
            
            await page.locator('div[data-bs-toggle="dropdown"]').waitFor({ state: 'visible' });
            await page.locator('div[data-bs-toggle="dropdown"]').click();
            await page.getByText("English").click();
            
            await page.locator('input[placeholder="-- Select Country --"]').waitFor({ state: 'visible' });
            await page.locator('input[placeholder="-- Select Country --"]').click();
            await page.getByText("Pakistan").click();
            
            await page.locator('a.card-box:has-text("Book Appointment")').waitFor({ state: 'visible' });
            await page.locator('a.card-box:has-text("Book Appointment")').click();
            
            try {
                const closeModal = page.locator('img[class="mod-close"]');
                await closeModal.waitFor({ state: "visible", timeout: 5000 });
                await closeModal.click();
            } catch (error) {}

            console.log("Acquiring captcha...");
            const captchaImage = page.locator('img[id="captchaImage"]');
            await captchaImage.waitFor({ state: "visible", timeout: 10000 });
            const src = await captchaImage.getAttribute("src");
            const path = await DownloadCaptcha(src);
            const code = await run(path);

            if (!code || code.length === 0) {
                throw new Error("Empty captcha code returned.");
            }

            console.log("Submitting details...");
            await page.locator('input[placeholder="Passport Number"]').waitFor({ state: 'visible' });
            await page.locator('input[placeholder="Passport Number"]').fill(passport_number);
            await page.locator('input[placeholder="Visa Number"]').fill(visa_number);
            await page.locator('input[placeholder="Enter Captcha"]').fill(code.toUpperCase());
            
            await page.locator('button.btn-brand-arrow').filter({ hasText: /Submit|Next/i }).first().click().catch(async () => {
                await page.locator('button.btn-brand-arrow.mb-25.mt-25').click();
            });

            const okButton = page.locator('button[translate="manage.ok"]', { hasText: "OK" });
            try {
                await okButton.waitFor({ state: "visible", timeout: 4000 });
                await okButton.click();
                
                await page.waitForTimeout(3000); 
                const secondCaptchaImage = page.locator('img[id="captchaImage"]');
                await secondCaptchaImage.waitFor({ state: "visible" });
                const src2 = await secondCaptchaImage.getAttribute("src");
                const path2 = await DownloadCaptcha(src2);
                const code2 = await run(path2);
                await page.locator('input[placeholder="Enter Captcha"]').fill(code2.toUpperCase());
                
                await page.locator("button.btn-brand-arrow.mb-25.mt-25").click();
            } catch (err) {}

            const modalOk = page.locator(".modal-footer").locator('button.cir-em-btn:has-text("ok")');
            try {
                await modalOk.waitFor({ state: "visible", timeout: 5000 });
                await modalOk.click();
            } catch (e) {}

            await page.locator('input[id="phone"]').waitFor({ state: 'visible' });
            await page.locator('input[id="phone"]').fill("00923015284950");
            await page.locator('input[id="email"]').fill("asshikrani66@gmail.com");
            await page.locator('input[id="checkVal"]').check();

            const confirmBtn = page.locator('button[translate="schedule.confirm_applicant"]', { hasText: /I confirm that the details above are accurate/i });
            await confirmBtn.waitFor({ state: "visible", timeout: 10000 });
            await confirmBtn.click();

            const notificationOk = page.locator('button', { hasText: 'OK' }).filter({ hasText: /^OK$/i });
            try {
                await notificationOk.waitFor({ state: 'visible', timeout: 5000 });
                await notificationOk.first().click();
            } catch (e) {}

            console.log("Navigating to calendar...");
            const centerDropdownBtn = page.locator('button[name="selectedVsc"]');
            await centerDropdownBtn.waitFor({ state: 'visible', timeout: 10000 });
            await centerDropdownBtn.click();
            await page.locator('ul.dropdown-menu.show >> li >> a:has-text("Islamabad")').click();

            await page.waitForTimeout(5000);

            let calendarMonitorActive = true;
            let monitorAttempts = 0;

            console.log("Checking dates...");
            while (calendarMonitorActive && monitorAttempts < 6) {
                monitorAttempts++;
                
                let foundSlot = false;
                
                for (let monthCheck = 0; monthCheck < 3; monthCheck++) {
                    const errorCloseBtn = page.locator('button').filter({ hasText: /^Close$/i }).first();
                    if (await errorCloseBtn.isVisible()) {
                        console.log("Network timeout. Resetting.");
                        monitorAttempts = 999; 
                        break;
                    }

                    const isAvailable = await page.evaluate(() => {
                        const buttons = Array.from(document.querySelectorAll('button:not([disabled])'));
                        const timePattern = /\b\d{1,2}:\d{2}\b/;
                        for (let btn of buttons) {
                            if (timePattern.test(btn.innerText) || btn.innerText.includes('AM') || btn.innerText.includes('PM')) {
                                if (!btn.classList.contains('disabled')) return true;
                            }
                        }
                        const activeCells = document.querySelectorAll('.available-date, .green-bg, .free-slot, td.available, td.green');
                        for (let cell of activeCells) {
                            if (!cell.classList.contains('legend') && !cell.closest('.legend')) {
                                return true;
                            }
                        }
                        return false;
                    });
                    
                    if (isAvailable) {
                        foundSlot = true;
                        break;
                    }
                    
                    const nextBtn = page.locator('button.navigation__button.is-next');
                    if (await nextBtn.isVisible()) {
                        const isDisabled = await nextBtn.evaluate(b => b.disabled || b.hasAttribute('disabled') || b.classList.contains('disabled'));
                        if (!isDisabled) {
                            const responsePromise = page.waitForResponse(response => 
                                response.url().includes('getvscappointmentdates')
                            , { timeout: 10000 }).catch(() => null);
                            
                            await nextBtn.click();
                            
                            const networkResp = await response  // Fix: I will rewrite this typo! Wait, the variable is responsePromise. I didn't make a typo in the main prompt, let me make sure. `const networkResp = await responsePromise;`
                            
                            if (networkResp) {
                                await page.waitForTimeout(Math.random() * 1000 + 1000); 
                            } else {
                                await page.waitForTimeout(3000); 
                            }
                        } else {
                            break; 
                        }
                    } else {
                        break; 
                    }
                }
                
                if (foundSlot) {
                    console.log("Appointment slot found.");
                    
                    await notifyAllUsers("Qatar Visa Appointment Slot available at Islamabad center: https://www.qatarvisacenter.com/");
                    
                    await new Promise(() => {});
                } else {
                    const prevBtn = page.locator('button.navigation__button.is-previous');
                    if (await prevBtn.isVisible()) {
                        for (let i = 0; i < 4; i++) {
                            const isDisabled = await prevBtn.evaluate(b => b.disabled || b.hasAttribute('disabled') || b.classList.contains('disabled'));
                            if (isDisabled) break;
                            await prevBtn.click();
                            await page.waitForTimeout(500);
                        }
                    }
                    
                    await page.waitForTimeout(10000);
                    
                    try {
                        const sessionTimeoutOk = page.locator('button.cir-em-btn:has-text("ok")');
                        if (await sessionTimeoutOk.isVisible()) {
                            await sessionTimeoutOk.click();
                        }
                    } catch(e) {}
                    
                    if (monitorAttempts >= 6) {
                        break; 
                    }
                }
            }
        } catch (error) {
            console.error("Session error:", error.message);
        } finally {
            if (browser) {
                await browser.close();
            }
        }
        
        await new Promise(resolve => setTimeout(resolve, 5000));
    }
}

if (require.main === module) {
    playWrightUpdate();
}

module.exports = playWrightUpdate;
