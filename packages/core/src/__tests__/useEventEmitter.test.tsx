import * as React from 'react';
import { render, act } from 'react-native-testing-library';
import useNavigationBuilder from '../useNavigationBuilder';
import NavigationContainer from '../NavigationContainer';
import Screen from '../Screen';
import MockRouter from './__fixtures__/MockRouter';
import { Router, NavigationState } from '../types';

it('fires focus and blur events in root navigator', () => {
  const TestNavigator = React.forwardRef((props: any, ref: any): any => {
    const { state, navigation, descriptors } = useNavigationBuilder(
      MockRouter,
      props
    );

    React.useImperativeHandle(ref, () => navigation, [navigation]);

    return state.routes.map(route => descriptors[route.key].render());
  });

  const firstFocusCallback = jest.fn();
  const firstBlurCallback = jest.fn();

  const secondFocusCallback = jest.fn();
  const secondBlurCallback = jest.fn();

  const thirdFocusCallback = jest.fn();
  const thirdBlurCallback = jest.fn();

  const fourthFocusCallback = jest.fn();
  const fourthBlurCallback = jest.fn();

  const createComponent = (focusCallback: any, blurCallback: any) => ({
    navigation,
  }: any) => {
    React.useEffect(() => navigation.addListener('focus', focusCallback), [
      navigation,
    ]);

    React.useEffect(() => navigation.addListener('blur', blurCallback), [
      navigation,
    ]);

    return null;
  };

  const navigation = React.createRef<any>();

  const element = (
    <NavigationContainer>
      <TestNavigator ref={navigation}>
        <Screen
          name="first"
          component={createComponent(firstFocusCallback, firstBlurCallback)}
        />
        <Screen
          name="second"
          component={createComponent(secondFocusCallback, secondBlurCallback)}
        />
        <Screen
          name="third"
          component={createComponent(thirdFocusCallback, thirdBlurCallback)}
        />
        <Screen
          name="fourth"
          component={createComponent(fourthFocusCallback, fourthBlurCallback)}
        />
      </TestNavigator>
    </NavigationContainer>
  );

  render(element);

  expect(firstFocusCallback).toBeCalledTimes(1);
  expect(firstBlurCallback).toBeCalledTimes(0);
  expect(secondFocusCallback).toBeCalledTimes(0);
  expect(secondBlurCallback).toBeCalledTimes(0);
  expect(thirdFocusCallback).toBeCalledTimes(0);
  expect(thirdBlurCallback).toBeCalledTimes(0);
  expect(fourthFocusCallback).toBeCalledTimes(0);
  expect(fourthBlurCallback).toBeCalledTimes(0);

  act(() => navigation.current.navigate('second'));

  expect(firstBlurCallback).toBeCalledTimes(1);
  expect(secondFocusCallback).toBeCalledTimes(1);

  act(() => navigation.current.navigate('fourth'));

  expect(firstFocusCallback).toBeCalledTimes(1);
  expect(firstBlurCallback).toBeCalledTimes(1);
  expect(secondFocusCallback).toBeCalledTimes(1);
  expect(secondBlurCallback).toBeCalledTimes(1);
  expect(thirdFocusCallback).toBeCalledTimes(0);
  expect(thirdBlurCallback).toBeCalledTimes(0);
  expect(fourthFocusCallback).toBeCalledTimes(1);
  expect(fourthBlurCallback).toBeCalledTimes(0);
});

it('fires focus and blur events in nested navigator', () => {
  const TestNavigator = React.forwardRef((props: any, ref: any): any => {
    const { state, navigation, descriptors } = useNavigationBuilder(
      MockRouter,
      props
    );

    React.useImperativeHandle(ref, () => navigation, [navigation]);

    return state.routes.map(route => descriptors[route.key].render());
  });

  const firstFocusCallback = jest.fn();
  const firstBlurCallback = jest.fn();

  const secondFocusCallback = jest.fn();
  const secondBlurCallback = jest.fn();

  const thirdFocusCallback = jest.fn();
  const thirdBlurCallback = jest.fn();

  const fourthFocusCallback = jest.fn();
  const fourthBlurCallback = jest.fn();

  const createComponent = (focusCallback: any, blurCallback: any) => ({
    navigation,
  }: any) => {
    React.useEffect(() => navigation.addListener('focus', focusCallback), [
      navigation,
    ]);

    React.useEffect(() => navigation.addListener('blur', blurCallback), [
      navigation,
    ]);

    return null;
  };

  const parent = React.createRef<any>();
  const child = React.createRef<any>();

  const element = (
    <NavigationContainer>
      <TestNavigator ref={parent}>
        <Screen
          name="first"
          component={createComponent(firstFocusCallback, firstBlurCallback)}
        />
        <Screen
          name="second"
          component={createComponent(secondFocusCallback, secondBlurCallback)}
        />
        <Screen name="nested">
          {() => (
            <TestNavigator ref={child}>
              <Screen
                name="third"
                component={createComponent(
                  thirdFocusCallback,
                  thirdBlurCallback
                )}
              />
              <Screen
                name="fourth"
                component={createComponent(
                  fourthFocusCallback,
                  fourthBlurCallback
                )}
              />
            </TestNavigator>
          )}
        </Screen>
      </TestNavigator>
    </NavigationContainer>
  );

  render(element);

  expect(thirdFocusCallback).toBeCalledTimes(0);
  expect(firstFocusCallback).toBeCalledTimes(1);

  act(() => child.current.navigate('fourth'));

  expect(firstFocusCallback).toBeCalledTimes(1);
  expect(fourthFocusCallback).toBeCalledTimes(0);
  expect(thirdFocusCallback).toBeCalledTimes(0);

  act(() => parent.current.navigate('second'));

  expect(thirdFocusCallback).toBeCalledTimes(0);
  expect(secondFocusCallback).toBeCalledTimes(1);

  act(() => parent.current.navigate('nested'));

  expect(firstBlurCallback).toBeCalledTimes(1);
  expect(thirdFocusCallback).toBeCalledTimes(0);
  expect(fourthFocusCallback).toBeCalledTimes(1);

  act(() => parent.current.navigate('third'));

  expect(fourthBlurCallback).toBeCalledTimes(1);
  expect(thirdFocusCallback).toBeCalledTimes(1);
});

it('fires blur event when a route is removed with a delay', async () => {
  const TestRouter = (options: any): Router<NavigationState, any> => {
    const router = MockRouter(options);

    return {
      ...router,

      getInitialState({ routeNames, routeParamList }) {
        const initialRouteName =
          options.initialRouteName !== undefined
            ? options.initialRouteName
            : routeNames[0];

        return {
          stale: false,
          key: 'stack',
          index: 0,
          routeNames,
          routes: [
            {
              key: initialRouteName,
              name: initialRouteName,
              params: routeParamList[initialRouteName],
            },
          ],
        };
      },

      getStateForAction(state, action) {
        switch (action.type) {
          case 'PUSH':
            return {
              ...state,
              index: state.index + 1,
              routes: [...state.routes, action.payload],
            };
          case 'POP': {
            const routes = state.routes.slice(0, -1);

            return {
              ...state,
              index: routes.length - 1,
              routes,
            };
          }
          default:
            return router.getStateForAction(state, action);
        }
      },

      actionCreators: {
        push(payload) {
          return { type: 'PUSH', payload };
        },

        pop() {
          return { type: 'POP' };
        },
      },
    };
  };

  const TestNavigator = React.forwardRef((props: any, ref: any): any => {
    const { state, navigation, descriptors } = useNavigationBuilder(
      TestRouter,
      props
    );

    React.useImperativeHandle(ref, () => navigation, [navigation]);

    const [previous, dispatch] = React.useReducer(
      (state, action) => {
        if (state.routes !== action.routes) {
          return { ...state, ...action };
        }

        return state;
      },
      { routes: state.routes, descriptors }
    );

    React.useEffect(() => {
      dispatch({ routes: state.routes, descriptors });
    }, [descriptors, state.routes]);

    return previous.routes.map((route: any) =>
      previous.descriptors[route.key].render()
    );
  });

  const blurCallback = jest.fn();

  const First = () => null;

  const Second = ({ navigation }: any) => {
    React.useEffect(() => navigation.addListener('blur', blurCallback), [
      navigation,
    ]);

    return null;
  };

  const navigation = React.createRef<any>();

  const element = (
    <NavigationContainer>
      <TestNavigator ref={navigation}>
        <Screen name="first" component={First} />
        <Screen name="second" component={Second} />
      </TestNavigator>
    </NavigationContainer>
  );

  render(element);

  act(() =>
    navigation.current.push({
      name: 'second',
      key: 'second',
    })
  );

  expect(blurCallback).toBeCalledTimes(0);

  act(() => navigation.current.pop());

  expect(blurCallback).toBeCalledTimes(1);
});

it('fires custom events', () => {
  const eventName = 'someSuperCoolEvent';

  const TestNavigator = React.forwardRef((props: any, ref: any): any => {
    const { state, navigation, descriptors } = useNavigationBuilder(
      MockRouter,
      props
    );

    React.useImperativeHandle(ref, () => ({ navigation, state }), [
      navigation,
      state,
    ]);

    return state.routes.map(route => descriptors[route.key].render());
  });

  const firstCallback = jest.fn();
  const secondCallback = jest.fn();
  const thirdCallback = jest.fn();

  const createComponent = (callback: any) => ({ navigation }: any) => {
    React.useEffect(() => navigation.addListener(eventName, callback), [
      navigation,
    ]);

    return null;
  };

  const ref = React.createRef<any>();

  const element = (
    <NavigationContainer>
      <TestNavigator ref={ref}>
        <Screen name="first" component={createComponent(firstCallback)} />
        <Screen name="second" component={createComponent(secondCallback)} />
        <Screen name="third" component={createComponent(thirdCallback)} />
      </TestNavigator>
    </NavigationContainer>
  );

  render(element);

  expect(firstCallback).toBeCalledTimes(0);
  expect(secondCallback).toBeCalledTimes(0);
  expect(thirdCallback).toBeCalledTimes(0);

  act(() => {
    ref.current.navigation.emit({
      type: eventName,
      target: ref.current.state.routes[ref.current.state.routes.length - 1].key,
      data: 42,
    });
  });

  expect(firstCallback).toBeCalledTimes(0);
  expect(secondCallback).toBeCalledTimes(0);
  expect(thirdCallback).toBeCalledTimes(1);
  expect(thirdCallback.mock.calls[0][0].type).toBe('someSuperCoolEvent');
  expect(thirdCallback.mock.calls[0][0].data).toBe(42);

  act(() => {
    ref.current.navigation.emit({ type: eventName });
  });

  expect(firstCallback).toBeCalledTimes(1);
  expect(secondCallback).toBeCalledTimes(1);
  expect(thirdCallback).toBeCalledTimes(2);
});
