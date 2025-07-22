import React, { useEffect, useRef } from "react";
import p5 from "p5";

const P5Background: React.FC = () => {
    const sketchRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const sketch = (p: p5) => {
            let t = 0;

            const a = (x: number, y: number) => {
                const w = p.windowWidth;
                const k = (4 + p.sin(y * 2 - t) * 3) * p.cos(x / 29);
                const e = y / 16 - 6;
                const d = Math.hypot(k, e);

                p.stroke((d * 10 + t * 50) % 360, 90, 90, 80);

                const q = 6 * p.sin(k * 2) + 0.6 / k + p.sin(y / 50) * k * (9 + 4 * p.sin(e * 9 - d * 3 + t * 2));
                const c = d - t;

                p.point(
                    q + 60 * p.cos(c) + w / 2,
                    q * p.sin(c) + d * 78 - 150
                );
            };

            p.setup = () => {
                p.createCanvas(p.windowWidth, p.windowHeight);
                p.colorMode(p.HSB, 360, 100, 100, 100);
                p.background(9);
            };

            p.draw = () => {
                p.background(9, 10);
                t += Math.PI / 240;
                for (let i = 1e4; i--;) {
                    a(i, i / 235);
                }
            };

            p.windowResized = () => {
                p.resizeCanvas(p.windowWidth, p.windowHeight);
            };
        };

        let myp5: p5 | undefined;
        if (sketchRef.current) {
            myp5 = new p5(sketch, sketchRef.current);
        }

        return () => {
            myp5?.remove();
        };
    }, []);

    return <div ref={sketchRef} style={{ position: 'fixed', top: 0, left: 0, zIndex: -1 }} />;
};

export default P5Background;