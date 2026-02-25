import React, { useMemo, useState } from 'react';

const NUM_POINTS = 24;
const ANGLE_STEP = (2 * Math.PI) / NUM_POINTS;

const SHAPE_FNS = [
    // 0. Near-circle (smooth, minimal shape for smallest value)
    (_i, _a) => 44,
    // 1. Soft scallop
    (i, _a) => i % 2 === 0 ? 46 : 38,
    // 2. Petal / soft star
    (_i, a) => 41 + 6 * Math.cos(5 * a),
    // 3. 4-lobe organic blob
    (_i, a) => 40 + 8 * Math.cos(4 * a + 0.4),
    // 4. Bold starburst (biggest value)
    (i, _a) => i % 2 === 0 ? 48 : 29,
];

const computeShape = (fn) => {
    const points = [];
    for (let i = 0; i < NUM_POINTS; i++) {
        const a = i * ANGLE_STEP;
        const r = fn(i, a);
        points.push([50 + r * Math.cos(a), 50 + r * Math.sin(a)]);
    }
    return points;
};

// One shape per stop (index 0-4 for stops 10-50)
const SHAPE_INDICES = [0, 1, 2, 3, 4];

const M3ShapeSlider = React.memo(({ value, onChange, stops = [10, 20, 30, 40, 50] }) => {
    const shapes = useMemo(() => SHAPE_INDICES.map(idx => computeShape(SHAPE_FNS[idx])), []);
    const [dragging, setDragging] = useState(false);

    const curIndex = stops.indexOf(value) !== -1 ? stops.indexOf(value) : 0;
    const progress = curIndex / (stops.length - 1);

    const getPoly = (shapePoints) =>
        `polygon(${shapePoints.map(([x, y]) => `${x.toFixed(1)}% ${y.toFixed(1)}%`).join(', ')})`;

    const handleInteraction = (e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const x = clientX - rect.left;
        const p = Math.max(0, Math.min(1, x / rect.width));
        const stopIdx = Math.round(p * (stops.length - 1));
        onChange(stops[stopIdx]);
    };

    return (
        <div
            className="flex flex-col items-center select-none w-full"
            style={{ padding: '4px 20px 40px' }}
        >
            <div className="relative w-full" style={{ height: '72px' }}>

                {/* Touch/Mouse Interaction Layer */}
                <div
                    className="absolute inset-0 z-20 cursor-pointer touch-none"
                    onMouseDown={(e) => { setDragging(true); handleInteraction(e); }}
                    onMouseMove={(e) => { if (dragging || e.buttons === 1) handleInteraction(e); }}
                    onMouseUp={() => setDragging(false)}
                    onMouseLeave={() => setDragging(false)}
                    onTouchStart={(e) => { setDragging(true); handleInteraction(e); }}
                    onTouchMove={(e) => { e.preventDefault(); handleInteraction(e); }}
                    onTouchEnd={() => setDragging(false)}
                />

                {/* ── Track Background ── */}
                <div
                    className="absolute left-0 right-0 rounded-full bg-[#be3627]/12 dark:bg-white/10"
                    style={{ height: '16px', top: 'calc(50% - 8px)' }}
                />

                {/* ── Active Fill Track ── */}
                <div
                    className="absolute left-0 rounded-full bg-[#be3627] dark:bg-[#D0BCFF]"
                    style={{
                        height: '16px',
                        top: 'calc(50% - 8px)',
                        width: `${progress * 100}%`,
                        transition: 'width 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)'
                    }}
                />

                {/* ── Stop Ticks (subtle vertical lines on the track) ── */}
                <div className="absolute inset-0 flex items-center justify-between" style={{ paddingLeft: '1px', paddingRight: '1px' }}>
                    {stops.map((stop, i) => (
                        <div
                            key={`tick-${stop}`}
                            className={`rounded-full transition-all duration-300 z-10 flex-shrink-0 ${i < curIndex
                                    ? 'bg-white/50 dark:bg-[#141218]/40'
                                    : i === curIndex
                                        ? 'opacity-0'
                                        : 'bg-[#be3627]/25 dark:bg-white/25'
                                }`}
                            style={{
                                width: '4px',
                                height: i === curIndex ? '0px' : '10px',
                                transition: 'all 0.3s ease'
                            }}
                        />
                    ))}
                </div>

                {/* ── Morphing Knob ── */}
                <div
                    className="absolute z-30 pointer-events-none bg-[#be3627] dark:bg-[#D0BCFF] flex items-center justify-center"
                    style={{
                        width: '56px',
                        height: '56px',
                        top: '50%',
                        left: `${progress * 100}%`,
                        transform: 'translate(-50%, -50%)',
                        clipPath: getPoly(shapes[curIndex]),
                        boxShadow: '0 8px 24px -4px rgba(0,0,0,0.35)',
                        transition: 'left 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), clip-path 0.45s cubic-bezier(0.34, 1.56, 0.64, 1)',
                        border: '4px solid',
                        borderColor: 'var(--knob-border, white)'
                    }}
                // We rely on CSS custom property; override via inline for dark detection fallback
                >
                    {/* Gloss overlay */}
                    <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/25 to-transparent pointer-events-none" style={{ clipPath: 'inherit' }} />
                    {/* Value text inside knob */}
                    <span className="relative z-10 text-white dark:text-[#1D1B20] text-[13px] font-black leading-none select-none"
                        style={{ textShadow: 'none' }}>
                        {value}
                    </span>
                </div>

                {/* ── Stop Labels ── */}
                <div className="absolute left-0 right-0 flex justify-between" style={{ top: 'calc(100% + 6px)' }}>
                    {stops.map((stop, i) => (
                        <div
                            key={`label-${stop}`}
                            className={`text-[12px] font-black tracking-tight transition-all duration-300 text-center ${i === curIndex
                                    ? 'text-[#be3627] dark:text-[#D0BCFF] scale-110'
                                    : 'text-[#5e413d]/50 dark:text-[#CAC4D0]/50 scale-100'
                                }`}
                            style={{ width: `${100 / stops.length}%`, transition: 'all 0.3s ease' }}
                        >
                            {stop}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
});

M3ShapeSlider.displayName = 'M3ShapeSlider';

export default M3ShapeSlider;
