const { Telegraf } = require("telegraf");
const mongoose = require("mongoose");

const bot = new Telegraf("8976228790:AAFhJATUHQdhFo5MtSrAec2tlnQKnCA0Utw");

const CHANNEL_LINK = "https://t.me/LootWalak";
const VERIFY_LINK = "https://kawaii768893-hue.github.io/cash-hungama/verify.html";
const MINI_APP = "https://cash-hungama.vercel.app/";

mongoose.connect(
  "mongodb+srv://Kawaii:kawaii123@cluster0.rp2ucf2.mongodb.net/?appName=Cluster0"
);

const userSchema = new mongoose.Schema({
  userId: Number,
  verified: {
    type: Boolean,
    default: false
  }
});

const User = mongoose.model("User", userSchema);

console.log("MongoDB Connected");

bot.start(async (ctx) => {

  const userId = ctx.from.id;

  let user = await User.findOne({ userId });

  if (!user) {
    await User.create({
      userId,
      verified: false
    });
  }

  await ctx.replyWithMarkdown(
`🔥 *Hey and welcome To Our Bot*

✨ *Join all our channels to use our bot!!* 🎁

🔐 *After joining, click on the "VERIFY JOIN" button And get ₹7 as a Free Bonus!!*`,
{
  reply_markup: {
    inline_keyboard: [
      [
        { text: "JOIN", url: CHANNEL_LINK },
        { text: "JOIN", url: CHANNEL_LINK }
      ],
      [
        { text: "JOIN", url: CHANNEL_LINK },
        { text: "JOIN", url: CHANNEL_LINK }
      ],
      [
        { text: "JOIN", url: CHANNEL_LINK }
      ],
      [
        {
          text: "🔐 VERIFY JOIN",
          callback_data: "verify_join"
        }
      ]
    ]
  }
}
);

});

bot.action("verify_join", async (ctx) => {

  const userId = ctx.from.id;

  try {

    const member = await ctx.telegram.getChatMember(
      "@LootWalak",
      userId
    );

    if (
      member.status !== "member" &&
      member.status !== "administrator" &&
      member.status !== "creator"
    ) {

      return ctx.reply("❌ Pehle channel join karo.");
    }

    await ctx.replyWithMarkdown(
`🔐 *Secure Device Verification*

Tap the button below to quickly verify your device.

It only takes a few seconds ⚡🔥`,
{
  reply_markup: {
    inline_keyboard: [
      [
        {
          text: "⚡ Verify Device",
          web_app: {
            url: VERIFY_LINK
          }
        }
      ]
    ]
  }
}
);

  } catch {

    ctx.reply("🚫 First Join All Channels !!.");
  }

});

bot.command("done", async (ctx) => {

  const userId = ctx.from.id;

  let user = await User.findOne({ userId });

  if (!user) return;

  if (user.verified === true) {

    return ctx.replyWithMarkdown(
`Open Now & Claim ₹7 Cash Free And Instant withdraw.! 😍

Click "Open Home" To Begin 👇👇`,
{
  reply_markup: {
    inline_keyboard: [
      [
        {
          text: "👉 Open Home",
          web_app: {
            url: MINI_APP
          }
        }
      ]
    ]
  }
}
);

  }

  user.verified = true;

  await user.save();

  await ctx.replyWithMarkdown(
`✅ *Verification Successful*

Open Now & Claim ₹7 Cash Free And Instant withdraw.! 😍

Click "Open Home" To Begin 👇👇`,
{
  reply_markup: {
    inline_keyboard: [
      [
        {
          text: "👉 Open Home",
          web_app: {
            url: MINI_APP
          }
        }
      ]
    ]
  }
}
);

});

bot.launch();

console.log("Bot Running...");
