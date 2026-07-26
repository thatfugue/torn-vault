import { render, screen, act } from '@testing-library/react';
import { AuthProvider, useAuth } from '../src/contexts/AuthContext';
import React from 'react';
import api from '../src/lib/api';

jest.mock('../src/lib/api');
const mockedApi = api as jest.Mocked<typeof api>;

const TestComponent = () => {
  const { user, loading, login, logout } = useAuth();

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <div data-testid="user-name">{user ? user.name : 'No User'}</div>
      <button onClick={() => login('test-key')}>Login</button>
      <button onClick={logout}>Logout</button>
    </div>
  );
};

describe('AuthContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('provides default unauthenticated state', async () => {
    mockedApi.get.mockRejectedValueOnce(new Error('Unauthorized'));

    await act(async () => {
        render(
            <AuthProvider>
                <TestComponent />
            </AuthProvider>
        );
    });

    expect(screen.getByTestId('user-name').textContent).toBe('No User');
  });

  it('handles successful login', async () => {
    mockedApi.get.mockRejectedValueOnce(new Error('Unauthorized'));
    mockedApi.post.mockResolvedValueOnce({ data: { user: { id: 1, name: 'TestUser' } } });

    await act(async () => {
        render(
            <AuthProvider>
                <TestComponent />
            </AuthProvider>
        );
    });

    await act(async () => {
      screen.getByText('Login').click();
    });

    expect(mockedApi.post).toHaveBeenCalledWith('/api/auth/login', { apiKey: 'test-key' });
    expect(screen.getByTestId('user-name').textContent).toBe('TestUser');
  });

  it('handles logout', async () => {

    mockedApi.get.mockResolvedValueOnce({ data: { id: 1, name: 'TestUser' } });
    mockedApi.post.mockResolvedValueOnce({ data: { message: 'Logged out' } });

    await act(async () => {
        render(
            <AuthProvider>
                <TestComponent />
            </AuthProvider>
        );
    });

    expect(screen.getByTestId('user-name').textContent).toBe('TestUser');

    await act(async () => {
      screen.getByText('Logout').click();
    });

    expect(mockedApi.post).toHaveBeenCalledWith('/api/auth/logout');
    expect(screen.getByTestId('user-name').textContent).toBe('No User');
  });
});
