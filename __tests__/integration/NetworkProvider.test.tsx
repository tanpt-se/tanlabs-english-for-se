import NetInfo, { NetInfoStateType } from '@react-native-community/netinfo';
import { onlineManager } from '@tanstack/react-query';
import React from 'react';
import { Text } from 'react-native';
import ReactTestRenderer, { act } from 'react-test-renderer';

import {
  NetworkProvider,
  shouldResumePausedMutations,
  useNetworkStatus,
} from '@/app/providers/NetworkProvider';

describe('NetworkProvider', () => {
  let listener:
    | ((state: Parameters<Parameters<typeof NetInfo.addEventListener>[0]>[0]) => void)
    | undefined;

  beforeEach(() => {
    jest.clearAllMocks();
    listener = undefined;
    jest.spyOn(onlineManager, 'setOnline').mockImplementation(() => undefined);
    jest.mocked(NetInfo.addEventListener).mockImplementation((callback) => {
      listener = callback;
      return jest.fn();
    });
  });

  it('exposes resume gating helpers', () => {
    expect(shouldResumePausedMutations(true, true, true)).toBe(true);
    expect(shouldResumePausedMutations(false, true, true)).toBe(false);
  });

  it('updates context and onlineManager from NetInfo events', async () => {
    function Probe() {
      const status = useNetworkStatus();
      return (
        <Text>{`${status.isOnline}:${status.isConnectionKnown}:${status.connectionType}`}</Text>
      );
    }

    let root!: ReactTestRenderer.ReactTestRenderer;
    await act(() => {
      root = ReactTestRenderer.create(
        <NetworkProvider>
          <Probe />
        </NetworkProvider>,
      );
    });

    expect(root.root.findByType(Text).props.children).toBe('true:false:unknown');

    await act(() => {
      listener?.({
        type: NetInfoStateType.wifi,
        isConnected: true,
        isInternetReachable: true,
        details: null,
      } as never);
    });

    expect(onlineManager.setOnline).toHaveBeenCalledWith(true);
    expect(root.root.findByType(Text).props.children).toBe('true:true:wifi');

    await act(() => {
      listener?.({
        type: NetInfoStateType.none,
        isConnected: false,
        isInternetReachable: false,
        details: null,
      } as never);
    });
    expect(onlineManager.setOnline).toHaveBeenCalledWith(false);
    expect(root.root.findByType(Text).props.children).toBe('false:true:none');

    await act(() => {
      listener?.({
        type: NetInfoStateType.wifi,
        isConnected: true,
        isInternetReachable: null,
        details: null,
      } as never);
    });
    expect(onlineManager.setOnline).toHaveBeenCalledWith(true);
    expect(root.root.findByType(Text).props.children).toBe('true:true:wifi');
  });
});
