const { chromium } = require("playwright");

async function inspect() {
    console.log("Starting inspection...");
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    try {
        await page.goto("https://www.qatarvisacenter.com/");
        
        // Service modal close karo
        try {
            const serviceNotAvail = page.locator('modal#modalServiceNotAvail button:has-text("Close")');
            await serviceNotAvail.waitFor({ state: "visible", timeout: 8000 });
            await serviceNotAvail.click();
            await page.waitForTimeout(1000);
        } catch (e) {}

        await page.locator('div[data-bs-toggle="dropdown"]').click();
        await page.getByText("English").click();
        await page.locator('input[placeholder="-- Select Country --"]').click();
        await page.getByText("Pakistan").click();
        
        await page.waitForTimeout(3000);
        
        // Saare links aur buttons print karo
        const elements = await page.evaluate(() => {
            const links = Array.from(document.querySelectorAll('a')).map(a => ({
                tag: 'a',
                text: a.innerText.trim(),
                class: a.className,
                href: a.href
            }));
            const buttons = Array.from(document.querySelectorAll('button')).map(b => ({
                tag: 'button', 
                text: b.innerText.trim(),
                class: b.className
            }));
            return [...links, ...buttons].filter(e => e.text.length > 0);
        });
        
        console.log("=== PAGE ELEMENTS ===");
        console.log(JSON.stringify(elements, null, 2));
        
    } catch (e) {
        console.error(e);
    } finally {
        await browser.close();
    }
}

inspect();
