import { I18nManager } from 'react-native';
import Animated from 'react-native-reanimated';
import { DrawerInterpolatorProps } from '../types';

const { cond, eq, min, max, multiply, interpolate } = Animated;

const PROGRESS_EPSILON = 0.05;
const DIRECTION_LEFT = 1;
const DIRECTION_RIGHT = -1;

export function forFront({
  align,
  progress,
  layouts,
}: DrawerInterpolatorProps) {
  const translateX = multiply(progress, layouts.drawer.width, align);

  const opacity = interpolate(progress, {
    inputRange: [PROGRESS_EPSILON, 1],
    outputRange: [0, 1],
  });

  return {
    drawerStyle: { transform: [{ translateX }] },
    contentStyle: { transform: [{ translateX: 0 }] },
    overlayStyle: { opacity },
  };
}

export function forBack({ align, progress, layouts }: DrawerInterpolatorProps) {
  const translateX = multiply(progress, layouts.drawer.width, align);

  const opacity = interpolate(progress, {
    inputRange: [PROGRESS_EPSILON, 1],
    outputRange: [0, 1],
  });

  return {
    drawerStyle: {
      transform: [
        {
          translateX: I18nManager.isRTL
            ? multiply(layouts.drawer.width, DIRECTION_RIGHT)
            : layouts.drawer.width,
        },
      ],
    },
    contentStyle: {
      transform: [{ translateX }],
    },
    overlayStyle: { opacity },
  };
}

export function forSlide({
  align,
  progress,
  layouts,
}: DrawerInterpolatorProps) {
  const translateX = multiply(progress, layouts.drawer.width, align);

  const opacity = interpolate(progress, {
    inputRange: [PROGRESS_EPSILON, 1],
    outputRange: [0, 1],
  });

  return {
    drawerStyle: {
      transform: [{ translateX }],
    },
    contentStyle: {
      transform: [{ translateX }],
    },
    overlayStyle: { opacity },
  };
}
