import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { FaInstagram, FaLinkedinIn, FaTelegramPlane } from 'react-icons/fa';

export interface FloatingSocialLinksProps {
  instagramUrl?: string;
  linkedinUrl?: string;
  telegramUrl?: string;
}

export function FloatingSocialLinks({
  instagramUrl = "https://instagram.com/weventurehub",
  linkedinUrl = "https://linkedin.com/company/weventurehub",
  telegramUrl = "https://t.me/weventurehub"
}: FloatingSocialLinksProps) {
  const [hoveredPlatform, setHoveredPlatform] = useState<'instagram' | 'linkedin' | 'telegram' | null>(null);

  const platforms = [
    {
      id: 'linkedin' as const,
      name: 'LinkedIn',
      url: linkedinUrl,
      icon: FaLinkedinIn,
      color: '#0A66C2',
      glow: 'rgba(10, 102, 194, 0.4)',
      ariaLabel: 'Open WeVentureHub LinkedIn page in a new tab',
    },
    {
      id: 'instagram' as const,
      name: 'Instagram',
      url: instagramUrl,
      icon: FaInstagram,
      color: '#E1306C',
      glow: 'rgba(225, 48, 108, 0.4)',
      ariaLabel: 'Open WeVentureHub Instagram profile in a new tab',
    },
    {
      id: 'telegram' as const,
      name: 'Telegram',
      url: telegramUrl,
      icon: FaTelegramPlane,
      color: '#0088CC',
      glow: 'rgba(0, 136, 204, 0.4)',
      ariaLabel: 'Open WeVentureHub Telegram channel in a new tab',
    },
  ];

  // Container variants for the staggered entrance animation when page loads
  const containerVariants = {
    hidden: { opacity: 0, x: 50 },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.3,
      },
    },
  };

  // Individual item variants
  const itemVariants = {
    hidden: { opacity: 0, scale: 0.7, x: 30 },
    visible: {
      opacity: 1,
      scale: 1,
      x: 0,
      transition: { type: 'spring', stiffness: 260, damping: 20 },
    },
  };

  return (
    <motion.div
      className="fixed z-40 flex flex-col gap-3 md:gap-4 bottom-6 right-6 md:bottom-auto md:top-1/2 md:-translate-y-1/2 md:right-5 items-end pointer-events-none"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {platforms.map((platform) => {
        const Icon = platform.icon as any;
        const isHovered = hoveredPlatform === platform.id;

        return (
          <motion.div
            key={platform.id}
            className="relative flex items-center justify-end pointer-events-auto"
            variants={itemVariants}
          >
            {/* Elegant Tooltip - Desktop Only */}
            <AnimatePresence>
              {isHovered && (
                <motion.div
                  className="hidden md:flex absolute right-[68px] items-center gap-2 bg-white text-gray-800 text-xs font-semibold py-1.5 px-3 rounded-lg shadow-lg border border-gray-100 whitespace-nowrap pointer-events-none"
                  initial={{ opacity: 0, x: 15, scale: 0.95 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: 15, scale: 0.95 }}
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                >
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: platform.color }}
                  />
                  <span>{platform.name}</span>
                  {/* Subtle pointing arrow */}
                  <div className="absolute right-[-4px] top-1/2 -translate-y-1/2 w-2 h-2 bg-white border-t border-r border-gray-100 rotate-45" />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Circular Hover Button */}
            <motion.a
              href={platform.url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={platform.ariaLabel}
              onMouseEnter={() => setHoveredPlatform(platform.id)}
              onMouseLeave={() => setHoveredPlatform(null)}
              onFocus={() => setHoveredPlatform(platform.id)}
              onBlur={() => setHoveredPlatform(null)}
              className="group relative flex items-center justify-center rounded-full bg-white border border-gray-200 text-gray-500 shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-brand-primary cursor-pointer w-11 h-11 md:w-[52px] md:h-[52px]"
              whileHover={{
                scale: 1.1,
                y: -3,
                boxShadow: `0 12px 24px -4px ${platform.glow}, 0 4px 12px -2px ${platform.glow}`,
                borderColor: platform.color,
                color: platform.color,
              }}
              whileTap={{ scale: 0.95 }}
              style={{
                transition: 'border-color 0.25s ease, color 0.25s ease',
              }}
            >
              {/* Inner active color aura */}
              <div 
                className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-5 transition-opacity duration-300"
                style={{ backgroundColor: platform.color }}
              />

              <Icon className="w-5 h-5 md:w-[22px] md:h-[22px] z-10 transition-transform duration-300 group-hover:rotate-6" />
            </motion.a>
          </motion.div>
        );
      })}
    </motion.div>
  );
}

export default FloatingSocialLinks;
