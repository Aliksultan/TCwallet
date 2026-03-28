const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!
const TG_API = `https://api.telegram.org/bot${BOT_TOKEN}`

async function sendMessage(chatId: string | number, text: string, parseMode = 'HTML') {
  try {
    const res = await fetch(`${TG_API}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: parseMode,
      }),
    })
    if (!res.ok) {
      const err = await res.json()
      console.error('[TG Bot] sendMessage error:', err)
    }
  } catch (e) {
    console.error('[TG Bot] network error:', e)
  }
}

// ─── Order Notifications ──────────────────────────────────────

export async function notifyManagersNewOrder(params: {
  managerTelegramIds: string[]
  orderId: string
  productName: string
  productPrice: number
  buyerName: string
  buyerUsername: string | null
}) {
  const { managerTelegramIds, orderId, productName, productPrice, buyerName, buyerUsername } = params
  const buyer = buyerUsername ? `@${buyerUsername} (${buyerName})` : buyerName

  const text = `🛒 <b>Новый заказ!</b>\n\n` +
    `📦 Товар: <b>${productName}</b>\n` +
    `◈ Цена: <b>${productPrice} TC</b>\n` +
    `👤 Покупатель: ${buyer}\n` +
    `🔑 ID заказа: <code>${orderId.slice(0, 8)}</code>\n\n` +
    `Откройте T-Market панель для управления заказом.`

  await Promise.all(managerTelegramIds.map((id) => sendMessage(id, text)))
}

export async function notifyMemberOrderAccepted(params: {
  memberTelegramId: string
  productName: string
  language: string
}) {
  const { memberTelegramId, productName, language } = params

  const text = language === 'kk'
    ? `✅ <b>Тапсырысыңыз қабылданды!</b>\n\n📦 ${productName}\n\nМенеджер сізге тауарды жеткізеді.`
    : `✅ <b>Ваш заказ принят!</b>\n\n📦 ${productName}\n\nМенеджер свяжется с вами для получения товара.`

  await sendMessage(memberTelegramId, text)
}

export async function notifyMemberOrderDeclined(params: {
  memberTelegramId: string
  productName: string
  refundAmount: number
  language: string
}) {
  const { memberTelegramId, productName, refundAmount, language } = params

  const text = language === 'kk'
    ? `❌ <b>Тапсырысыңыз қабылданбады</b>\n\n📦 ${productName}\n↩️ Қайтарылды: <b>${refundAmount} TC</b>\n\nМонеталар балансыңызға қайтарылды.`
    : `❌ <b>Ваш заказ отклонён</b>\n\n📦 ${productName}\n↩️ Возврат: <b>${refundAmount} TC</b>\n\nМонеты возвращены на ваш баланс.`

  await sendMessage(memberTelegramId, text)
}

export async function notifyMemberOrderCompleted(params: {
  memberTelegramId: string
  productName: string
  language: string
}) {
  const { memberTelegramId, productName, language } = params

  const text = language === 'kk'
    ? `🎉 <b>Тапсырысыңыз орындалды!</b>\n\n📦 ${productName}\n\nСатып алуыңыз үшін рахмет! Tulga Community-де белсенді болыңыз 🌟`
    : `🎉 <b>Ваш заказ выполнен!</b>\n\n📦 ${productName}\n\nСпасибо за покупку! Оставайтесь активным в Tulga Community 🌟`

  await sendMessage(memberTelegramId, text)
}

// ─── Transaction Notifications ────────────────────────────────

export async function notifyMemberCoinsEarned(params: {
  memberTelegramId: string
  amount: number
  activity: string | null
  reason: string | null
  newBalance: number
  language: string
}) {
  const { memberTelegramId, amount, activity, reason, newBalance, language } = params

  const text = language === 'kk'
    ? `🎯 <b>Сізге ${amount} TC берілді!</b>\n\n` +
      `${activity ? `📌 Іс-шара: ${activity}\n` : ''}` +
      `${reason ? `💬 Себеп: ${reason}\n` : ''}` +
      `◈ Жаңа баланс: <b>${newBalance} TC</b>`
    : `🎯 <b>Вам начислено ${amount} TC!</b>\n\n` +
      `${activity ? `📌 Активность: ${activity}\n` : ''}` +
      `${reason ? `💬 Причина: ${reason}\n` : ''}` +
      `◈ Новый баланс: <b>${newBalance} TC</b>`

  await sendMessage(memberTelegramId, text)
}

export async function notifyMemberCoinsRemoved(params: {
  memberTelegramId: string
  amount: number
  reason: string | null
  newBalance: number
  language: string
}) {
  const { memberTelegramId, amount, reason, newBalance, language } = params

  const text = language === 'kk'
    ? `⬇️ <b>Балансыңыздан ${Math.abs(amount)} TC алынды</b>\n\n` +
      `${reason ? `💬 Себеп: ${reason}\n` : ''}` +
      `◈ Жаңа баланс: <b>${newBalance} TC</b>`
    : `⬇️ <b>С вашего баланса списано ${Math.abs(amount)} TC</b>\n\n` +
      `${reason ? `💬 Причина: ${reason}\n` : ''}` +
      `◈ Новый баланс: <b>${newBalance} TC</b>`

  await sendMessage(memberTelegramId, text)
}
