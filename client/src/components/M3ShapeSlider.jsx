import React, { useRef, useState } from 'react';

// ── Shape geometry ──────────────────────────────────────────────────────────
const NUM_PTS = 20;
const SHAPE_FNS = [
    (_i, a) => 38 + 1.5 * Math.cos(3 * a),       // stop 0 – near-circle
    (i) => i % 2 === 0 ? 40 : 32,             // stop 1 – soft scallop
    (_i, a) => 34 + 7 * Math.cos(5 * a),         // stop 2 – 5-petal
    (_i, a) => 33 + 9 * Math.cos(4 * a + 0.5),   // stop 3 – 4-lobe blob
    (i) => i % 2 === 0 ? 43 : 24,             // stop 4 – starburst
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

// ── Constants ──────────────────────────────────────────────────────────────
const KNOB_W = 40;   // knob pill width  (px)
const KNOB_H = 24;   // knob pill height (px)
const HALF_K = KNOB_W / 2; // 20px — used as padding so knob never overflows

// ── Component ────────────────────────────────────────────────────────────────
const M3ShapeSlider = React.memo(({ value, onChange, stops = [10, 20, 30, 40, 50] }) => {
    const wrapRef = useRef(null); // the full slider wrapper (includes padding)
    const [active, setActive] = useState(false);

    const n = stops.length;
    const curIndex = Math.max(0, stops.indexOf(value));
    const progress = curIndex / (n - 1); // 0 → 1

    // ── Resolve a pointer X into the nearest stop ──────────────────────────
    // The "live track" runs from HALF_K to (wrapWidth - HALF_K).
    const resolveStop = (clientX) => {
        const rect = wrapRef.current?.getBoundingClientRect();
        if (!rect) return curIndex;
        const liveWidth = rect.width - KNOB_W; // effective drag range
        const x = clientX - rect.left - HALF_K;
        const p = Math.max(0, Math.min(1, x / liveWidth));
        return stops[Math.round(p * (n - 1))];
    };

    const onDown = (cx) => { setActive(true); onChange(resolveStop(cx)); };
    const onMove = (cx) => { if (active) onChange(resolveStop(cx)); };
    const onUp = () => setActive(false);

    // ── Knob CSS left — offset from left edge of wrapper ──────────────────
    // At progress=0  → left = 0      (knob centre at HALF_K from wrapper left)
    // At progress=1  → left = 100%   (knob centre at wrapper right - HALF_K)
    // We achieve this by keeping knob inside a div that has px padding = HALF_K
    // and setting left as percentage of the INNER track div (which has no padding).

    const shapeClip = toClipPath(SHAPES[curIndex]);

    return (
        <div className="select-none w-full" style={{ padding: '6px 0 32px' }}>

            {/* ── Outer wrapper — the ref for hit-testing ── */}
            <div
                ref={wrapRef}
                className="relative cursor-pointer touch-none"
                style={{ height: '44px' }}
                onMouseDown={e => onDown(e.clientX)}
                onMouseMove={e => { if (e.buttons === 1) onMove(e.clientX); }}
                onMouseUp={onUp}
                onMouseLeave={onUp}
                onTouchStart={e => { e.preventDefault(); onDown(e.touches[0].clientX); }}
                onTouchMove={e => { e.preventDefault(); onMove(e.touches[0].clientX); }}
                onTouchEnd={onUp}
            >
                {/* ── Inner track area — horizontally inset by HALF_K so knob centres align with numbers ── */}
                <div
                    className="absolute top-0 bottom-0"
                    style={{ left: `${HALF_K}px`, right: `${HALF_K}px` }}
                >
                    {/* Track background */}
                    <div
                        className="absolute rounded-full bg-[rgba(120,120,120,0.2)] dark:bg-white/15"
                        style={{ height: '6px', top: 'calc(50% - 3px)', left: 0, right: 0 }}
                    />

                    {/* Active fill */}
                    <div
                        className="absolute rounded-full bg-[#be3627] dark:bg-[#D0BCFF]"
                        style={{
                            height: '6px',
                            top: 'calc(50% - 3px)',
                            left: 0,
                            width: `${progress * 100}%`,
                            transition: 'width 0.18s ease',
                        }}
                    />

                    {/* Tick dots — one per stop, positioned at the exact stop % */}
                    {stops.map((stop, i) => {
                        const pct = (i / (n - 1)) * 100;
                        const passed = i < curIndex;
                        const current = i === curIndex;
                        return (
                            <div
                                key={`tick-${stop}`}
                                className="absolute rounded-full pointer-events-none"
                                style={{
                                    width: '4px',
                                    height: '4px',
                                    top: 'calc(50% + 5px)',        // below track centre
                                    left: `${pct}%`,
                                    transform: 'translateX(-50%)',
                                    background: current
                                        ? 'transparent'
                                        : passed
                                            ? 'rgba(255,255,255,0.45)'
                                            : 'rgba(60,60,67,0.18)',
                                    transition: 'background 0.15s',
                                }}
                            />
                        );
                    })}

                    {/* Knob — positioned by left:  progress * 100% inside the inner div */}
                    <div
                        className="absolute pointer-events-none"
                        style={{
                            width: `${KNOB_W}px`,
                            height: `${KNOB_H}px`,
                            top: '50%',
                            left: `${progress * 100}%`,
                            // translate(-50%,-50%) centres the knob on the stop position
                            transform: 'translate(-50%, -50%)',
                            transition: 'left 0.18s ease',
                            zIndex: 10,
                        }}
                    >
                        {/* Pill shadow base */}
                        <div
                            className="absolute inset-0 rounded-full bg-white dark:bg-[#2D2835]"
                            style={{ boxShadow: '0 0.5px 4px rgba(0,0,0,0.14), 0 6px 13px rgba(0,0,0,0.18)' }}
                        />

                        {/* Morphing shape centred inside the pill */}
                        <div
                            className="absolute bg-[#be3627] dark:bg-[#D0BCFF]"
                            style={{
                                width: '22px',
                                height: '22px',
                                top: '50%',
                                left: '50%',
                                transform: 'translate(-50%, -50%)',
                                clipPath: shapeClip,
                                transition: 'clip-path 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)',
                            }}
                        />
                    </div>

                    {/* Number labels — absolutely positioned at the same stop % */}
                    <div className="absolute left-0 right-0" style={{ top: 'calc(100% + 10px)' }}>
                        {stops.map((stop, i) => {
                            const pct = (i / (n - 1)) * 100;
                            const active = i === curIndex;
                            return (
                                <span
                                    key={`lbl-${stop}`}
                                    className={`absolute text-[12px] font-bold tabular-nums transition-all duration-200 ${active
                                        ? 'text-[#be3627] dark:text-[#D0BCFF]'
                                        : 'text-[rgba(60,60,67,0.5)] dark:text-[rgba(202,196,208,0.5)]'
                                        }`}
                                    style={{
                                        left: `${pct}%`,
                                        transform: active
                                            ? 'translateX(-50%) scale(1.1)'
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
