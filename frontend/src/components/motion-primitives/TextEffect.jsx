import { motion } from 'motion/react';
import React from 'react';
import { cn } from '../../lib/utils';

const defaultContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.04,
    },
  },
  exit: {
    opacity: 0,
    transition: {
      staggerChildren: 0.02,
      staggerDirection: -1,
    },
  },
};

const defaultItemVariants = {
  hidden: {
    opacity: 0,
    y: 12,
    filter: 'blur(8px)',
  },
  visible: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: {
      duration: 0.45,
      ease: [0.2, 0.65, 0.3, 0.9],
    },
  },
  exit: {
    opacity: 0,
    y: -8,
    filter: 'blur(4px)',
    transition: {
      duration: 0.2,
    },
  },
};

export function TextEffect({
  children,
  per = 'word',
  as = 'div',
  variants,
  className,
  delay = 0,
}) {
  const Component = motion[as] || motion.div;
  let segments = [];

  if (typeof children === 'string') {
    if (per === 'word') {
      segments = children.split(' ');
    } else if (per === 'char') {
      segments = children.split('');
    } else {
      segments = [children];
    }
  } else {
    segments = [children];
  }

  const containerVariants = {
    ...defaultContainerVariants,
    visible: {
      ...defaultContainerVariants.visible,
      transition: {
        ...defaultContainerVariants.visible.transition,
        delayChildren: delay,
      },
    },
    ...variants?.container,
  };

  const itemVariants = {
    ...defaultItemVariants,
    ...variants?.item,
  };

  return (
    <Component
      initial="hidden"
      animate="visible"
      exit="exit"
      variants={containerVariants}
      className={cn('inline-block', className)}
    >
      {segments.map((segment, index) => (
        <motion.span
          key={index}
          variants={itemVariants}
          className={cn(per === 'word' ? 'inline-block mr-[0.25em] last:mr-0' : 'inline-block')}
        >
          {segment === ' ' ? '\u00A0' : segment}
        </motion.span>
      ))}
    </Component>
  );
}
