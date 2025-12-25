// backend/routes/tv.js Örneği:
const router = require("express").Router();
const { getTvDetails, getTvSimilar, getAllTvShows } = require("../controllers/tvController");

// ÖNCE Discover rotası (yoksa :id bunu ezer)
router.get("/discover", getAllTvShows);

// SONRA ID gerektiren rotalar
router.get("/:id", getTvDetails);
router.get("/:id/similar", getTvSimilar);

module.exports = router;