declare module 'expo-router' {
  export const Stack: any;
  export const Tabs: any;
  export const Slot: any;
  export function useRouter(): any;
  export function useLocalSearchParams<T extends Record<string, any> = Record<string, any>>(): T;
  export function useNavigation(): any;
  export function useSegments(): string[];
  export function usePathname(): string;
  export const Link: any;
  export const Redirect: any;
  export const SplashScreen: any;
}

declare module 'expo-router/html' {
  export const ScrollViewStyleReset: any;
}
