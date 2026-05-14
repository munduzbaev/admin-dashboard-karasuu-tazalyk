import React from "react";
import { motion } from "motion/react";
import { useNavigate } from "react-router";

const NotFound: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="relative h-screen w-screen bg-[#0b0b0b] text-[#f5f5f5] overflow-hidden flex flex-col justify-between p-8 md:p-12 select-none">
            {/* Grain Overlay */}
            <div className="fixed inset-[-50%] w-[200%] h-[200%] opacity-[0.04] pointer-events-none z-50 animate-[grain_8s_steps(10)_infinite] bg-[url('https://upload.wikimedia.org/wikipedia/commons/7/76/1k_filmgrain.png')]" />

            {/* Navigation */}
            <nav className="relative z-10 w-full flex justify-between items-end">
                <div className="text-xl font-bold tracking-tight uppercase">Tazalyk Kara-Suu</div>
                <div className="text-xl font-medium tracking-tight uppercase whitespace-nowrap opacity-60">©2026 by AN studio</div>
            </nav>

            {/* Main 404 */}
            <main className="relative z-10 flex-1 flex items-center justify-center">
                <div className="flex gap-[2vw] text-[30vw] font-black leading-[0.8] tracking-tighter">
                    {["4", "0", "4"].map((digit, i) => (
                        <motion.span
                            key={i}
                            initial={{ y: "-120vh", rotateZ: Math.random() * 20 - 10 }}
                            animate={{ y: 0, rotateZ: 0 }}
                            transition={{
                                delay: 0.4 + i * 0.15,
                                type: "spring",
                                damping: 12,
                                stiffness: 100,
                            }}
                            whileHover={{
                                scale: 1.1,
                                rotateX: Math.random() * 40 - 20,
                                rotateY: Math.random() * 40 - 20,
                                transition: { duration: 0.2 }
                            }}
                            className="inline-block perspective-[1000px]"
                        >
                            {digit}
                        </motion.span>
                    ))}
                </div>
            </main>

            {/* Footer */}
            <footer className="relative z-10 w-full flex flex-col items-center gap-8 text-center mb-4 md:mb-8">
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.2, duration: 1 }}
                    className="text-lg md:text-xl font-medium tracking-tight max-w-lg uppercase"
                >
                    Страница не найдена/ Баракча табылган жок.
                </motion.p>
                <motion.button
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                        delay: 1.5,
                        duration: 0.8,
                        type: "spring",
                        damping: 15,
                        stiffness: 100
                    }}
                    whileHover={{
                        y: -8,
                        transition: { type: "spring", stiffness: 400, damping: 10 }
                    }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => navigate("/")}
                    className="border-b-2 border-white pb-2 font-bold tracking-[0.2em] uppercase text-sm"
                >
                    Вернуться назад
                </motion.button>
            </footer>

            <style dangerouslySetInnerHTML={{
                __html: `
        @keyframes grain {
          0%, 100% { transform: translate(0, 0); }
          10% { transform: translate(-5%, -10%); }
          20% { transform: translate(-15%, 5%); }
          30% { transform: translate(7%, -25%); }
          40% { transform: translate(-5%, 25%); }
          50% { transform: translate(-15%, 10%); }
          60% { transform: translate(15%, 0%); }
          70% { transform: translate(0%, 15%); }
          80% { transform: translate(3%, 35%); }
          90% { transform: translate(-10%, 10%); }
        }
      `}} />
        </div>
    );
};

export default NotFound;
