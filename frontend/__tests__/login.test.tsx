import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import LoginPage from '../src/app/login/page';
import { useAuth } from '../src/contexts/AuthContext';
import { useRouter } from 'next/navigation';

jest.mock('../src/contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}));

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

describe('Login Page', () => {
  const mockLogin = jest.fn();
  const mockPush = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useAuth as jest.Mock).mockReturnValue({
      login: mockLogin,
      loading: false,
    });
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });
  });

  it('renders login form', () => {
    render(<LoginPage />);
    expect(screen.getByRole('heading', { name: /login to tornvault/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/torn public api key/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
  });

  it('submits the form with the API key', async () => {
    render(<LoginPage />);

    const input = screen.getByLabelText(/torn public api key/i);
    const button = screen.getByRole('button', { name: /login/i });

    fireEvent.change(input, { target: { value: 'test-api-key' } });
    fireEvent.click(button);

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('test-api-key');
    });
  });

  it('shows loading state during submission', () => {
    (useAuth as jest.Mock).mockReturnValue({
      login: mockLogin,
      loading: true,
    });

    render(<LoginPage />);
    expect(screen.getByRole('button', { name: /logging in\.\.\./i })).toBeDisabled();
  });
});
