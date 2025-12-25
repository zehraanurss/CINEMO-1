import { useState, useRef, useEffect } from "react";
import { aiAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";
import back1Image from '../assets/images/back1.png';
import back2Image from '../assets/images/back2.png';
import back3Image from '../assets/images/back3.png';
export default function AIRecommendation() {
  const { user } = useAuth();
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState([]);
  const [loading, setLoading] = useState(false);

  const chatEndRef = useRef(null);
 const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  };

 useEffect(() => {
    // Sadece sohbet geçmişi varsa veya loading durumundaysa aşağı kaydır.
    // Böylece sayfa ilk açıldığında (chat boşken) en alta atmaz.
    if (chat.length > 0 || loading) {
      scrollToBottom();
    }
  }, [chat, loading]);
  const send = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    const userMsg = { role: "user", text: message };
    setChat((c) => [...c, userMsg]);
    const outgoing = message; // state sıfırlanmadan önce yakala
    setMessage("");
    setLoading(true);

    try {
      const res = await aiAPI.chat({ message: outgoing, conversationHistory: chat });
      const aiMsg = {
        role: "ai",
        text: res.data.data.message,
        recommendations: res.data.data.recommendations || [],
      };
      setChat((c) => [...c, aiMsg]);
    } catch (err) {
      setChat((c) => [...c, { role: "ai", text: "Üzgünüm, bir bağlantı hatası oluştu." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#07070a] text-white">
    {/* BACKGROUND (3 parçalı) */}
    <div className="absolute inset-0 z-0 overflow-hidden">
      <div className="absolute inset-0 flex flex-col">
        <div className="flex-1 w-full bg-cover bg-center" style={{ backgroundImage: `url(${back1Image})` }} />
        <div className="flex-1 w-full bg-cover bg-center" style={{ backgroundImage: `url(${back2Image})` }} />
        <div className="flex-1 w-full bg-cover bg-center" style={{ backgroundImage: `url(${back3Image})` }} />
      </div>

      <div className="absolute inset-0 bg-black/65 bg-gradient-to-t from-black via-black/40 to-black/70" />
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(1200px 700px at 50% 25%, rgba(0,0,0,0) 35%, rgba(0,0,0,.8) 85%)",
        }}
      />

      <div className="absolute -top-24 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-purple-600/20 blur-3xl" />
      <div className="absolute bottom-[-140px] left-[12%] h-[460px] w-[460px] rounded-full bg-pink-500/14 blur-3xl" />
      <div className="absolute bottom-[-160px] right-[10%] h-[520px] w-[520px] rounded-full bg-indigo-500/12 blur-3xl" />
    </div>

      

      {/* Main container */}
       <div className="relative z-10 mx-auto w-full max-w-6xl px-4 pt-24 pb-8">
      <main className="relative z-10 mx-auto mt-6 w-full max-w-6xl px-4 pb-10">
        <div className="grid gap-6 lg:grid-cols-[1.25fr_.75fr]">
          {/* Chat Card */}
          <section className="group relative overflow-hidden rounded-3xl border border-white/10 bg-black/40 backdrop-blur-xl shadow-2xl">
            {/* Glow outline */}
            <div className="pointer-events-none absolute -inset-10 opacity-60 blur-3xl transition-all duration-500 group-hover:opacity-90"
              style={{
                background:
                  "radial-gradient(600px 260px at 20% 0%, rgba(168,85,247,.35), transparent 60%), radial-gradient(520px 260px at 80% 0%, rgba(236,72,153,.28), transparent 60%)",
              }}
            />

{/* Header: px-6 yatay ferahlık, py-5 dikey denge sağlar */}
<div className="relative flex items-center justify-between gap-4 border-b border-white/10 bg-black/35 px-6 py-5">
  <div>
    <h1 className="flex items-center gap-3 text-lg sm:text-xl font-bold leading-tight text-white/90">
  {/* Kutu stillerini kaldırdık, sadece boyut verdik */}
  <span className="text-2xl">
    ✨
  </span>
  AI Recommendation
</h1>
    {/* Alt metin */}
    <p className="mt-1 ml-1 text-sm text-white/50">
      Merhaba <span className="text-white/80 font-medium">{user?.name}</span>, bugün ne izlemek istersin?
    </p>
  </div>

  {/* Sağdaki Etiket */}
  <div className="hidden sm:flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-medium text-white/60 shadow-inner">
    <span className="relative flex h-2 w-2">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
      <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
    </span>
    Akıllı öneri modu
  </div>
</div>

            {/* Chat body */}
            <div className="relative h-[62vh] overflow-y-auto px-6 py-6 space-y-5 custom-scrollbar">
              {chat.length === 0 && !loading && (
                <div className="grid h-full place-items-center">
                  <div className="text-center">
                    <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-3xl border border-white/10 bg-white/5">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white/70" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    </div>
                    <p className="text-white/70">Bir tür, ruh hali veya örnek film yaz.</p>
                    
                  </div>
                </div>
              )}

              {chat.map((m, i) => {
                const isUser = m.role === "user";
                return (
                  <div key={i} className={`flex w-full ${isUser ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[86%] sm:max-w-[78%]`}>
                      {/* Badge */}
                      <div className={`mb-1 flex ${isUser ? "justify-end" : "justify-start"}`}>
                        <span
                          className={`text-[11px] px-2 py-0.5 rounded-full border ${
                            isUser
                              ? "bg-white/5 border-white/10 text-white/70"
                              : "bg-purple-500/10 border-purple-400/20 text-purple-200/80"
                          }`}
                        >
                          {isUser ? "Sen" : "CINEMO AI"}
                        </span>
                      </div>

                      {/* Bubble */}
                      <div
                        className={`rounded-2xl px-4 py-3 text-sm sm:text-[15px] leading-relaxed shadow-lg ${
                          isUser
                            ? "bg-purple-500/20 border border-purple-500/30 text-purple-100"
                            : "bg-white/5 border border-white/10 text-white/85"
                        }`}
                        style={
                          isUser
                            ? { boxShadow: "0 10px 30px rgba(168,85,247,.18), 0 10px 26px rgba(236,72,153,.10)" }
                            : { boxShadow: "0 12px 30px rgba(0,0,0,.35)" }
                        }
                      >
                        <div className="whitespace-pre-wrap">{m.text}</div>

                        {/* Recommendations cards */}
                        {m.recommendations && m.recommendations.length > 0 && (
                          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {m.recommendations.map((rec, idx) => (
                              <div
                                key={idx}
                                className="rounded-xl border border-white/10 bg-black/30 p-3"
                              >
                                <div className="text-xs text-white/60">Öneri</div>
                                <div className="mt-0.5 font-medium text-white/90">
                                  {rec.title || "Film Önerisi"}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Loading typing bubble */}
              {loading && (
                <div className="flex justify-start">
                  <div className="max-w-[78%]">
                    <div className="mb-1 flex justify-start">
                      <span className="text-[11px] px-2 py-0.5 rounded-full border bg-purple-500/10 border-purple-400/20 text-purple-200/80">
                        CINEMO AI
                      </span>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-pink-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                        <span className="h-2 w-2 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                        <span className="h-2 w-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: "300ms" }} />
                        <span className="ml-2 text-xs text-white/55">Düşünüyorum…</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div ref={chatEndRef} />
            </div>

            {/* Composer */}
            <div className="relative border-t border-white/10 bg-black/35 p-4">
              <form onSubmit={send} className="flex items-end gap-3">
                <div className="relative flex-1">
                  <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-r from-purple-500/10 to-pink-500/10 blur-md opacity-60" />
                  <input
                    className="relative w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-4 pr-12 text-white/90 placeholder-white/40 outline-none
                               focus:border-white/20 focus:ring-2 focus:ring-purple-500/20 transition"
                    placeholder="What do you watch?"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    disabled={loading}
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-white/35">
                    ⏎
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || !message.trim()}
                  className="group relative grid h-[52px] w-[52px] place-items-center rounded-2xl
                             bg-gradient-to-r from-purple-600 to-pink-600
                             shadow-[0_10px_30px_rgba(168,85,247,.18)]
                             hover:shadow-[0_14px_38px_rgba(236,72,153,.16)]
                             hover:scale-[1.03] active:scale-95 transition
                             disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition"
                        style={{ boxShadow: "0 0 0 1px rgba(255,255,255,.08) inset" }} />
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="22" y1="2" x2="11" y2="13"></line>
                    <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                  </svg>
                </button>
              </form>

              <div className="mt-2 text-[11px] text-white/40">
                İpucu: “kısa” / “uzun”, “tek mekân”, “IMDb yüksek”, “Netflix tarzı” gibi filtreler yazabilirsin.
              </div>
            </div>
          </section>

          {/* Right panel: Quick prompts (modern/pro feeling) */}
          <aside className="relative overflow-hidden rounded-3xl border border-white/10 bg-black/35 backdrop-blur-xl shadow-2xl">
            <div className="p-6 border-b border-white/10 bg-black/25">
              <h2 className="text-lg font-bold">Hızlı Başlangıç</h2>
              <p className="mt-1 text-sm text-white/60">
                Tek tıkla örnek istekler gönder.
              </p>
            </div>

            <div className="p-6 space-y-3">
              {[
                "Gerilim seviyorum, ters köşe olsun.",
                "Romantik ama klişe olmasın.",
                "Kısa ve eğlenceli bir film öner.",
                "Uzun soluklu, sürükleyici bir dizi öner.",
                "Mind-bending bilim kurgu: Interstellar tarzı.",
              ].map((t) => (
                <button
                  key={t}
                  onClick={() => setMessage(t)}
                  className="w-full text-left rounded-2xl border border-white/10 bg-white/5 px-4 py-3
                             hover:bg-white/8 hover:border-white/15 transition"
                >
                  <div className="text-sm text-white/85">{t}</div>
                  <div className="mt-1 text-[11px] text-white/45">Mesaj kutusuna ekle</div>
                </button>
              ))}
            </div>
          </aside>
        </div>
      </main>

    </div>
    </div>
  );
}
