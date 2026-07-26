import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import UnifiedLogs from '../src/components/UnifiedLogs';
import api from '../src/lib/api';

jest.mock('../src/lib/api');
jest.mock('../src/contexts/ToastContext', () => ({
  useToast: () => ({ showToast: jest.fn() })
}));

const mockIntersectionObserver = jest.fn();
mockIntersectionObserver.prototype.observe = jest.fn();
mockIntersectionObserver.prototype.disconnect = jest.fn();
window.IntersectionObserver = mockIntersectionObserver;

describe('UnifiedLogs Component', () => {
  const mockLogs = [
    {
      id: '1',
      type: 'armory',
      timestamp: 1600000000,
      news: '<a href="https://www.torn.com/profiles.php?XID=1">Player1</a> withdrew 5x Xanax from the armory.'
    },
    {
      id: '2',
      type: 'funds',
      timestamp: 1600000100,
      news: '<a href="https://www.torn.com/profiles.php?XID=2">Player2</a> deposited $1,000,000 into the faction vault.'
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (api.get as jest.Mock).mockResolvedValue({ data: mockLogs });
  });

  it('renders correctly and fetches logs', async () => {
    render(<UnifiedLogs />);

    expect(screen.getByText(/Connecting to Torn servers/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText(/Player1/i)).toBeInTheDocument();
      expect(screen.getByText(/Player2/i)).toBeInTheDocument();
    });
  });

  it('filters logs by search term', async () => {
    render(<UnifiedLogs />);

    await waitFor(() => expect(screen.getByText(/Player1/i)).toBeInTheDocument());

    const searchInput = screen.getByPlaceholderText(/Search all intel/i);
    fireEvent.change(searchInput, { target: { value: 'Xanax' } });

    expect(screen.getByText(/Player1/i)).toBeInTheDocument();
    expect(screen.queryByText(/Player2/i)).not.toBeInTheDocument();
  });

  it('filters logs by category tab', async () => {
    render(<UnifiedLogs />);

    await waitFor(() => expect(screen.getByText(/Player1/i)).toBeInTheDocument());

    const fundsTab = screen.getByRole('button', { name: /Funds/i });
    fireEvent.click(fundsTab);

    expect(screen.queryByText(/Player1/i)).not.toBeInTheDocument();
    expect(screen.getByText(/Player2/i)).toBeInTheDocument();
  });
});
