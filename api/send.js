export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { text, parse_mode = "Markdown" } = req.body || {};
    if (!text) {
        return res.status(400).json({ error: 'text wajib diisi' });
    }

    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (!token || !chatId) {
        return res.status(500).json({ error: 'Server config missing' });
    }

    try {
        const tgRes = await fetch(
            `https://api.telegram.org/bot${token}/sendMessage`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: chatId,
                    text,
                    parse_mode,
                    link_preview_options: { is_disabled: true }
                })
            }
        );
        const data = await tgRes.json();
        
        if (!data.ok) {
            return res.status(500).json({ error: 'Telegram error', detail: data });
        }
        
        return res.status(200).json({ ok: true });
    } catch (err) {
        return res.status(500).json({ error: 'Send failed' });
    }
}