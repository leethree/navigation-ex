import * as React from 'react';
import SceneView from './SceneView';
import NavigationBuilderContext, {
  ChildActionListener,
  FocusedNavigationListener,
  NavigatorStateGetter,
} from './NavigationBuilderContext';
import { NavigationEventEmitter } from './useEventEmitter';
import useNavigationCache from './useNavigationCache';
import {
  Descriptor,
  NavigationAction,
  NavigationHelpers,
  NavigationState,
  ParamListBase,
  RouteConfig,
  RouteProp,
  Router,
} from './types';

type Options<State extends NavigationState, ScreenOptions extends object> = {
  state: State;
  screens: { [key: string]: RouteConfig<ParamListBase, string, ScreenOptions> };
  navigation: NavigationHelpers<ParamListBase>;
  screenOptions?:
    | ScreenOptions
    | ((props: {
        route: RouteProp<ParamListBase, string>;
        navigation: any;
      }) => ScreenOptions);
  onAction: (
    action: NavigationAction,
    visitedNavigators?: Set<string>
  ) => boolean;
  getState: () => State;
  setState: (state: State) => void;
  addActionListener: (listener: ChildActionListener) => void;
  addFocusedListener: (listener: FocusedNavigationListener) => void;
  addStateGetter: (key: string, getter: NavigatorStateGetter) => void;
  onRouteFocus: (key: string) => void;
  router: Router<State, NavigationAction>;
  emitter: NavigationEventEmitter;
};

/**
 * Hook to create descriptor objects for the child routes.
 *
 * A descriptor object provides 3 things:
 * - Helper method to render a screen
 * - Options specified by the screen for the navigator
 * - Navigation object intended for the route
 */
export default function useDescriptors<
  State extends NavigationState,
  ScreenOptions extends object
>({
  state,
  screens,
  navigation,
  screenOptions,
  onAction,
  getState,
  setState,
  addActionListener,
  addFocusedListener,
  addStateGetter,
  onRouteFocus,
  router,
  emitter,
}: Options<State, ScreenOptions>) {
  const [options, setOptions] = React.useState<{ [key: string]: object }>({});
  const { trackAction } = React.useContext(NavigationBuilderContext);

  const context = React.useMemo(
    () => ({
      navigation,
      onAction,
      addActionListener,
      addFocusedListener,
      addStateGetter,
      onRouteFocus,
      trackAction,
    }),
    [
      navigation,
      onAction,
      addActionListener,
      addFocusedListener,
      onRouteFocus,
      addStateGetter,
      trackAction,
    ]
  );

  const navigations = useNavigationCache<State, ScreenOptions>({
    state,
    getState,
    navigation,
    setOptions,
    router,
    emitter,
  });

  return state.routes.reduce(
    (acc, route) => {
      const screen = screens[route.name];
      const navigation = navigations[route.key];

      acc[route.key] = {
        navigation,
        render() {
          return (
            <NavigationBuilderContext.Provider key={route.key} value={context}>
              <SceneView
                navigation={navigation}
                route={route}
                screen={screen}
                getState={getState}
                setState={setState}
              />
            </NavigationBuilderContext.Provider>
          );
        },
        get options() {
          return {
            // The default `screenOptions` passed to the navigator
            ...(typeof screenOptions === 'object' || screenOptions == null
              ? screenOptions
              : screenOptions({
                  // @ts-ignore
                  route,
                  navigation,
                })),
            // The `options` prop passed to `Screen` elements
            ...(typeof screen.options === 'object' || screen.options == null
              ? screen.options
              : screen.options({
                  // @ts-ignore
                  route,
                  navigation,
                })),
            // The options set via `navigation.setOptions`
            ...options[route.key],
          };
        },
      };

      return acc;
    },
    {} as {
      [key: string]: Descriptor<ParamListBase, string, State, ScreenOptions>;
    }
  );
}
