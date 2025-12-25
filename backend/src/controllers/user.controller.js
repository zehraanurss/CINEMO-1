const User = require("../models/User");

// --- 1. FONKSİYON: Profil Getir (Watchlist'i görmek için lazım) ---
exports.getProfile = async (req, res) => {
  try {
    // req.user.id, auth middleware'den (verifyToken) gelir
    const user = await User.findById(req.user.id).select("-password"); // Şifreyi gönderme

    if (!user) {
      return res.status(404).json({ success: false, message: "Kullanıcı bulunamadı" });
    }

    res.status(200).json({
      success: true,
      data: user, // İçinde watchlist array'i de olacak
    });
  } catch (error) {
    console.error("Profil hatası:", error);
    res.status(500).json({ success: false, message: "Profil hatası" });
  }
};

/// --- YENİ FONKSİYON: FAVORİ EKLE/ÇIKAR ---
exports.toggleFavorite = async (req, res, next) => {
  try {
    const { tmdbId, title, posterPath, voteAverage } = req.body;
    const userId = req.user.id; // Auth middleware'den gelir

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ success: false, message: "Kullanıcı bulunamadı" });
    }

    // Favorilerde var mı kontrol et
    const existingIndex = user.favorites.findIndex(
      (item) => item.tmdbId.toString() === tmdbId.toString()
    );

    if (existingIndex !== -1) {
      // Varsa çıkar
      user.favorites.splice(existingIndex, 1);
      await user.save();
      return res.status(200).json({ success: true, message: "Favorilerden çıkarıldı", favorites: user.favorites });
    } else {
      // Yoksa ekle
      // (İsteğe bağlı: Eklenecek film watchlist'te var mı diye kontrol edebilirsin, 
      // ama frontend zaten bunu engelliyor.)
      user.favorites.push({ tmdbId, title, posterPath, voteAverage });
      await user.save();
      return res.status(200).json({ success: true, message: "Favorilere eklendi", favorites: user.favorites });
    }
  } catch (error) {
    next(error);
  }
};

// --- MEVCUT TOGGLE WATCHLIST GÜNCELLENMELİ ---
// Mantık: Eğer izleme listesinden siliyorsak, favorilerden de silmeliyiz.
exports.toggleWatchlist = async (req, res, next) => {
  try {
    const { tmdbId, title, posterPath, voteAverage } = req.body;
    const userId = req.user.id;

    const user = await User.findById(userId);

    const existingIndex = user.watchlist.findIndex(
      (item) => item.tmdbId.toString() === tmdbId.toString()
    );

    if (existingIndex !== -1) {
      // LİSTEDEN ÇIKARMA İŞLEMİ
      user.watchlist.splice(existingIndex, 1);

      // --- EKSTRA GÜVENLİK ---
      // Eğer listeden çıkıyorsa, favorilerden de otomatik çıkaralım
      const favIndex = user.favorites.findIndex(f => f.tmdbId.toString() === tmdbId.toString());
      if (favIndex !== -1) {
        user.favorites.splice(favIndex, 1);
      }
      // -----------------------

      await user.save();
      return res.status(200).json({ success: true, message: "Listeden çıkarıldı" });
    } else {
      // LİSTEYE EKLEME İŞLEMİ
      user.watchlist.push({ tmdbId, title, posterPath, voteAverage });
      await user.save();
      return res.status(200).json({ success: true, message: "Listeye eklendi" });
    }
  } catch (error) {
    next(error);
  }
};