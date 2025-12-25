const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true, select: false },

    avatar: {
      type: String,
      default:
        "https://ui-avatars.com/api/?background=E50914&color=fff&name=User",
    },

    preferences: {
      genres: { type: [String], default: [] },
      languages: { type: [String], default: [] },
      adult: { type: Boolean, default: false },
    },

    // AI ile ilgili tercihler ve geçmiş
    aiPreferences: {
      genres: { type: [String], default: [] },
      languages: { type: [String], default: [] },
    },
    
    // --- YENİ EKLENEN KISIM: WATCHLIST (Listem) ---
    // watchHistory'den farkı: Henüz izlenmemiş, kenara ayrılmış olmasıdır.
    watchlist: {
      type: [
        {
          tmdbId: { type: Number, required: true }, // Diğer alanlarla uyumlu olması için Number yaptık
          title: { type: String },
          posterPath: { type: String },
          voteAverage: { type: Number },
          addedAt: { type: Date, default: Date.now },
        },
      ],
      default: [],
    },
    // --- YENİ EKLENECEK KISIM: FAVORİLER ---
  favorites: [
    {
      tmdbId: { type: String, required: true },
      title: String,
      posterPath: String,
      voteAverage: Number,
      addedAt: { type: Date, default: Date.now },
    },
  ],
  // ---------------------------------------
    // Kullanıcının izleme geçmişi ve değerlendirmeleri
    watchHistory: {
      type: [
        {
          tmdbId: Number,
          title: String,
          watchedAt: Date,
        },
      ],
      default: [],
    },

    ratings: {
      type: [
        {
          tmdbId: Number,
          rating: Number,
          createdAt: { type: Date, default: Date.now },
        },
      ],
      default: [],
    },

    // Son aramalar / recent searches (AI sorgularında bulunan filmler)
    recentSearches: {
      type: [
        {
          tmdbId: Number,
          title: String,
          addedAt: { type: Date, default: Date.now },
        },
      ],
      default: [],
    },

    subscription: {
      plan: { type: String, default: "free" }, // free | premium
      expiresAt: { type: Date, default: null },
    },
  },
  { timestamps: true }
);

// Şifre hash
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Şifre karşılaştır
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("User", userSchema);
