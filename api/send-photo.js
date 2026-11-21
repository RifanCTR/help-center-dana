import formidable from 'formidable';
import fs from 'fs';

export const config = {
    api: {
        bodyParser: false
    }
};

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (!token || !chatId) {
        return res.status(500).json({ error: 'Server config missing' });
    }

    try {
        const form = formidable({ multiples: false });

        const [fields, files] = await new Promise((resolve, reject) => {
            form.parse(req, (err, fields, files) => {
                if (err) reject(err);
                else resolve([fields, files]);
            });
        });

        // formidable v3: files.photo bisa array atau object
        const photoFile = Array.isArray(files.photo) ? files.photo[0] : files.photo;
        if (!photoFile) {
            return res.status(400).json({ error: 'photo wajib diisi' });
        }

        // formidable v3: fields.caption juga array
        const captionRaw = fields.caption;
        const caption = Array.isArray(captionRaw) ? captionRaw[0] : (captionRaw || '');

        // Baca file dari disk
        const buffer = fs.readFileSync(photoFile.filepath);
        const mimeType = photoFile.mimetype || 'image/jpeg';
        const filename = photoFile.originalFilename || 'foto.jpg';

        // Bangun FormData untuk Telegram
        const tgForm = new FormData();
        tgForm.append('chat_id', chatId);
        if (caption) tgForm.append('caption', caption);

        const blob = new Blob([buffer], { type: mimeType });
        tgForm.append('photo', blob, filename);

        const tgRes = await fetch(
            `https://api.telegram.org/bot${token}/sendPhoto`,
            {
                method: 'POST',
                body: tgForm
            }
        );
        const data = await tgRes.json();

        if (!data.ok) {
            console.error('Telegram sendPhoto error:', data);
            return res.status(500).json({ error: 'Telegram error', detail: data });
        }

        return res.status(200).json({ ok: true });
    } catch (err) {
        console.error('send-photo error:', err);
        return res.status(500).json({ error: 'Send photo failed', message: err.message });
    }
}