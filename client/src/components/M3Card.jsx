import React, { memo } from 'react';

/**
 * M3 Card — Material Design 3 Card Component
 * 
 * M3 Spec:
 * - Three variants: elevated, filled, outlined
 * - Corner radius: 12dp (medium), 16dp (large)  
 * - Elevated: surface color, elevation 1
 * - Filled: surface-container-highest, no elevation
 * - Outlined: surface, 1dp outline
 * 
 * @param {string} variant - 'elevated' | 'filled' | 'outlined'
 * @param {function} onClick - Click handler (makes card interactive)
 * @param {React.ReactNode} children - Card content
 * @param {string} className - Additional classes
 * @param {boolean} interactive - Whether card has hover/press states
 */

const M3Card = memo(({
    variant = 'elevated',
    onClick,
    children,
    className = '',
    interactive = false,
    padding = 'p-6',
}) => {
    const isClickable = !!onClick || interactive;

    const variantClasses = {
        elevated: `
            bg-white/10 dark:bg-[#1C1B1F]/10 backdrop-blur-2xl
            shadow-[0_4px_12px_rgba(0,0,0,0.15)]
            dark:shadow-[0_4px_12px_rgba(0,0,0,0.3)]
            border-[0.5px] border-white/30 dark:border-white/10
            ${isClickable ? 'hover:shadow-[0_0_25px_rgba(255,255,255,0.15)] hover:border-white/50 active:scale-[0.98]' : ''}
        `,
        filled: `
            bg-[#E7E0EC]/15 dark:bg-[#49454F]/15 backdrop-blur-2xl
            border-[0.5px] border-white/20 dark:border-white/5
            ${isClickable ? 'hover:bg-white/20 hover:border-white/40 active:scale-[0.98]' : ''}
        `,
        outlined: `
            bg-white/5 dark:bg-[#1C1B1F]/5 backdrop-blur-2xl
            border-[0.5px] border-white/40 dark:border-[#49454F]/50
            ${isClickable ? 'hover:bg-white/10 hover:border-white/60 active:scale-[0.98]' : ''}
        `,
    };

    const Component = onClick ? 'button' : 'div';

    return (
        <Component
            onClick={onClick}
            className={`
                rounded-sq-xl
                ${padding}
                transition-all duration-200
                ${variantClasses[variant] || variantClasses.elevated}
                ${isClickable ? 'cursor-pointer active:scale-[0.99]' : ''}
                ${onClick ? 'w-full text-left' : ''}
                ${className}
            `}
        >
            {children}
        </Component>
    );
});

M3Card.displayName = 'M3Card';

export default M3Card;
