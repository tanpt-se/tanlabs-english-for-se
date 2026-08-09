import NetInfo, { NetInfoStateType } from '@react-native-community/netinfo';
import { onlineManager } from '@tanstack/react-query';
import { createContext, useContext, useEffect, useState } from 'react';

import type { NetInfoState } from '@react-native-community/netinfo';
import type { PropsWithChildren } from 'react';

type NetworkStatus = {
  connectionType: NetInfoStateType;
  isConnectionKnown: boolean;
  isOnline: boolean;
};

const initialStatus: NetworkStatus = {
  connectionType: NetInfoStateType.unknown,
  isConnectionKnown: false,
  isOnline: true,
};

const NetworkContext = createContext<NetworkStatus>(initialStatus);

function getNetworkStatus(state: NetInfoState): NetworkStatus {
  const isConnectionKnown = state.isConnected !== null;
  // Treat null reachability as unknown/online so OS-flaky simulators do not
  // pause mutations after a transient airplane/Wi-Fi toggle.
  const reachable = state.isInternetReachable;
  const isOnline = state.isConnected !== false && reachable !== false;

  return {
    connectionType: state.type,
    isConnectionKnown,
    isOnline,
  };
}

export function NetworkProvider({ children }: PropsWithChildren) {
  const [status, setStatus] = useState(initialStatus);

  useEffect(
    () =>
      NetInfo.addEventListener((state) => {
        const nextStatus = getNetworkStatus(state);
        onlineManager.setOnline(nextStatus.isOnline);
        setStatus(nextStatus);
      }),
    [],
  );

  return <NetworkContext.Provider value={status}>{children}</NetworkContext.Provider>;
}

export function useNetworkStatus() {
  return useContext(NetworkContext);
}
