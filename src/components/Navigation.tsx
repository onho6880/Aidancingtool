'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_ITEMS = [
  { href: '/',               label: 'Trang chu',      icon: 'house' },
  { href: '/motion-copy',    label: 'Motion Copy',    icon: 'dance' },
  { href: '/image-to-video', label: 'Image to Video', icon: 'film' },
  { href: '/clothes-change', label: 'Trang Phuc AI',  icon: 'dress' },
  { href: '/history',        label: 'Lich Su',        icon: 'list' },
];

const ICONS: Record<string, string> = {
  house: '🏠', dance: '🕺', film: '🎬', dress: '👗', list: '📋',
};

export default function Navigation() {
  const pathname = usePathname();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-surface-border bg-surface/90 backdrop-blur-xl">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 font-bold text-lg">
          <span className="w-8 h-8 rounded-xl bg-gradient-brand flex items-center justify-center text-sm">✨</span>
          <span className="text-gradient">VidAI Studio</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-1">
          {NAV_ITEMS.map(item => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                  active
                    ? 'bg-brand-500/15 text-brand-400 border border-brand-500/20'
                    : 'text-gray-400 hover:text-white hover:bg-surface-hover'
                }`}
              >
                <span className="text-base">{ICONS[item.icon]}</span>
                {item.label}
              </Link>
            );
          })}
        </div>

        {/* Mobile nav */}
        <div className="md:hidden flex items-center gap-2">
          {NAV_ITEMS.slice(1, 4).map(item => (
            <Link
              key={item.href}
              href={item.href}
              className={`p-2 rounded-xl text-lg transition-all duration-200 ${
                pathname === item.href ? 'bg-brand-500/15 text-brand-400' : 'text-gray-500'
              }`}
            >
              {ICONS[item.icon]}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
