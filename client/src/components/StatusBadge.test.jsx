// Tests for StatusBadge component
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import StatusBadge from '../components/StatusBadge';

describe('StatusBadge', () => {
  it('renders with correct status text', () => {
    render(<StatusBadge status="In transit" />);
    expect(screen.getByText('In transit')).toBeInTheDocument();
  });

  it('applies correct variant class for Delivered', () => {
    const { container } = render(<StatusBadge status="Delivered" />);
    const badge = container.querySelector('span');
    expect(badge).toHaveClass('status-delivered');
  });

  it('applies correct variant class for Delayed', () => {
    const { container } = render(<StatusBadge status="Delayed" />);
    const badge = container.querySelector('span');
    expect(badge).toHaveClass('status-delayed');
  });

  it('applies correct variant class for In transit', () => {
    const { container } = render(<StatusBadge status="In transit" />);
    const badge = container.querySelector('span');
    expect(badge).toHaveClass('status-in-transit');
  });

  it('applies correct variant class for Out for delivery', () => {
    const { container } = render(<StatusBadge status="Out for delivery" />);
    const badge = container.querySelector('span');
    expect(badge).toHaveClass('status-out-for-delivery');
  });

  it('applies correct variant class for Picked up', () => {
    const { container } = render(<StatusBadge status="Picked up" />);
    const badge = container.querySelector('span');
    expect(badge).toHaveClass('status-picked-up');
  });

  it('applies correct variant class for Created', () => {
    const { container } = render(<StatusBadge status="Created" />);
    const badge = container.querySelector('span');
    expect(badge).toHaveClass('status-created');
  });
});