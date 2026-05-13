export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Sadece POST desteklenir' });
    }

    const { mesajGecmisi, oyuncuAdi, sinif, can, altin, maxCan } = req.body;
    
    // Vercel'e ekleyeceğimiz güvenli API şifresi buradan çekilir
    const API_KEY = process.env.GROQ_API_KEY; 

    const systemPrompt = `Sen yaratıcı bir Türkçe RPG oyun anlatıcısısın. 
    Kurallar: 
    1) Her zaman Türkçe yaz. 
    2) Yanıtlar kısa ve etkileyici olsun (maksimum 120 kelime). 
    3) Her yanıtın sonunda oyuncuya 2-3 numara seçenek sun. 
    4) Oyuncu tehlikeli bir eylem yaparsa yanıtına [CAN:-X] yaz (X: 10-30 arası). 
    5) Oyuncu altın bulursa [ALTIN:+X] yaz, altın harcarsa [ALTIN:-X] yaz. 
    6) Gerçekçi ve atmosferik bir fantezi dünyası yarat. 
    Oyuncu: ${oyuncuAdi} | Sınıf: ${sinif} | Can: ${can}/${maxCan} | Altın: ${altin}`;

    // İstek gövdesini hazırlıyoruz
    const messages = [
        { role: "system", content: systemPrompt },
        ...mesajGecmisi
    ];

    try {
        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "llama-3.3-70b-versatile",
                max_tokens: 400,
                temperature: 0.8,
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