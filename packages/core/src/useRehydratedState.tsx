import * as React from 'react';
import { NavigationState, Route } from './types';
import NavigationGetStateContext from './NavigationGetStateContext';

type OnGetState = () => NavigationState;

type Options = {
  route: Route<string>;
  getState: () => NavigationState;
};

export default function useRehydratedState({ route, getState }: Options) {
  const parentAddStateGetters = React.useContext(NavigationGetStateContext);
  const childStateGettersRef = React.useRef<{
    [key: string]: OnGetState | undefined;
  }>({});

  const routeKey = route && route.key;

  const getRehydratedState = React.useCallback(() => {
    const state = getState();

    return {
      ...state,
      routes: state.routes.map(route => {
        if (route.state && route.state.stale === false) {
          return route;
        }

        const stateGetter = childStateGettersRef.current[route.key];
        const childState = stateGetter && stateGetter();

        if (childState) {
          return {
            ...route,
            state: childState,
          };
        }

        return route;
      }),
    };
  }, [getState]);

  React.useEffect(() => {
    if (routeKey && parentAddStateGetters) {
      return parentAddStateGetters(routeKey, getRehydratedState);
    }
  }, [getRehydratedState, getState, parentAddStateGetters, routeKey]);

  const onGetState = React.useCallback((key: string, getter: OnGetState) => {
    childStateGettersRef.current[key] = getter;

    return () => {
      childStateGettersRef.current[key] = undefined;
    };
  }, []);

  return {
    getRehydratedState,
    onGetState,
  };
}
