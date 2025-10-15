import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import carousel1 from "../assets/carousel1.jpg";
import carousel2 from "../assets/carousel2.jpg";
import carousel3 from "../assets/carousel3.jpg";
import carousel4 from "../assets/carousel4.jpg";

const images = [carousel1, carousel2, carousel3, carousel4];

const Hero = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Automatically change slide every 6 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }, 6000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div>
      <div className="relative w-full h-56 md:h-96 overflow-hidden rounded-lg">
        <AnimatePresence mode="wait">
          <motion.img
            key={currentIndex}
            src={images[currentIndex]}
            alt={`Slide ${currentIndex + 1}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
            className="absolute block w-full h-full object-cover"
          />
        </AnimatePresence>

        {/* Indicators */}
        <div className="absolute z-30 flex -translate-x-1/2 bottom-5 left-1/2 space-x-3">
          {images.map((_, i) => (
            <div
              key={i}
              className={`w-3 h-3 rounded-full ${
                i === currentIndex ? 'bg-white' : 'bg-gray-400'
              }`}
            ></div>
          ))}
        </div>
      </div>

      <motion.div
        className="text-blue-950 text-center font-extrabold text-4xl md:text-6xl leading-tight mb-6"
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
      >
        <h1>GIBSLIFE Brokers Insurance Portal</h1>
      </motion.div>
    </div>
  );
};

export default Hero;
