interface HeroProps {
  avatar?: string;
  level: string;
  title: string;
  subtitle: string;
  stats: { label: string; value: string; color?: string }[];
  className?: string;
}

export const Hero = ({ 
  avatar, 
  level, 
  title, 
  subtitle, 
  stats,
  className = "" 
}: HeroProps) => {
  return (
    <section className={`relative mb-12 overflow-hidden bg-primary-container p-8 comic-border kinetic-shadow rounded-sm ${className}`}>
      <div className="absolute top-0 left-0 w-full h-full kirby-krackle opacity-10"></div>
      <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
        <div className="relative flex-shrink-0">
          <div className="w-24 h-24 comic-border bg-white flex items-center justify-center p-1">
            {avatar ? (
              <img 
                src={avatar} 
                alt={title} 
                className="w-full h-full object-cover grayscale contrast-125"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-full h-full bg-surface-container-high" />
            )}
          </div>
          <div className="absolute -bottom-2 -right-2 bg-secondary text-white px-3 py-1 comic-border font-headline text-xs italic font-black">
            {level}
          </div>
        </div>
        <div className="text-center md:text-left flex-1">
          <h1 className="font-headline text-4xl lg:text-5xl font-black text-on-background uppercase tracking-tighter leading-none mb-2 drop-shadow-[2px_2px_0px_#fff]">
            {title}
          </h1>
          <p className="font-body font-bold text-on-background uppercase text-xs tracking-widest opacity-80">
            {subtitle}
          </p>
        </div>
        <div className="flex gap-4">
          {stats.map((stat, i) => (
            <div key={i} className="bg-white p-4 comic-border kinetic-shadow text-center min-w-[100px]">
              <div className={`text-2xl font-black font-headline ${stat.color || "text-on-background"}`}>
                {stat.value}
              </div>
              <div className="text-[10px] font-bold uppercase opacity-60">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
