import { motion, useInView } from 'motion/react';
import React, { useRef } from 'react';
import { cn } from '../../lib/utils';

const defaultVariants = {
  hidden: { opacity: 0, y: 32, filter: 'blur(6px)' },
  visible: { opacity: 1, y: 0, filter: 'blur(0px)' },
};

export function InView({
  children,
  variants = defaultVariants,
  transition = { duration: 0.55, ease: [0.21, 0.47, 0.32, 0.98] },
  viewOptions = { margin: '0px 0px -80px 0px', once: true },
  as = 'div',
  className,
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, viewOptions);
  const Component = motion[as] || motion.div;

  return (
    <Component
      ref={ref}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
      variants={variants}
      transition={transition}
      className={cn(className)}
    >
      {children}
    </Component>
  );
}
