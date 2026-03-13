import { render, screen } from '@testing-library/react';
import Home from './pages/Home';

test('renders home welcome', () => {
  render(<Home />);
  const header = screen.getByText(/welcome to heal lots/i);
  expect(header).toBeInTheDocument();
});
