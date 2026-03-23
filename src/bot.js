require('dotenv').config();
const { Telegraf } = require('telegraf');
const User = require('./models/User');

const bot = new Telegraf(process.env.BOT_TOKEN);

// Welcome and subscription logic
bot.start(async (ctx) => {
    const telegramId = ctx.message.chat.id.toString();
    const firstName = ctx.message.chat.first_name || "User";

    try {
        const existingUser = await User.findOne({ telegramId });
        if (existingUser) {
            ctx.reply(`Welcome back, ${firstName}! You are already subscribed to receive Qatar Visa Appointment alerts.`);
        } else {
            const newUser = new User({ telegramId, firstName });
            await newUser.save();
            ctx.reply(`Hello ${firstName}! You have successfully subscribed to Qatar Visa Appointment alerts for Islamabad. You will be instantly notified the moment a slot opens up!\n\nUse /status to check monitoring state, or /stop to unsubscribe.`);
            console.log(`New user subscribed: ${firstName} (${telegramId})`);
        }
    } catch (err) {
        console.error("Error saving user:", err);
        ctx.reply("Sorry, there was an error subscribing you to alerts. Please try again.");
    }
});

// Unsubscribe logic
bot.command('stop', async (ctx) => {
    const telegramId = ctx.message.chat.id.toString();
    try {
        await User.findOneAndDelete({ telegramId });
        ctx.reply("You have been unsubscribed from Qatar Visa Appointment alerts.");
        console.log(`User unsubscribed: ${telegramId}`);
    } catch (err) {
        console.error("Error removing user:", err);
    }
});

// App status logic
bot.command('status', async (ctx) => {
    const telegramId = ctx.message.chat.id.toString();
    const user = await User.findOne({ telegramId });
    if (user) {
        ctx.reply("System Status: ACTIVELY MONITORING 🟢\n\nYou are currently subscribed and waiting for visa appointment alerts! The bot is continuously watching the Qatar Visa Center calendar in the background.");
    } else {
        ctx.reply("System Status: ACTIVELY MONITORING 🟢\n\nYou are not subscribed to alerts. Send /start to subscribe now.");
    }
});

const startBot = () => {
    if (!process.env.BOT_TOKEN) {
        console.error("[!] Warning: BOT_TOKEN is not defined in .env. The Telegram bot will not launch.");
        return;
    }
    
    bot.launch();
    console.log("Telegram Alert Bot has successfully launched.");

    // Enable graceful stop
    process.once('SIGINT', () => bot.stop('SIGINT'));
    process.once('SIGTERM', () => bot.stop('SIGTERM'));
};

const notifyAllUsers = async (message) => {
    if (!process.env.BOT_TOKEN) return;
    
    try {
        const users = await User.find({});
        console.log(`Broadcasting alert to ${users.length} subscribed users...`);
        for (const user of users) {
            try {
                await bot.telegram.sendMessage(user.telegramId, message);
            } catch (err) {
                console.error(`Failed to send message to ${user.telegramId}:`, err.message);
                // Optional: remove user if they blocked the bot
                if (err.message.includes('bot was blocked by the user') || err.message.includes('chat not found')) {
                     await User.findOneAndDelete({ telegramId: user.telegramId });
                     console.log(`Removed uncontactable user ${user.telegramId}`);
                }
            }
        }
        console.log("Broadcast successfully dispatched to all active users.");
    } catch (err) {
        console.error("Failed to fetch users from database for broadcast:", err);
    }
};

module.exports = { startBot, notifyAllUsers };
