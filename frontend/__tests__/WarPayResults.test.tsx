import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import WarPayCalculator from '../src/components/WarPayCalculator';
import api from '../src/lib/api';

jest.mock('../src/lib/api');
const mockedApi = api as jest.Mocked<typeof api>;

jest.mock('../src/contexts/ToastContext', () => ({
  useToast: () => ({ showToast: jest.fn() }),
}));

describe('WarPayCalculator Results Table', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the results table after successful calculation', async () => {
    const mockPayouts = [
      { playerId: 123, respect: 100, hits: 5, payout: 500000 },
      { playerId: 456, respect: 50, hits: 2, payout: 250000 }
    ];
    mockedApi.post.mockResolvedValueOnce({ data: mockPayouts });

    render(<WarPayCalculator />);

    const input = screen.getByPlaceholderText(/enter total budget/i);
    const button = screen.getByRole('button', { name: /calculate/i });

    fireEvent.change(input, { target: { value: '750000' } });
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText('Player ID')).toBeInTheDocument();
    });

    expect(screen.getByText('123')).toBeInTheDocument();
    expect(screen.getByText('$500,000')).toBeInTheDocument();
    expect(screen.getByText('456')).toBeInTheDocument();
    expect(screen.getByText('$250,000')).toBeInTheDocument();
  });
});
