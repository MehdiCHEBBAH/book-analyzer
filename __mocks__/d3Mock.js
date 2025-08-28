// Mock D3.js for Jest testing
const createMockSelection = () => {
  const mockSelection = {
    selectAll: jest.fn(() => mockSelection),
    remove: jest.fn(() => mockSelection),
    data: jest.fn(() => mockSelection),
    enter: jest.fn(() => mockSelection),
    append: jest.fn(() => mockSelection),
    attr: jest.fn(() => mockSelection),
    style: jest.fn(() => mockSelection),
    on: jest.fn(() => mockSelection),
    call: jest.fn(() => mockSelection),
    text: jest.fn(() => mockSelection),
    select: jest.fn(() => mockSelection),
  };
  return mockSelection;
};

const d3Mock = {
  select: jest.fn(() => createMockSelection()),
  forceSimulation: jest.fn(() => {
    const mockSimulation = {
      force: jest.fn(() => mockSimulation),
      on: jest.fn(() => mockSimulation),
      alphaTarget: jest.fn(() => mockSimulation),
      alphaDecay: jest.fn(() => mockSimulation),
      velocityDecay: jest.fn(() => mockSimulation),
      restart: jest.fn(() => mockSimulation),
      stop: jest.fn(() => mockSimulation),
    };
    return mockSimulation;
  }),
  forceLink: jest.fn(() => ({
    id: jest.fn(() => ({
      distance: jest.fn(() => ({
        id: jest.fn(() => ({ distance: jest.fn() })),
      })),
    })),
  })),
  forceManyBody: jest.fn(() => ({
    strength: jest.fn(() => ({ strength: jest.fn() })),
  })),
  forceCenter: jest.fn(() => ({
    x: jest.fn(() => ({ y: jest.fn() })),
    y: jest.fn(() => ({ x: jest.fn() })),
  })),
  forceCollide: jest.fn(() => ({
    radius: jest.fn(() => ({ radius: jest.fn() })),
  })),
  drag: jest.fn(() => ({
    on: jest.fn(() => ({
      on: jest.fn(() => ({
        on: jest.fn(),
      })),
    })),
  })),
  scaleOrdinal: jest.fn(() => ({
    domain: jest.fn(() => ({
      range: jest.fn(),
    })),
  })),
  schemeCategory10: ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd'],
  transition: jest.fn(() => ({
    duration: jest.fn(() => ({
      attr: jest.fn(),
    })),
  })),
};

module.exports = d3Mock;
