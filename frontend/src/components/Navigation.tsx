import { Link, useLocation } from "react-router-dom";
import { Bell, User, Menu } from "lucide-react";

export const Navbar = () => {
  const location = useLocation();

  const navLinks = [
    { name: "HOME", path: "/" },
    { name: "UPLOAD", path: "/upload" },
    { name: "PROFILE", path: "/profile" },
  ];

  return (
    <nav className="fixed top-0 w-full z-50 bg-background border-b-4 border-on-background shadow-[4px_4px_0px_0px_rgba(56,56,53,1)]">
      <div className="flex justify-between items-center w-full px-6 py-4 max-w-screen-2xl mx-auto">
        <div className="flex-1 flex justify-start">
          <Link to="/" className="text-3xl font-black italic tracking-tighter text-on-background drop-shadow-[2px_2px_0px_#ffd709] font-headline uppercase">
            GrillUme
          </Link>
        </div>

        <div className="hidden md:flex flex-1 justify-center gap-8 items-center font-headline font-black uppercase tracking-tighter">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`
                transition-all duration-100 hover:skew-x-[-6deg] hover:scale-105
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
          <Link to="/profile" className="text-primary hover:skew-x-[-6deg] hover:scale-110 transition-transform">
            <User size={24} strokeWidth={3} />
          </Link>
          <button className="md:hidden text-on-background">
            <Menu size={24} strokeWidth={3} />
          </button>
        </div>
      </div>
    </nav>
  );
}


export const Footer = () => (
  <footer className="bg-on-background w-full mt-12 border-t-4 border-secondary">
    <div className="flex flex-col md:flex-row justify-between items-center w-full px-8 py-10 gap-4 max-w-screen-2xl mx-auto">
      <div className="text-xl font-black text-background italic font-headline">ROASTUME</div>
      <div className="flex gap-8 font-body text-xs tracking-[0.05rem] uppercase font-bold text-background/80">
        <a href="#" className="hover:text-primary-container transition-colors">PRIVACY</a>
        <a href="#" className="hover:text-primary-container transition-colors">TERMS</a>
        <a href="#" className="hover:text-primary-container transition-colors">SUPPORT</a>
      </div>
      <div className="text-primary-container font-body text-xs tracking-[0.05rem] uppercase font-bold">
        GrillUme----+ Made for FUN, try to keep it constructive---- CN04
      </div>
    </div>
  </footer>
);