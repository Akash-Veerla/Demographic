import React, { memo } from 'react';

/**
 * M3 Segmented Button — Material Design 3 Segmented Button Group
 * 
 * M3 Spec:
 * - Height: 40dp
 * - Corner radius: 20dp (full round on ends, 0 on middle)
 * - Selected: secondary-container fill with on-secondary-container text
 * - Unselected: outlined with on-surface text
 * - Checkmark icon on selected segment
 * - Min 2, max 5 segments
 * 
 * @param {Array} segments - Array of { value, label, icon }
 * @param {string} value - Currently selected value
 * @param {function} onChange - Change handler with new value
 * @param {boolean} showIcon - Show checkmark on selected
 * @param {string} className - Additional classes
 * @param {string} size - 'default' | 'compact'
 */

const M3SegmentedButton = memo(({
    segments = [],
    value,
    onChange,
    showIcon = true,
    className = '',
    size = 'default',
}) => {
    const heightClass = size === 'compact' ? 'h-9' : 'h-10';

    return (
        <div
            className={`inline-flex ${className}`}
            role="group"
        >
            {segments.map((segment, index) => {
                const isSelected = segment.value === value;
                const isFirst = index === 0;
                const isLast = index === segments.length - 1;

                // M3 spec: full round on ends, flat joins in middle
                const borderRadius = isFirst
                    ? 'rounded-l-full'
                    : isLast
                        ? 'rounded-r-full'
                        : 'rounded-none';

                return (
                    <button
                        key={segment.value}
                        type="button"
                        onClick={() => onChange?.(segment.value)}
                        className={`
                            ${heightClass} px-4
                            inline-flex items-center justify-center gap-2
                            text-sm font-bold tracking-wide
                            border border-[#79747E] dark:border-[#938F99]
                            transition-all duration-200 active:scale-[0.98]
                            ${borderRadius}
                            ${!isFirst ? '-ml-[1px]' : ''}
                            ${isSelected
                                ? 'bg-primary/12 dark:bg-[#D0BCFF]/16 text-primary dark:text-[#D0BCFF] border-primary dark:border-[#D0BCFF] z-10 relative'
                                : 'bg-transparent text-[#1a100f] dark:text-[#E6E1E5] hover:bg-[#1a100f]/8 dark:hover:bg-[#E6E1E5]/8'
                            }
                        `}
                        aria-pressed={isSelected}
                    >
                        {/* Checkmark for selected */}
                        {isSelected && showIcon && (
                            <span className="material-symbols-outlined text-[16px] font-bold">check</span>
                        )}

                        {/* Icon */}
                        {segment.icon && !isSelected && (
                            <span className="material-symbols-outlined text-[18px]">{segment.icon}</span>
                        )}

                        {/* Label */}
                        <span>{segment.label}</span>
                    </button>
                );
            })}
        </div>
    );
});

M3SegmentedButton.displayName = 'M3SegmentedButton';

export default M3SegmentedButton;
