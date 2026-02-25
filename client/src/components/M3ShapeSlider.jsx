import React, { useRef, useState } from 'react';

// ── Shape geometry (NO circle — circle is reserved for the drag-in-between state) ─
const NUM_PTS = 24;
const SHAPE_FNS = [
    // stop 0 → soft scallop  (gentle alternating radii)
    (i)      => i % 2 === 0 ? 42 : 33,
    // stop 1 → 5-petal flower
    (_i, a)  => 36 + 9 * Math.cos(5 * a),
    // stop 2 → 4-lobe organic blob
    (_i, a)  => 35 + 10 * Math.cos(4 * a + 0.4),
    // stop 3 → 6-point rounded star
    (i)      => i % 2 === 0 ? 44 : 30,
    // stop 4 → sharp starburst (most complex)
    (i)      => i % 2 === 0 ? 46 : 22,
];

// Circle — used while dragging between stops
const CIRCLE_FN  = (_i, _a) => 40;

function computeShape(fn) {
    const step = (2 * Math.PI) / NUM_PTS;
    return Array.from({ length: NUM_PTS }, (_, i) => {
        const a = i * step;
        const r = fn(i, a);
        return [50 + r * Math.cos(a), 50 + r * Math.sin(a)];
    });
}

const SHAPES       = SHAPE_FNS.map(computeShape);
const CIRCLE_SHAPE = computeShape(CIRCLE_FN);

function toClipPath(pts) {
    return `polygon(${pts.map(([x, y]) => `${x.toFixed(1)}% ${y.toFixed(1)}%`).join(', ')})`;
}

const SHAPE_CLIPS  = SHAPES.map(toClipPath);
const CIRCLE_CLIP  = toClipPath(CIRCLE_SHAPE);

// ── Layout constants ────────────────────────────────────────────────────────
const KNOB_SIZE = 32;   // square containing the shape (px)
const HALF_K    = KNOB_SIZE / 2;

// ── Component ────────────────────────────────────────────────────────────────
const M3ShapeSlider = React.memo(({ value, onChange, stops = [10, 20, 30, 40, 50] }) => {
    const wrapRef  = useRef(null);
    const [dragging, setDragging] = useState(false);

    const n        = stops.length;
    const curIndex = Math.max(0, stops.indexOf(value));
    const progress = curIndex / (n - 1);

    // While dragging we show circle, on a stop we show the stop's shape
    const shapeClip = dragging ? CIRCLE_CLIP : SHAPE_CLIPS[curIndex];

    // Resolve pointer → nearest stop value
    const resolveStop = (clientX) => {
        const rect = wrapRef.current?.getBoundingClientRect();
        if (!rect) return value;
        const liveWidth = rect.width - KNOB_SIZE;
        const x = clientX - rect.left - HALF_K;
        const p = Math.max(0, Math.min(1, x / liveWidth));
        return stops[Math.round(p * (n - 1))];
    };

    const onDown = (cx) => { setDragging(true); onChange(resolveStop(cx)); };
    const onMove = (cx) => { if (dragging) onChange(resolveStop(cx)); };
    const onUp   = ()   => setDragging(false);

    return (
        <div className="select-none w-full" style={{ padding: '4px 0 28px' }}>
            {/* ── Hit area — the full wrapper width is draggable ── */}
            <div
                ref={wrapRef}
                className="relative cursor-pointer touch-none"
                style={{ height: '40px' }}
                onMouseDown ={e => onDown(e.clientX)}
                onMouseMove ={e => { if (e.buttons === 1) onMove(e.clientX); }}
                onMouseUp   ={onUp}
                onMouseLeave={onUp}
                onTouchStart={e => { e.preventDefault(); onDown(e.touches[0].clientX); }}
                onTouchMove ={e => { e.preventDefault(); onMove(e.touches[0].clientX); }}
                onTouchEnd  ={onUp}
            >
                {/* ── Inner track: inset HALF_K on each side so shapes align with labels ── */}
                <div
                    className="absolute top-0 bottom-0"
                    style={{ left: `${HALF_K}px`, right: `${HALF_K}px` }}
                >
                    {/* Track background */}
                    <div
                        className="absolute rounded-full"
                        style={{
                            height: '5px',
                            top: 'calc(50% - 2.5px)',
                            left: 0, right: 0,
                            background: 'rgba(120,120,120,0.18)',
                        }}
                    />

                    {/* Active fill */}
                    <div
                        className="absolute rounded-full bg-[#be3627] dark:bg-[#D0BCFF]"
                        style={{
                            height: '5px',
                            top: 'calc(50% - 2.5px)',
                            left: 0,
                            width: `${progress * 100}%`,
                            transition: dragging ? 'none' : 'width 0.15s ease',
                        }}
                    />

                    {/* ── Morphing shape knob — NO pill, just the shape itself ── */}
                    <div
                        className="absolute pointer-events-none"
                        style={{
                            width:  `${KNOB_SIZE}px`,
                            height: `${KNOB_SIZE}px`,
                            top:    '50%',
                            left:   `${progress * 100}%`,
                            transform: 'translate(-50%, -50%)',
                            transition: dragging ? 'none' : 'left 0.15s ease',
                            zIndex: 10,
                        }}
                    >
                        {/* White shadow layer (slight glow / background) so shape pops */}
                        <div
                            className="absolute inset-0"
                            style={{
                                clipPath: shapeClip,
                                background: 'rgba(255,255,255,0.85)',
                                filter: 'blur(2px)',
                                transform: 'scale(1.15)',
                                transition: 'clip-path 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                            }}
                        />
                        {/* Main shape */}
                        <div
                            className="absolute inset-0 bg-[#be3627] dark:bg-[#D0BCFF]"
                            style={{
                                clipPath: shapeClip,
                                transition: 'clip-path 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                            }}
                        />
                        {/* Gloss highlight */}
                        <div
                            className="absolute inset-0 bg-gradient-to-br from-white/35 to-transparent"
                            style={{
                                clipPath: shapeClip,
                                transition: 'clip-path 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                            }}
                        />
                    </div>

                    {/* ── Number labels — same coordinate system as the knob ── */}
                    <div className="absolute left-0 right-0" style={{ top: 'calc(100% + 8px)' }}>
                        {stops.map((stop, i) => {
                            const pct    = (i / (n - 1)) * 100;
                            const isCur  = i === curIndex;
                            return (
                                <span
                                    key={`lbl-${stop}`}
                                    className={`absolute text-[12px] font-bold tabular-nums transition-all duration-200 ${
                                        isCur
                                            ? 'text-[#be3627] dark:text-[#D0BCFF]'
                                            : 'text-[rgba(60,60,67,0.5)] dark:text-[rgba(202,196,208,0.48)]'
                                    }`}
                                    style={{
                                        left: `${pct}%`,
                                        transform: isCur
                                            ? 'translateX(-50%) scale(1.12)'
                                            : 'translateX(-50%) scale(1)',
                                        transformOrigin: 'center top',
                                        whiteSpace: 'nowrap',
                                    }}
                                >
                                    {stop}
                                </span>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
});

M3ShapeSlider.displayName = 'M3ShapeSlider';
export default M3ShapeSlider;
