import React, { useMemo, useRef, useState } from 'react';

// ── Shape geometry ──────────────────────────────────────────────────────────
const NUM_PTS = 20;

const SHAPE_FNS = [
    // 0 → stop=10 → near-circle (smoothest)
    (_i, a) => 38 + 1.5 * Math.cos(3 * a),
    // 1 → stop=20 → soft scallop
    (i, _a) => i % 2 === 0 ? 40 : 32,
    // 2 → stop=30 → 5-petal flower
    (_i, a) => 34 + 7 * Math.cos(5 * a),
    // 3 → stop=40 → 4-lobe blob
    (_i, a) => 33 + 9 * Math.cos(4 * a + 0.5),
    // 4 → stop=50 → sharp starburst
    (i, _a) => i % 2 === 0 ? 43 : 24,
];

function computeShape(fn) {
    const step = (2 * Math.PI) / NUM_PTS;
    return Array.from({ length: NUM_PTS }, (_, i) => {
        const a = i * step;
        const r = fn(i, a);
        return [50 + r * Math.cos(a), 50 + r * Math.sin(a)];
    });
}

const SHAPES = SHAPE_FNS.map(computeShape);

function toClipPath(pts) {
    return `polygon(${pts.map(([x, y]) => `${x.toFixed(1)}% ${y.toFixed(1)}%`).join(', ')})`;
}

// ── Component ────────────────────────────────────────────────────────────────
const M3ShapeSlider = React.memo(({ value, onChange, stops = [10, 20, 30, 40, 50] }) => {
    const curIndex = Math.max(0, stops.indexOf(value));
    const progress = curIndex / (stops.length - 1);

    const trackRef = useRef(null);
    const [active, setActive] = useState(false);

    // Resolve pointer X → nearest stop index
    const resolveIndex = (clientX) => {
        const rect = trackRef.current?.getBoundingClientRect();
        if (!rect) return curIndex;
        const p = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
        return Math.round(p * (stops.length - 1));
    };

    const onDown = (clientX) => {
        setActive(true);
        onChange(stops[resolveIndex(clientX)]);
    };
    const onMove = (clientX) => {
        if (!active) return;
        onChange(stops[resolveIndex(clientX)]);
    };
    const onUp = () => setActive(false);

    // ── Colors (CSS custom-prop aware) ──────────────────────────────────────
    // Light: primary = #be3627  Dark: primary = #D0BCFF
    // We use Tailwind dark: classes throughout.

    const shapeClip = toClipPath(SHAPES[curIndex]);

    // Knob left offset (percentage of track width, accounting for knob half-width)
    const knobLeft = `${progress * 100}%`;

    return (
        <div
            className="select-none w-full"
            style={{ padding: '8px 0 36px' }}
        >
            {/* ── Outer layout: [track area] ── */}
            <div
                ref={trackRef}
                className="relative w-full cursor-pointer"
                style={{ height: '44px' }}
                onMouseDown={e => onDown(e.clientX)}
                onMouseMove={e => { if (e.buttons === 1) onMove(e.clientX); }}
                onMouseUp={onUp}
                onMouseLeave={onUp}
                onTouchStart={e => { e.preventDefault(); onDown(e.touches[0].clientX); }}
                onTouchMove={e => { e.preventDefault(); onMove(e.touches[0].clientX); }}
                onTouchEnd={onUp}
            >
                {/* ── Track (6px tall, rounded) ── */}
                <div
                    className="absolute left-0 right-0 rounded-full overflow-hidden"
                    style={{ height: '6px', top: 'calc(50% - 3px)' }}
                >
                    {/* Background track */}
                    <div className="absolute inset-0 bg-[rgba(120,120,120,0.2)] dark:bg-white/15 rounded-full" />
                    {/* Filled portion */}
                    <div
                        className="absolute left-0 top-0 bottom-0 rounded-full bg-[#be3627] dark:bg-[#D0BCFF]"
                        style={{
                            width: `${progress * 100}%`,
                            transition: 'width 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
                        }}
                    />
                </div>

                {/* ── Tick dots (4×4px, centred on each stop position, below track centre) ── */}
                {stops.map((stop, i) => {
                    const tickLeft = `${(i / (stops.length - 1)) * 100}%`;
                    const isPassed = i < curIndex;
                    const isCurrent = i === curIndex;
                    return (
                        <div
                            key={`tick-${stop}`}
                            className="absolute rounded-full pointer-events-none"
                            style={{
                                width: '4px',
                                height: '4px',
                                // Place ticks 9px below track centre (matches Apple spec: top = 50% - 4/2 + 9)
                                top: 'calc(50% + 6px)',
                                left: tickLeft,
                                transform: 'translateX(-50%)',
                                background: isCurrent
                                    ? 'transparent'
                                    : isPassed
                                        ? 'rgba(255,255,255,0.5)'
                                        : 'rgba(60,60,67,0.18)',
                                transition: 'background 0.2s ease'
                            }}
                        />
                    );
                })}

                {/* ── Knob: pill shape (38×28px) with morphing shape on top ── */}
                <div
                    className="absolute pointer-events-none"
                    style={{
                        top: '50%',
                        left: knobLeft,
                        transform: 'translate(-50%, -50%)',
                        transition: 'left 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                        zIndex: 10,
                        width: '44px',
                        height: '28px',
                    }}
                >
                    {/* White pill with shadow — matches Apple reference knob */}
                    <div
                        className="absolute inset-0 rounded-full bg-white dark:bg-[#2D2835]"
                        style={{
                            boxShadow: '0px 0.5px 4px rgba(0,0,0,0.12), 0px 6px 13px rgba(0,0,0,0.16)'
                        }}
                    />

                    {/* Morphing material shape floats centred on the pill */}
                    <div
                        className="absolute bg-[#be3627] dark:bg-[#D0BCFF]"
                        style={{
                            width: '26px',
                            height: '26px',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            clipPath: shapeClip,
                            transition: [
                                'clip-path 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)',
                                'width 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)',
                                'height 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)',
                            ].join(', '),
                        }}
                    />
                </div>

                {/* ── Number labels ── */}
                <div className="absolute left-0 right-0 flex justify-between" style={{ top: 'calc(100% + 8px)' }}>
                    {stops.map((stop, i) => {
                        const isCurrent = i === curIndex;
                        return (
                            <span
                                key={`label-${stop}`}
                                className={`text-[13px] font-bold tabular-nums transition-all duration-200 ${isCurrent
                                        ? 'text-[#be3627] dark:text-[#D0BCFF] scale-110'
                                        : 'text-[rgba(60,60,67,0.55)] dark:text-[rgba(202,196,208,0.55)] scale-100'
                                    }`}
                                style={{
                                    display: 'block',
                                    width: `${100 / stops.length}%`,
                                    textAlign: 'center',
                                    transformOrigin: 'center bottom',
                                }}
                            >
                                {stop}
                            </span>
                        );
                    })}
                </div>
            </div>
        </div>
    );
});

M3ShapeSlider.displayName = 'M3ShapeSlider';
export default M3ShapeSlider;
