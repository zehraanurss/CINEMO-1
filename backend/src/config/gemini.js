// const { GoogleGenerativeAI } = require("@google/generative-ai");

// // Gemini yapılandırması
// const geminiConfig = {
//   apiKey: process.env.GEMINI_API_KEY,
//   model: "gemini-2.0-flash",
//   temperature: 0.7,
//   maxOutputTokens: 1000,
// };

// const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
// const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

// // Gemini sistem promptları
// const geminiSystemPrompts = {
//   movieRecommendation:
//     "Sen bir film ve dizi öneri uzmanısın. Yapay zeka kullanarak kişiye özel filmler öner. Türkçe cevap ver.",
//   chatAssistant: `Sen bir akıllı film öneri asistanısın. Şu yeteneklerin var:
// * Site içerisindeki popüler filmleri belirleyebilirsin: En çok izlenen, beğenilen veya değerlendirilen filmleri takip edebilirsin.
// * Kullanıcıların genel tercihlerini analiz edebilirsin: Site üzerindeki kullanıcı davranışlarından (örneğin, hangi tür filmlerin daha çok izlendiği) genel eğilimleri çıkarabilisin.
// * Kullanıcı profillerini analiz edebilirsin: İzleme geçmişi, verilen puanlar ve tercihler doğrultusunda kişiye özel profiller oluşturabilisin.
// * Kişiye özel film önerileri sunabilirsin: Profil ve genel eğilimlere dayanarak, beğenilecek filmleri tahmin edebilisin.
// * Doğal dil anlayışıyla konuşabilisin: Kullanıcıların taleplerini anla ve uygun cevaplar ver.

// Kullanıcıyla sohbet et, sorularını cevapla, filmler öner. Her zaman Türkçe cevap ver.`,
//   contentAnalyzer:
//     "Sen bir film analiz uzmanısın. Detaylı ve doğru analizler yap. Türkçe cevap ver.",
//   trendAnalyst:
//     "Sen film endüstrisi trend analisti. Güncel ve doğru analizler yap. Türkçe cevap ver.",
// };

// module.exports = {
//   genAI,
//   model,
//   geminiConfig,
//   geminiSystemPrompts,
// };


// require("dotenv").config();
// const axios = require("axios");

// // Ayarlar
// const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// // ✅ DEĞİŞİKLİK BURADA: 2.0 yerine daha yeni ve hızlı olan 2.5'i seçtik
// const GEMINI_MODEL = "gemini-2.5-flash"; 

// console.log("--- GEMINI AYARLARI ---");
// console.log("Kullanılan Model:", GEMINI_MODEL);
// console.log("API Key Durumu:", GEMINI_API_KEY ? "✅ Yüklü (" + GEMINI_API_KEY.substring(0, 8) + "...)" : "❌ BULUNAMADI");
// console.log("-----------------------");

// const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

// // --- SİSTEM PROMPTLARI ---
// const geminiSystemPrompts = {
//   movieRecommendation:
//     "Sen bir film ve dizi öneri uzmanısın. Yapay zeka kullanarak kişiye özel filmler öner. Türkçe cevap ver.",
//   chatAssistant: `Sen bir akıllı film öneri asistanısın. Şu yeteneklerin var:
// * Site içerisindeki popüler filmleri belirleyebilirsin.
// * Kullanıcıların genel tercihlerini analiz edebilirsin.
// * Kişiye özel film önerileri sunabilirsin.
// * Doğal dil anlayışıyla konuşabilisin.

// Kullanıcıyla sohbet et, sorularını cevapla, filmler öner. Her zaman Türkçe cevap ver.`,
//   contentAnalyzer:
//     "Sen bir film analiz uzmanısın. Detaylı ve doğru analizler yap. Türkçe cevap ver.",
//   trendAnalyst:
//     "Sen film endüstrisi trend analisti. Güncel ve doğru analizler yap. Türkçe cevap ver.",
// };

// // --- MANUEL GEMINI ENTEGRASYONU ---
// const model = {
//   startChat: function (config) {
//     const history = config.history || [];

//     return {
//       sendMessage: async function (message) {
//         const contents = history.map((msg) => ({
//           role: msg.role === "assistant" ? "model" : msg.role,
//           parts: msg.parts,
//         }));

//         contents.push({
//           role: "user",
//           parts: [{ text: message }],
//         });

//         try {
//           const response = await axios.post(
//             API_URL,
//             {
//               contents: contents,
//               generationConfig: {
//                 maxOutputTokens: 1000,
//                 temperature: 0.7,
//               },
//             },
//             {
//               headers: { "Content-Type": "application/json" },
//               timeout: 20000 // Süreyi biraz daha artırdık (20 sn)
//             }
//           );

//           const responseText =
//             response.data?.candidates?.[0]?.content?.parts?.[0]?.text ||
//             "Üzgünüm, şu an cevap veremiyorum.";

//           return {
//             response: {
//               text: () => responseText,
//             },
//           };
//         } catch (error) {
//           console.error("--- GEMINI HATASI ---");
//           if (error.code === 'ECONNABORTED') {
//              console.error("Sebep: Zaman Aşımı (Google cevap vermedi).");
//           } else if (error.response) {
//             console.error("Hata Kodu:", error.response.status);
//             console.error("Detay:", JSON.stringify(error.response.data, null, 2));
//           } else {
//             console.error("Hata Mesajı:", error.message);
//           }
//           throw new Error("Yapay zeka servisine bağlanılamadı.");
//         }
//       },
//     };
//   },
// };

// const genAI = {
//   getGenerativeModel: () => model,
// };

// const geminiConfig = {
//   apiKey: GEMINI_API_KEY,
//   model: GEMINI_MODEL,
// };

// module.exports = {
//   genAI,
//   model,
//   geminiConfig,
//   geminiSystemPrompts,
// };


require("dotenv").config();
const axios = require("axios");

// Ayarlar
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = "gemini-flash-latest"; 

console.log("--- GEMINI AYARLARI ---");
console.log("Kullanılan Model:", GEMINI_MODEL);
console.log("API Key Durumu:", GEMINI_API_KEY ? "✅ Yüklü" : "❌ BULUNAMADI");
console.log("-----------------------");

const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

// --- SİSTEM PROMPTLARI ---
const geminiSystemPrompts = {
  movieRecommendation:
    "Sen bir film ve dizi öneri uzmanısın. Yapay zeka kullanarak kişiye özel filmler öner. Türkçe cevap ver.",
  chatAssistant: `Sen CinemAI platformunun zeki ve esprili asistanısın.

  ANA GÖREV (ÖNCE BUNU KONTROL ET):
  Kullanıcının son mesajını analiz et ve şu iki moddan birini seç:

  MOD 1: SADECE SOHBET ("Nasılsın", "Selam", "Naber", "Kimsin")
  KURAL: Film önerisi YAPMA. Film adı VERME.
  EYLEM: Sadece sohbet et. Sinema hakkında genel konuşabilirsin ("Bugün film izledin mi?" gibi) ama spesifik bir film önerme.
  ÖRNEK: "İyiyim babba, sen nasılsın? Bugün keyifler yerinde mi?"

  MOD 2: FİLM İSTEĞİ / ANALİZİ ("Film öner", "Korku filmi var mı", "Canım sıkıldı ne izlesem", "Inception nasıl?")
  KURAL: Şimdi devreye gir ve en iyi önerini yap.
  EYLEM: Kullanıcının zevkine uygun, nokta atışı filmler öner.

  ---
  GENEL KURALLAR:
  1. Asla robot gibi "Ben bir yapay zekayım" deme. Karakterde kal.
  2. Film öneriyorsan adını **kalın** yaz.
  3. Samimi ve Türkçe konuş.`,
  
  contentAnalyzer:
    "Sen bir film analiz uzmanısın. Detaylı ve doğru analizler yap. Türkçe cevap ver.",
  trendAnalyst:
    "Sen film endüstrisi trend analisti. Güncel ve doğru analizler yap. Türkçe cevap ver.",
};

// --- MANUEL GEMINI ENTEGRASYONU ---
const model = {
  startChat: function (config) {
    const history = config.history || [];

    return {
      sendMessage: async function (message) {
        const contents = history.map((msg) => ({
          role: msg.role === "assistant" ? "model" : msg.role,
          parts: msg.parts,
        }));

        contents.push({
          role: "user",
          parts: [{ text: message }],
        });

        try {
          const response = await axios.post(
            API_URL,
            {
              contents: contents,
              safetySettings: [
                { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
                { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
                { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
                { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
              ],
              generationConfig: {
                maxOutputTokens: 2048, // 👈 LİMİTİ 2 KATINA ÇIKARDIK
                temperature: 0.8, // Biraz daha yaratıcı olsun
              },
            },
            {
              headers: { "Content-Type": "application/json" },
              timeout: 40000 // 40 Saniye beklesin (uzun cevaplar için)
            }
          );

          const candidate = response.data?.candidates?.[0];
          const responseText = candidate?.content?.parts?.[0]?.text;

          if (!responseText) {
            console.log("⚠️ CEVAP BOŞ GELDİ! Google Cevabı:", JSON.stringify(response.data, null, 2));
            return { response: { text: () => "Filtreye takıldı veya cevap üretilemedi." } };
          }

          return {
            response: {
              text: () => responseText,
            },
          };
        } catch (error) {
          console.error("--- GEMINI HATASI ---");
          if (error.response) {
             console.error("Status:", error.response.status);
             console.error("Data:", JSON.stringify(error.response.data, null, 2));
          } else {
             console.error("Message:", error.message);
          }
          throw new Error("Yapay zeka servisine bağlanılamadı.");
        }
      },
    };
  },
};

const genAI = {
  getGenerativeModel: () => model,
};

const geminiConfig = {
  apiKey: GEMINI_API_KEY,
  model: GEMINI_MODEL,
};

module.exports = {
  genAI,
  model,
  geminiConfig,
  geminiSystemPrompts,
};