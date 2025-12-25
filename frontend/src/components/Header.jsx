import { useState, useEffect } from "react"; 
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Search } from "lucide-react";

export default function Header() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const location = useLocation();

  const [isScrolled, setIsScrolled] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 0);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();

    const q = searchTerm.trim();
    if (!q) return;

    nav({
      pathname: "/search",
      search: `?q=${encodeURIComponent(q)}`
    });
  };

  const isLoginPage = location.pathname === "/login";
  const isAiPage = location.pathname === "/ai-recommendations";
  const isHomePage = location.pathname === "/"; 

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-50 transition-colors duration-500 ease-in-out
      ${isScrolled 
        ? "bg-black shadow-lg py-3" 
        : "bg-gradient-to-b from-black/90 via-black/60 to-transparent py-5" 
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between relative">

        {/* SOL GRUP */}
        <div className="flex items-center">
          <Link 
            to="/" 
            className={`
              font-black tracking-tighter italic z-50
              text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-red-500
              drop-shadow-[0_0_15px_rgba(168,85,247,0.5)] 
              hover:scale-105 transition-all duration-300 block
              ${isLoginPage ? "text-4xl md:text-5xl" : "text-3xl md:text-4xl"}
            `}
          >
            CINEMO
          </Link>

          {/* MENÜ + ARAMA */}
          {user && isHomePage && (
            <div className="hidden md:flex items-center gap-6 ml-10">
              <nav className="flex items-center gap-5 text-sm font-medium text-gray-300">
               
                <Link to="/tv" className="hover:text-white hover:scale-105 transition-all">Diziler</Link>
                <Link to="/movies" className="hover:text-white hover:scale-105 transition-all">Filmler</Link>
              </nav>

              <form onSubmit={handleSearch} className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-purple-400 transition-colors" />
                <input 
                  type="text" 
                  placeholder="Ara..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-zinc-800/60 border border-white/10 rounded-full py-1.5 pl-9 pr-4 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50 focus:bg-zinc-800 transition-all w-40 focus:w-64"
                />
              </form>
            </div>
          )}
        </div>

        {/* SAĞ MENÜ */}
        {!isLoginPage && (
          <nav className="flex items-center gap-6 z-50">
            {user && !isAiPage && (
              <Link 
                to="/ai-recommendations" 
                className="group flex items-center gap-2 text-gray-200 hover:text-purple-400 transition-colors font-medium"
              >
                <span className="text-xl group-hover:animate-pulse">✨</span>
                <span className="hidden lg:inline">CinemoAI </span>
              </Link>
            )}

            {user ? (
              <div className="flex items-center gap-4">
                <Link to="/profile" className="flex items-center gap-3 pl-1 pr-4 py-1 rounded-full bg-zinc-800/40 border border-white/5 hover:bg-zinc-800/80 transition-all group cursor-pointer">
                  <div className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-md border border-purple-400/50 flex items-center justify-center text-purple-300 group-hover:bg-purple-500/20 group-hover:text-purple-200 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="text-sm font-medium text-purple-100 tracking-wide group-hover:text-white transition-colors hidden sm:inline">
                    {user?.name}
                  </span>
                </Link>

                <button
                  onClick={() => { logout(); nav("/"); }}
                  className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-4 py-2 text-sm rounded-lg font-medium shadow-lg hover:shadow-[0_0_15px_rgba(147,51,234,0.5)] hover:scale-105 active:scale-95 transition-all duration-300 border border-white/10"
                >
                  Log Out
                </button>
              </div>
            ) : (
              <Link 
                to="/login" 
                className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-2 rounded-lg font-bold shadow-lg hover:shadow-[0_0_20px_rgba(147,51,234,0.5)] hover:scale-105 transition-all duration-300"
              >
                Log In
              </Link>
            )}
          </nav>
        )}
      </div>
    </header>
  );
}
