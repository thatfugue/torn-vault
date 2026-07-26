import { render, screen } from '@testing-library/react';
import Home from '../src/app/page';

describe('Home Page', () => {
  it('renders the TornVault heading', () => {
    render(<Home />);
    const heading = screen.getByRole('heading', { name: /tornvault/i });
    expect(heading).toBeInTheDocument();
  });
});
