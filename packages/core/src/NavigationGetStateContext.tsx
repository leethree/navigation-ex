import * as React from 'react';
import { NavigationState } from './types';

const NavigationGetStateContext = React.createContext<
  ((key: string, getter: () => NavigationState) => void) | undefined
>(undefined);

export default NavigationGetStateContext;
