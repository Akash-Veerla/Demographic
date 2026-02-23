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

    // Theme accurate colors: Red (#be3627) for Light, Purple (#D0BCFF) for Dark
    const activeColorClass = "bg-[#be3627] dark:bg-[#D0BCFF]";
    const activeTextColorClass = "text-[#be3627] dark:text-[#D0BCFF]";
    const trackBgColorClass = "bg-[#be3627]/10 dark:bg-white/10";

    return (
        <div
            className="flex flex-col items-center select-none w-full max-w-[450px]"
            style={{ padding: '8px 24px 36px' }}
        >
            <div className="relative w-full h-[64px] flex items-center">
                {/* Interaction Overlay */}
                <div
                    className="absolute inset-0 z-20 cursor-pointer"
                    onMouseDown={handleInteraction}
                    onMouseMove={(e) => { if (e.buttons === 1) handleInteraction(e); }}
                />

                {/* Track Background - Thickened to 18px */}
                <div
                    className={`absolute h-[18px] left-0 right-0 rounded-full ${trackBgColorClass}`}
                    style={{ top: 'calc(50% - 9px)' }}
                />

                {/* Fill Track - Thickened to 18px */}
                <div
                    className={`absolute h-[18px] left-0 rounded-full transition-all duration-300 ease-out ${activeColorClass}`}
                    style={{
                        top: 'calc(50% - 9px)',
                        width: `${progress * 100}%`
                    }}
                />

                {/* Stop Points (Bold thick dots ON the track) */}
                <div className="absolute inset-0 flex items-center justify-between px-[1px]">
                    {stops.map((stop, i) => (
                        <div
                            key={`point-${stop}`}
                            className={`w-5 h-5 rounded-full transition-all duration-300 z-10 border-[2.5px] border-white dark:border-[#141218] shadow-md flex items-center justify-center ${i <= curIndex ? activeColorClass : 'bg-gray-300 dark:bg-gray-700'
                                }`}
                            style={{
                                transform: i === curIndex ? 'scale(1.2)' : 'scale(1)'
                            }}
                        >
                            {/* Inner dot to prevent mixing into the white border */}
                            <div className="w-1.5 h-1.5 rounded-full bg-white/40" />
                        </div>
                    ))}
                </div>

                {/* Stop Labels (Numbers 10-50 below) */}
                <div className="absolute top-[115%] left-0 right-0 flex justify-between">
                    {stops.map((stop, i) => (
                        <div
                            key={`label-${stop}`}
                            className={`text-[13px] font-black uppercase tracking-tight transition-all duration-300 w-10 text-center ${i === curIndex ? activeTextColorClass : 'text-[#5e413d]/60 dark:text-[#CAC4D0]/60'
                                }`}
                        >
                            {stop}
                        </div>
                    ))}
                </div>

                {/* Knob (The Morphing Shape) */}
                <div
                    className={`absolute w-14 h-14 shadow-[0_15px_35px_-5px_rgba(0,0,0,0.4)] z-30 pointer-events-none transform -translate-x-1/2 -translate-y-1/2 top-1/2 transition-all duration-500 ease-out border-[4px] border-white dark:border-[#141218] flex items-center justify-center ${activeColorClass}`}
                    style={{
                        left: `${progress * 100}%`,
                        clipPath: getPoly(shapes[curIndex]),
                        transition: 'left 0.5s cubic-bezier(0.34, 1.56, 0.64, 1), clip-path 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)'
                    }}
                >
                    {/* Interior highlights to make it look premium */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-black/10 to-transparent pointer-none" />
                </div>
            </div>
        </div>
    );
});

export default M3ShapeSlider;
