import { render, screen, waitFor } from '@testing-library/react';
import MemberRoster from '../src/components/MemberRoster';
import api from '../src/lib/api';

jest.mock('../src/lib/api');
const mockedApi = api as jest.Mocked<typeof api>;

jest.mock('../src/contexts/ToastContext', () => ({
  useToast: () => ({ showToast: jest.fn() }),
}));

describe('MemberRoster', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('displays a loading state initially', () => {
    mockedApi.get.mockImplementation(() => new Promise(() => {}));
    render(<MemberRoster />);
    expect(screen.getByText(/synchronizing roster data\.\.\./i)).toBeInTheDocument();
  });

  it('fetches and displays member data successfully', async () => {
    mockedApi.get.mockResolvedValueOnce({
      data: [
        { id: '1', name: 'Member 1', status: 'Online', state: 'Okay' },
        { id: '2', name: 'Member 2', status: 'Offline', state: 'Okay' },
      ]
    });

    render(<MemberRoster />);

    await waitFor(() => {
      expect(screen.getByText('Member 1')).toBeInTheDocument();
    });

    expect(screen.getByText('Online')).toBeInTheDocument();
    expect(screen.getByText('Member 2')).toBeInTheDocument();
    expect(screen.getByText('Offline')).toBeInTheDocument();
  });

  it('handles empty member list', async () => {
    mockedApi.get.mockResolvedValueOnce({ data: [] });
    render(<MemberRoster />);

    await waitFor(() => {
      expect(screen.getByText(/no intelligence data available/i)).toBeInTheDocument();
    });
  });
});
