import { motion, useInView } from 'motion/react';
import React, { useRef } from 'react';
import { cn } from '../../lib/utils';

const defaultContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const defaultItemVariants = {
  hidden: { opacity: 0, y: 20, filter: 'blur(4px)' },
  visible: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: 0.45, ease: [0.25, 0.1, 0.25, 1] },
  },
};

export function AnimatedGroup({
  children,
  className,
  variants,
  viewOptions = { margin: '0px 0px -50px 0px', once: true },
  as = 'div',
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, viewOptions);
  const Component = motion[as] || motion.div;

  const containerVariants = {
    ...defaultContainerVariants,
    ...variants?.container,
  };

  const itemVariants = {
    ...defaultItemVariants,
    ...variants?.item,
  };

  return (
    <Component
      ref={ref}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
      variants={containerVariants}
      className={cn(className)}
    >
      {React.Children.map(children, (child, index) => {
        if (!React.isValidElement(child)) return child;
        return (
          <motion.div key={child.key || index} variants={itemVariants}>
            {child}
          </motion.div>
        );
      })}
    </Component>
  );
}
