import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from '@testing-library/react';
import '@testing-library/jest-dom';
import Home from '../src/app/page';

// Mock fetch globally
global.fetch = jest.fn();

describe('Home Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the main UI elements', () => {
    render(<Home />);

    expect(screen.getByText('Book Analyzer')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Analyze classic books from Project Gutenberg to visualize character relationships and discover hidden patterns in literature'
      )
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText('Project Gutenberg Book ID')
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Analyze Book' })
    ).toBeInTheDocument();
  });

  it('handles user input correctly', () => {
    render(<Home />);

    const input = screen.getByLabelText('Project Gutenberg Book ID');
    fireEvent.change(input, { target: { value: '1342' } });

    expect(input).toHaveValue('1342');
  });

  it('enables submit button when book ID is entered', () => {
    render(<Home />);

    const button = screen.getByRole('button', { name: 'Analyze Book' });
    const input = screen.getByLabelText('Project Gutenberg Book ID');

    expect(button).toBeDisabled();

    fireEvent.change(input, { target: { value: '1342' } });

    expect(button).toBeEnabled();
  });

  it('shows loading state during API call', async () => {
    (fetch as jest.Mock).mockImplementation(
      () =>
        new Promise(resolve =>
          setTimeout(
            () =>
              resolve({
                ok: true,
                json: () => Promise.resolve({}),
              }),
            100
          )
        )
    );

    render(<Home />);

    const input = screen.getByLabelText('Project Gutenberg Book ID');
    const button = screen.getByRole('button', { name: 'Analyze Book' });

    fireEvent.change(input, { target: { value: '1342' } });

    await act(async () => {
      fireEvent.click(button);
    });

    expect(screen.getByText('Analyzing...')).toBeInTheDocument();
    expect(
      screen.getByText('Analyzing Character Relationships')
    ).toBeInTheDocument();
    expect(button).toBeDisabled();
    expect(input).toBeDisabled();
  });

  it('displays analysis results successfully', async () => {
    const mockResult = {
      bookId: '1342',
      title: 'Pride and Prejudice',
      author: 'Jane Austen',
      analysis: {
        characterRelationships: [
          {
            character1: 'Elizabeth Bennet',
            character2: 'Mr. Darcy',
            relationship: 'Romantic tension and eventual love',
            strength: 'strong',
          },
        ],
        keyCharacters: [
          {
            name: 'Elizabeth Bennet',
            importance: 9,
            description: 'The main protagonist, intelligent and witty',
            moral_category: 'heroic',
          },
          {
            name: 'Mr. Darcy',
            importance: 8,
            description:
              'A wealthy gentleman, initially proud but ultimately kind',
            moral_category: 'heroic',
          },
          {
            name: 'Jane Bennet',
            importance: 7,
            description: "Elizabeth's older sister, beautiful and kind",
            moral_category: 'supportive',
          },
        ],
        themes: ['Love', 'Marriage', 'Social Class'],
        summary:
          'A classic novel about love and marriage in Georgian-era England.',
        wordCount: 122189,
        keyEvents: [
          {
            event: 'Mr. Darcy proposes to Elizabeth',
            significance: 'A turning point in their relationship',
            characters_involved: ['Elizabeth Bennet', 'Mr. Darcy'],
          },
        ],
      },
      timestamp: '2024-01-01T00:00:00.000Z',
    };

    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResult),
    });

    render(<Home />);

    const input = screen.getByLabelText('Project Gutenberg Book ID');
    const button = screen.getByRole('button', { name: 'Analyze Book' });

    fireEvent.change(input, { target: { value: '1342' } });

    await act(async () => {
      fireEvent.click(button);
    });

    await waitFor(() => {
      expect(screen.getByText('Pride and Prejudice')).toBeInTheDocument();
      expect(screen.getByText('by Jane Austen')).toBeInTheDocument();
      expect(
        screen.getByText(
          'A classic novel about love and marriage in Georgian-era England.'
        )
      ).toBeInTheDocument();
      expect(screen.getByText('122,189')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument(); // Key characters count
      expect(screen.getAllByText('Elizabeth Bennet')).toHaveLength(2); // One in character list, one in key events
      expect(screen.getAllByText('Mr. Darcy')).toHaveLength(2); // One in character list, one in key events
      expect(screen.getByText('Love')).toBeInTheDocument();
      expect(screen.getByText('Marriage')).toBeInTheDocument();
      expect(screen.getByText('Social Class')).toBeInTheDocument();
    });

    // Click on the Relationships tab to see the relationships
    const relationshipsTab = screen.getByText('Relationships');
    fireEvent.click(relationshipsTab);

    await waitFor(() => {
      expect(
        screen.getByText('Elizabeth Bennet ↔ Mr. Darcy')
      ).toBeInTheDocument();
      expect(
        screen.getByText('Romantic tension and eventual love')
      ).toBeInTheDocument();
    });
  });

  it('handles API error gracefully', async () => {
    (fetch as jest.Mock).mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ error: 'Book not found' }),
    });

    render(<Home />);

    const input = screen.getByLabelText('Project Gutenberg Book ID');
    const button = screen.getByRole('button', { name: 'Analyze Book' });

    fireEvent.change(input, { target: { value: '99999' } });

    await act(async () => {
      fireEvent.click(button);
    });

    await waitFor(() => {
      expect(screen.getByText('Book not found')).toBeInTheDocument();
    });
  });

  it('handles network error gracefully', async () => {
    (fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

    render(<Home />);

    const input = screen.getByLabelText('Project Gutenberg Book ID');
    const button = screen.getByRole('button', { name: 'Analyze Book' });

    fireEvent.change(input, { target: { value: '1342' } });

    await act(async () => {
      fireEvent.click(button);
    });

    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });
  });

  it('displays relationship strength with correct colors', async () => {
    const mockResult = {
      bookId: '1342',
      title: 'Test Book',
      author: 'Test Author',
      analysis: {
        characterRelationships: [
          {
            character1: 'Character A',
            character2: 'Character B',
            relationship: 'Strong friendship',
            strength: 'strong',
          },
          {
            character1: 'Character C',
            character2: 'Character D',
            relationship: 'Acquaintance',
            strength: 'weak',
          },
        ],
        keyCharacters: [
          {
            name: 'Character A',
            importance: 8,
            description: 'Main character',
          },
        ],
        themes: ['Friendship'],
        summary: 'A test book.',
        wordCount: 1000,
        keyEvents: [],
      },
      timestamp: '2024-01-01T00:00:00.000Z',
    };

    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResult),
    });

    render(<Home />);

    const input = screen.getByLabelText('Project Gutenberg Book ID');
    const button = screen.getByRole('button', { name: 'Analyze Book' });

    fireEvent.change(input, { target: { value: '1342' } });

    await act(async () => {
      fireEvent.click(button);
    });

    await waitFor(() => {
      // Click on the Relationships tab to see the relationships
      const relationshipsTab = screen.getByText('Relationships');
      fireEvent.click(relationshipsTab);
    });

    await waitFor(() => {
      const strongRelationship = screen.getByText('strong');
      const weakRelationship = screen.getByText('weak');

      expect(strongRelationship).toHaveClass(
        'bg-gradient-to-r',
        'from-green-100',
        'to-emerald-100',
        'text-green-800'
      );
      expect(weakRelationship).toHaveClass(
        'bg-gradient-to-r',
        'from-gray-100',
        'to-slate-100',
        'text-gray-800'
      );
    });
  });
});
