'use client';

import React, { useState, useEffect, useRef } from 'react';

interface CounterProps {
  value: number;
  duration?: number; // duration in ms
}

export const Counter: React.FC<CounterProps> = ({ value, duration = 1500 }) => {
  const [count, setCount] = useState(0);
  const countRef = useRef(0);
  const isAnimated = useRef(false);

  useEffect(() => {
    if (isAnimated.current) {
      setCount(value);
      return;
    }

    let startTimestamp: number | null = null;
    const step = (timestamp: number) => {
      if (!startTimestamp) {
        startTimestamp = timestamp;
      }
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const currentCount = Math.floor(progress * value);
      
      countRef.current = currentCount;
      setCount(currentCount);

      if (progress < 1) {
        window.requestAnimationFrame(step);
      } else {
        setCount(value);
        isAnimated.current = true;
      }
    };

    window.requestAnimationFrame(step);
  }, [value, duration]);

  return <span>{count.toLocaleString()}</span>;
};

export default Counter;
