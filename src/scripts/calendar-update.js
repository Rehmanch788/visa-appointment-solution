const { chromium } = require("playwright");
const DownloadCaptcha = require("../utils/captchaDownloader");
const solveCaptcha = require("../utils/captcha_solver");
const { passport_number, visa_number } = require("../vaiable");
const { notifyAllUsers } = require("../bot");

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
    console.log("Starting Calendar Monitoring Service...");

    // The entire flow is enclosed in an infinite loop. It will retry if it crashes or fails.
    while (true) {
        console.log("\n--- Starting new QVC session ---");
        let browser = null;
        try {
            // Launch with stealth arguments to prevent QVC server from outright blocking our requests
            browser = await chromium.launch({ 
                headless: true,
                args: [
                    '--disable-blink-features=AutomationControlled'
                    // We purposefully removed --disable-web-security because QVC blocks the initial API load when it's present!
                ]
            }); 
            
            // Injecting a pure, human User-Agent profile to completely bypass Cloudflare/Akamai WAFs blocking our bot fingerprints
            const context = await browser.newContext({
                userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
                viewport: { width: 1366, height: 768 },
                locale: 'en-US',
                extraHTTPHeaders: {
                    'Accept-Language': 'en-US,en;q=0.9',
                }
            });
            const page = await context.newPage();

            // Set default timeouts to be resilient against slow networks
            page.setDefaultTimeout(15000);
            page.setDefaultNavigationTimeout(30000);

            // Step 1: Navigating to QVC Homepage
            console.log("Navigating to QVC homepage...");
            await page.goto("https://www.qatarvisacenter.com/");
            
            // Step 2: Selecting Country & Language
            console.log("Selecting Country & Language...");
            await page.locator('div[data-bs-toggle="dropdown"]').waitFor({ state: 'visible' });
            await page.locator('div[data-bs-toggle="dropdown"]').click();
            await page.getByText("English").click();
            
            await page.locator('input[placeholder="-- Select Country --"]').waitFor({ state: 'visible' });
            await page.locator('input[placeholder="-- Select Country --"]').click();
            await page.getByText("Pakistan").click();
            
            await page.locator('a.card-box:has-text("Book Appointment")').waitFor({ state: 'visible' });
            await page.locator('a.card-box:has-text("Book Appointment")').click();
            
            // Step 3: Wait for Applicant Details form and dismiss promotions
            console.log("Waiting for Applicant Details form...");
            try {
                const closeModal = page.locator('img[class="mod-close"]');
                await closeModal.waitFor({ state: "visible", timeout: 5000 });
                await closeModal.click();
                console.log("Closed promotion modal.");
            } catch (error) {
                console.log("No promotion modal appeared.");
            }

            // Step 4: Solving the First Captcha
            console.log("Wait for and solve Applicant Captcha...");
            const captchaImage = page.locator('img[id="captchaImage"]');
            await captchaImage.waitFor({ state: "visible", timeout: 10000 });
            const src = await captchaImage.getAttribute("src");
            const path = await DownloadCaptcha(src);
            const code = await run(path);

            if (!code || code.length === 0) {
                throw new Error("Captcha solver returned an empty string. The python script might have failed.");
            }

            // Step 5: Fill Details
            console.log(`Filling Passport (${passport_number}), Visa (${visa_number}), and Captcha (${code})...`);
            await page.locator('input[placeholder="Passport Number"]').waitFor({ state: 'visible' });
            await page.locator('input[placeholder="Passport Number"]').fill(passport_number);
            await page.locator('input[placeholder="Visa Number"]').fill(visa_number);
            await page.locator('input[placeholder="Enter Captcha"]').fill(code.toUpperCase());
            
            // Step 6: First Submit Button
            console.log("Clicking the first Submit button...");
            await page.locator('button.btn-brand-arrow').filter({ hasText: /Submit|Next/i }).first().click().catch(async () => {
                await page.locator('button.btn-brand-arrow.mb-25.mt-25').click();
            });

            // Step 7: Handle "Do you want to clear active session" dialog if it pops up
            const okButton = page.locator('button[translate="manage.ok"]', { hasText: "OK" });
            try {
                await okButton.waitFor({ state: "visible", timeout: 4000 });
                console.log("Active session dialog appeared — clicking OK button");
                await okButton.click();
                
                // Solve the second captcha
                console.log("Solving Secondary Captcha...");
                await page.waitForTimeout(3000); // Give it time to load new captcha image
                const secondCaptchaImage = page.locator('img[id="captchaImage"]');
                await secondCaptchaImage.waitFor({ state: "visible" });
                const src2 = await secondCaptchaImage.getAttribute("src");
                const path2 = await DownloadCaptcha(src2);
                const code2 = await run(path2);
                await page.locator('input[placeholder="Enter Captcha"]').fill(code2.toUpperCase());
                
                await page.locator("button.btn-brand-arrow.mb-25.mt-25").click();
            } catch (err) {
                console.log("No active session dialog appeared.");
            }

            // Step 8: Additional Information Modal (Email/Phone)
            console.log("Waiting for Additional Info OK button...");
            const modalOk = page.locator(".modal-footer").locator('button.cir-em-btn:has-text("ok")');
            try {
                await modalOk.waitFor({ state: "visible", timeout: 5000 });
                await modalOk.click();
                console.log("Additional info OK clicked.");
            } catch (e) {
                console.log("No additional info modal occurred.");
            }

            // Fill contact info
            console.log("Filling Email, Phone and Terms & Conditions...");
            await page.locator('input[id="phone"]').waitFor({ state: 'visible' });
            await page.locator('input[id="phone"]').fill("00923015284950");
            await page.locator('input[id="email"]').fill("asshikrani66@gmail.com");
            await page.locator('input[id="checkVal"]').check();

            // Next we must continue to the calendar page by confirming applicant.
            console.log("Locating the 'I confirm...' button...");
            const confirmBtn = page.locator('button[translate="schedule.confirm_applicant"]', { hasText: /I confirm that the details above are accurate/i });
            await confirmBtn.waitFor({ state: "visible", timeout: 10000 });
            await confirmBtn.click();

            // Handle the Notification dialog
            console.log("Waiting for Notification dialog...");
            const notificationOk = page.locator('button', { hasText: 'OK' }).filter({ hasText: /^OK$/i });
            try {
                await notificationOk.waitFor({ state: 'visible', timeout: 5000 });
                await notificationOk.first().click();
                console.log("Notification OK clicked.");
            } catch (e) {
                console.log("No Notification dialog appeared.");
            }

            // Select Visa Center (Islamabad)
            console.log("Selecting Visa Center: Islamabad...");
            const centerDropdownBtn = page.locator('button[name="selectedVsc"]');
            await centerDropdownBtn.waitFor({ state: 'visible', timeout: 10000 });
            await centerDropdownBtn.click();
            await page.locator('ul.dropdown-menu.show >> li >> a:has-text("Islamabad")').click();

            // Step 9: Monitor Calendar Page
            console.log("Waiting for Calendar to render...");
            await page.waitForTimeout(5000);

            let calendarMonitorActive = true;
            let monitorAttempts = 0;

            console.log("--------------- Monitoring Calendar --------------");
            // The user wants to check for at least 1 minute before restarting the session.
            // (6 checks x 10 seconds = 60 seconds)
            while (calendarMonitorActive && monitorAttempts < 6) {
                monitorAttempts++;
                console.log(`[Attempt ${monitorAttempts}/6] Checking availability across upcoming months...`);
                
                let foundSlot = false;
                
                // We will scan up to 3 upcoming months
                for (let monthCheck = 0; monthCheck < 3; monthCheck++) {
                    // Fail-safe for CORS or Network error popups that block the screen:
                    const errorCloseBtn = page.locator('button').filter({ hasText: /^Close$/i }).first();
                    if (await errorCloseBtn.isVisible()) {
                        console.log("Network Error dialog (CORS) detected! QVC server dropped connection.");
                        monitorAttempts = 999; // force immediate session restart
                        break;
                    }

                    const isAvailable = await page.evaluate(() => {
                        // Check if there are active time buttons that aren't disabled
                        const buttons = Array.from(document.querySelectorAll('button:not([disabled])'));
                        const timePattern = /\b\d{1,2}:\d{2}\b/;
                        for (let btn of buttons) {
                            if (timePattern.test(btn.innerText) || btn.innerText.includes('AM') || btn.innerText.includes('PM')) {
                                if (!btn.classList.contains('disabled')) return true;
                            }
                        }
                        // Check for standard class indicators (excluding 'legend' classes)
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
                    
                    // Not found in this month, click "Next" month if available
                    const nextBtn = page.locator('button.navigation__button.is-next');
                    if (await nextBtn.isVisible()) {
                        const isDisabled = await nextBtn.evaluate(b => b.disabled || b.hasAttribute('disabled') || b.classList.contains('disabled'));
                        if (!isDisabled) {
                            console.log(`Month ${monthCheck + 1} empty. Navigating to next month...`);
                            
                            // Hook into the network payload to safely wait for QVC's dates to download
                            const responsePromise = page.waitForResponse(response => 
                                response.url().includes('getvscappointmentdates')
                            , { timeout: 10000 }).catch(() => null);
                            
                            await nextBtn.click();
                            
                            const networkResp = await responsePromise;
                            if (networkResp) {
                                // Data loaded successfully, random human-like delay
                                await page.waitForTimeout(Math.random() * 1000 + 1000); 
                            } else {
                                // Fallback wait if the intercept timed out
                                await page.waitForTimeout(3000); 
                            }
                        } else {
                            break; // Can't go further forward
                        }
                    } else {
                        break; // No next button at all
                    }
                }
                
                if (foundSlot) {
                    console.log("*************************************************************");
                    console.log("[SUCCESS!] CALENDAR STATE CHANGED: APPOINTMENT EXPLICITLY AVAILABLE!");
                    console.log("*************************************************************");
                    
                    console.log('\u0007'); // Terminal beep
                    
                    // Alert all subscribed users immediately!
                    await notifyAllUsers("🚨 Urgent: Qatar Visa Appointment Slot is now AVAILABLE at the Islamabad center!\n\nPlease login quickly: https://www.qatarvisacenter.com/");
                    
                    console.log("Leaving the browser session open infinitely for your manual booking. Press Ctrl+C in terminal to stop.");
                    // Freezing the execution here forever so it does NOT return. 
                    await new Promise(() => {});
                } else {
                    console.log("Not available anywhere right now. Navigating back to the initial month...");
                    
                    // Try to restore the calendar to the current month for the next loop
                    const prevBtn = page.locator('button.navigation__button.is-previous');
                    if (await prevBtn.isVisible()) {
                        // click previous until disabled
                        for (let i = 0; i < 4; i++) {
                            const isDisabled = await prevBtn.evaluate(b => b.disabled || b.hasAttribute('disabled') || b.classList.contains('disabled'));
                            if (isDisabled) break;
                            await prevBtn.click();
                            await page.waitForTimeout(500);
                        }
                    }
                    
                    console.log("Waiting for 10 seconds before next check cycle...");
                    await page.waitForTimeout(10000);
                    
                    try {
                        const sessionTimeoutOk = page.locator('button.cir-em-btn:has-text("ok")');
                        if (await sessionTimeoutOk.isVisible()) {
                            await sessionTimeoutOk.click();
                        }
                    } catch(e) {}
                    
                    if (monitorAttempts >= 6) {
                        console.log("Restarting the entire flow to grab a fresh session and avoid session timeout...");
                        break; 
                    }
                }
            }
        } catch (error) {
            console.error("\n[!] Encountered an issue in the flow:", error.message);
            console.log("Taking a quick break before restarting...");
        } finally {
            if (browser) {
                console.log("Closing browser...\n");
                await browser.close();
            }
        }
        
        // Wait before starting a new cycle
        console.log("Sleeping for 5 seconds before retrying the flow...");
        await new Promise(resolve => setTimeout(resolve, 5000));
    }
}

// Ensure the function is called if run directly from the terminal with "node src/scripts/calendar-update.js"
if (require.main === module) {
    playWrightUpdate();
}

module.exports = playWrightUpdate;
