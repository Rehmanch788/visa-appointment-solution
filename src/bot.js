require('dotenv').config();
const { Telegraf } = require('telegraf');
const User = require('./models/User');

const bot = new Telegraf(process.env.BOT_TOKEN);

bot.start(async (ctx) => {
    const telegramId = ctx.message.chat.id.toString();
    const firstName = ctx.message.chat.first_name || "User";

    try {
        const existingUser = await User.findOne({ telegramId });
        if (existingUser) {
            ctx.reply(`Welcome back, ${firstName}. You are currently subscribed.`);
        } else {
            const newUser = new User({ telegramId, firstName });
            await newUser.save();
            ctx.reply(`Subscribed successfully. You will be notified when an appointment slot is available.`);
            console.log(`New subscriber: ${telegramId}`);
        }
    } catch (err) {
        console.error("Error saving user data:", err);
    }
});

bot.command('stop', async (ctx) => {
    const telegramId = ctx.message.chat.id.toString();
    try {
        await User.findOneAndDelete({ telegramId });
        ctx.reply("You have been unsubscribed.");
        console.log(`Unsubscribed: ${telegramId}`);
    } catch (err) {
        console.error("Error removing user:", err);
    }
});

bot.command('status', async (ctx) => {
    const telegramId = ctx.message.chat.id.toString();
    const user = await User.findOne({ telegramId });
    if (user) {
        ctx.reply("Service is running and actively checking for calendar slots.");
    } else {
        ctx.reply("Service is running. Send /start to subscribe for updates.");
    }
});

const startBot = () => {
    if (!process.env.BOT_TOKEN) {
        console.error("BOT_TOKEN is missing from .env");
        return;
    }
    
    bot.launch();
    console.log("Telegram bot active.");

    process.once('SIGINT', () => bot.stop('SIGINT'));
    process.once('SIGTERM', () => bot.stop('SIGTERM'));
};

const notifyAllUsers = async (message) => {
    if (!process.env.BOT_TOKEN) return;
    
    try {
        const users = await User.find({});
        for (const user of users) {
            try {
                await bot.telegram.sendMessage(user.telegramId, message);
            } catch (err) {
                console.error(`Message failed intended for ${user.telegramId}:`, err.message);
                if (err.message.includes('bot was blocked') || err.message.includes('chat not found')) {
                     await User.findOneAndDelete({ telegramId: user.telegramId });
                }
            }
        }
    } catch (err) {
        console.error("Broadcast failed:", err);
    }
};

module.exports = { startBot, notifyAllUsers };
