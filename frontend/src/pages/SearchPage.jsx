import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { moviesAPI } from "../services/api";
import MovieCard from "../components/MovieCard";
import Loading from "../components/Loading";
import { Search, Frown } from "lucide-react";

const SearchPage = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q"); // URL'den ?q=değer kısmını alır

  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (query) {
      fetchSearchResults();
    }
  }, [query]);

  const fetchSearchResults = async () => {
    setLoading(true);
    try {
      // API.js içindeki search fonksiyonunu kullanıyoruz
      const res = await moviesAPI.search(query);
      
      // Gelen veride person (kişi) olmayanları filtreleyelim (sadece film/dizi)
      const filtered = (res.data.results || []).filter(
        item => item.media_type !== "person"
      );
      
      setResults(filtered);
    } catch (error) {
      console.error("Arama hatası:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loading />;

  return (
    <div className="min-h-screen bg-netflix-black text-white pt-24 px-4 md:px-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl md:text-3xl font-bold mb-6 flex items-center gap-2">
          <Search className="w-6 h-6 text-gray-400" />
          <span>"{query}" için sonuçlar</span>
        </h1>

        {results.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {results.map((item) => (
              <div key={item.id} className="w-full">
                 <MovieCard movie={item} />
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 opacity-50">
            <Frown className="w-16 h-16 mb-4" />
            <p className="text-xl">Sonuç bulunamadı.</p>
            <p className="text-sm">Lütfen farklı anahtar kelimelerle tekrar deneyin.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchPage;