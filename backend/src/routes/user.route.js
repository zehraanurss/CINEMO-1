const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth"); // Auth middleware'in

// Controller importlarını güncelle (toggleFavorite'i ekle)
const { 
  getProfile, 
  toggleWatchlist, 
  toggleFavorite
} = require("../controllers/user.controller");

router.get("/profile", protect, getProfile);
router.post("/watchlist/toggle", protect, toggleWatchlist);

// --- YENİ ROTA ---
router.post("/favorites/toggle", protect, toggleFavorite);
// -----------------

module.exports = router;