import { render, screen, waitFor } from '@testing-library/react';
import FactionPulse from '../src/components/FactionPulse';
import api from '../src/lib/api';

jest.mock('../src/lib/api');
const mockedApi = api as jest.Mocked<typeof api>;

jest.mock('../src/contexts/ToastContext', () => ({
  useToast: () => ({ showToast: jest.fn() }),
}));

describe('FactionPulse', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('displays a loading state initially', () => {
    mockedApi.get.mockImplementation(() => new Promise(() => {}));
    render(<FactionPulse />);
    expect(screen.getByText(/loading pulse\.\.\./i)).toBeInTheDocument();
  });

  it('fetches and displays faction data successfully', async () => {
    mockedApi.get.mockResolvedValueOnce({
      data: { name: 'Test Faction', respect: 150000, memberCount: 85 }
    });

    render(<FactionPulse />);

    await waitFor(() => {
      expect(screen.getByText('Test Faction')).toBeInTheDocument();
    });

    expect(screen.getByText('150,000')).toBeInTheDocument();
    expect(screen.getByText('85')).toBeInTheDocument();
  });

  it('handles API errors gracefully', async () => {
    mockedApi.get.mockRejectedValueOnce(new Error('API Error'));
    render(<FactionPulse />);

    await waitFor(() => {
      expect(screen.queryByText(/loading pulse\.\.\./i)).not.toBeInTheDocument();
    });

    expect(screen.getAllByText('---').length).toBeGreaterThan(0);
  });
});
