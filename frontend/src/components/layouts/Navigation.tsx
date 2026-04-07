import { Link, useLocation } from "react-router-dom";
import { Bell, User, Menu, LogOut, X, Shield } from "lucide-react";
import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { Button } from "../ui/Button";

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
    <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303C33.654 32.657 29.234 36 24 36c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.152 7.959 3.041l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/>
    <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 16.108 18.961 13 24 13c3.059 0 5.842 1.152 7.959 3.041l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"/>
    <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.143 35.091 26.715 36 24 36c-5.213 0-9.62-3.317-11.283-7.946l-6.52 5.025C9.514 39.556 16.227 44 24 44z"/>
    <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.084 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"/>
  </svg>
);

export const Navbar = () => {
  const location = useLocation();
  const {
    user,
    isAuthenticated,
    isAuthPanelOpen,
    openAuthPanel,
    closeAuthPanel,
    beginGoogleAuth,
    authError,
    clearAuthError,
    logout,
  } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);

  const navLinks = [
    { name: "HOME", path: "/" },
    { name: "UPLOAD", path: "/upload" },
    ...(isAuthenticated ? [{ name: "PROFILE", path: "/profile" }] : []),
  ];

  const handleSignIn = async () => {
    if (isSigningIn) return;
    setIsSigningIn(true);
    try {
      await beginGoogleAuth();
    } finally {
      setIsSigningIn(false);
    }
  };

  return (
    <>
      <nav className="fixed top-0 w-full z-50 bg-background border-b-4 border-on-background shadow-[4px_4px_0px_0px_rgba(56,56,53,1)]">
        <div className="flex justify-between items-center w-full px-6 py-4 max-w-screen-2xl mx-auto">
          <div className="flex-1 flex justify-start">
            <Link
              id="navbar-logo-anchor"
              to="/"
              className="text-3xl font-black italic tracking-tighter text-on-background drop-shadow-[2px_2px_0px_#ffd709] font-headline uppercase flex items-center group"
            >
              <span>GRILL</span>
              <span className="text-secondary ml-1 mr-2 inline-block -rotate-12 group-hover:rotate-12 transition-transform duration-300 scale-125 drop-shadow-[2px_2px_0px_#000]">
                U
              </span>
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
                  ${
                    location.pathname === link.path
                      ? "text-primary border-b-4 border-primary pb-1"
                      : "text-on-background hover:text-secondary"
                  }
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
                  onClick={() => {
                    void logout();
                  }}
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

            <button className="md:hidden text-on-background pl-4" onClick={() => setIsMobileMenuOpen(true)}>
              <Menu size={24} strokeWidth={3} />
            </button>
          </div>
        </div>
      </nav>

      {isMobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 z-[55] bg-on-background/50 backdrop-blur-sm transition-opacity"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

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
                ${
                  location.pathname === link.path
                    ? "text-primary border-b-4 border-primary pb-1 inline-block w-max"
                    : "text-on-background hover:text-secondary"
                }
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
                    void logout();
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
                <h2 className="font-headline text-2xl font-black uppercase tracking-tighter">Sign In</h2>
              </div>
              <button
                className="text-on-background"
                onClick={closeAuthPanel}
                aria-label="Close auth panel"
              >
                <X size={22} />
              </button>
            </div>

            <div className="p-5 space-y-4">

              {authError && (
                <p className="bg-secondary-container border-2 border-on-background p-3 font-bold text-sm">
                  {authError}
                </p>
              )}

              <Button
                variant="secondary"
                className="w-full"
                onClick={async () => {
                  clearAuthError();
                  await handleSignIn();
                }}
                disabled={isSigningIn}
              >
                <span className="inline-flex items-center justify-center gap-2">
                  {!isSigningIn && <GoogleIcon />}
                  <span>{isSigningIn ? "CONNECTING..." : "SIGN IN WITH GOOGLE"}</span>
                </span>
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export const Footer = () => (
  <footer className="bg-on-background w-full mt-8 border-t-4 border-secondary">
    <div className="w-full px-5 md:px-8 py-6 max-w-screen-2xl mx-auto">
      <div className="flex flex-col items-center justify-center text-center gap-2 md:gap-3 bg-on-background/40 rounded-2xl p-4 md:p-5">
        <div className="text-xl md:text-2xl font-black text-background italic font-headline flex items-center gap-1 group cursor-default">
          <span>GRILL</span>
          <span className="text-secondary -rotate-12 group-hover:rotate-180 transition-transform duration-300 scale-110">U</span>
          <span>ME</span>
        </div>
        <p className="max-w-2xl text-primary-container font-body text-xs md:text-sm tracking-[0.05rem] uppercase font-bold leading-snug">
          MADE FOR FUN. TRY TO KEEP IT CIVIL, FOLKS.
        </p>
      </div>
    </div>
  </footer>
);
