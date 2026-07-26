import { render, screen } from '@testing-library/react';
import Dashboard from '../src/app/dashboard/page';

jest.mock('../src/contexts/ToastContext', () => ({
  useToast: () => ({ showToast: jest.fn() }),
}));

describe('War Pay UI', () => {
  it('renders the War Pay Calculator section', () => {
    render(<Dashboard />);
    expect(screen.getByText(/war pay calculator/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/enter total budget/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /calculate/i })).toBeInTheDocument();
  });
});
