export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ ok: false, message: "Method not allowed" });
    }

    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (!token || !chatId) {
        return res.status(500).json({ ok: false, message: "Environment variables belum diatur" });
    }

    try {
        const { message } = req.body || {};
        
        if (!message || typeof message !== "string") {
            return res.status(400).json({ ok: false, message: "Pesan tidak valid" });
        }

        const telegramRes = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                chat_id: chatId,
                text: message,
                parse_mode: "Markdown",
                disable_web_page_preview: false
            })
        });

        const data = await telegramRes.json();
        return res.status(telegramRes.ok ? 200 : 500).json(data);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ ok: false, message: "Gagal menghubungi Telegram API" });
    }
}