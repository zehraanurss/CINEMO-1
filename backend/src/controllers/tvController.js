const axios = require("axios");

// TMDB API URL ve Key'i
const TMDB_URL = "https://api.themoviedb.org/3";
const TMDB_KEY = process.env.TMDB_API_KEY; // .env dosyanızda bu değişkenin olduğundan emin olun

// 1. Dizi Detaylarını Getir
exports.getTvDetails = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Axios ile doğrudan TMDB'ye istek atıyoruz
    const response = await axios.get(`${TMDB_URL}/tv/${id}`, {
      params: {
        api_key: TMDB_KEY,
        language: "tr-TR",
      },
    });

    res.status(200).json({
      success: true,
      data: response.data,
    });
  } catch (error) {
    console.error("TV Detay Hatası:", error.message);
    next(error);
  }
};

// 2. Benzer Dizileri Getir
exports.getTvSimilar = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const response = await axios.get(`${TMDB_URL}/tv/${id}/recommendations`, {
      params: {
        api_key: TMDB_KEY,
        language: "tr-TR",
        page: 1,
      },
    });

    res.status(200).json({
      success: true,
      data: response.data.results,
    });
  } catch (error) {
    console.error("TV Benzer Hatası:", error.message);
    next(error);
  }
};

// 3. Tüm Dizileri Getir (Keşfet Modu + Sayfalama)
exports.getAllTvShows = async (req, res, next) => {
  try {
    // Frontend'den gelen sayfa numarası (yoksa 1)
    const page = req.query.page || 1; 
    
    const response = await axios.get(`${TMDB_URL}/discover/tv`, {
      params: {
        api_key: TMDB_KEY,
        language: "tr-TR",
        sort_by: "popularity.desc", // En popülerden sırala
        page: page,
        include_adult: false,
        include_null_first_air_dates: false // Henüz yayın tarihi olmayanları getirme
      },
    });

    res.status(200).json({
      success: true,
      data: response.data.results,      // Dizi listesi
      page: response.data.page,         // Şu anki sayfa
      totalPages: response.data.total_pages // Toplam sayfa sayısı
    });
  } catch (error) {
    console.error("Tüm Diziler Hatası:", error.message);
    next(error);
  }
};