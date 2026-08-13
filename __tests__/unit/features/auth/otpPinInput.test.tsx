import React from 'react';
import { TextInput } from 'react-native';
import ReactTestRenderer, { act } from 'react-test-renderer';

import { OtpPinInput } from '@/features/auth/components/OtpPinInput';

describe('OtpPinInput', () => {
  it('renders six digit boxes and forwards numeric input', async () => {
    const onChange = jest.fn();
    let root!: ReactTestRenderer.ReactTestRenderer;

    await act(() => {
      root = ReactTestRenderer.create(
        <OtpPinInput testID="signup-otp" value="12" onChange={onChange} />,
      );
    });

    expect(root.root.findByProps({ testID: 'signup-otp-boxes' })).toBeTruthy();

    const input = root.root.findByType(TextInput);
    await act(() => {
      input.props.onChangeText('123456');
    });

    expect(onChange).toHaveBeenCalledWith('123456');
  });

  it('strips non-digits and caps at six characters', async () => {
    const onChange = jest.fn();
    let root!: ReactTestRenderer.ReactTestRenderer;

    await act(() => {
      root = ReactTestRenderer.create(<OtpPinInput value="" onChange={onChange} />);
    });

    const input = root.root.findByType(TextInput);
    await act(() => {
      input.props.onChangeText('12ab345678');
    });

    expect(onChange).toHaveBeenCalledWith('123456');
  });

  it('forwards aria props to the hidden input', async () => {
    let root!: ReactTestRenderer.ReactTestRenderer;

    await act(() => {
      root = ReactTestRenderer.create(
        <OtpPinInput
          aria-describedby="otp-error"
          aria-invalid
          testID="signup-otp"
          value=""
          onChange={jest.fn()}
        />,
      );
    });

    const input = root.root.findByType(TextInput);
    expect(input.props['aria-describedby']).toBe('otp-error');
    expect(input.props['aria-invalid']).toBe(true);
  });

  it('supports error styling, focus, and hidden label', async () => {
    let root!: ReactTestRenderer.ReactTestRenderer;

    await act(() => {
      root = ReactTestRenderer.create(
        <OtpPinInput error showLabel={false} testID="otp" value="1" onChange={jest.fn()} />,
      );
    });

    expect(root.root.findByProps({ testID: 'otp-boxes' })).toBeTruthy();

    const input = root.root.findByType(TextInput);
    await act(() => {
      input.props.onFocus();
      input.props.onBlur();
    });
  });
});
