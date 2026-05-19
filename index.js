const { Telegraf, Markup } = require("telegraf");
const mongoose = require("mongoose");
const http = require("http");

// ==============================
// MONGODB
// ==============================

mongoose.connect(
"mongodb+srv://Kawaii:768893y7@cluster0.rp2ucf2.mongodb.net/?appName=Cluster0"
)
.then(() => console.log("MongoDB Connected"))
.catch((err) => console.log(err));

// ==============================
// USER SCHEMA
// ==============================

const userSchema = new mongoose.Schema({
  userId: { type: Number, unique: true },
  name: { type: String, default: "" },
  balance: { type: Number, default: 7 },
  referrals: { type: Number, default: 0 },
  referredBy: { type: Number, default: null },
  verified: { type: Boolean, default: false }
});

const User = mongoose.model("User", userSchema);

// ==============================
// BOT CONFIG
// ==============================

const bot = new Telegraf("8976228790:AAFhJATUHQdhFo5MtSrAec2tlnQKnCA0Utw");

// ==============================
// CONFIG
// ==============================

const CHANNELS    = ["LootWalak", "LootWalak", "LootWalak", "LootWalak", "LootWalak"];
const VERIFY_LINK = "https://kawaii768893-hue.github.io/cash-hungama/verify.html";
const MINI_APP    = "https://cashhungama.netlify.app/";
const ADMIN_ID    = 7861231546;
const MIN_WITHDRAW = 10;

// ==============================
// HELPER - GET UNJOINED CHANNELS
// ==============================

async function getUnjoinedChannels(userId) {
  const unjoined = [];
  for (let ch of CHANNELS) {
    try {
      const member = await bot.telegram.getChatMember("@" + ch, userId);
      if (member.status === "left" || member.status === "kicked") {
        if (!unjoined.includes(ch)) unjoined.push(ch);
      }
    } catch(e) {
      if (!unjoined.includes(ch)) unjoined.push(ch);
    }
  }
  return unjoined;
}

// ==============================
// HELPER - BUILD JOIN BUTTONS
// ==============================

function buildJoinButtons(unjoined, showVerify = true) {
  const buttons = [];
  const list = unjoined.length > 0 ? unjoined : CHANNELS;
  // Remove duplicates
  const unique = [...new Set(list)];
  for (let i = 0; i < unique.length; i += 2) {
    const row = [];
    row.push(Markup.button.url("JOIN \uD83D\uDD25", "https://t.me/" + unique[i]));
    if (unique[i + 1]) {
      row.push(Markup.button.url("JOIN \uD83D\uDD25", "https://t.me/" + unique[i + 1]));
    }
    buttons.push(row);
  }
  if (showVerify) {
    buttons.push([Markup.button.callback("\uD83D\uDD12 VERIFY JOIN", "verify_join")]);
  }
  return buttons;
}

// ==============================
// START
// ==============================

bot.start(async (ctx) => {
  const userId     = ctx.from.id;
  const firstName  = ctx.from.first_name || "User";
  const startParam = ctx.startPayload;

  // Find or create user
  let user = await User.findOne({ userId });
  if (!user) {
    const referredBy = startParam && parseInt(startParam) !== userId ? parseInt(startParam) : null;
    user = await User.create({
      userId,
      name: firstName,
      balance: 7,
      referrals: 0,
      referredBy,
      verified: false
    });
  }

  // Already verified
  if (user.verified) {
    const unjoined = await getUnjoinedChannels(userId);
    if (unjoined.length === 0) {
      await ctx.reply(
        "Open Now & Claim \u20B97 Cash Free And Instant Withdraw.! \uD83D\uDE0D\n\nClick \"Open Home\" To Begin \uD83D\uDC47\uD83D\uDC47",
        Markup.inlineKeyboard([[
          Markup.button.webApp("\uD83C\uDFE0 Open Home", MINI_APP)
        ]])
      );
    } else {
      await ctx.reply(
        "Hey and welcome To Our Bot\n\n\u2728 Join all our channels to use our bot!! \uD83C\uDF81\n\n\uD83D\uDD11 After joining, click on the \"VERIFY JOIN\" button And get \u20B97 as a Free Bonus!!",
        Markup.inlineKeyboard(buildJoinButtons(unjoined))
      );
    }
    return;
  }

  // Not verified
  const unjoined = await getUnjoinedChannels(userId);
  await ctx.reply(
    "Hey and welcome To Our Bot\n\n\u2728 Join all our channels to use our bot!! \uD83C\uDF81\n\n\uD83D\uDD11 After joining, click on the \"VERIFY JOIN\" button And get \u20B97 as a Free Bonus!!",
    Markup.inlineKeyboard(buildJoinButtons(unjoined))
  );
});

// ==============================
// VERIFY JOIN
// ==============================

bot.action("verify_join", async (ctx) => {
  const userId = ctx.from.id;

  const user = await User.findOne({ userId });

  // Already verified
  if (user && user.verified) {
    await ctx.answerCbQuery("\u2705 Already Verified!");
    await ctx.reply(
      "Open Now & Claim \u20B97 Cash Free And Instant Withdraw.! \uD83D\uDE0D\n\nClick \"Open Home\" To Begin \uD83D\uDC47\uD83D\uDC47",
      Markup.inlineKeyboard([[
        Markup.button.webApp("\uD83C\uDFE0 Open Home", MINI_APP)
      ]])
    );
    return;
  }

  // Check channels - only one popup
  const unjoined = await getUnjoinedChannels(userId);
  if (unjoined.length > 0) {
    await ctx.answerCbQuery("\u274C You must join all channels first!", { show_alert: true });
    return;
  }

  // All joined - show verify
  await ctx.answerCbQuery("\u2705 Channels Verified!");
  await ctx.reply(
    "\uD83D\uDD10 Secure Device Verification\n\nTap the button below to quickly verify your device.\nIt only takes a few seconds \u26A1\uD83D\uDD25",
    Markup.inlineKeyboard([[
      Markup.button.webApp("\u26A1 Verify Device", VERIFY_LINK)
    ]])
  );
});

// ==============================
// HTTP API SERVER
// ==============================

const server = http.createServer(async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Content-Type", "application/json");

  if (req.method === "OPTIONS") {
    res.writeHead(200);
    res.end();
    return;
  }

  const url  = new URL(req.url, "http://localhost");
  const path = url.pathname;

  // GET /user?id=TELEGRAM_ID
  if (path === "/user" && req.method === "GET") {
    const userId = parseInt(url.searchParams.get("id"));
    if (!userId) {
      res.writeHead(400);
      res.end(JSON.stringify({ error: "No user id" }));
      return;
    }
    const user = await User.findOne({ userId });
    if (!user) {
      res.writeHead(404);
      res.end(JSON.stringify({ error: "User not found" }));
      return;
    }
    res.writeHead(200);
    res.end(JSON.stringify({
      userId: user.userId,
      name: user.name,
      balance: user.balance,
      referrals: user.referrals,
      verified: user.verified
    }));
    return;
  }

  // POST /verified (called from verify.html after device verification)
  if (path === "/verified" && req.method === "POST") {
    let body = "";
    req.on("data", chunk => body += chunk);
    req.on("end", async () => {
      try {
        const { userId } = JSON.parse(body);
        const uid  = parseInt(userId);
        let user   = await User.findOne({ userId: uid });

        if (!user) {
          res.writeHead(404);
          res.end(JSON.stringify({ error: "User not found" }));
          return;
        }

        if (user.verified) {
          res.writeHead(200);
          res.end(JSON.stringify({ success: true, alreadyVerified: true }));
          return;
        }

        user.verified = true;
        await user.save();

        // Give referral bonus
        if (user.referredBy) {
          const referrer = await User.findOne({ userId: user.referredBy });
          if (referrer) {
            referrer.balance  += 3;
            referrer.referrals += 1;
            await referrer.save();
            try {
              await bot.telegram.sendMessage(
                user.referredBy,
                "\uD83C\uDF89 \u20B93 Credited to Your Balance!\n\nInvited: " + uid
              );
            } catch(e) {}
          }
        }

        // Send open home to user
        try {
          await bot.telegram.sendMessage(
            uid,
            "Open Now & Claim \u20B97 Cash Free And Instant Withdraw.! \uD83D\uDE0D\n\nClick \"Open Home\" To Begin \uD83D\uDC47\uD83D\uDC47",
            {
              reply_markup: {
                inline_keyboard: [[{
                  text: "\uD83C\uDFE0 Open Home",
                  web_app: { url: MINI_APP }
                }]]
              }
            }
          );
        } catch(e) {}

        res.writeHead(200);
        res.end(JSON.stringify({ success: true }));
      } catch(e) {
        res.writeHead(500);
        res.end(JSON.stringify({ error: "Server error" }));
      }
    });
    return;
  }

  // POST /withdraw
  if (path === "/withdraw" && req.method === "POST") {
    let body = "";
    req.on("data", chunk => body += chunk);
    req.on("end", async () => {
      try {
        const { userId, amount, upi } = JSON.parse(body);
        const user = await User.findOne({ userId: parseInt(userId) });

        if (!user) {
          res.writeHead(404);
          res.end(JSON.stringify({ error: "User not found" }));
          return;
        }

        if (user.balance < MIN_WITHDRAW) {
          res.writeHead(400);
          res.end(JSON.stringify({ error: "Minimum withdrawal is \u20B9" + MIN_WITHDRAW }));
          return;
        }

        if (user.balance < amount) {
          res.writeHead(400);
          res.end(JSON.stringify({ error: "Insufficient balance" }));
          return;
        }

        user.balance -= amount;
        await user.save();

        // Notify admin
        try {
          await bot.telegram.sendMessage(
            ADMIN_ID,
            "\uD83D\uDCB8 *Withdraw Request*\n\n\uD83D\uDC64 Name: " + user.name + "\n\uD83C\uDD94 ID: " + userId + "\n\uD83D\uDCB0 Amount: \u20B9" + amount + "\n\uD83C\uDFF7 UPI: " + upi,
            { parse_mode: "Markdown" }
          );
        } catch(e) {}

        res.writeHead(200);
        res.end(JSON.stringify({ success: true, newBalance: user.balance }));
      } catch(e) {
        res.writeHead(500);
        res.end(JSON.stringify({ error: "Server error" }));
      }
    });
    return;
  }

  res.writeHead(404);
  res.end(JSON.stringify({ error: "Not found" }));
});

server.listen(process.env.PORT || 3000, () => {
  console.log("API running on port " + (process.env.PORT || 3000));
});

// ==============================
// BOT LAUNCH
// ==============================

bot.launch();
console.log("\uD83D\uDE80 Bot Running...");
	
