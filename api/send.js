// api/send.js
export default async function handler(req, res) {
  // Hanya izinkan method POST
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    // Ambil data dari body request (yang dikirim dari script.js frontend)
    const { chat_id, text, photo, caption } = req.body;

    // Ambil token rahasia dari Environment Variables Vercel
    const botToken = process.env.BOT_TOKEN;

    if (!botToken) {
      console.error("BOT_TOKEN tidak ditemukan di Environment Variables");
      return res.status(500).json({ 
        success: false, 
        message: 'Server configuration error: BOT_TOKEN missing' 
      });
    }

    // Tentukan endpoint Telegram berdasarkan tipe pesan
    let url;
    if (photo && caption) {
      // Jika ada foto, gunakan sendPhoto
      url = `https://api.telegram.org/bot${botToken}/sendPhoto`;
    } else {
      // Jika hanya teks, gunakan sendMessage
      url = `https://api.telegram.org/bot${botToken}/sendMessage`;
    }

    // Kirim request ke Telegram API
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chat_id,
        text: text,
        parse_mode: "Markdown",
        disable_web_page_preview: false,
        // Jika ada foto base64 atau blob, kita perlu handle khusus FormData
        // Tapi untuk simplifikasi, kita asumsikan frontend mengirim JSON stringified 
        // atau kita bisa kirim langsung fieldnya jika menggunakan FormData object.
        
        // Catatan: Jika frontend mengirim foto sebagai Blob/File object,
        // kita perlu mengubah body menjadi FormData agar Telegram menerima gambar.
      })
    });

    // Jika response sukses dari Telegram
    if (response.ok) {
      const data = await response.json();
      return res.status(200).json({ success: true, data });
    } else {
      const errorData = await response.json();
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to send to Telegram', 
        details: errorData 
      });
    }

  } catch (error) {
    console.error("Error internal server:", error);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal Server Error', 
      error: error.message 
    });
  }
}