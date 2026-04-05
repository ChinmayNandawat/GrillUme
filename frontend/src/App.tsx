import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useState } from "react";
import { AnimatePresence } from "motion/react";
import { Footer, Navbar } from "./components/layouts/Navigation";
import {Home} from "./pages/Home";
import { Upload } from "./pages/Upload";
import { Profile } from "./pages/Profile";
import { RoastDetail } from "./pages/RoastDetail";
import { SplashOverlay } from "./components/overlays/SplashOverlay";


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
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/upload" element={<Upload />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/roast/:id" element={<RoastDetail />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </Router>
    </>
  );
}


