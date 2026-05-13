let oyuncuAdi = "Kahraman";
let sinif = "Savaşçı";
let can = 120;
let maxCan = 120;
let altin = 50;
let bolum = 1;
let mesajGecmisi = [];

const storyBox = document.getElementById('story-box');
const inputField = document.getElementById('action-input');
const sendBtn = document.getElementById('send-btn');

function arayuzuGuncelle() {
    document.getElementById('hp').innerText = `${can}/${maxCan}`;
    document.getElementById('gold').innerText = altin;
    document.getElementById('level').innerText = bolum;
}

function ekranaYazdir(metin, tur) {
    const p = document.createElement('p');
    p.className = tur; // 'player-text' veya 'ai-text'
    p.innerText = metin;
    storyBox.appendChild(p);
    storyBox.scrollTop = storyBox.scrollHeight; // Otomatik aşağı kaydır
}

// Oyunu başlatan ilk istek
async function oyunuBaslat() {
    arayuzuGuncelle();
    const ilkMesaj = `Yeni bir oyun başlıyor. Oyuncunun adı ${oyuncuAdi} ve sınıfı ${sinif}. Ortaçağ fantezi dünyasında küçük bir kasabanın meydanında başla. Atmosferik 3-4 cümlelik bir giriş yaz. Sonunda oyuncuya tam olarak 3 numara seçenek sun.`;
    await yapayZekayaGonder(ilkMesaj, true);
}

// Backend'e (Vercel) istek atan ana fonksiyon
async function yapayZekayaGonder(kullaniciMesaji, ilkGirisMi = false) {
    if (!ilkGirisMi) ekranaYazdir("> " + kullaniciMesaji, "player-text");
    
    inputField.value = '';
    sendBtn.disabled = true;
    inputField.disabled = true;
    
    // Geçmişe kullanıcının mesajını ekle
    mesajGecmisi.push({ role: "user", content: kullaniciMesaji });

    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                mesajGecmisi: mesajGecmisi,
                oyuncuAdi: oyuncuAdi,
                sinif: sinif,
                can: can,
                maxCan: maxCan,
                altin: altin
            })
        });

        const data = await response.json();
        const aiYaniti = data.yanit;

        // Geçmişe AI yanıtını ekle
        mesajGecmisi.push({ role: "assistant", content: aiYaniti });
        
        // Can ve Altın hesaplamaları (Java'daki mantığının aynısı)
        canGuncelle(aiYaniti);
        altinGuncelle(aiYaniti);
        
        if (!ilkGirisMi) bolum++;
        
        // Bölüm 5'in katıysa can yenile
        if (bolum % 5 === 0 && can > 0 && can < maxCan) {
            can = Math.min(maxCan, can + 15);
            aiYaniti += "\n✨ [Dinlendin! +15 can]";
        }

        arayuzuGuncelle();
        ekranaYazdir(aiYaniti, "ai-text");

        if (can <= 0) {
            ekranaYazdir(`💀 ${oyuncuAdi} yenildi! Macera sona erdi. Sayfayı yenileyerek baştan başlayabilirsin.`, "system-text");
            return; // Butonları kapalı bırak
        }

    } catch (error) {
        ekranaYazdir("❌ Sunucu ile bağlantı kurulamadı. Lütfen tekrar dene.", "system-text");
    }

    sendBtn.disabled = false;
    inputField.disabled = false;
    inputField.focus();
}

function canGuncelle(yanit) {
    if (yanit.includes("[CAN:-")) {
        let bas = yanit.indexOf("[CAN:-") + 6;
        let bit = yanit.indexOf("]", bas);
        let azalma = parseInt(yanit.substring(bas, bit));
        if(!isNaN(azalma)) can = Math.max(0, can - azalma);
    }
    if (yanit.includes("[CAN:+")) {
        let bas = yanit.indexOf("[CAN:+") + 6;
        let bit = yanit.indexOf("]", bas);
        let artis = parseInt(yanit.substring(bas, bit));
        if(!isNaN(artis)) can = Math.min(maxCan, can + artis);
    }
}

function altinGuncelle(yanit) {
    if (yanit.includes("[ALTIN:+")) {
        let bas = yanit.indexOf("[ALTIN:+") + 8;
        let bit = yanit.indexOf("]", bas);
        let kazanc = parseInt(yanit.substring(bas, bit));
        if(!isNaN(kazanc)) altin += kazanc;
    }
    if (yanit.includes("[ALTIN:-")) {
        let bas = yanit.indexOf("[ALTIN:-") + 8;
        let bit = yanit.indexOf("]", bas);
        let harcama = parseInt(yanit.substring(bas, bit));
        if(!isNaN(harcama)) altin = Math.max(0, altin - harcama);
    }
}

// Gönder butonuna basıldığında
sendBtn.addEventListener('click', () => {
    const metin = inputField.value.trim();
    if (metin !== "") yapayZekayaGonder(`Oyuncunun eylemi: "${metin}". Bu eylemi hikayeye yansıt ve sonuçlandır. Gerekirse [CAN:-X] veya [CAN:+X] veya [ALTIN:+X] veya [ALTIN:-X] ekle. Sonunda 2-3 yeni seçenek sun.`);
});

// Enter tuşuna basıldığında
inputField.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendBtn.click();
});

// Oyunu ilk açılışta başlat
window.onload = oyunuBaslat;