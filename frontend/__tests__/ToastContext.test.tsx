import { render, screen, act } from '@testing-library/react';
import { ToastProvider, useToast } from '../src/contexts/ToastContext';
import React from 'react';

const TestComponent = () => {
  const { showToast } = useToast();

  return (
    <div>
      <button onClick={() => showToast('Test Error Message', 'error')}>Show Error</button>
      <button onClick={() => showToast('Test Success Message', 'success')}>Show Success</button>
    </div>
  );
};

describe('ToastContext', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders a toast when showToast is called', () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    expect(screen.queryByText('Test Error Message')).not.toBeInTheDocument();

    act(() => {
      screen.getByText('Show Error').click();
    });

    expect(screen.getByText('Test Error Message')).toBeInTheDocument();
  });

  it('auto-dismisses toasts after a timeout', () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    act(() => {
      screen.getByText('Show Success').click();
    });

    expect(screen.getByText('Test Success Message')).toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(5000);
    });

    expect(screen.queryByText('Test Success Message')).not.toBeInTheDocument();
  });
});
