import { Link, useLocation } from "react-router-dom";
import { Bell, User, Menu, LogOut, Shield, X } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { Button } from "../ui/Button";

export const Navbar = () => {
  const location = useLocation();
  const {
    user,
    isAuthenticated,
    login,
    register,
    logout,
    isAuthPanelOpen,
    openAuthPanel,
    closeAuthPanel,
    authError,
    clearAuthError,
  } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navLinks = [
    { name: "HOME", path: "/" },
    { name: "UPLOAD", path: "/upload" },
    ...(isAuthenticated ? [{ name: "PROFILE", path: "/profile" }] : []),
  ];

  const resetForm = () => {
    setEmail("");
    setUsername("");
    setPassword("");
  };

  const handleAuthSubmit = async () => {
    if (isSubmitting) return;
    if (!email.trim() || !password.trim()) return;
    if (mode === "signup" && !username.trim()) return;

    setIsSubmitting(true);
    clearAuthError();
    try {
      if (mode === "signin") {
        await login(email.trim(), password);
      } else {
        await register(username.trim(), email.trim(), password);
      }
      resetForm();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <nav className="fixed top-0 w-full z-50 bg-background border-b-4 border-on-background shadow-[4px_4px_0px_0px_rgba(56,56,53,1)]">
        <div className="flex justify-between items-center w-full px-6 py-4 max-w-screen-2xl mx-auto">
          <div className="flex-1 flex justify-start">
            <Link to="/" className="text-3xl font-black italic tracking-tighter text-on-background drop-shadow-[2px_2px_0px_#ffd709] font-headline uppercase flex items-center group">
              <span>GRILL</span>
              <span className="text-secondary ml-1 mr-2 inline-block -rotate-12 group-hover:rotate-12 transition-transform duration-300 scale-125 drop-shadow-[2px_2px_0px_#000]">U</span>
              <span>ME</span>
            </Link>
          </div>

          <div className="hidden md:flex flex-1 justify-center gap-8 items-center font-headline font-black uppercase tracking-tighter">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`
                  bg-transparent transition-all duration-100 hover:skew-x-[-6deg] hover:scale-105
                  ${location.pathname === link.path
                    ? "text-primary border-b-4 border-primary pb-1"
                    : "text-on-background hover:text-secondary"}
                `}
              >
                {link.name}
              </Link>
            ))}
          </div>

          <div className="flex-1 flex justify-end items-center gap-4">
            <button className="text-primary hover:skew-x-[-6deg] hover:scale-110 transition-transform">
              <Bell size={24} strokeWidth={3} />
            </button>

            {isAuthenticated ? (
              <div className="hidden md:flex items-center gap-3">
                <span className="font-headline text-sm font-black uppercase tracking-widest text-on-background bg-primary-container px-3 py-1 comic-border">
                  {user?.username}
                </span>
                <Link to="/profile" className="text-primary hover:skew-x-[-6deg] hover:scale-110 transition-transform">
                  <User size={24} strokeWidth={3} />
                </Link>
                <button
                  onClick={logout}
                  className="text-secondary hover:scale-110 transition-transform"
                  aria-label="Logout"
                >
                  <LogOut size={24} strokeWidth={3} />
                </button>
              </div>
            ) : (
              <Button variant="secondary" className="hidden md:flex px-4 py-2" onClick={openAuthPanel}>
                SIGN IN
              </Button>
            )}

            <button 
              className="md:hidden text-on-background pl-4"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <Menu size={24} strokeWidth={3} />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="md:hidden fixed inset-0 z-[55] bg-on-background/50 backdrop-blur-sm transition-opacity"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Menu Panel */}
      <div 
        className={`md:hidden fixed top-0 right-0 bottom-0 z-[60] w-64 bg-background border-l-4 border-on-background shadow-[-4px_0px_0px_0px_rgba(56,56,53,1)] flex flex-col pt-20 pb-6 px-6 transform transition-transform duration-300 ease-in-out ${
          isMobileMenuOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="absolute top-4 right-6">
          <button
            className="text-on-background hover:scale-110 transition-transform"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <X size={28} strokeWidth={3} />
          </button>
        </div>
        
        <div className="flex flex-col gap-6 font-headline font-black uppercase tracking-tighter text-2xl mt-8">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              onClick={() => setIsMobileMenuOpen(false)}
              className={`
                transition-all duration-100 
                ${location.pathname === link.path
                  ? "text-primary border-b-4 border-primary pb-1 inline-block w-max"
                  : "text-on-background hover:text-secondary"}
              `}
            >
              {link.name}
            </Link>
          ))}
        </div>

        <div className="mt-auto border-t-4 border-on-background pt-6">
          {isAuthenticated ? (
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <span className="font-headline text-base font-black uppercase tracking-widest text-on-background bg-primary-container px-3 py-1 comic-border overflow-hidden text-ellipsis whitespace-nowrap max-w-full">
                  {user?.username}
                </span>
              </div>
              <div className="flex flex-col gap-4 mt-2">
                <Link 
                  to="/profile" 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-2 text-primary hover:skew-x-[-6deg] hover:scale-105 transition-transform font-headline font-black uppercase"
                >
                  <User size={24} strokeWidth={3} /> Profile
                </Link>
                <button
                  onClick={() => {
                    logout();
                    setIsMobileMenuOpen(false);
                  }}
                  className="flex items-center gap-2 text-secondary hover:scale-105 transition-transform font-headline font-black uppercase"
                >
                  <LogOut size={24} strokeWidth={3} /> Logout
                </button>
              </div>
            </div>
          ) : (
            <Button 
              variant="secondary" 
              className="w-full py-3 text-lg" 
              onClick={() => {
                openAuthPanel();
                setIsMobileMenuOpen(false);
              }}
            >
              SIGN IN
            </Button>
          )}
        </div>
      </div>

      {isAuthPanelOpen && (
        <div className="fixed inset-0 z-[60] flex items-start justify-end p-4 md:p-8 bg-on-background/50 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white border-4 border-on-background rounded-2xl shadow-[8px_8px_0px_0px_#383835] overflow-hidden">
            <div className="flex items-center justify-between bg-primary-container border-b-4 border-on-background px-5 py-3">
              <div className="flex items-center gap-2">
                <Shield size={20} />
                <h2 className="font-headline text-2xl font-black uppercase tracking-tighter">{mode === "signin" ? "Sign In" : "Create Account"}</h2>
              </div>
              <button className="text-on-background" onClick={closeAuthPanel} aria-label="Close auth panel">
                <X size={22} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="flex gap-2">
                <button
                  className={`flex-1 py-2 font-headline font-black uppercase comic-border ${mode === "signin" ? "bg-secondary text-white" : "bg-white"}`}
                  onClick={() => {
                    setMode("signin");
                    clearAuthError();
                  }}
                >
                  SIGN IN
                </button>
                <button
                  className={`flex-1 py-2 font-headline font-black uppercase comic-border ${mode === "signup" ? "bg-tertiary text-white" : "bg-white"}`}
                  onClick={() => {
                    setMode("signup");
                    clearAuthError();
                  }}
                >
                  SIGN UP
                </button>
              </div>

              {mode === "signup" && (
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest mb-1">Username</label>
                  <input
                    type="text"
                    className="w-full border-4 border-on-background p-3 font-bold"
                    value={username}
                    onChange={(event) => setUsername(event.target.value)}
                    placeholder="roastmaster01"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-black uppercase tracking-widest mb-1">Email</label>
                <input
                  type="email"
                  className="w-full border-4 border-on-background p-3 font-bold"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-widest mb-1">Password</label>
                <input
                  type="password"
                  className="w-full border-4 border-on-background p-3 font-bold"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="At least 8 characters"
                />
              </div>

              {authError && (
                <p className="bg-secondary-container border-2 border-on-background p-3 font-bold text-sm">{authError}</p>
              )}

              <Button
                variant={mode === "signin" ? "secondary" : "tertiary"}
                className="w-full"
                onClick={handleAuthSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? "PROCESSING..." : mode === "signin" ? "ENTER THE ARENA" : "CREATE MY ACCOUNT"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export const Footer = () => (
  <footer className="bg-on-background w-full mt-12 border-t-4 border-secondary">
    <div className="flex flex-col md:flex-row justify-between items-center w-full px-8 py-10 gap-4 max-w-screen-2xl mx-auto">
      <div className="text-xl font-black text-background italic font-headline flex items-center gap-1 group cursor-default">
        <span>GRILL</span>
        <span className="text-secondary -rotate-12 group-hover:rotate-180 transition-transform duration-300 scale-110">U</span>
        <span>ME</span>
      </div>
      <div className="text-primary-container font-body text-xs tracking-[0.05rem] uppercase font-bold">
        GRILLUME. MADE FOR FUN. TRY TO KEEP IT CIVIL, FOLKS.
      </div>
    </div>
  </footer>
);
