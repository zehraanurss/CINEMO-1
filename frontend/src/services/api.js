import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
});

// Token ekle
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// --- AUTH ---
export const authAPI = {
  register: (data) => api.post("/auth/register", data),
  login: (data) => api.post("/auth/login", data),
  getMe: () => api.get("/auth/me"),
  updateProfile: (data) => api.put("/auth/profile", data),
};

// --- MOVIES & TV SERIES ---
export const moviesAPI = {
  getTrending: (page = 1) => api.get(`/movies/trending?page=${page}`),
  getPopular: (page = 1) => api.get(`/movies/popular?page=${page}`),
  getTopRated: (page = 1) => api.get(`/movies/top-rated?page=${page}`),
  getSeries: (page = 1) => api.get(`/movies/series?page=${page}`),
  
  // Film Detayı
  getDetails: (id) => api.get(`/movies/${id}`),

  // --- YENİ EKLENEN: Dizi Detayı ---
  // Backend'de bu rotanın (/tv/:id) tanımlı olması gerekir.
  getTvDetails: (id) => api.get(`/tv/${id}`), 
  
  search: (q) => api.get(`/movies/search`, { params: { q } }),
  
  getGenres: () => api.get("/genres"),

  getByGenre: (genreId, page = 1) => api.get(`/genre/${genreId}?page=${page}`),
  
};

// --- RECOMMENDATIONS ---
export const recommendationsAPI = {
  getHybrid: () => api.get("/recommendations/hybrid"),
  getContentBased: (movieId) => api.get(`/recommendations/content/${movieId}`),
  getGenreBased: (genres) => api.post("/recommendations/genre", { genres }),
  getPopular: () => api.get("/recommendations/popular"),
  
  // Film Benzerleri
  getSimilar: (id) => api.get(`/movies/${id}/similar`),

  // --- YENİ EKLENEN: Dizi Benzerleri ---
  // Backend'de bu rotanın (/tv/:id/similar veya recommendations) tanımlı olması gerekir.
  getTvSimilar: (id) => api.get(`/tv/${id}/similar`),
};

// services/api.js dosyasındaki userAPI objesine şunu ekle:

export const userAPI = {
  // ... diğerleri
  toggleWatchlist: (data) => api.post("/users/watchlist/toggle", data),
  toggleFavorite: (data) => api.post("/users/favorites/toggle", data), // <-- YENİ
  getProfile: () => api.get("/users/profile"), 
};
// --- AI (Gemini) ---
export const aiAPI = {
  recommend: (payload) => api.post("/ai/recommend", payload),
  updateProfile: (payload) => api.post("/ai/update-profile", payload),
  chat: (payload) => api.post("/ai/chat", payload),
  analyze: (payload) => api.post("/ai/analyze", payload),
  trends: () => api.get("/ai/trends"),
};

export default api;