require('dotenv').config();

const notifyDiscord = async (message) => {
    const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
    
    if (!webhookUrl) {
        console.error("DISCORD_WEBHOOK_URL is missing from .env");
        return;
    }

    try {
        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                content: message,
                username: "Visa Alert Bot"
            })
        });

        if (response.ok) {
            console.log("Discord notification sent!");
        } else {
            console.error("Discord webhook failed:", response.status);
        }
    } catch (err) {
        console.error("Discord notification error:", err);
    }
};

const startBot = () => {
    if (!process.env.DISCORD_WEBHOOK_URL) {
        console.error("DISCORD_WEBHOOK_URL is missing from .env");
        return;
    }
    console.log("Discord notification system active.");
};

const notifyAllUsers = async (message) => {
    await notifyDiscord(message);
};

module.exports = { startBot, notifyAllUsers };
