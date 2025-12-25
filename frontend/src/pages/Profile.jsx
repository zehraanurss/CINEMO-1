import { useEffect, useMemo, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { userAPI } from "../services/api";
import Loading from "../components/Loading";
import {
  User as UserIcon,
  Mail,
  Calendar,
  Trash2,
  Star,
  Crown,
  Search,
  ArrowUpDown,
  Sparkles,
  ChevronDown,
  Check,
  AlertTriangle,
  X,
  Heart, // YENİ EKLENDİ (Favori ikonu)
} from "lucide-react";

// Seçenekleri buraya sabit olarak tanımlayalım
const sortOptions = [
  { value: "recent", label: "Varsayılan" },
  { value: "rating", label: "Puan (Yüksek)" },
  { value: "title", label: "İsim (A-Z)" },
];

const Profile = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // İşlem state'leri
  const [removingId, setRemovingId] = useState(null);
  const [favoritingId, setFavoritingId] = useState(null); // Favori işlemi için loading

  // UI state
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("recent");
  
  // --- YENİ: TAB STATE (watchlist | favorites) ---
  const [activeTab, setActiveTab] = useState("watchlist"); 

  // --- DROPDOWN STATE ---
  const [isSortOpen, setIsSortOpen] = useState(false);
  const sortDropdownRef = useRef(null);

  // --- MODAL STATE ---
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [movieToDelete, setMovieToDelete] = useState(null);

  // Dışarı tıklandığında dropdown'ı kapatmak için efekt
  useEffect(() => {
    function handleClickOutside(event) {
      if (sortDropdownRef.current && !sortDropdownRef.current.contains(event.target)) {
        setIsSortOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const currentSortLabel = sortOptions.find(opt => opt.value === sort)?.label || "Sırala";

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await userAPI.getProfile();
      setUser(res.data.data);
    } catch (error) {
      console.error("Profil yüklenemedi:", error);
    } finally {
      setLoading(false);
    }
  };

  // --- FAVORİ İŞLEMİ (YENİ) ---
const handleToggleFavorite = async (movie) => {
    setFavoritingId(movie.tmdbId);
    try {
        const movieData = {
            tmdbId: movie.tmdbId,
            title: movie.title,
            posterPath: movie.posterPath,
            voteAverage: movie.voteAverage,
        };

        // Backend isteği
        await userAPI.toggleFavorite(movieData);

        // State güncelleme
        setUser((prev) => {
            // Burada da String çevirimi yaparak kontrol ediyoruz
            const isFav = prev.favorites?.some(f => String(f.tmdbId) === String(movie.tmdbId));
            let newFavorites;

            if (isFav) {
                // Varsa çıkar (String kontrolü ile)
                newFavorites = prev.favorites.filter(f => String(f.tmdbId) !== String(movie.tmdbId));
            } else {
                // Yoksa ekle
                // Eğer movie objesi eksikse diye movieData'yı eklemek daha güvenli olabilir,
                // ama movie objesi tam ise direkt onu ekleyelim.
                newFavorites = [...(prev.favorites || []), movie];
            }

            return { ...prev, favorites: newFavorites };
        });

    } catch (error) {
        console.error("Favori hatası:", error);
        // Hata durumunda kullanıcıya bildirim verilebilir
    } finally {
        setFavoritingId(null);
    }
  };

  // --- SİLME MODALI ---
  const openDeleteModal = (movie) => {
    setMovieToDelete(movie);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!movieToDelete) return;

    setRemovingId(movieToDelete.tmdbId);
    setDeleteModalOpen(false);

    try {
      const movieData = {
        tmdbId: movieToDelete.tmdbId,
        title: movieToDelete.title,
        posterPath: movieToDelete.posterPath,
        voteAverage: movieToDelete.voteAverage,
      };

      await userAPI.toggleWatchlist(movieData);

      setUser((prev) => ({
        ...prev,
        // Listeden silineni çıkar
        watchlist: prev.watchlist.filter((item) => item.tmdbId !== movieToDelete.tmdbId),
        // EĞER İSTENİRSE: Listeden silineni favorilerden de çıkar (Frontend tarafında)
        favorites: prev.favorites?.filter((item) => item.tmdbId !== movieToDelete.tmdbId) || []
      }));
    } catch (error) {
      console.error("Silme hatası:", error);
      alert("Bir hata oluştu.");
    } finally {
      setRemovingId(null);
      setMovieToDelete(null);
    }
  };

  const planLabel =
    user?.subscription?.plan === "premium" ? "Premium" : "Ücretsiz";

  const createdAtText = useMemo(() => {
    if (!user?.createdAt) return "-";
    return new Date(user.createdAt).toLocaleDateString("tr-TR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  }, [user?.createdAt]);

 // membershipDays yerine bunu kullanabilirsin:
const listQualityScore = useMemo(() => {
  const list = user?.watchlist || [];
  if (list.length === 0) return 0;

  // Tüm filmlerin puanlarını topla
  const totalScore = list.reduce((acc, curr) => acc + (curr.voteAverage || 0), 0);
  
  // Ortalamayı al
  return (totalScore / list.length).toFixed(1);
}, [user?.watchlist]);
  const watchlistCount = user?.watchlist?.length || 0;
  const favoritesCount = user?.favorites?.length || 0; // Favori sayısı

  // --- FİLTRELEME MANTIĞI GÜNCELLENDİ ---
  const filteredSorted = useMemo(() => {
    // Aktif tab'a göre listeyi seç
    const sourceList = activeTab === "watchlist" 
        ? (user?.watchlist || []) 
        : (user?.favorites || []);

    const list = Array.isArray(sourceList) ? [...sourceList] : [];
    const q = query.trim().toLowerCase();
    
    const filtered = q
      ? list.filter((m) => (m.title || "").toLowerCase().includes(q))
      : list;

    if (sort === "rating") {
      filtered.sort((a, b) => (b.voteAverage || 0) - (a.voteAverage || 0));
    } else if (sort === "title") {
      filtered.sort((a, b) => (a.title || "").localeCompare(b.title || "", "tr"));
    }
    return filtered;
  }, [user?.watchlist, user?.favorites, query, sort, activeTab]);

  if (loading) return <Loading />;

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white bg-netflix-black px-4">
        {/* ... Login redirect kısmı aynı ... */}
        <div className="max-w-md w-full text-center p-8 rounded-2xl border border-white/10 bg-white/5 backdrop-blur">
          <h2 className="text-2xl font-bold mb-2">Profil bulunamadı</h2>
          <p className="text-gray-400 mb-6">Kullanıcı bilgileri alınamadı.</p>
          <Link to="/login" className="px-6 py-3 rounded-xl bg-purple-600">Giriş Yap</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-white bg-netflix-black relative overflow-hidden">
      
      {/* Background Glow Effects */}
      <div className="fixed inset-0 pointer-events-none">
         <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-purple-600/10 blur-[120px] rounded-full opacity-40" />
         <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-pink-600/10 blur-[120px] rounded-full opacity-40" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-8 pt-24 md:pt-32 pb-12">
        
        {/* HEADER SECTION (AVATAR & INFO) - AYNI KALDI */}
        <div className="flex flex-col md:flex-row gap-8 items-center md:items-start">
           <div className="relative shrink-0">
             <div className="relative w-32 h-32 md:w-40 md:h-40 rounded-full bg-white/10 backdrop-blur-md border border-purple-400/50 flex items-center justify-center text-purple-300 shadow-2xl">
               <UserIcon className="w-16 h-16" />
             </div>
             <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 whitespace-nowrap">
                 <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold border bg-netflix-black border-white/20 text-gray-200 shadow-lg">
                    {user.subscription?.plan === "premium" ? <Crown className="w-3 h-3 text-yellow-400" /> : <Star className="w-3 h-3" />}
                    {planLabel}
                 </span>
             </div>
           </div>

           <div className="flex-1 w-full text-center md:text-left">
               <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white mb-2">{user.name}</h1>
               <div className="flex flex-wrap justify-center md:justify-start gap-4 text-sm text-gray-400">
                  <span className="flex items-center gap-2"><Mail className="w-4 h-4 text-pink-500" />{user.email}</span>
                  <span className="flex items-center gap-2"><Calendar className="w-4 h-4 text-purple-500" />Kayıt: {createdAtText}</span>
               </div>

               <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
                           <div className="p-5 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 transition group">
   <p className="text-gray-400 text-xs uppercase tracking-wider font-semibold group-hover:text-purple-400 transition-colors">
     İzleme Listem
   </p>
                     <p className="text-3xl font-bold mt-1 text-white">{watchlistCount}</p>
                  </div>
                           <div className="p-5 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 transition group">
   <p className="text-gray-400 text-xs uppercase tracking-wider font-semibold group-hover:text-purple-400 transition-colors">
     Favoriler
   </p>
                     <p className="text-3xl font-bold mt-1 text-white">{favoritesCount}</p>
                  </div>
                 <div className="p-5 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 transition group">
   <p className="text-gray-400 text-xs uppercase tracking-wider font-semibold group-hover:text-purple-400 transition-colors">
     Liste Kalitesi
   </p>
   
   <div className="flex items-center gap-3 mt-1">
     {/* Yıldız İkonu */}
     <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
     
     <div className="flex items-end gap-1">
       <p className="text-3xl font-bold text-white">
         {listQualityScore}
       </p>
       <span className="text-sm font-medium text-gray-500 mb-1">/ 10</span>
     </div>
   </div>
</div>
               </div>
           </div>
        </div>

        {/* DIVIDER */}
        <div className="my-12 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

        {/* --- TABS & FILTERS SECTION (GÜNCELLENDİ) --- */}
        <div>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
              
              {/* SOL TARAF: TABLAR */}
              <div className="flex items-center gap-6">
                <button 
                  onClick={() => setActiveTab("watchlist")}
                  className={`text-3xl font-bold flex items-center gap-3 transition-colors ${activeTab === "watchlist" ? "text-white" : "text-gray-600 hover:text-gray-400"}`}
                >
                  İzleme Listem
                  {activeTab === "watchlist" && (
                    <span className="text-lg font-normal text-gray-500 bg-white/5 px-3 py-1 rounded-full animate-in fade-in">
                        {watchlistCount}
                    </span>
                  )}
                </button>

                <div className="h-8 w-px bg-white/10" />

                <button 
                  onClick={() => setActiveTab("favorites")}
                  className={`text-3xl font-bold flex items-center gap-3 transition-colors ${activeTab === "favorites" ? "text-white" : "text-gray-600 hover:text-gray-400"}`}
                >
                  Favoriler
                  {activeTab === "favorites" && (
                     <span className="text-lg font-normal text-gray-500 bg-white/5 px-3 py-1 rounded-full animate-in fade-in">
                        {favoritesCount}
                    </span>
                  )}
                </button>
              </div>

              {/* SAĞ TARAF: FİLTRELER */}
              <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto z-50"> 
                
                <div className="relative flex-1 sm:w-64">
                   <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                   <input 
                     value={query}
                     onChange={(e) => setQuery(e.target.value)}
                     placeholder={`${activeTab === "watchlist" ? "İzleme listesinde" : "Favorilerde"} ara...`}
                     className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:border-purple-500/50 transition text-sm"
                   />
                </div>
                
                {/* Sort Dropdown */}
                <div className="relative" ref={sortDropdownRef}>
                  <button
                    onClick={() => setIsSortOpen(!isSortOpen)}
                    className={`
                      flex items-center justify-between w-full sm:w-52
                      bg-white/5 backdrop-blur-sm border border-white/10 
                      text-gray-200 text-sm font-medium
                      rounded-xl px-4 py-3 
                      transition-all duration-200
                      hover:bg-white/10 hover:border-purple-500/30
                      focus:outline-none focus:ring-2 focus:ring-purple-500/20
                      ${isSortOpen ? 'border-purple-500/50 bg-white/10' : ''}
                    `}
                  >
                    <div className="flex items-center gap-2">
                      <ArrowUpDown className="w-4 h-4 text-purple-400" />
                      <span>{currentSortLabel}</span>
                    </div>
                    <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${isSortOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {isSortOpen && (
                    <div className="absolute right-0 top-full mt-2 w-full bg-[#1A1A1A] border border-white/10 rounded-xl shadow-xl shadow-black/50 overflow-hidden z-50">
                      <div className="p-1">
                        {sortOptions.map((option) => (
                          <button
                            key={option.value}
                            onClick={() => { setSort(option.value); setIsSortOpen(false); }}
                            className={`flex items-center justify-between w-full px-3 py-2.5 text-sm rounded-lg transition-colors ${sort === option.value ? 'bg-purple-500/10 text-purple-400' : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'}`}
                          >
                            <span>{option.label}</span>
                            {sort === option.value && <Check className="w-3.5 h-3.5" />}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
          </div>

          {/* GRID */}
          {filteredSorted && filteredSorted.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
               {filteredSorted.map((movie) => {
                  // Bu film favorilerde mi kontrol et
                  const isFavorited = user.favorites?.some(f => String(f.tmdbId) === String(movie.tmdbId));

                  return (
                    <div key={movie.tmdbId} className="group relative">
                        {/* Poster Card */}
                        <Link to={`/movie/${movie.tmdbId}`} className="block relative aspect-[2/3] rounded-xl overflow-hidden bg-white/5 shadow-lg border border-white/5 group-hover:border-purple-500/30 transition duration-300">
                          {movie.posterPath ? (
                              <img 
                                src={`https://image.tmdb.org/t/p/w500${movie.posterPath}`}
                                alt={movie.title}
                                className="w-full h-full object-cover transition duration-500 group-hover:scale-110"
                              />
                          ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-500 text-xs">Poster Yok</div>
                          )}
                          
                          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                              <p className="font-bold text-white text-sm line-clamp-2">{movie.title}</p>
                              <div className="flex items-center gap-1 mt-1 text-yellow-400 text-xs font-medium">
                                <Star className="w-3 h-3 fill-yellow-400" />
                                {movie.voteAverage?.toFixed(1)}
                              </div>
                          </div>
                        </Link>

                        {/* --- ACTIONS BUTTONS --- */}
                        <div className="absolute -top-2 -right-2 flex flex-col gap-2 z-10 opacity-0 group-hover:opacity-100 transition-all duration-200">
                           
                           {/* 1. SİLME BUTONU (Sadece Watchlist sekmesinde görünür) */}
                           {activeTab === "watchlist" && (
                             <button
                               onClick={() => openDeleteModal(movie)}
                               disabled={removingId === movie.tmdbId}
                               className="p-2 rounded-full bg-neutral-900 border border-white/10 shadow-xl hover:bg-red-500 hover:border-red-500 hover:text-white text-gray-400 transition"
                               title="Listeden Kaldır"
                             >
                               {removingId === movie.tmdbId ? <div className="w-3 h-3 border-2 border-white/50 border-t-white rounded-full animate-spin"/> : <Trash2 className="w-3 h-3" />}
                             </button>
                           )}

                           {/* 2. FAVORİ BUTONU (Her iki sekmede de görünebilir) */}
                           <button
                             onClick={() => handleToggleFavorite(movie)}
                             disabled={favoritingId === movie.tmdbId}
                             className={`p-2 rounded-full border shadow-xl transition 
                               ${isFavorited 
                                 ? 'bg-pink-600 border-pink-500 text-white hover:bg-pink-700' 
                                 : 'bg-neutral-900 border-white/10 text-gray-400 hover:bg-pink-500 hover:border-pink-500 hover:text-white'
                               }`}
                             title={isFavorited ? "Favorilerden Çıkar" : "Favorilere Ekle"}
                           >
                              {favoritingId === movie.tmdbId ? (
                                <div className="w-3 h-3 border-2 border-white/50 border-t-white rounded-full animate-spin"/>
                              ) : (
                                <Heart className={`w-3 h-3 ${isFavorited ? 'fill-current' : ''}`} />
                              )}
                           </button>

                        </div>
                    </div>
                  );
               })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-24 text-center border-2 border-dashed border-white/5 rounded-3xl bg-white/[0.02]">
               <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                  <Sparkles className="w-8 h-8 text-gray-600" />
               </div>
               <h3 className="text-xl font-bold text-white">
                 {activeTab === "watchlist" ? "Listeniz boş görünüyor" : "Favorileriniz boş"}
               </h3>
               <p className="text-gray-400 mt-2 max-w-xs mx-auto">
                 {activeTab === "watchlist" 
                   ? "Henüz izleme listenize bir içerik eklemediniz." 
                   : "Henüz favori listenize bir içerik eklemediniz."}
               </p>
               <Link to="/" className="mt-6 px-6 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white font-medium transition">Keşfetmeye Başla</Link>
            </div>
          )}
        </div>

      </div>

      {/* --- DELETE CONFIRMATION MODAL --- */}
      {deleteModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity" onClick={() => setDeleteModalOpen(false)} />
          <div className="relative w-full max-w-sm bg-[#1A1A1A] border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
            <button onClick={() => setDeleteModalOpen(false)} className="absolute right-4 top-4 text-gray-400 hover:text-white transition"><X className="w-5 h-5" /></button>
            <div className="p-6 text-center">
              <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4 border border-red-500/20">
                <AlertTriangle className="w-6 h-6 text-red-500" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Silmek İstiyor musun?</h3>
              <p className="text-gray-400 text-sm mb-6">
                <span className="text-white font-medium">"{movieToDelete?.title}"</span> listenizden kaldırılacak.
              </p>
              <div className="flex gap-3 justify-center">
                <button onClick={() => setDeleteModalOpen(false)} className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white font-medium border border-white/5">İptal</button>
                <button onClick={confirmDelete} className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-medium shadow-lg shadow-purple-900/20">Evet, Kaldır</button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Profile;