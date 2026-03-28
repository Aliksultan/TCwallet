const TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8679059023:AAGHsUzhGqAV70nxRrYQ9p8fL5sZDo1KzZM';
// We need to read the current URL from the user's running localhost.run tunnel or ask them for it
const targetUrl = process.argv[2];

if (!targetUrl) {
  console.error("Please provide the URL as an argument, e.g. node send_test_button.js https://da297e778b3d0f.lhr.life");
  process.exit(1);
}

// Just send a message to the bot's updates (we don't know the user's chat_id, so we'll fetch getUpdates to find it)
async function send() {
  const getUpdatesRes = await fetch(`https://api.telegram.org/bot${TOKEN}/getUpdates`);
  const updates = await getUpdatesRes.json();
  
  if (!updates.result || updates.result.length === 0) {
    console.error("Please send any message to your bot first, then run this script again.");
    return;
  }
  
  // Get the most recent chat id
  const chatId = updates.result[updates.result.length - 1].message.chat.id;
  
  const sendRes = await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text: "Open the App with the direct link below (this ignores BotFather caching):",
      reply_markup: {
        inline_keyboard: [[
          {
            text: "🚀 Open App Directly",
            web_app: { url: targetUrl }
          }
        ]]
      }
    })
  });
  
  const result = await sendRes.json();
  if (result.ok) {
    console.log("✅ Sent direct button to your Telegram!");
  } else {
    console.error("❌ Failed:", result);
  }
}

send();
