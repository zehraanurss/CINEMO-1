import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { moviesAPI } from "../services/api";
import MovieCard from "../components/MovieCard";
import Loading from "../components/Loading";
import { Search, Frown, Film, Tv, Grid3X3, X } from "lucide-react";

const SearchPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const nav = useNavigate();

  const query = searchParams.get("q") || "";
  const typeParam = searchParams.get("type"); // "movie" | "tv" | null

  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  // UI state
  const [activeFilter, setActiveFilter] = useState("all"); // all | movie | tv
  const [searchTerm, setSearchTerm] = useState(query);

  // URL query değişince input da güncellensin
  useEffect(() => {
    setSearchTerm(query);
  }, [query]);

  // URL type param -> aktif filtre
  useEffect(() => {
    if (typeParam && ["movie", "tv"].includes(typeParam)) setActiveFilter(typeParam);
    else setActiveFilter("all");
  }, [typeParam]);

  // Arama sonuçlarını çek
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    fetchSearchResults(query);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const fetchSearchResults = async (q) => {
    setLoading(true);
    try {
      const res = await moviesAPI.search(q);

      // Backend'den gelen response formatını güvenli ele al
      const raw = res?.data?.success ? res.data.data : res?.data?.results || [];

      // Sadece movie/tv (person hariç)
      const cleaned = raw.filter((item) => item?.mediaType !== "person");

      setResults(cleaned);
    } catch (error) {
      console.error("Arama hatası:", error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  // Filtrelenmiş liste
  const filteredResults = useMemo(() => {
    if (activeFilter === "all") return results;
    return results.filter((item) => item.mediaType === activeFilter);
  }, [results, activeFilter]);

  // Sayılar
  const counts = useMemo(() => {
    const movieCount = results.filter((i) => i.mediaType === "movie").length;
    const tvCount = results.filter((i) => i.mediaType === "tv").length;
    return { all: results.length, movie: movieCount, tv: tvCount };
  }, [results]);

  // URL’i güncelleyen helper
  const updateUrl = (nextQ, nextType) => {
    const params = {};
    if (nextQ?.trim()) params.q = nextQ.trim();
    if (nextType && nextType !== "all") params.type = nextType;
    setSearchParams(params);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const nextQ = searchTerm.trim();
    if (!nextQ) return;

    // Mevcut filtreyi koruyarak arat
    updateUrl(nextQ, activeFilter);
  };

  const handleClear = () => {
    setSearchTerm("");
    // arama temizlenince sonuçlar da boşalsın
    setSearchParams({});
  };

  const onFilterChange = (next) => {
    setActiveFilter(next);

    // filtre değişince URL’e yaz (query varsa)
    if (query.trim()) updateUrl(query, next);
    else updateUrl(searchTerm, next);
  };

  if (loading) return <Loading />;

  return (
    <div className="min-h-screen bg-netflix-black text-white pt-24 px-4 md:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Sticky Search + Filters */}
        <div className="relative mb-8">
          {/* Başlık + mini bilgi */}
          <div className="flex flex-col gap-3">
            <div className="flex items-end justify-between gap-4">
              <h1 className="text-xl md:text-2xl font-bold flex items-center gap-2">
                <Search className="w-5 h-5 text-gray-400" />
                <span>
                  {query.trim() ? `"${query}" için sonuçlar` : "Arama"}
                </span>
              </h1>

              
            </div>

            {/* Arama kutusu */}
            <form onSubmit={handleSubmit} className="w-full">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Film veya dizi ara…"
                  className="w-full h-12 pl-12 pr-24 rounded-2xl bg-white/5 border border-white/10
                             focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-purple-500/40
                             text-white placeholder:text-gray-500"
                />
                {searchTerm?.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClear}
                    className="absolute right-12 top-1/2 -translate-y-1/2 p-2 rounded-full
                               hover:bg-white/10 text-gray-300"
                    aria-label="Temizle"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
                <button
                  type="submit"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-9 px-4 rounded-xl
                             bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-sm font-semibold
                             hover:opacity-95 active:opacity-90"
                >
                  Ara
                </button>
              </div>

              
            </form>

            {/* Filter Butonları */}
            {results.length > 0 && (
              <div className="flex flex-wrap gap-3 pt-1">
                <button
                  onClick={() => onFilterChange("all")}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                    activeFilter === "all"
                      ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-500/25"
                      : "bg-zinc-800/60 text-gray-300 hover:bg-zinc-700/80 hover:text-white border border-zinc-700/50"
                  }`}
                >
                  <Grid3X3 className="w-4 h-4" />
                  <span>Tümü</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs ${
                      activeFilter === "all" ? "bg-white/20" : "bg-zinc-700"
                    }`}
                  >
                    {counts.all}
                  </span>
                </button>

                <button
                  onClick={() => onFilterChange("movie")}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                    activeFilter === "movie"
                      ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-500/25"
                      : "bg-zinc-800/60 text-gray-300 hover:bg-zinc-700/80 hover:text-white border border-zinc-700/50"
                  }`}
                >
                  <Film className="w-4 h-4" />
                  <span>Filmler</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs ${
                      activeFilter === "movie" ? "bg-white/20" : "bg-zinc-700"
                    }`}
                  >
                    {counts.movie}
                  </span>
                </button>

                <button
                  onClick={() => onFilterChange("tv")}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                    activeFilter === "tv"
                      ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-500/25"
                      : "bg-zinc-800/60 text-gray-300 hover:bg-zinc-700/80 hover:text-white border border-zinc-700/50"
                  }`}
                >
                  <Tv className="w-4 h-4" />
                  <span>Diziler</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs ${
                      activeFilter === "tv" ? "bg-white/20" : "bg-zinc-700"
                    }`}
                  >
                    {counts.tv}
                  </span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="pt-6">
          {filteredResults.length > 0 ? (
            <>
              <p className="text-sm text-gray-400 mb-4">
                Gösterilen:{" "}
                <span className="text-white/90 font-semibold">
                  {filteredResults.length}
                </span>{" "}
                sonuç
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {filteredResults.map((item) => (
                  <div key={item.tmdbId} className="w-full">
                    <MovieCard movie={item} />
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 opacity-60">
              <Frown className="w-16 h-16 mb-4" />
              <p className="text-xl">
                {query.trim()
                  ? activeFilter === "all"
                    ? "Sonuç bulunamadı."
                    : `${activeFilter === "movie" ? "Film" : "Dizi"} bulunamadı.`
                  : "Aramaya başlayın."}
              </p>
              <p className="text-sm text-gray-400 mt-2 text-center max-w-md">
                {query.trim()
                  ? "Farklı anahtar kelimeler deneyin veya filtreyi değiştirin."
                  : "Yukarıdaki kutudan film/dizi adı yazıp Enter’a basın."}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchPage;
