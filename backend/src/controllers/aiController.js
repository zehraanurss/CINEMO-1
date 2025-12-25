const { genAI, model: geminiModel, geminiSystemPrompts } = require("../config/gemini");
const Movie = require("../models/Movie");
const tmdbService = require("../services/tmdbService");
const User = require("../models/User");

// Conversation history storage (üretim için Redis kullanılabilir)
const conversationMap = new Map();

// @desc    Gemini ile doğal dil film önerisi (chat)
// @route   POST /api/ai/chat
// @access  Private
exports.chatRecommendation = async (req, res) => {
  try {
    const { message, conversationHistory = [] } = req.body;
    const userId = req.user.id;

    if (!message || message.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Mesaj gereklidir",
      });
    }

    // Konuşma geçmişi al veya oluştur
    if (!conversationMap.has(userId)) {
      conversationMap.set(userId, []);
    }

    const conversation = conversationMap.get(userId);

    // Kullanıcı profilini ve veritabanı bilgisini al
    const user = await User.findById(userId);
    const popularMovies = await Movie.find()
      .sort({ popularity: -1 })
      .limit(10)
      .select("title genres voteAverage releaseDate overview");

    // Eğer kullanıcı belirli bir film soruyorsa, mesaj içeriğini TMDB'de ara ve DB'ye kaydet
    // Önce mesajdan olası film başlığını çıkartıp temiz bir sorgu olarak gönderiyoruz
    const extractSearchQuery = (text) => {
      if (!text) return "";
      // 1) Tırnak içi başlık varsa onu al
      const quoteMatch = text.match(/"([^"]+)"|'([^']+)'|“([^”]+)”|«([^»]+)»/);
      if (quoteMatch) {
        return (quoteMatch[1] || quoteMatch[2] || quoteMatch[3] || quoteMatch[4] || "").trim();
      }

      // 2) Küçük normalizasyon: soru kelimelerini, yardımcı ifadeleri çıkar
      let s = text.toString().toLowerCase();
      // yaygın Türkçe ifade kalıpları
      s = s.replace(/hakk(ord?)?a|hakkinda|hakkında/g, " ");
      s = s.replace(/bilgi ver(iyor)?|bilgi verir misin|bilgi/g, " ");
      s = s.replace(/bana|lütfen|lutf(en)?/g, " ");
      s = s.replace(/öner(ir|ir misin)?|tavsiye/g, " ");
      s = s.replace(/film|dizi|fragman|izle(yi)?n?/g, " ");
      s = s.replace(/ hakkında | hakkında| hakkında\b/g, " ");
      // noktalama ve parantezleri temizle
      s = s.replace(/[\?\!\.,;:\(\)\[\]\/\\]/g, " ");
      s = s.replace(/\s+/g, " ").trim();

      // Kelime bazlı karar: en fazla ilk 4 kelimeyi kullan
      const parts = s.split(" ").filter(Boolean);
      if (parts.length === 0) return text.trim();
      // Eğer tek kelime varsa direkt onu kullan
      const candidate = parts.slice(0, 4).join(" ");
      return candidate;
    };

    const searchQuery = extractSearchQuery(message || "");
    let dynamicMovies = [];
    try {
      console.log(`AI Controller: original message: "${message}"`);
      console.log(`AI Controller: extracted searchQuery: "${searchQuery}"`);
      const searchResults = await tmdbService.search(searchQuery || message || "");
      console.log(`AI Controller: TMDB searchResults count: ${Array.isArray(searchResults) ? searchResults.length : 'not-array'}`);
      if (Array.isArray(searchResults) && searchResults.length > 0) {
        dynamicMovies = searchResults.slice(0, 5); // en fazla 5 tane al
        console.log(`AI Controller: dynamicMovies titles: ${dynamicMovies.map(m => m.title).join(', ')}`);
      }
    } catch (e) {
      // Hata olursa yoksay
      console.warn("TMDB search fallback failed:", e.message || e);
    }

  
    const movieListForContext = [];
    
    // Yardımcı fonksiyon: Özeti temizle ve kısalt (Çok uzun özetler token limitini doldurmasın)
    const formatMovie = (m) => {
      const summary = m.overview ? m.overview.substring(0, 200) + "..." : "Özet bilgisi yok";
      const genres = m.genres?.map((g) => g.name).join(", ") || "Tür belirtilmemiş";
      return `- ${m.title} (Puan: ${m.voteAverage}/10, Tür: ${genres})\n  Konu: ${summary}`;
    };

    if (dynamicMovies.length > 0) {
      movieListForContext.push("Aranan filme ilişkin TMDB sonuçları:");
      dynamicMovies.forEach((m) => {
        movieListForContext.push(formatMovie(m));
      });
      movieListForContext.push("\n---\n");
    }

    movieListForContext.push("Veritabanında bulunan popüler filmler:");
    if (popularMovies && popularMovies.length > 0) {
      popularMovies.forEach((m) => {
        movieListForContext.push(formatMovie(m));
      });
    } else {
      movieListForContext.push("Veritabanında henüz film yok. Genel öneriler yap.");
    }
    
    // --- GÜNCELLEME BİTİŞİ ---

    const dbContext = `\n${movieListForContext.join("\n")}\n\nKullanıcı Profili:\n- Ad: ${user?.name || "Misafir"}\n- İzleme Geçmişi: ${user?.watchHistory?.length || 0} film\n- Ratings: ${user?.ratings?.length || 0} değerlendirme${user?.aiPreferences?.genres?.length > 0 ? `\n- Tercih edilen türler: ${user.aiPreferences.genres.join(", ")}` : ""}`.trim();

    // Gemini ile sohbet başlat
    const chat = geminiModel.startChat({
      history: conversation.map((msg) => ({
        role: msg.role === "assistant" ? "model" : "user",
        parts: [{ text: msg.text }],
      })),
      generationConfig: {
        maxOutputTokens: 1024,
      },
    });

    // Mesajı bağlam ile gönder
    // const fullMessage = `${geminiSystemPrompts.chatAssistant}\n\n${dbContext}\n\nKullanıcı: ${message}`;

    // --- GÜNCELLEME: AKILLI ÖNERİ PROMPTU ---

    // 1. Kullanıcının son izlediklerini alalım (Hafıza)
    const historySummary = user.watchHistory && user.watchHistory.length > 0
      ? user.watchHistory.slice(-5).map(m => m.title).join(", ")
      : "Henüz geçmiş yok";

    // 2. Gelişmiş Prompt Tasarımı
    const detailedInstruction = `
    GÖREV: Kullanıcıya film önerisi yap.
    
    KULLANICI PROFİLİ:
    - Son İzledikleri: [${historySummary}]
    - Kullanıcı Mesajı: "${message}"

    KURALLAR:
    1. Sadece film ismi verme, **neden** önerdiğini kullanıcının geçmişiyle ilişkilendir.
       (Örnek: "Interstellar'ı sevdiğin için bunu da seveceksin...")
    2. Filmin "Vibe"ını (Atmosferini) tek kelimeyle parantez içinde belirt. 
       (Örnek: 🌌 Melankolik Bilim Kurgu)
    3. Eğer veritabanındaki listede (yukarıdaki context) uygun film yoksa, kendi genel kültürünü kullan.
    4. Cevabı şu formatta ver:
       
       🎬 **Film Adı (Yıl)** - (Atmosfer)
       ✨ **Neden Önerdim:** [Kısa ve ikna edici açıklama]
       ⚠️ **Uyarı:** [Varsa şiddet, yavaş tempo vb. uyarısı, yoksa "Aileye uygun" de]

    Samimi ve akıcı bir Türkçe kullan.
    `;

    // Mesajı bağlam ile gönder
    const fullMessage = `${geminiSystemPrompts.chatAssistant}\n\n${dbContext}\n\n${detailedInstruction}`;
    
    // --- GÜNCELLEME SONU ---

    const result = await chat.sendMessage(fullMessage);
    const responseText = result.response.text();

    // Konuşma geçmişine ekle
    conversation.push({ role: "user", text: message });
    conversation.push({ role: "assistant", text: responseText });

    // Geçmiş çok uzun olursa kısalt
    if (conversation.length > 20) {
      conversationMap.set(userId, conversation.slice(-20));
    }

    res.json({
      success: true,
      data: {
        message: responseText,
        recommendations: [],
        conversationId: `gemini_${userId}`,
      },
    });
  } catch (error) {
    console.error("Gemini Chat Error:", error.message);
    res.status(500).json({
      success: false,
      message: error.message || "Gemini sohbeti işlenemiyor",
    });
  }
};

// @desc    Gemini ile film önerisi al
// @route   POST /api/ai/recommend
// @access  Private
exports.getAIRecommendations = async (req, res) => {
  try {
    const { userPreferences = [], watchHistory = [], mood, genres = [], limit = 10 } = req.body;

    const prompt = `Sen bir film öneri yapay zekanısın. Aşağıdaki bilgilere dayarak ${limit} tane film önerisi yap (Türkçe):
    
Kullanıcı Tercihleri: ${userPreferences.join(", ") || "Belirtilmedi"}
Ruh Hali: ${mood || "Belirtilmedi"}
Tercih Edilen Türler: ${genres.join(", ") || "Tüm türler"}
İzleme Tarihi: Son izlenen ${watchHistory.length} film

Cevabını JSON formatında ver:
{
  "recommendations": [
    {"title": "Film Adı", "reason": "Neden bu filmi öneriyorum", "rating": 8.5}
  ],
  "reasoning": "Genel tavsiye açıklaması"
}`;

    const recommendChat = geminiModel.startChat({
      history: conversation.map((msg) => ({
        role: msg.role === "assistant" ? "model" : "user",
        parts: [{ text: msg.text }],
      })),
      generationConfig: { maxOutputTokens: 1024 },
    });

    const recResult = await recommendChat.sendMessage(prompt);
    const responseText = recResult.response.text();

    let recommendations = [];
    let reasoning = "Gemini AI tarafından kişiye özel öneriler yapılmıştır.";

    try {
      // JSON'u çıkarmaya çalış
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        recommendations = parsed.recommendations || [];
        reasoning = parsed.reasoning || reasoning;
      }
    } catch (e) {
      reasoning = responseText;
    }

    res.json({
      success: true,
      data: {
        recommendations,
        reasoning,
        model: "Gemini Pro",
        confidence: 0.85,
        metadata: {
          model: "Google Gemini Pro",
          factors: ["watch_history", "user_preferences", "mood", "genres"],
        },
      },
    });
  } catch (error) {
    console.error("Gemini Recommend Error:", error.message);
    res.status(500).json({
      success: false,
      message: error.message || "Gemini önerisi oluşturulamadı",
    });
  }
};

// @desc    Kullanıcı tercihlerini güncelle
// @route   POST /api/ai/update-profile
// @access  Private
exports.updateAIProfile = async (req, res) => {
  try {
    const { preferences, watchHistory = [], ratings = [] } = req.body;
    const userId = req.user.id;

    // Kullanıcı profilini güncelle
    const user = await User.findByIdAndUpdate(
      userId,
      {
        aiPreferences: preferences,
        watchHistory,
        ratings,
      },
      { new: true }
    );

    res.json({
      success: true,
      message: "Kullanıcı profili başarıyla güncellendi",
      data: {
        userId,
        profileUpdated: true,
        preferencesCount: preferences?.genres?.length || 0,
        watchHistoryCount: watchHistory.length,
      },
    });
  } catch (error) {
    console.error("AI Profile Update Error:", error.message);
    res.status(500).json({
      success: false,
      message: error.message || "Profil güncellenemedi",
    });
  }
};

// @desc    Film/dizi analizi
// @route   POST /api/ai/analyze
// @access  Private
exports.analyzeContent = async (req, res) => {
  try {
    const { movieId, title, description, type = "movie" } = req.body;

    if (!title && !description) {
      return res.status(400).json({
        success: false,
        message: "Film başlığı veya açıklaması gereklidir",
      });
    }

    const prompt = `Aşağıdaki ${type} hakkında Türkçe detaylı analiz yap:

Başlık: ${title}
Açıklama: ${description || "N/A"}

Analizi JSON formatında ver:
{
  "themes": [],
  "emotionalTone": "",
  "complexity": "low|medium|high",
  "pacing": "slow|medium|fast",
  "targetAudience": [],
  "warnings": [],
  "aiInsights": ""
}`;

    const analyzeChat = geminiModel.startChat({
      history: conversation.map((msg) => ({
        role: msg.role === "assistant" ? "model" : "user",
        parts: [{ text: msg.text }],
      })),
      generationConfig: { maxOutputTokens: 1024 },
    });

    const analyzeResult = await analyzeChat.sendMessage(prompt);
    const responseText = analyzeResult.response.text();

    let analysis = {
      movieId,
      title,
      themes: [],
      emotionalTone: "mixed",
      complexity: "medium",
      pacing: "medium",
      targetAudience: [],
      aiInsights: "Analiz tamamlandı",
    };

    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        analysis = { movieId, title, ...parsed };
      }
    } catch (e) {
      // Default analizi kullan
    }

    res.json({
      success: true,
      data: analysis,
    });
  } catch (error) {
    console.error("Analysis Error:", error.message);
    res.status(500).json({
      success: false,
      message: error.message || "Film analizi yapılamadı",
    });
  }
};

// @desc    Trend analizi
// @route   GET /api/ai/trends
// @access  Public
exports.getTrends = async (req, res) => {
  try {
    const prompt = `Film ve dizi endüstrisinde şu anda hangi trendler hakim? Son 3 ayda popüler türler, temalar ve beklenen yeni trendler neler? Türkçe cevap ver.

Cevabını JSON formatında ver:
{
  "risingGenres": [],
  "popularThemes": [],
  "predictions": [],
  "explanations": ""
}`;

    const trendsChat = geminiModel.startChat({
      history: [],
      generationConfig: { maxOutputTokens: 1024 },
    });

    const trendsResult = await trendsChat.sendMessage(prompt);
    const responseText = trendsResult.response.text();

    let trends = {
      risingGenres: [],
      popularThemes: [],
      predictions: [],
      explanations: "",
      generatedAt: new Date(),
    };

    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        trends = { ...trends, ...parsed };
      }
    } catch (e) {
      // Default kullan
    }

    res.json({
      success: true,
      data: trends,
    });
  } catch (error) {
    console.error("Trends Error:", error.message);
    res.status(500).json({
      success: false,
      message: error.message || "Trend analizi yapılamadı",
    });
  }
};

// @desc List available Gemini models (temporary debugging endpoint)
// @route GET /api/ai/models
// @access Public
exports.listModels = async (req, res) => {
  try {
    if (!genAI || typeof genAI.listModels !== "function") {
      return res.status(500).json({ success: false, message: "genAI.listModels not available on this SDK instance" });
    }

    const models = await genAI.listModels();
    return res.json({ success: true, data: models });
  } catch (error) {
    console.error("ListModels Error:", error.message || error);
    return res.status(500).json({ success: false, message: error.message || "Could not list models" });
  }
};