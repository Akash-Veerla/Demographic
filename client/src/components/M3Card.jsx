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
            bg-white/80 dark:bg-[#1C1B1F]/80 backdrop-blur-xl
            shadow-[0_1px_2px_rgba(0,0,0,0.3),0_1px_3px_1px_rgba(0,0,0,0.15)]
            dark:shadow-[0_1px_2px_rgba(0,0,0,0.5),0_1px_3px_1px_rgba(0,0,0,0.3)]
            border border-white/20 dark:border-white/5
            ${isClickable ? 'hover:shadow-[0_1px_2px_rgba(0,0,0,0.3),0_2px_6px_2px_rgba(0,0,0,0.15)] active:shadow-[0_1px_2px_rgba(0,0,0,0.3),0_1px_3px_1px_rgba(0,0,0,0.15)] hover:bg-white/90 dark:hover:bg-[#1C1B1F]/90' : ''}
        `,
        filled: `
            bg-[#E7E0EC]/50 dark:bg-[#49454F]/50 backdrop-blur-lg
            border border-transparent
            ${isClickable ? 'hover:bg-[#E7E0EC]/70 dark:hover:bg-[#49454F]/70' : ''}
        `,
        outlined: `
            bg-white/60 dark:bg-[#1C1B1F]/60 backdrop-blur-xl
            border border-[#CAC4D0] dark:border-[#49454F]
            ${isClickable ? 'hover:bg-white/80 dark:hover:bg-[#E6E1E5]/10 hover:border-[#79747E] dark:hover:border-[#938F99]' : ''}
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
