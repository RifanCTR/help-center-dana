
export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({
            ok: false,
            message: "Method not allowed"
        });
    }

    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (!token || !chatId) {
        return res.status(500).json({
            ok: false,
            message: "Environment variables belum diatur"
        });
    }

    try {
        const contentType = req.headers["content-type"] || "";

        let telegramUrl;
        let response;

        if (contentType.includes("application/json")) {
            const { type, message, latitude, longitude } =
                req.body || {};

            let text;

            if (type === "text") {
                if (
                    typeof message !== "string" ||
                    !message.trim()
                ) {
                    return res.status(400).json({
                        ok: false,
                        message: "Pesan tidak valid"
                    });
                }

                text = message;
            } else if (type === "location") {
                if (
                    typeof latitude !== "number" ||
                    typeof longitude !== "number" ||
                    latitude < -90 ||
                    latitude > 90 ||
                    longitude < -180 ||
                    longitude > 180
                ) {
                    return res.status(400).json({
                        ok: false,
                        message: "Koordinat tidak valid"
                    });
                }

                text =
                    `Lokasi yang dibagikan pengguna:\n` +
                    `Latitude: ${latitude}\n` +
                    `Longitude: ${longitude}\n` +
                    `Maps: https://www.google.com/maps?q=${latitude},${longitude}`;
            } else {
                return res.status(400).json({
                    ok: false,
                    message: "Jenis permintaan tidak dikenal"
                });
            }

            telegramUrl =
                `https://api.telegram.org/bot${token}/sendMessage`;

            response = await fetch(telegramUrl, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    chat_id: chatId,
                    text
                })
            });

        } else {
            return res.status(415).json({
                ok: false,
                message: "Content-Type tidak didukung"
            });
        }

        const result = await response.json();

        return res.status(response.ok ? 200 : 502).json({
            ok: response.ok,
            result
        });

    } catch (error) {
        console.error("Telegram API error:", error);

        return res.status(500).json({
            ok: false,
            message: "Terjadi kesalahan server"
        });
    }
}
