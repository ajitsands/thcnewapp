import {
  createNavigationContainerRef,
  StackActions,
} from '@react-navigation/native';

export const navigationRef = createNavigationContainerRef();

export const {goBack} = navigationRef;

export function navigate(name: string, params?: object) {
  if (navigationRef.isReady()) {
    //@ts-ignore
    navigationRef.navigate(name, params);
  }
}

export function replace(name: string, params?: object) {
  if (navigationRef.isReady())
    navigationRef.dispatch(StackActions.replace(name, params));
}

export function navReset(name: string, params?: object) {
  if (navigationRef.isReady()) {
    navigationRef.reset({
      index: 0,
      routes: [{name}],
    });
  }
}

export function navReplace(name: string, params?: object) {
  if (navigationRef.isReady())
    navigationRef.dispatch(StackActions.replace(name, params));
}
