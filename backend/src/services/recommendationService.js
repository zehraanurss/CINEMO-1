const Movie = require('../models/Movie');
const User = require('../models/User');
const tmdbService = require('./tmdbService');

class RecommendationService {

  // --- Yardımcı: TMDB objesini normalize et ---
  normalizeTmdbItem(item) {
    if (!item) return null;
    return {
      ...item,
      tmdbId: item.tmdbId ?? item.id,               // TMDB'den id gelir
      mediaType: item.mediaType ?? item.media_type, // "movie" | "tv"
      genres: item.genres ?? item.genre_ids ?? [],  // bazen {id,name}, bazen [id]
      voteAverage: item.voteAverage ?? item.vote_average ?? 0,
      popularity: item.popularity ?? 0,
      releaseDate: item.releaseDate ?? item.release_date ?? item.first_air_date ?? null,
      title: item.title ?? item.name ?? '',
    };
  }

  // --- Yardımcı: watchlist item’ının genre id listesi ---
  getGenreIds(x) {
    if (!x?.genres) return [];
    // [{id,name}] veya [id]
    return x.genres.map(g => (typeof g === 'object' ? g.id : g)).filter(Boolean);
  }

  // --- Yardımcı: yıl çıkar ---
  getYear(x) {
    const d = x?.releaseDate || x?.release_date || x?.first_air_date;
    if (!d) return null;
    const y = parseInt(String(d).slice(0, 4), 10);
    return Number.isFinite(y) ? y : null;
  }

  // --- Kullanıcı profili oluştur (tür/keyword/cast + tercih metrikleri) ---
  buildUserProfile(fullWatchlist) {
    const genreW = new Map();
    const typeW = new Map();
    let voteSum = 0, voteN = 0;
    const years = [];

    for (const it of fullWatchlist) {
      const mediaType = it.mediaType || it.type || it.media_type || 'movie';
      typeW.set(mediaType, (typeW.get(mediaType) || 0) + 1);

      const gids = this.getGenreIds(it);
      for (const gid of gids) {
        genreW.set(gid, (genreW.get(gid) || 0) + 1);
      }

      const v = it.voteAverage ?? it.vote_average;
      if (typeof v === 'number' && v > 0) { voteSum += v; voteN++; }

      const y = this.getYear(it);
      if (y) years.push(y);
    }

    // top genre listesi
    const topGenres = [...genreW.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([gid]) => String(gid));

    // film/dizi tercih oranı
    const totalType = [...typeW.values()].reduce((a, b) => a + b, 0) || 1;
    const typePref = {};
    for (const [k, v] of typeW.entries()) typePref[k] = v / totalType;

    const avgVote = voteN ? (voteSum / voteN) : 6.5;
    const avgYear = years.length ? Math.round(years.reduce((a, b) => a + b, 0) / years.length) : null;

    return { topGenres, typePref, avgVote, avgYear };
  }

  // --- Seed seçimi: watchlist içinden en “güçlü” 5-10 içeriği al ---
  pickSeeds(fullWatchlist, seedCount = 8) {
    const scored = fullWatchlist.map(it => {
      const vote = it.voteAverage ?? it.vote_average ?? 0;
      const pop = it.popularity ?? 0;
      // basit ama etkili: oy + popülerlik karması
      const score = (vote * 2) + Math.log10(pop + 1);
      return { it, score };
    });

    return scored
      .sort((a, b) => b.score - a.score)
      .slice(0, seedCount)
      .map(x => x.it);
  }

  // --- Benzerlik skoru ---
  scoreCandidate(candidate, profile, fullWatchlist) {
    const cand = this.normalizeTmdbItem(candidate);
    if (!cand?.tmdbId) return -Infinity;

    const candGenres = new Set(
      (Array.isArray(cand.genres) ? cand.genres : []).map(g => (typeof g === 'object' ? g.id : g)).filter(Boolean).map(String)
    );

    // 1) Profil genre örtüşmesi
    let genreScore = 0;
    for (const g of profile.topGenres) {
      if (candGenres.has(String(g))) genreScore += 1;
    }
    // normalize (0..1)
    genreScore = profile.topGenres.length ? (genreScore / profile.topGenres.length) : 0;

    // 2) Watchlist’e yakınlık (maks genre Jaccard)
    let maxJaccard = 0;
    for (const w of fullWatchlist) {
      const wg = new Set(this.getGenreIds(w).map(String));
      const inter = [...candGenres].filter(x => wg.has(x)).length;
      const union = new Set([...candGenres, ...wg]).size || 1;
      const j = inter / union;
      if (j > maxJaccard) maxJaccard = j;
    }

    // 3) Puan yakınlığı
    const vote = cand.voteAverage || 0;
    const voteDiff = Math.abs(vote - (profile.avgVote || 6.5));
    const voteScore = Math.max(0, 1 - (voteDiff / 3)); // 0..1

    // 4) Yıl yakınlığı (varsa)
    let yearScore = 0.5;
    if (profile.avgYear) {
      const y = this.getYear(cand);
      if (y) {
        const yd = Math.abs(y - profile.avgYear);
        yearScore = Math.max(0, 1 - (yd / 12)); // 12 yıl üstü düşer
      }
    }

    // 5) Film/Dizi tercihi
    const tPref = profile.typePref?.[cand.mediaType] ?? 0.5;

    // 6) Popülerlik (çok abartmadan)
    const popScore = Math.log10((cand.popularity || 0) + 1) / 3; // kaba 0..~1

    // Ağırlıklar (en çok “benzerlik” istiyorsun -> maxJaccard + genre)
    const total =
      (0.35 * maxJaccard) +
      (0.25 * genreScore) +
      (0.15 * voteScore) +
      (0.10 * yearScore) +
      (0.10 * tPref) +
      (0.05 * popScore);

    return total;
  }

  // --- Basit çeşitlendirme: aynı türden çok yığılmayı azalt ---
  diversify(sorted, limit) {
    const result = [];
    const genreBucket = new Map();

    for (const item of sorted) {
      if (result.length >= limit) break;
      const gids = (item.genres || []).map(g => (typeof g === 'object' ? g.id : g)).filter(Boolean).map(String);

      // en baskın 1-2 genre üzerinden limit koy
      const key = gids.slice(0, 2).join('-') || 'none';
      const used = genreBucket.get(key) || 0;

      if (used >= 4) continue; // aynı bucket'tan max 4
      genreBucket.set(key, used + 1);

      result.push(item);
    }

    return result;
  }

  async getHybridRecommendations(userId, limit = 20) {
    try {
      const user = await User.findById(userId);
      if (!user?.watchlist?.length) {
        const trending = await tmdbService.getTrending?.() || [];
        return trending.slice(0, limit);
      }

      const watchlistIds = user.watchlist.map(m => m.tmdbId);

      // DB’den çektiğin veride mediaType/type mutlaka olsun (movie/tv)
      const fullWatchlist = await Movie.find({ tmdbId: { $in: watchlistIds } });

      if (!fullWatchlist.length) {
        const trending = await tmdbService.getTrending?.() || [];
        return trending.slice(0, limit);
      }

      const profile = this.buildUserProfile(fullWatchlist);
      const seeds = this.pickSeeds(fullWatchlist, 8);

      // 1) Seed bazlı recommendations + similar ile güçlü aday havuzu
      const candidateMap = new Map(); // key: `${mediaType}:${tmdbId}`

      for (const s of seeds) {
        const mediaType = s.mediaType || s.type || 'movie';
        const sid = s.tmdbId;

        // recommendations
        if (tmdbService.getRecommendations) {
          const recs = await tmdbService.getRecommendations(mediaType, sid);
          (recs || []).forEach(x => {
            const n = this.normalizeTmdbItem(x);
            if (!n?.tmdbId) return;
            const k = `${n.mediaType || mediaType}:${n.tmdbId}`;
            candidateMap.set(k, n);
          });
        }

        // similar (opsiyonel ama iyi çalışır)
        if (tmdbService.getSimilar) {
          const sim = await tmdbService.getSimilar(mediaType, sid);
          (sim || []).forEach(x => {
            const n = this.normalizeTmdbItem(x);
            if (!n?.tmdbId) return;
            const k = `${n.mediaType || mediaType}:${n.tmdbId}`;
            candidateMap.set(k, n);
          });
        }
      }

      // 2) Profil genre’ları ile discover (movie + tv)
      const topGenres = profile.topGenres.slice(0, 3).join(',');
      const minVote = Math.max(5.5, (profile.avgVote || 6.5) - 1.0);

      if (tmdbService.discover && topGenres) {
        const discoverMovie = await tmdbService.discover('movie', {
          with_genres: topGenres,
          'vote_average.gte': minVote,
          sort_by: 'popularity.desc',
          page: 1
        });
        (discoverMovie || []).forEach(x => {
          const n = this.normalizeTmdbItem({ ...x, media_type: 'movie' });
          const k = `movie:${n.tmdbId}`;
          candidateMap.set(k, n);
        });

        const discoverTv = await tmdbService.discover('tv', {
          with_genres: topGenres,
          'vote_average.gte': minVote,
          sort_by: 'popularity.desc',
          page: 1
        });
        (discoverTv || []).forEach(x => {
          const n = this.normalizeTmdbItem({ ...x, media_type: 'tv' });
          const k = `tv:${n.tmdbId}`;
          candidateMap.set(k, n);
        });
      }

      // Aday listesini oluştur
      let candidates = Array.from(candidateMap.values());

      // 3) Watchlist filtre + tekrar filtre
      const watchSet = new Set(watchlistIds.map(String));
      candidates = candidates.filter(x => !watchSet.has(String(x.tmdbId)));

      // 4) Skorla ve sırala
      const scored = candidates
        .map(c => ({ c, s: this.scoreCandidate(c, profile, fullWatchlist) }))
        .filter(x => Number.isFinite(x.s))
        .sort((a, b) => b.s - a.s)
        .map(x => x.c);

      // 5) Çeşitlendir + limit
      const finalList = this.diversify(scored, limit);

      // Yine yetmezse trend ile tamamla
      if (finalList.length < limit) {
        const trending = await tmdbService.getTrending?.() || [];
        const extra = (trending || [])
          .map(x => this.normalizeTmdbItem(x))
          .filter(x => x?.tmdbId && !watchSet.has(String(x.tmdbId)));

        const combined = [...finalList, ...extra];
        const uniq = new Map();
        combined.forEach(it => uniq.set(`${it.mediaType || 'movie'}:${it.tmdbId}`, it));
        return Array.from(uniq.values()).slice(0, limit);
      }

      return finalList.slice(0, limit);

    } catch (error) {
      console.error('Hybrid recommendation error:', error);
      const fallback = await tmdbService.getTrending?.() || [];
      return fallback.slice(0, limit);
    }
  }

  // Diğer metodlar kalabilir...
  
  // --- Diğer Metodlar Aynen Kalabilir ---
  async getContentBasedRecommendations(movieId, limit = 10) {
    // ... eski kodun ...
    try {
        const movie = await Movie.findOne({ tmdbId: movieId });
        if (!movie) return [];
        const genreNames = movie.genres.map(g => g.name);
        return await Movie.find({
            tmdbId: { $ne: movieId },
            'genres.name': { $in: genreNames },
            voteAverage: { $gte: movie.voteAverage - 1 }
        })
        .sort({ voteAverage: -1, popularity: -1 })
        .limit(limit);
    } catch (e) { return []; }
  }

  async getPopularRecommendations(limit = 10) {
     return await Movie.find().sort({ popularity: -1 }).limit(limit);
  }

  async getGenreBasedRecommendations(genres, limit = 10) {
     return await Movie.find({ 'genres.name': { $in: genres } }).limit(limit);
  }
}

module.exports = new RecommendationService();


