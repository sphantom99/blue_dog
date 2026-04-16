
import { useEffect, useRef } from 'react';
import { CountUp, type CountUpOptions } from 'countup.js';

export function useCountUp<T extends HTMLElement = HTMLElement>(endVal: number, options?: CountUpOptions) {
    const ref = useRef<T>(null);
    const countUpRef = useRef<CountUp | null>(null);
    const optionsRef = useRef(options);

    useEffect(() => {
        optionsRef.current = options;
    });

    useEffect(() => {
        if (!ref.current) return;

        const anim = new CountUp(ref.current, endVal, optionsRef.current);
        countUpRef.current = anim;

        if (!anim.error) {
            anim.start();
        } else {
            console.error(anim.error);
        }
    }, [endVal]);

    return ref;
}
