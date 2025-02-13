import * as React from 'react';
import * as CommonActions from './CommonActions';
import { NavigationEventEmitter } from './useEventEmitter';
import NavigationContext from './NavigationContext';

import {
  NavigationAction,
  NavigationHelpers,
  NavigationProp,
  ParamListBase,
  NavigationState,
  Router,
} from './types';

type Options<State extends NavigationState> = {
  state: State;
  getState: () => State;
  navigation: NavigationHelpers<ParamListBase> &
    Partial<NavigationProp<ParamListBase, string, any, any, any>>;
  setOptions: (
    cb: (options: { [key: string]: object }) => { [key: string]: object }
  ) => void;
  router: Router<State, NavigationAction>;
  emitter: NavigationEventEmitter;
};

type NavigationCache<
  State extends NavigationState,
  ScreenOptions extends object
> = {
  [key: string]: NavigationProp<ParamListBase, string, State, ScreenOptions>;
};

/**
 * Hook to cache navigation objects for each screen in the navigator.
 * It's important to cache them to make sure navigation objects don't change between renders.
 * This lets us apply optimizations like `React.memo` to minimize re-rendering screens.
 */
export default function useNavigationCache<
  State extends NavigationState,
  ScreenOptions extends object
>({
  state,
  getState,
  navigation,
  setOptions,
  router,
  emitter,
}: Options<State>) {
  // Cache object which holds navigation objects for each screen
  // We use `React.useMemo` instead of `React.useRef` coz we want to invalidate it when deps change
  // In reality, these deps will rarely change, if ever
  const parentNavigation = React.useContext(NavigationContext);

  const cache = React.useMemo(
    () => ({ current: {} as NavigationCache<State, ScreenOptions> }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [getState, navigation, setOptions, router, emitter, parentNavigation]
  );

  const actions = {
    ...router.actionCreators,
    ...CommonActions,
  };

  cache.current = state.routes.reduce<NavigationCache<State, ScreenOptions>>(
    (acc, route, index) => {
      const previous = cache.current[route.key];
      const isFirst = route.key === state.routes[0].key;

      if (previous && previous.isFirstRouteInParent() === isFirst) {
        // If a cached navigation object already exists and has same `isFirstRouteInParent`, reuse it
        // This method could return different result if the index of the route changes somehow
        acc[route.key] = previous;
      } else {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { emit, ...rest } = navigation;

        const dispatch = (
          action: NavigationAction | ((state: State) => NavigationAction)
        ) => {
          const payload =
            typeof action === 'function' ? action(getState()) : action;

          navigation.dispatch(
            typeof payload === 'object' && payload != null
              ? { source: route.key, ...payload }
              : payload
          );
        };

        const helpers = Object.keys(actions).reduce(
          (acc, name) => {
            // @ts-ignore
            acc[name] = (...args: any) => dispatch(actions[name](...args));
            return acc;
          },
          {} as { [key: string]: () => void }
        );

        acc[route.key] = {
          ...rest,
          ...helpers,
          ...emitter.create(route.key),
          dangerouslyGetParent: () => parentNavigation as any,
          dangerouslyGetState: getState,
          dispatch,
          setOptions: (options: object) =>
            setOptions(o => ({
              ...o,
              [route.key]: { ...o[route.key], ...options },
            })),
          isFocused: () => {
            const state = getState();

            if (index !== state.index) {
              return false;
            }

            // If the current screen is focused, we also need to check if parent navigator is focused
            // This makes sure that we return the focus state in the whole tree, not just this navigator
            return navigation ? navigation.isFocused() : true;
          },
          isFirstRouteInParent: () => isFirst,
        };
      }

      return acc;
    },
    {}
  );

  return cache.current;
}
