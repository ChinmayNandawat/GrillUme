import { motion } from "motion/react";
import { ReactNode, MouseEvent } from "react";

interface ButtonProps {
  children: ReactNode;
  variant?: "primary" | "secondary" | "tertiary" | "outline";
  className?: string;
  onClick?: (event: MouseEvent<HTMLButtonElement>) => void;
  type?: "button" | "submit";
  icon?: ReactNode;
  disabled?: boolean;
  ariaLabel?: string;
}

export const Button = ({
  children,
  variant = "primary",
  className = "",
  onClick,
  type = "button",
  icon,
  disabled = false,
  ariaLabel,
}: ButtonProps) => {
  const variants = {
    primary: "bg-primary-container text-on-background",
    secondary: "bg-secondary text-white",
    tertiary: "bg-tertiary text-white",
    outline: "bg-white text-on-background",
  };

  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      whileHover={disabled ? {} : { scale: 1.02, x: 2, y: 2 }}
      whileTap={disabled ? {} : { scale: 0.98, x: 4, y: 4 }}
      className={`
        comic-border kinetic-shadow 
        px-6 py-3 font-headline font-black uppercase italic tracking-tighter
        flex items-center justify-center gap-2
        transition-all duration-100
        hover:shadow-none
        ${disabled ? "opacity-50 cursor-not-allowed grayscale" : ""}
        ${variants[variant]}
        ${className}
      `}
    >
      {icon && <span className="flex items-center">{icon}</span>}
      {children}
    </motion.button>
  );
};
