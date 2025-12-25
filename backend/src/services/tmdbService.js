const tmdbAxios = require("../config/tmdb");
const Movie = require("../models/Movie");

class TMDBService {
  // --- Helpers ---
  normalizeMediaType(item, fallback = null) {
    if (item?.media_type) return item.media_type;
    if (fallback) return fallback;
    // trending/all'da bazen media_type gelmez; first_air_date varsa tv kabul edelim
    return item?.first_air_date ? "tv" : "movie";
  }

  mapGenres(item) {
    // 1) Detay endpoint'i: genres: [{id,name}]
    if (Array.isArray(item?.genres) && item.genres.length) {
      return item.genres.map(g => ({ id: g.id, name: g.name || "" }));
    }
    // 2) Liste endpoint'i: genre_ids: [id]
    if (Array.isArray(item?.genre_ids) && item.genre_ids.length) {
      return item.genre_ids.map(id => ({ id, name: "" }));
    }
    return [];
  }

  mapListItemToDoc(m, forcedMediaType = null) {
    const mediaType = this.normalizeMediaType(m, forcedMediaType);

    return {
      tmdbId: m.id,
      title: m.title || m.name || "Untitled",
      overview: m.overview || "",
      posterPath: m.poster_path || "",
      backdropPath: m.backdrop_path || "",
      genres: this.mapGenres(m),
      releaseDate: m.release_date || m.first_air_date || "",
      mediaType,
      voteAverage: m.vote_average || 0,
      voteCount: m.vote_count || 0,
      popularity: m.popularity || 0,
      // runtime yalnız detayda dolacak
      runtime: m.runtime ?? null,
    };
  }

  async saveMoviesToDB(results = [], forcedMediaType = null) {
    if (!Array.isArray(results)) return [];

    const mapped = results
      .filter(Boolean)
      .map(m => this.mapListItemToDoc(m, forcedMediaType));

    // Upsert
    for (const item of mapped) {
      await Movie.updateOne(
        { tmdbId: item.tmdbId },
        { $set: item },
        { upsert: true }
      );
    }

    return mapped;
  }

  // --- LIST / FEED METODS (sayfalama var) ---

  // Trendler: film + dizi
  async getTrending(page = 1) {
    const res = await tmdbAxios.get("/trending/all/week", {
      params: { page, language: "tr-TR" }
    });
    return this.saveMoviesToDB(res.data.results);
  }

  // Popüler Filmler
  async getPopular(page = 1) {
    const res = await tmdbAxios.get("/movie/popular", {
      params: { page, language: "tr-TR" }
    });
    return this.saveMoviesToDB(res.data.results, "movie");
  }

  // En yüksek puanlı filmler
  async getTopRated(page = 1) {
    const res = await tmdbAxios.get("/movie/top_rated", {
      params: { page, language: "tr-TR" }
    });
    return this.saveMoviesToDB(res.data.results, "movie");
  }

  // Popüler Diziler
  async getSeries(page = 1) {
    const res = await tmdbAxios.get("/tv/popular", {
      params: { page, language: "tr-TR" }
    });
    return this.saveMoviesToDB(res.data.results, "tv");
  }

  // --- DETAILS / RECOMMENDATION ENDPOINTS ---

  // Tek fonksiyonla movie/tv detay
  async getDetails(mediaType, id) {
    const type = mediaType === "tv" ? "tv" : "movie";

    const res = await tmdbAxios.get(`/${type}/${id}`, {
      params: {
        language: "tr-TR",
        append_to_response: "keywords,credits"
      }
    });

    const m = res.data;

    const doc = {
      tmdbId: m.id,
      title: m.title || m.name || "Untitled",
      overview: m.overview || "",
      posterPath: m.poster_path || "",
      backdropPath: m.backdrop_path || "",
      genres: this.mapGenres(m), // burada genres[{id,name}] dolu olur
      releaseDate: m.release_date || m.first_air_date || "",
      mediaType: type,
      voteAverage: m.vote_average || 0,
      voteCount: m.vote_count || 0,
      popularity: m.popularity || 0,
      runtime: m.runtime ?? (Array.isArray(m.episode_run_time) ? (m.episode_run_time[0] ?? null) : null),

      // İstersen DB'de saklamak için aç:
      // keywords: (type === "movie" ? (m.keywords?.keywords || []) : (m.keywords?.results || []))
      //   .map(k => ({ id: k.id, name: k.name })),
      // castIds: (m.credits?.cast || []).slice(0, 10).map(c => c.id),
      // directorId: (() => {
      //   if (type === "movie") return (m.credits?.crew || []).find(x => x.job === "Director")?.id || null;
      //   // tv: created_by var, crew'de director her bölümde farklı olabilir
      //   return (m.created_by || [])[0]?.id || null;
      // })(),
    };

    await Movie.updateOne(
      { tmdbId: doc.tmdbId },
      { $set: doc },
      { upsert: true }
    );

    return doc;
  }

  // Geriye uyumluluk: eski movie detay
  async getMovieDetails(id) {
    return this.getDetails("movie", id);
  }

  // /{type}/{id}/recommendations
  async getRecommendations(mediaType, id, page = 1) {
    const type = mediaType === "tv" ? "tv" : "movie";

    try {
      const res = await tmdbAxios.get(`/${type}/${id}/recommendations`, {
        params: { page, language: "tr-TR" }
      });

      // recommendation results'ta media_type gelmeyebilir -> forced
      return this.saveMoviesToDB(res.data.results, type);
    } catch (error) {
      console.warn(`Recommendations error for ${type} ID ${id}:`, error.message);
      return [];
    }
  }

  // /{type}/{id}/similar
  async getSimilar(mediaType, id, page = 1) {
    const type = mediaType === "tv" ? "tv" : "movie";

    try {
      const res = await tmdbAxios.get(`/${type}/${id}/similar`, {
        params: { page, language: "tr-TR" }
      });

      return this.saveMoviesToDB(res.data.results, type);
    } catch (error) {
      console.warn(`Similar error for ${type} ID ${id}:`, error.message);
      return [];
    }
  }

  // Eski fonksiyon dursun
  async getSimilarMovies(id) {
    return this.getSimilar("movie", id);
  }

  // --- SEARCH ---

  async search(query, page = 1) {
    const [movieRes, tvRes] = await Promise.all([
      tmdbAxios.get("/search/movie", { params: { query, page, language: "tr-TR" } }),
      tmdbAxios.get("/search/tv", { params: { query, page, language: "tr-TR" } })
    ]);

    const movieResults = movieRes.data.results || [];
    const tvResults = tvRes.data.results || [];

    const moviesWithType = movieResults.map(m => ({ ...m, media_type: "movie" }));
    const tvWithType = tvResults.map(t => ({ ...t, media_type: "tv" }));

    const allResults = [...moviesWithType, ...tvWithType];

    allResults.sort((a, b) => (b.popularity || 0) - (a.popularity || 0));

    const topResults = allResults.slice(0, 20);

    await this.saveMoviesToDB(topResults);

    // API response formatı olarak da mapleyelim
    return topResults.map(item => this.mapListItemToDoc(item));
  }

  // --- GENRES ---

  async getGenres() {
    try {
      const [movieGenres, tvGenres] = await Promise.all([
        tmdbAxios.get("/genre/movie/list", { params: { language: "tr-TR" } }),
        tmdbAxios.get("/genre/tv/list", { params: { language: "tr-TR" } })
      ]);

      const allGenres = [
        ...(movieGenres.data.genres || []),
        ...(tvGenres.data.genres || [])
      ];

      const uniqueGenres = allGenres.reduce((acc, genre) => {
        if (!acc.find(g => g.id === genre.id)) acc.push(genre);
        return acc;
      }, []);

      return uniqueGenres;
    } catch (error) {
      console.error("Genre fetch error:", error);
      return [];
    }
  }

  // --- DISCOVER (GENEL) ---
  // RecommendationService’in kullanabilmesi için:
  // tmdbService.discover('movie', { with_genres:'..', 'vote_average.gte': 6, page:1 })
  async discover(mediaType, params = {}) {
    const type = mediaType === "tv" ? "tv" : "movie";
    try {
      const res = await tmdbAxios.get(`/discover/${type}`, {
        params: {
          language: "tr-TR",
          sort_by: "popularity.desc",
          page: 1,
          ...params
        }
      });
      return this.saveMoviesToDB(res.data.results, type);
    } catch (error) {
      console.warn(`Discover error for ${type}:`, error.message);
      return [];
    }
  }

  // Genre bazlı arama (senin eski fonksiyonun)
  async searchByGenre(genreId, mediaType = "all", opts = {}) {
    try {
      const { page = 1, minVote = null, sortBy = "popularity.desc" } = opts;

      let results = [];

      if (mediaType === "all" || mediaType === "movie") {
        const movieRes = await tmdbAxios.get("/discover/movie", {
          params: {
            with_genres: genreId,
            language: "tr-TR",
            sort_by: sortBy,
            page,
            ...(minVote != null ? { "vote_average.gte": minVote } : {})
          }
        });
        const moviesWithType = (movieRes.data.results || []).map(m => ({ ...m, media_type: "movie" }));
        results = [...results, ...moviesWithType];
      }

      if (mediaType === "all" || mediaType === "tv") {
        const tvRes = await tmdbAxios.get("/discover/tv", {
          params: {
            with_genres: genreId,
            language: "tr-TR",
            sort_by: sortBy,
            page,
            ...(minVote != null ? { "vote_average.gte": minVote } : {})
          }
        });
        const tvWithType = (tvRes.data.results || []).map(t => ({ ...t, media_type: "tv" }));
        results = [...results, ...tvWithType];
      }

      results.sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
      const topResults = results.slice(0, 20);

      await this.saveMoviesToDB(topResults);

      return topResults.map(item => this.mapListItemToDoc(item));
    } catch (error) {
      console.error("Genre search error:", error);
      return [];
    }
  }
}

module.exports = new TMDBService();
