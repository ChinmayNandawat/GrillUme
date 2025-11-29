import { motion } from "motion/react";

interface SkeletonProps {
  className?: string;
  variant?: "rect" | "circle" | "text";
}

export const Skeleton = ({ className = "", variant = "rect" }: SkeletonProps) => {
  const baseClasses = "bg-on-background/10 animate-pulse";
  const variantClasses = {
    rect: "rounded-lg",
    circle: "rounded-full",
    text: "rounded h-4 w-full",
  };

  return (
    <motion.div 
      initial={{ opacity: 0.5 }}
      animate={{ opacity: [0.5, 0.8, 0.5] }}
      transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
    />
  );
};
