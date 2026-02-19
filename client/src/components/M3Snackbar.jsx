import React, { memo, useEffect, useState, useCallback, useRef } from 'react';

/**
 * M3 Snackbar — Material Design 3 Snackbar/Toast
 * 
 * M3 Spec:
 * - Height: min 48dp
 * - Corner radius: 4dp (per spec, we use sq-xs for squircle consistency)
 * - Inverse surface background
 * - Supporting text: 14sp
 * - Action: text button, inverse primary
 * - Max 2 lines, single-line preferred
 * - Duration: 4s (short), 10s (long)
 * - Position: bottom center, 16dp above nav bar
 * 
 * @param {string} message - Snackbar text
 * @param {string} icon - Optional leading icon
 * @param {string} actionLabel - Action button text
 * @param {function} onAction - Action button handler
 * @param {function} onDismiss - Dismiss handler
 * @param {number} duration - Auto-dismiss in ms (0 = persistent)
 * @param {string} variant - 'default' | 'success' | 'error' | 'info'
 * @param {boolean} show - Whether snackbar is visible
 */

const VARIANT_MAP = {
    default: {
        bg: 'bg-[#313033] dark:bg-[#E6E1E5]',
        text: 'text-white dark:text-[#313033]',
        action: 'text-[#D0BCFF] dark:text-[#6750A4]',
        icon: 'text-white/70 dark:text-[#313033]/70'
    },
    success: {
        bg: 'bg-[#1B5E20] dark:bg-[#A5D6A7]',
        text: 'text-white dark:text-[#1B5E20]',
        action: 'text-[#A5D6A7] dark:text-[#2E7D32]',
        icon: 'text-[#A5D6A7] dark:text-[#2E7D32]'
    },
    error: {
        bg: 'bg-[#B3261E] dark:bg-[#F2B8B5]',
        text: 'text-white dark:text-[#601410]',
        action: 'text-[#F2B8B5] dark:text-[#B3261E]',
        icon: 'text-[#F2B8B5] dark:text-[#601410]'
    },
    info: {
        bg: 'bg-primary dark:bg-[#D0BCFF]',
        text: 'text-white dark:text-[#381E72]',
        action: 'text-white/90 dark:text-[#381E72]/90',
        icon: 'text-white/70 dark:text-[#381E72]/70'
    },
};

const M3Snackbar = memo(({
    message,
    icon,
    actionLabel,
    onAction,
    onDismiss,
    duration = 4000,
    variant = 'default',
    show = false,
}) => {
    const [visible, setVisible] = useState(false);
    const [exiting, setExiting] = useState(false);
    const timeoutRef = useRef(null);

    const dismiss = useCallback(() => {
        setExiting(true);
        setTimeout(() => {
            setVisible(false);
            setExiting(false);
            onDismiss?.();
        }, 200);
    }, [onDismiss]);

    useEffect(() => {
        if (show) {
            setVisible(true);
            setExiting(false);

            if (duration > 0) {
                clearTimeout(timeoutRef.current);
                timeoutRef.current = setTimeout(dismiss, duration);
            }
        } else {
            if (visible) dismiss();
        }

        return () => clearTimeout(timeoutRef.current);
    }, [show, duration, dismiss]);

    if (!visible) return null;

    const colors = VARIANT_MAP[variant] || VARIANT_MAP.default;

    return (
        <div
            className={`
                fixed bottom-24 md:bottom-8 left-1/2 -translate-x-1/2 z-[9998]
                ${exiting ? 'animate-out fade-out slide-out-to-bottom-2 duration-200' : 'animate-in fade-in slide-in-from-bottom-4 duration-300'}
            `}
            role="status"
            aria-live="polite"
        >
            <div
                className={`
                    flex items-center gap-3
                    min-h-[48px] min-w-[288px] max-w-[560px]
                    px-4 py-3
                    rounded-sq-xs
                    shadow-[0_6px_10px_rgba(0,0,0,0.14),0_1px_18px_rgba(0,0,0,0.12)]
                    ${colors.bg}
                `}
            >
                {/* Leading icon */}
                {icon && (
                    <span className={`material-symbols-outlined text-lg shrink-0 ${colors.icon}`}>
                        {icon}
                    </span>
                )}

                {/* Message — M3: 14sp */}
                <span className={`flex-1 text-sm font-medium ${colors.text}`}>
                    {message}
                </span>

                {/* Action button */}
                {actionLabel && (
                    <button
                        type="button"
                        onClick={() => {
                            onAction?.();
                            dismiss();
                        }}
                        className={`
                            shrink-0 px-2 py-1 text-sm font-bold
                            rounded-sq-xs
                            hover:opacity-80 active:opacity-60
                            transition-opacity
                            ${colors.action}
                        `}
                    >
                        {actionLabel}
                    </button>
                )}

                {/* Dismiss (close) button */}
                {!actionLabel && (
                    <button
                        type="button"
                        onClick={dismiss}
                        className={`shrink-0 p-1 rounded-sq-xs hover:opacity-80 transition-opacity ${colors.text}`}
                    >
                        <span className="material-symbols-outlined text-lg">close</span>
                    </button>
                )}
            </div>
        </div>
    );
});

M3Snackbar.displayName = 'M3Snackbar';

export default M3Snackbar;
