import { motion } from "framer-motion";
import carLogo from "@assets/image_2026-01-09_142631252-removebg-preview_1767958016384.png";

interface LoadingPageProps {
  message?: string;
  fullScreen?: boolean;
}

export function LoadingPage({ message = "Loading...", fullScreen = true }: LoadingPageProps) {
  const containerClass = fullScreen 
    ? "min-h-screen flex items-center justify-center bg-background"
    : "flex items-center justify-center py-12";

  return (
    <div className={containerClass}>
      <div className="flex flex-col items-center gap-6">
        {/* Shaking Car Logo */}
        <motion.div
          animate={{
            x: [0, -10, 10, -10, 10, -5, 5, 0],
            rotate: [0, -5, 5, -5, 5, -2, 2, 0],
          }}
          transition={{
            duration: 0.6,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="relative"
        >
          <div className="w-24 h-24 md:w-32 md:h-32 bg-primary/10 rounded-full flex items-center justify-center p-4">
            <img 
              src={carLogo} 
              alt="MotorBuy" 
              className="w-full h-full object-contain"
            />
          </div>
        </motion.div>

        {/* Loading Dots */}
        <div className="flex items-center gap-2">
          {[0, 1, 2].map((index) => (
            <motion.div
              key={index}
              className="w-3 h-3 bg-primary rounded-full"
              animate={{
                y: [0, -10, 0],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 0.8,
                repeat: Infinity,
                delay: index * 0.2,
                ease: "easeInOut",
              }}
            />
          ))}
        </div>

        {/* Optional Message */}
        {message && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-sm text-muted-foreground font-medium"
          >
            {message}
          </motion.p>
        )}
      </div>
    </div>
  );
}

