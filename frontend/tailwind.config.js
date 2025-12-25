/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    // Container ayarını buraya ekliyoruz (layout ortalaması için)
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        // Mevcut renklerin
        "netflix-red": "#E50914",
        "netflix-black": "#000000",
        "netflix-gray": "#141414",
        // YENİ EKLEDİĞİMİZ: Artık bg-[#1A1A1A] yerine bg-card-dark yazabileceksin
        "card-dark": "#1A1A1A",
      },
      // YENİ EKLEDİĞİMİZ: Artık z-[100] yerine z-modal yazabileceksin
      zIndex: {
        'modal': '100',
      },
      boxShadow: {
        glow: "0 0 30px rgba(229,9,20,0.35)",
      },
      // Animasyonları config içine de tanımlayabilirsin ama
      // senin CSS dosyan zaten hazır olduğu için orayı ellemiyoruz.
    },
  },
  plugins: [],
};