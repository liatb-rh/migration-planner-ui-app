import React, { useRef, useState } from "react";
import { useMountedState } from "react-use";

// Local hook similar to react-use's useAsyncFn but clears error at start
type AsyncState<TReturn> = {
  loading: boolean;
  value?: TReturn;
  error?: unknown;
};

export const useAsyncFnResetError = <TArgs extends unknown[], TReturn>(
  fn: (...args: TArgs) => Promise<TReturn>,
  deps: React.DependencyList = [],
): [AsyncState<TReturn>, (...args: TArgs) => Promise<TReturn>] => {
  const lastCallId = useRef(0);
  const isMounted = useMountedState();
  const [state, setState] = useState<AsyncState<TReturn>>({ loading: false });

  const callback = React.useCallback(
    (...args: TArgs) => {
      const callId = ++lastCallId.current;
      setState((prev) => ({ ...prev, loading: true, error: undefined }));
      return fn(...args).then(
        (value) => {
          if (isMounted() && callId === lastCallId.current) {
            setState({ value, loading: false });
          }
          return value;
        },
        (error) => {
          if (isMounted() && callId === lastCallId.current) {
            setState({ error, loading: false });
          }
          return error as unknown as TReturn;
        },
      );
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    deps,
  );

  return [state, callback] as const;
};
