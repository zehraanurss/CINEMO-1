import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Header from "./components/Header";
import Home from "./pages/Home";
import Login from "./pages/Login";
import MovieDetail from "./pages/MovieDetail";
import AIRecommendation from "./components/AIRecommendation";
import Profile from "./pages/Profile"; 
import Loading from "./components/Loading";
import CategoryPage from './pages/CategoryPage';
import SearchPage from "./pages/SearchPage";


const AppRoutes = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <Loading />;
  }

  return (
    <>
      <Header />

      <Routes>
        {/* Public Routes */}
        <Route
          path="/login"
          element={isAuthenticated ? <Navigate to="/" /> : <Login />}
        />

        {/* Public Home */}
        <Route path="/" element={<Home />} />

        {/* Category Page */}
        <Route path="/category/:type" element={<CategoryPage />} />

        {/* Public Movie Detail */}
        <Route path="/movie/:id" element={<MovieDetail />} />

        {/* --- YENİ EKLENECEK KISIM: DİZİ DETAYI --- */}
        {/* /tv/12345 adresine gidildiğinde de MovieDetail sayfasını açar */}
        <Route path="/tv/:id" element={<MovieDetail />} />
        {/* ----------------------------------------- */}

        {/* Public AI Page */}
        <Route path="/ai-recommendations" element={<AIRecommendation />} />

        <Route path="/search" element={<SearchPage />} />
        
        <Route 
          path="/profile" 
          element={isAuthenticated ? <Profile /> : <Navigate to="/login" />} 
        />
        
        {/* 404 */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </>
  );
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="bg-netflix-black min-h-screen text-white">
          <AppRoutes />
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;