import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { moviesAPI, recommendationsAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";
import HeroSection from "../components/HeroSection";
import MovieRow from "../components/MovieRow";
import Loading from "../components/Loading";


import back1Image from "../assets/images/back1.png";
import back2Image from "../assets/images/back2.png";
import back3Image from "../assets/images/back3.png";

const Home = () => {
  const { isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(true);

  const [data, setData] = useState({
    hero: null,
    trending: [],
    popular: [],
    topRated: [],
    series: [],
    personalized: [],
  });

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  const fetchData = async () => {
    try {
      setLoading(true);

      const requests = [moviesAPI.getTrending()];

      if (isAuthenticated) {
        requests.push(moviesAPI.getPopular());
        requests.push(moviesAPI.getTopRated());
        requests.push(moviesAPI.getSeries());
        requests.push(recommendationsAPI.getHybrid());
      }

      const responses = await Promise.all(requests);
      const trendingData = responses[0].data.data;

      setData({
        hero: isAuthenticated ? trendingData[0] : null,
        trending: trendingData.slice(0, 21),
        popular: isAuthenticated ? responses[1]?.data.data.slice(0, 20) : [],
        topRated: isAuthenticated ? responses[2]?.data.data.slice(0, 20) : [],
        series: isAuthenticated ? responses[3]?.data.data.slice(0, 20) : [],
        personalized: isAuthenticated ? responses[4]?.data.data || [] : [],
      });
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const reasons = useMemo(
    () => [
      {
        title: "Advanced AI Analysis",
        desc: "Forget generic suggestions. Our AI analyzes your viewing history and ratings to provide spot-on recommendations.",
        icon: (
          <svg
            className="w-12 h-12 text-purple-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.5"
              d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"
            />
          </svg>
        ),
      },
      {
        title: "Discover by Mood",
        desc: "It's not just about genre; feelings matter. Find movies and shows that perfectly match your current vibe.",
        icon: (
          <svg
            className="w-12 h-12 text-purple-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.5"
              d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        ),
      },
      {
        title: "Smart Watchlists",
        desc: "Keep all your favorites from different platforms in one place. Create your ultimate watchlist.",
        icon: (
          <svg
            className="w-12 h-12 text-purple-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.5"
              d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
            />
          </svg>
        ),
      },
      {
        title: "End Decision Fatigue",
        desc: "Stop scrolling and start watching. Save the time you spend searching and find the perfect match immediately.",
        icon: (
          <svg
            className="w-12 h-12 text-purple-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.5"
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        ),
      },
    ],
    []
  );

  if (loading) return <Loading />;

  // --- MİSAFİR KULLANICI ---
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-black text-white overflow-x-hidden">
        {/* HERO */}
        <section className="relative w-full h-[88vh] md:h-[92vh] overflow-hidden">
          {/* Background: 3 images stacked */}
          <div className="absolute inset-0 z-0">
            <div className="absolute inset-0 flex flex-col">
              <div
                className="flex-1 w-full bg-cover bg-center"
                style={{ backgroundImage: `url(${back1Image})` }}
              />
              <div
                className="flex-1 w-full bg-cover bg-center"
                style={{ backgroundImage: `url(${back2Image})` }}
              />
              <div
                className="flex-1 w-full bg-cover bg-center"
                style={{ backgroundImage: `url(${back3Image})` }}
              />
            </div>

            {/* Stronger mask for readability + premium look */}
            <div className="absolute inset-0 bg-black/50" />
            <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/45 to-black" />
            <div className="absolute inset-0 [box-shadow:inset_0_-120px_120px_rgba(0,0,0,0.9)]" />

            {/* subtle glow */}
            <div className="absolute -top-24 left-1/2 h-72 w-[40rem] -translate-x-1/2 rounded-full bg-purple-500/10 blur-3xl" />
          </div>

          {/* Content */}
          <div className="relative z-10 h-full flex items-center">
            <div className="w-full max-w-6xl mx-auto px-4 md:px-10 pt-24 md:pt-28">
              <div className="max-w-3xl">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm text-white/80 backdrop-blur">
                  <span className="h-2 w-2 rounded-full bg-purple-400 shadow-[0_0_18px_rgba(168,85,247,0.9)]" />
                  AI-powered recommendations
                </div>

                <h1 className="mt-5 text-4xl md:text-6xl font-black leading-tight drop-shadow-xl">
                  Can't decide what to watch?
                </h1>

                <p className="mt-4 text-base md:text-2xl text-white/85 leading-relaxed drop-shadow">
                  Stop scrolling for hours. Let AI learn your taste and find the
                  perfect movie or TV show for you in seconds.
                </p>

                <div className="mt-8 flex flex-col sm:flex-row gap-3 sm:items-center">
                  <Link
                    to="/login"
                    className="group inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 px-7 py-3 text-lg font-bold shadow-lg shadow-purple-500/25 transition hover:scale-[1.02] hover:shadow-purple-500/35 focus:outline-none focus:ring-2 focus:ring-purple-500/60"
                  >
                    Start Exploring
                    <span className="text-2xl transition-transform group-hover:translate-x-0.5">
                      ›
                    </span>
                  </Link>

                  <div className="text-sm text-white/60">
                    No payment • Personalized picks • Fast onboarding
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Wave transition */}
          <div className="absolute bottom-0 left-0 w-full z-20">
            <svg
              viewBox="0 0 1440 120"
              className="block w-full"
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient id="g1" x1="0" x2="1">
                  <stop offset="0" stopColor="#7c3aed" stopOpacity="0.95" />
                  <stop offset="1" stopColor="#db2777" stopOpacity="0.95" />
                </linearGradient>
              </defs>
              <path
                d="M0,64 C240,124 480,124 720,72 C960,20 1200,20 1440,72 L1440,120 L0,120 Z"
                fill="url(#g1)"
                opacity="0.45"
              />
              <path
                d="M0,74 C240,124 480,124 720,78 C960,32 1200,32 1440,78 L1440,120 L0,120 Z"
                fill="#000000"
              />
            </svg>
          </div>
        </section>

        {/* CONTENT */}
        <section className="relative z-30 bg-black pb-20">
          <div className="max-w-7xl mx-auto px-4 md:px-16">
            {/* Trending */}
            <div className="-mt-12 md:-mt-16 mb-14">
              <MovieRow
                title="Trending Now"
                movies={data.trending?.slice(0, 10)}
                size="normal"
                isRanked={true}
                variant="ai-rank"
                gap="gap-4"
              />
            </div>

            {/* Reasons */}
            <div>
              <div className="flex items-end justify-between gap-4 mb-6">
                <h2 className="text-2xl md:text-3xl font-bold">
                  More Reasons to Join
                </h2>
                <div className="hidden md:block text-sm text-white/55">
                  Built for fast discovery
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {reasons.map((item, index) => (
                  <div
                    key={index}
                    className="group relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.08] to-white/[0.03] p-6 min-h-[240px] flex flex-col justify-between backdrop-blur"
                  >
                    <div>
                      <h3 className="text-xl font-bold">{item.title}</h3>
                      <p className="mt-2 text-sm leading-relaxed text-white/65">
                        {item.desc}
                      </p>
                    </div>

                    <div className="mt-6 flex items-end justify-between">
                     
                      <div className="opacity-90 group-hover:opacity-100 transition">
                        {item.icon}
                      </div>
                    </div>

                    {/* hover glow */}
                    <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="absolute -top-16 -right-16 h-56 w-56 rounded-full bg-purple-500/15 blur-3xl" />
                      <div className="absolute -bottom-20 -left-20 h-56 w-56 rounded-full bg-pink-500/10 blur-3xl" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom CTA */}
            <div className="mt-16 rounded-2xl border border-white/10 bg-gradient-to-r from-purple-600/15 to-pink-600/10 p-6 md:p-8">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h3 className="text-xl md:text-2xl font-bold">
                    Ready to get better recommendations?
                  </h3>
                  <p className="mt-1 text-white/65">
                    Create your profile and let the AI learn your taste.
                  </p>
                </div>
                <Link
                  to="/login"
                  className="inline-flex items-center justify-center rounded-xl bg-white text-black font-bold px-6 py-3 hover:opacity-90 transition"
                >
                  Join Now
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    );
  }

  // --- GİRİŞ YAPMIŞ KULLANICI ---
  return (
    <div className="min-h-screen bg-black text-white">
      <HeroSection movie={data.hero} />

     <div className="relative -mt-32 z-10 pb-20">
    <div className="max-w-screen-2xl mx-auto px-4 md:px-8 space-y-10">
        
        {data.personalized.length > 0 && (
        <MovieRow
            title="Sizin İçin Öneriler"
            movies={data.personalized}
            size="large"
            linkTo="/category/recommendations" // Öneriler için link
        />
        )}

        <MovieRow 
            title="Şu Anda Trend" 
            movies={data.trending} 
            size="large" 
            linkTo="/category/trending" // Trendler sayfası için
        />
        
      
        
        <MovieRow 
            title="En İyi Puanlananlar" 
            movies={data.topRated} 
            size="large" 
            linkTo="/category/top-rated" // En iyiler sayfası için
        />
        
        <MovieRow 
            title="Popüler Diziler" 
            movies={data.series} 
            size="large" 
            linkTo="/category/series" // Diziler sayfası için
        />
    </div>
</div>
    </div>
  );
};

export default Home;
