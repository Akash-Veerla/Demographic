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
            bg-white dark:bg-[#1C1B1F]
            shadow-[0_1px_2px_rgba(0,0,0,0.3),0_1px_3px_1px_rgba(0,0,0,0.15)]
            dark:shadow-[0_1px_2px_rgba(0,0,0,0.5),0_1px_3px_1px_rgba(0,0,0,0.3)]
            ${isClickable ? 'hover:shadow-[0_1px_2px_rgba(0,0,0,0.3),0_2px_6px_2px_rgba(0,0,0,0.15)] active:shadow-[0_1px_2px_rgba(0,0,0,0.3),0_1px_3px_1px_rgba(0,0,0,0.15)]' : ''}
        `,
        filled: `
            bg-[#E7E0EC]/30 dark:bg-[#49454F]/20
            ${isClickable ? 'hover:bg-[#E7E0EC]/50 dark:hover:bg-[#49454F]/30' : ''}
        `,
        outlined: `
            bg-white dark:bg-[#1C1B1F]
            border border-[#CAC4D0] dark:border-[#49454F]
            ${isClickable ? 'hover:bg-[#1a100f]/4 dark:hover:bg-[#E6E1E5]/4 hover:border-[#79747E] dark:hover:border-[#938F99]' : ''}
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
