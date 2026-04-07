import { BrowserRouter as Router, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { useState } from "react";
import { AnimatePresence } from "motion/react";
import { Footer, Navbar } from "./components/layouts/Navigation.tsx";
import { Home } from "./pages/Home.tsx";
import { Upload } from "./pages/Upload.tsx";
import { Profile } from "./pages/Profile.tsx";
import { RoastDetail } from "./pages/RoastDetail.tsx";
import { SplashOverlay } from "./components/overlays/SplashOverlay.tsx";
import { useAuth } from "./context/AuthContext.tsx";
import { AuthCallback } from "./pages/AuthCallback.tsx";
import { UsernameSetup } from "./pages/UsernameSetup.tsx";
import { SignInEntry } from "./pages/SignInEntry";

const GuardedRoutes = () => {
  const { isAuthenticated, onboardingRequired, isAuthLoading } = useAuth();
  const location = useLocation();
  const isCallbackRoute = location.pathname === "/auth/callback";
  const isSetupRoute = location.pathname === "/setup-username";
  const isSignInRoute = location.pathname === "/signin";

  if (isAuthLoading && !isCallbackRoute) {
    return (
      <div className="max-w-4xl mx-auto py-20 text-center">
        <p className="font-headline font-black uppercase tracking-wider">Preparing the arena...</p>
      </div>
    );
  }

  if (onboardingRequired && !isSetupRoute && !isCallbackRoute) {
    return <Navigate to="/setup-username" replace />;
  }

  if (isAuthenticated && (isCallbackRoute || isSetupRoute || isSignInRoute)) {
    return <Navigate to="/" replace />;
  }

  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/signin" element={<SignInEntry />} />
      <Route path="/upload" element={<Upload />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/roast/:id" element={<RoastDetail />} />
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route path="/setup-username" element={<UsernameSetup />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};


export default function App() {
  const [isSplashVisible, setIsSplashVisible] = useState(true);
  const [isAppRevealed, setIsAppRevealed] = useState(false);

  return (
    <>
      <AnimatePresence>
        {isSplashVisible && (
          <SplashOverlay
            onRevealApp={() => setIsAppRevealed(true)}
            onComplete={() => setIsSplashVisible(false)}
          />
        )}
      </AnimatePresence>
      <Router>
        <div
          className={`min-h-screen flex flex-col bg-background selection:bg-primary-container selection:text-on-primary-container transition-opacity duration-300 ${
            isAppRevealed ? "opacity-100" : "opacity-0 pointer-events-none select-none"
          }`}
        >
          <Navbar />
          <main className="flex-1 pt-24 pb-12 px-4 md:px-8 lg:px-10">
            <GuardedRoutes />
          </main>
          <Footer />
        </div>
      </Router>
    </>
  );
}


