import React, { memo, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import M3Badge from './M3Badge';

/**
 * M3 Navigation Bar — Material Design 3 Bottom Navigation
 * 
 * M3 Spec:
 * - Height: 80dp
 * - Active indicator: 64x32dp pill, secondary-container color
 * - Icon: 24dp, on-secondary-container when active, on-surface-variant when inactive
 * - Label: 12sp medium, always visible
 * - Max 5 destinations
 * - Active indicator animates with spring motion
 * 
 * @param {Array} items - Nav items: [{ label, icon, activeIcon, path, badge }]
 * @param {string} className - Additional classes
 */

const M3NavBar = memo(({ items = [], className = '' }) => {
    const navigate = useNavigate();
    const location = useLocation();

    // Determine active item
    const activeIndex = useMemo(() => {
        return items.findIndex(item => {
            if (item.path === '/') return location.pathname === '/';
            return location.pathname.startsWith(item.path);
        });
    }, [items, location.pathname]);

    return (
        <nav
            className={`
                fixed bottom-0 left-0 right-0 z-[1000]
                bg-white/10 dark:bg-white/5
                backdrop-blur-2xl
                border-t border-white/20 dark:border-white/10
                safe-area-bottom
                ${className}
            `}
            role="navigation"
            aria-label="Main navigation"
        >
            <div className="flex items-center justify-around h-20 max-w-lg mx-auto px-2">
                {items.map((item, index) => {
                    const isActive = index === activeIndex;

                    return (
                        <button
                            key={item.path}
                            type="button"
                            onClick={() => navigate(item.path)}
                            className="
                                flex flex-col items-center justify-center
                                min-w-[48px] w-full h-full
                                gap-1
                                transition-all duration-200
                                group
                                outline-none
                            "
                            aria-label={item.label}
                            aria-current={isActive ? 'page' : undefined}
                        >
                            {/* Icon container with M3 active indicator pill */}
                            <div className="relative flex items-center justify-center h-8">
                                {/* Active indicator pill — M3: 64x32dp, secondary-container */}
                                <div
                                    className={`
                                        absolute inset-x-0 h-8 rounded-sq-lg
                                        transition-all duration-300 ease-[cubic-bezier(0.2,0,0,1)]
                                        ${isActive
                                            ? 'bg-primary/12 dark:bg-[#D0BCFF]/16 w-16 -left-3 opacity-100 scale-100'
                                            : 'w-8 opacity-0 scale-75 group-hover:opacity-60 group-hover:scale-100 bg-[#1a100f]/5 dark:bg-[#E6E1E5]/5'
                                        }
                                    `}
                                    style={{ left: isActive ? 'calc(50% - 32px)' : 'calc(50% - 16px)' }}
                                />

                                {/* Icon with optional badge */}
                                <M3Badge count={item.badge || 0} variant={item.badge > 0 ? 'standard' : 'dot'}>
                                    <span
                                        className={`
                                            material-symbols-outlined text-[24px] relative z-10
                                            transition-all duration-200
                                            ${isActive
                                                ? 'text-primary dark:text-[#D0BCFF] font-bold'
                                                : 'text-[#49454F] dark:text-[#CAC4D0] group-hover:text-[#1a100f] dark:group-hover:text-[#E6E1E5]'
                                            }
                                        `}
                                        style={{ fontVariationSettings: isActive ? "'FILL' 1, 'wght' 600" : "'FILL' 0, 'wght' 400" }}
                                    >
                                        {isActive ? (item.activeIcon || item.icon) : item.icon}
                                    </span>
                                </M3Badge>
                            </div>

                            {/* Label — M3: 12sp medium */}
                            <span
                                className={`
                                    text-xs font-bold leading-none tracking-wide
                                    transition-colors duration-200
                                    ${isActive
                                        ? 'text-primary dark:text-[#D0BCFF]'
                                        : 'text-[#49454F] dark:text-[#CAC4D0] group-hover:text-[#1a100f] dark:group-hover:text-[#E6E1E5]'
                                    }
                                `}
                            >
                                {item.label}
                            </span>
                        </button>
                    );
                })}
            </div>
        </nav>
    );
});

M3NavBar.displayName = 'M3NavBar';

export default M3NavBar;
