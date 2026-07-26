import { render, screen } from '@testing-library/react';
import Dashboard from '../src/app/dashboard/page';

jest.mock('../src/contexts/ToastContext', () => ({
  useToast: () => ({ showToast: jest.fn() }),
}));

describe('Dashboard Page', () => {
  it('renders dashboard components', () => {

    render(<Dashboard />);
    expect(screen.getByText(/faction pulse/i)).toBeInTheDocument();
    expect(screen.getByText(/member roster/i)).toBeInTheDocument();
  });
});
