import React, { useMemo } from 'react';

const NUM_POINTS = 24;
const ANGLE_STEP = (2 * Math.PI) / NUM_POINTS;

const SHAPE_FNS = [
    // 0. Starburst
    (i, a) => i % 2 === 0 ? 48 : 30,
    // 1. Scalloped
    (i, a) => i % 2 === 0 ? 47 : 38,
    // 2. Soft pentagon
    (i, a) => 44 + 3.5 * Math.cos(5 * a),
    // 3. Near-circle
    (i, _a) => 46,
    // 4. Star flower
    (i, a) => 40 + 8 * Math.cos(6 * a),
    // 5. 4-lobe organic blob
    (i, a) => 41 + 8 * Math.cos(4 * a + 0.4),
    // 6. Egg
    (i, a) => 43 + 6 * Math.cos(a),
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

const SELECTED_SHAPE_INDICES = [3, 2, 4, 5, 0]; // 10, 20, 30, 40, 50

const M3ShapeSlider = React.memo(({ value, onChange, stops = [10, 20, 30, 40, 50] }) => {
    const shapes = useMemo(() => SELECTED_SHAPE_INDICES.map(idx => computeShape(SHAPE_FNS[idx])), []);

    const curIndex = stops.indexOf(value) !== -1 ? stops.indexOf(value) : 0;
    const progress = curIndex / (stops.length - 1);

    const getPoly = (shapePoints) => {
        return `polygon(${shapePoints.map(([x, y]) => `${x.toFixed(1)}% ${y.toFixed(1)}%`).join(', ')})`;
    };

    const handleInteraction = (e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const p = Math.max(0, Math.min(1, x / rect.width));
        const stopIdx = Math.round(p * (stops.length - 1));
        onChange(stops[stopIdx]);
    };

    // Theme accurate colors: Blue for Light, Purple for Dark
    const activeColorClass = "bg-[#0088FF] dark:bg-[#D0BCFF]";
    const activeTextColorClass = "text-[#0088FF] dark:text-[#D0BCFF]";

    return (
        <div
            className="flex flex-col items-center select-none w-full max-w-[450px]"
            style={{ padding: '8px 24px 32px' }}
        >
            <div className="relative w-full h-[60px] flex items-center">
                {/* Interaction Overlay */}
                <div
                    className="absolute inset-0 z-20 cursor-pointer"
                    onMouseDown={handleInteraction}
                    onMouseMove={(e) => { if (e.buttons === 1) handleInteraction(e); }}
                />

                {/* Track Background */}
                <div
                    className="absolute h-[14px] left-0 right-0 rounded-full bg-black/5 dark:bg-white/10"
                    style={{ top: 'calc(50% - 7px)' }}
                />

                {/* Fill Track */}
                <div
                    className={`absolute h-[14px] left-0 rounded-full transition-all duration-300 ease-out ${activeColorClass}`}
                    style={{
                        top: 'calc(50% - 7px)',
                        width: `${progress * 100}%`
                    }}
                />

                {/* Stop Points (Bold thick dots ON the track) */}
                <div className="absolute inset-0 flex items-center justify-between px-[2px]">
                    {stops.map((stop, i) => (
                        <div
                            key={`point-${stop}`}
                            className={`w-5 h-5 rounded-full transition-all duration-300 z-10 border-[3px] border-white dark:border-[#1f1b24] shadow-md ${i <= curIndex ? activeColorClass : 'bg-gray-300 dark:bg-gray-600'
                                }`}
                            style={{
                                transform: i === curIndex ? 'scale(1.3)' : 'scale(1)'
                            }}
                        />
                    ))}
                </div>

                {/* Stop Labels (Numbers 10-50 below) */}
                <div className="absolute top-[110%] left-0 right-0 flex justify-between">
                    {stops.map((stop, i) => (
                        <div
                            key={`label-${stop}`}
                            className={`text-[12px] font-black uppercase tracking-widest transition-all duration-300 w-10 text-center ${i === curIndex ? activeTextColorClass : 'text-gray-400 dark:text-gray-500'
                                }`}
                        >
                            {stop}
                        </div>
                    ))}
                </div>

                {/* Knob (The Morphing Shape) */}
                <div
                    className={`absolute w-14 h-14 shadow-[0_12px_28px_-4px_rgba(0,0,0,0.35)] z-30 pointer-events-none transform -translate-x-1/2 -translate-y-1/2 top-1/2 transition-all duration-500 ease-out border-[4px] border-white dark:border-[#1f1b24] ${activeColorClass}`}
                    style={{
                        left: `${progress * 100}%`,
                        clipPath: getPoly(shapes[curIndex]),
                        transition: 'left 0.5s cubic-bezier(0.34, 1.56, 0.64, 1), clip-path 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)'
                    }}
                />
            </div>
        </div>
    );
});

export default M3ShapeSlider;
