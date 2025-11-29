import { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  variant?: "white" | "yellow" | "blue" | "red" | "green";
  hasShadow?: boolean;
}

export const Card = ({
  children,
  className = "",
  variant = "white",
  hasShadow = true,
}: CardProps) => {
  const variants = {
    white: "bg-white",
    yellow: "bg-primary-container",
    blue: "bg-comic-blue",
    red: "bg-punchy-red",
    green: "bg-toxic-green",
  };

  return (
    <div
      className={`
        comic-border overflow-hidden relative
        ${hasShadow ? "kinetic-shadow" : ""}
        ${variants[variant]}
        ${className}
      `}
    >
      {children}
    </div>
  );
};
