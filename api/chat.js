export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Sadece POST desteklenir' });
    }

    const { mesajGecmisi, oyuncuAdi, sinif, can, altin, maxCan } = req.body;
    
    // Google API Şifremiz
    const API_KEY = process.env.GEMINI_API_KEY; 

    const systemPrompt = `Sen yaratıcı bir Türkçe RPG oyun anlatıcısısın. 
    Kurallar: 
    1) Her zaman Türkçe yaz ve kusursuz bir dilbilgisi kullan.
    2) Yanıtlar kısa ve etkileyici olsun (maksimum 120 kelime). 
    3) Her yanıtın sonunda oyuncuya tam olarak 3 numara seçenek sun. 
    4) Oyuncu tehlikeli bir eylem yaparsa yanıtına [CAN:-X] yaz (X: 10-30 arası). 
    5) Oyuncu altın bulursa [ALTIN:+X] yaz, altın harcarsa [ALTIN:-X] yaz. 
    6) Gerçekçi ve atmosferik bir fantezi dünyası yarat. 
    Oyuncu: ${oyuncuAdi} | Sınıf: ${sinif} | Can: ${can}/${maxCan} | Altın: ${altin}`;

    const messages = [
        { role: "system", content: systemPrompt },
        ...mesajGecmisi
    ];

    try {
        // Doğrudan Google'ın kendi sunucusuna bağlanıyoruz!
        const response = await fetch("https://generativelanguage.googleapis.com/v1beta/openai/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "gemini-1.5-flash", // Hızlı, ücretsiz ve kusursuz Türkçe
                messages: messages
            })
        });

        const data = await response.json();

        if (data.error) {
            return res.status(500).json({ yanit: "❌ API Hatası: " + data.error.message });
        }

        const yanitMetni = data.choices[0].message.content;
        return res.status(200).json({ yanit: yanitMetni });

    } catch (error) {
        return res.status(500).json({ yanit: "❌ Sunucu tarafında bir hata oluştu." });
    }
}
