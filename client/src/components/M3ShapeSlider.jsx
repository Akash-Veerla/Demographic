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

    return (
        <div
            className="flex flex-col items-center select-none w-full max-w-[400px]"
            style={{ padding: '0px 16px 1px', height: '52px' }}
        >
            <div className="flex flex-row items-center justify-center gap-[12px] w-full" style={{ height: '50px' }}>
                {/* Min Symbol */}
                <div
                    className="w-[32px] h-[50px] flex items-center justify-center text-[17px] font-bold text-[rgba(60,60,67,0.6)] text-center"
                    style={{ fontFamily: "'SF Pro', 'Inter', sans-serif" }}
                >
                    {stops[0]}
                </div>

                {/* Stack */}
                <div
                    className="flex-1 h-[50px] relative flex items-center cursor-pointer group"
                    onMouseDown={handleInteraction}
                    onMouseMove={(e) => { if (e.buttons === 1) handleInteraction(e); }}
                >
                    {/* Track Background */}
                    <div
                        className="absolute h-[6px] left-0 right-0 rounded-[3px]"
                        style={{ background: 'rgba(120, 120, 120, 0.2)', top: 'calc(50% - 3px)' }}
                    />

                    {/* Fill */}
                    <div
                        className="absolute h-[6px] left-0 rounded-[3px] transition-all duration-300 ease-out"
                        style={{
                            background: '#0088FF',
                            top: 'calc(50% - 3px)',
                            width: `${progress * 100}%`
                        }}
                    />

                    {/* Ticks Container */}
                    <div
                        className="absolute h-[4px] left-0 right-0 flex flex-row justify-between items-center pointer-events-none"
                        style={{ top: 'calc(50% - 2px + 9px)' }}
                    >
                        {stops.map((stop, i) => (
                            <div
                                key={stop}
                                className="w-[4px] h-[4px] transition-all duration-300"
                                style={{
                                    background: 'rgba(60, 60, 67, 0.18)',
                                    clipPath: getPoly(shapes[i]),
                                    transform: i <= curIndex ? 'scale(1.8)' : 'scale(1.2)'
                                }}
                            />
                        ))}
                    </div>

                    {/* Knob */}
                    <div
                        className="absolute w-[38px] h-[24px] bg-white flex items-center justify-center transition-all duration-500 ease-out"
                        style={{
                            left: `calc(${progress * 100}% - 19px)`,
                            top: 'calc(50% - 12px)',
                            boxShadow: '0px 0.5px 4px rgba(0, 0, 0, 0.12), 0px 6px 13px rgba(0, 0, 0, 0.12)',
                            borderRadius: '100px'
                        }}
                    >
                        {/* Material Morphing Interior */}
                        <div
                            className="bg-[#0088FF] w-[14px] h-[14px] transition-all duration-500 ease-out"
                            style={{
                                clipPath: getPoly(shapes[curIndex])
                            }}
                        />
                    </div>
                </div>

                {/* Max Symbol */}
                <div
                    className="w-[32px] h-[50px] flex items-center justify-center text-[17px] font-bold text-[rgba(60,60,67,0.6)] text-center"
                    style={{ fontFamily: "'SF Pro', 'Inter', sans-serif" }}
                >
                    {stops[stops.length - 1]}
                </div>
            </div>
        </div>
    );
});

export default M3ShapeSlider;
