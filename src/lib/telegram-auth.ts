import crypto from 'crypto'

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!

/**
 * Validates Telegram WebApp initData using HMAC-SHA256.
 * https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
 */
export function validateTelegramInitData(initData: string): boolean {
  try {
    const params = new URLSearchParams(initData)
    const hash = params.get('hash')
    if (!hash) return false

    params.delete('hash')

    // Sort keys and join as key=value\n
    const dataCheckString = Array.from(params.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}=${v}`)
      .join('\n')

    // Secret key = HMAC-SHA256("WebAppData", bot_token)
    const secretKey = crypto
      .createHmac('sha256', 'WebAppData')
      .update(BOT_TOKEN)
      .digest()

    const expectedHash = crypto
      .createHmac('sha256', secretKey)
      .update(dataCheckString)
      .digest('hex')

    return expectedHash === hash
  } catch {
    return false
  }
}

/**
 * Parses Telegram user data from validated initData string.
 */
export function parseTelegramUser(initData: string) {
  const params = new URLSearchParams(initData)
  const userStr = params.get('user')
  if (!userStr) return null

  try {
    const user = JSON.parse(userStr)
    return {
      telegram_id: String(user.id),
      username: user.username || null,
      display_name: [user.first_name, user.last_name].filter(Boolean).join(' '),
      language: user.language_code === 'kk' ? 'kk' : 'ru',
    }
  } catch {
    return null
  }
}
