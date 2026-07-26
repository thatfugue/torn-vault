import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import WarPayCalculator from '../src/components/WarPayCalculator';
import api from '../src/lib/api';

jest.mock('../src/lib/api');
const mockedApi = api as jest.Mocked<typeof api>;

jest.mock('../src/contexts/ToastContext', () => ({
  useToast: () => ({ showToast: jest.fn() }),
}));

describe('WarPayCalculator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('submits the budget and fetches payouts', async () => {
    const mockPayouts = [
      { playerId: 1, respect: 100, hits: 5, payout: 500000 },
      { playerId: 2, respect: 50, hits: 2, payout: 250000 }
    ];
    mockedApi.post.mockResolvedValueOnce({ data: mockPayouts });

    render(<WarPayCalculator />);

    const input = screen.getByPlaceholderText(/enter total budget/i);
    const button = screen.getByRole('button', { name: /calculate/i });

    fireEvent.change(input, { target: { value: '750000' } });
    fireEvent.click(button);

    await waitFor(() => {
      expect(mockedApi.post).toHaveBeenCalledWith('/api/faction/payout', expect.objectContaining({
        budget: 750000
      }));
    });

    await waitFor(() => {
        expect(screen.queryByText(/enter a budget and click calculate/i)).not.toBeInTheDocument();
    });
  });

  it('handles calculation errors', async () => {
    mockedApi.post.mockRejectedValueOnce(new Error('Calculation failed'));
    render(<WarPayCalculator />);

    const input = screen.getByPlaceholderText(/enter total budget/i);
    const button = screen.getByRole('button', { name: /calculate/i });

    fireEvent.change(input, { target: { value: '1000' } });
    fireEvent.click(button);

    await waitFor(() => {
        expect(screen.getByRole('button', { name: /calculate/i })).not.toBeDisabled();
    });
  });
});
