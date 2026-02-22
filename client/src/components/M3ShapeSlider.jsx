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

const easeInOutCubic = (t) =>
    t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

const SELECTED_SHAPE_INDICES = [3, 2, 4, 5, 0]; // 10, 20, 30, 40, 50

const M3ShapeSlider = React.memo(({ value, onChange, stops = [10, 20, 30, 40, 50] }) => {
    const shapes = useMemo(() => SELECTED_SHAPE_INDICES.map(idx => computeShape(SHAPE_FNS[idx])), []);

    const curIndex = stops.indexOf(value);
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

    return (
        <div className="flex flex-col gap-4 w-full max-w-md select-none">
            <div
                className="relative h-12 flex items-center cursor-pointer group px-4"
                onMouseDown={handleInteraction}
                onMouseMove={(e) => {
                    if (e.buttons === 1) handleInteraction(e);
                }}
            >
                {/* Track */}
                <div className="absolute left-4 right-4 h-1 bg-primary/20 dark:bg-white/10 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-primary/40 dark:bg-[#D0BCFF]/40 transition-all duration-500 ease-out"
                        style={{ width: `${progress * 100}%` }}
                    />
                </div>

                {/* Stops */}
                {stops.map((stop, i) => {
                    const stopPos = (i / (stops.length - 1)) * 100;
                    const isActive = stop <= value;
                    return (
                        <div
                            key={stop}
                            className="absolute mt-0 transform -translate-x-1/2 flex flex-col items-center"
                            style={{ left: `calc(1rem + ${stopPos}% * (100% - 2rem) / 100)` }}
                        >
                            <div
                                className={`w-3 h-3 transition-all duration-300 ${isActive ? 'bg-primary dark:bg-[#D0BCFF] scale-110' : 'bg-primary/30 dark:bg-white/20'}`}
                                style={{
                                    clipPath: getPoly(shapes[i]),
                                    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
                                }}
                            />
                            <span className={`text-[10px] font-black mt-6 transition-colors duration-300 ${isActive ? 'text-primary dark:text-[#D0BCFF]' : 'text-[#915b55] dark:text-[#CAC4D0]'}`}>
                                {stop}
                            </span>
                        </div>
                    );
                })}

                {/* Thumb */}
                <div
                    className="absolute w-9 h-9 bg-primary dark:bg-[#D0BCFF] shadow-lg shadow-primary/30 z-10 pointer-events-none transform -translate-x-1/2 -translate-y-1/2 top-1/2 group-hover:scale-110 transition-all duration-500"
                    style={{
                        left: `calc(1rem + ${progress * 100}% * (100% - 2rem) / 100)`,
                        clipPath: getPoly(shapes[curIndex]),
                        transition: 'left 0.6s cubic-bezier(0.34, 1.56, 0.64, 1), clip-path 0.6s cubic-bezier(0.34, 1.56, 0.64, 1), transform 0.2s ease-out'
                    }}
                />
            </div>
        </div>
    );
});

export default M3ShapeSlider;
