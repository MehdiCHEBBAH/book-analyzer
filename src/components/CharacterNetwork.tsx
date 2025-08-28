'use client';

import { useEffect, useRef } from 'react';
import * as d3 from 'd3';

interface CharacterRelationship {
  character1: string;
  character2: string;
  relationship: string;
  strength: 'strong' | 'moderate' | 'weak';
}

interface AnalysisResult {
  bookId: string;
  title: string;
  author: string;
  analysis: {
    characterRelationships: CharacterRelationship[];
    keyCharacters: Array<{
      name: string;
      importance: number;
      description: string;
      moral_category: string;
    }>;
    themes: string[];
    summary: string;
    wordCount: number;
    keyEvents: Array<{
      event: string;
      significance: string;
      characters_involved: string[];
    }>;
  };
  timestamp: string;
}

interface CharacterNetworkProps {
  analysisResult: AnalysisResult;
}

interface Node extends d3.SimulationNodeDatum {
  id: string;
  name: string;
  interactionCount: number;
  group: number;
  importance: number;
  moral_category: string;
}

interface Link extends d3.SimulationLinkDatum<Node> {
  source: string;
  target: string;
  relationship: string;
  strength: 'strong' | 'moderate' | 'weak';
  interactionCount: number;
}

export default function CharacterNetwork({
  analysisResult,
}: CharacterNetworkProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const simulationRef = useRef<d3.Simulation<Node, Link> | null>(null);

  useEffect(() => {
    if (!analysisResult || !svgRef.current) return;

    // Cleanup previous simulation
    if (simulationRef.current) {
      simulationRef.current.stop();
    }

    // Clear previous visualization
    d3.select(svgRef.current).selectAll('*').remove();

    // Process data for D3 with validation
    const relationships = analysisResult.analysis.characterRelationships;
    const characters = analysisResult.analysis.keyCharacters;

    // Create a set of valid character names for quick lookup
    const validCharacters = new Set(characters.map(char => char.name));

    // Create nodes with optimized data processing
    const nodes: Node[] = characters.map((character, index) => {
      const interactionCount = relationships.filter(
        rel =>
          (rel.character1 === character.name ||
            rel.character2 === character.name) &&
          validCharacters.has(rel.character1) &&
          validCharacters.has(rel.character2)
      ).length;

      return {
        id: character.name,
        name: character.name,
        interactionCount: Math.max(interactionCount, 1),
        group: index % 6, // More color variety
        importance: character.importance,
        moral_category: character.moral_category,
      };
    });

    // Create links with deduplication and validation
    const linkMap = new Map<string, Link>();
    relationships.forEach(rel => {
      // Only create links between characters that exist in the nodes array
      if (
        validCharacters.has(rel.character1) &&
        validCharacters.has(rel.character2)
      ) {
        const key = [rel.character1, rel.character2].sort().join('|');
        if (!linkMap.has(key)) {
          linkMap.set(key, {
            source: rel.character1,
            target: rel.character2,
            relationship: rel.relationship,
            strength: rel.strength,
            interactionCount: 1,
          });
        }
      }
    });
    const links: Link[] = Array.from(linkMap.values());

    // Log for debugging
    console.log(
      'Nodes:',
      nodes.map(n => n.id)
    );
    console.log(
      'Links:',
      links.map(l => `${l.source} -> ${l.target}`)
    );
    console.log('Valid characters:', Array.from(validCharacters));

    // Safety check - ensure we have valid data
    if (nodes.length === 0) {
      console.warn('No valid nodes found for visualization');
      return;
    }

    // If no valid links, show a message
    if (links.length === 0) {
      console.warn('No valid relationships found for visualization');
      // Still create nodes but without links
    }

    // Responsive SVG sizing
    const parentContainer = svgRef.current.parentElement;
    const width = Math.min(800, parentContainer?.clientWidth || 800);
    const height = Math.min(600, window.innerHeight * 0.6);

    const svg = d3
      .select(svgRef.current)
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', `0 0 ${width} ${height}`)
      .style('max-width', '100%')
      .style('height', 'auto');

    // Create a container group for zoom transformations
    const container = svg.append('g').attr('class', 'zoom-container');

    // Add zoom behavior
    const zoom = d3
      .zoom()
      .scaleExtent([0.1, 4]) // Min zoom 0.1x, max zoom 4x
      .on('zoom', event => {
        container.attr('transform', event.transform);
      });

    svg.call(zoom as any);

    // Store zoom function for fit-to-view button
    const zoomBehavior = zoom;
    (svgRef.current as any).zoomBehavior = zoomBehavior;

    // Moral category color mapping
    const getMoralCategoryColor = (category: string): string => {
      switch (category) {
        case 'heroic':
          return '#10B981'; // Green for heroic characters
        case 'villainous':
          return '#EF4444'; // Red for villainous characters
        case 'neutral':
          return '#6B7280'; // Gray for neutral characters
        case 'deceptive':
          return '#F59E0B'; // Orange for deceptive characters
        case 'supportive':
          return '#3B82F6'; // Blue for supportive characters
        case 'antagonistic':
          return '#8B5CF6'; // Purple for antagonistic characters
        default:
          return '#6B7280'; // Gray as default
      }
    };

    // Optimized force simulation with error handling
    let simulation: d3.Simulation<Node, Link> | undefined;
    try {
      simulation = d3
        .forceSimulation(nodes)
        .force(
          'link',
          d3
            .forceLink(links)
            .id((d: any) => d.id)
            .distance(120)
        )
        .force('charge', d3.forceManyBody().strength(-400))
        .force('center', d3.forceCenter(width / 2, height / 2))
        .force(
          'collision',
          d3.forceCollide().radius((d: any) => d.importance * 3 + 20)
        )
        .alphaDecay(0.02) // Faster stabilization
        .velocityDecay(0.4);

      simulationRef.current = simulation;
    } catch (error) {
      console.error('Error creating force simulation:', error);
      console.error('Nodes:', nodes);
      console.error('Links:', links);
      return;
    }

    // Create links with improved styling
    const link = container
      .append('g')
      .attr('class', 'links')
      .selectAll('line')
      .data(links)
      .enter()
      .append('line')
      .attr('stroke', (d: Link) => {
        // Color based on relationship type
        const relationship = d.relationship.toLowerCase();
        if (
          relationship.includes('romantic') ||
          relationship.includes('love')
        ) {
          return '#EC4899'; // Pink for romantic
        } else if (
          relationship.includes('family') ||
          relationship.includes('parent') ||
          relationship.includes('child')
        ) {
          return '#10B981'; // Green for family
        } else if (
          relationship.includes('friend') ||
          relationship.includes('ally')
        ) {
          return '#3B82F6'; // Blue for friendship
        } else if (
          relationship.includes('enemy') ||
          relationship.includes('rival') ||
          relationship.includes('antagonist')
        ) {
          return '#EF4444'; // Red for enemies
        } else {
          // Default color for other relationship types
          return '#6B7280'; // Gray for other relationships
        }
      })
      .attr('stroke-opacity', 0.7)
      .attr('stroke-width', (d: Link) => {
        switch (d.strength) {
          case 'strong':
            return 3;
          case 'moderate':
            return 2;
          case 'weak':
            return 1;
          default:
            return 1;
        }
      })
      .attr('stroke-linecap', 'round');

    // Create nodes with improved styling
    const node = container
      .append('g')
      .attr('class', 'nodes')
      .selectAll('g')
      .data(nodes)
      .enter()
      .append('g')
      .call(
        d3
          .drag<any, Node>()
          .on('start', dragstarted)
          .on('drag', dragged)
          .on('end', dragended)
      );

    // Add circles to nodes with enhanced styling
    node
      .append('circle')
      .attr('r', (d: Node) => d.importance * 3 + 20)
      .attr('fill', (d: Node) => getMoralCategoryColor(d.moral_category))
      .attr('stroke', '#ffffff')
      .attr('stroke-width', 3)
      .attr('stroke-opacity', 0.8)
      .style('cursor', 'pointer')
      .style('filter', 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))')
      .on('mouseover', function (event, d: Node) {
        d3.select(this)
          .transition()
          .duration(150)
          .attr('r', d.importance * 3 + 25)
          .style('filter', 'drop-shadow(0 4px 8px rgba(0,0,0,0.2))');

        // Highlight connected links with performance optimization
        link
          .style('stroke-opacity', (l: Link) =>
            l.source === d.id || l.target === d.id ? 1 : 0.15
          )
          .style('stroke-width', (l: Link) => {
            if (l.source === d.id || l.target === d.id) {
              switch (l.strength) {
                case 'strong':
                  return 5;
                case 'moderate':
                  return 3;
                case 'weak':
                  return 2;
                default:
                  return 2;
              }
            }
            return 0.5;
          });
      })
      .on('mouseout', function (event, d: Node) {
        d3.select(this)
          .transition()
          .duration(150)
          .attr('r', d.importance * 3 + 20)
          .style('filter', 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))');

        // Reset link styles
        link.style('stroke-opacity', 0.7).style('stroke-width', (l: Link) => {
          switch (l.strength) {
            case 'strong':
              return 3;
            case 'moderate':
              return 2;
            case 'weak':
              return 1;
            default:
              return 1;
          }
        });
      });

    // Add labels to nodes with improved styling
    node
      .append('text')
      .text((d: Node) => d.name)
      .attr('text-anchor', 'middle')
      .attr('dy', '.35em')
      .attr('font-size', '11px')
      .attr('font-weight', '600')
      .attr('fill', '#ffffff')
      .attr('stroke', '#000000')
      .attr('stroke-width', '0.5px')
      .attr('stroke-opacity', 0.3)
      .style('pointer-events', 'none')
      .style('text-shadow', '0 1px 2px rgba(0,0,0,0.5)');

    // Update positions on simulation tick with performance optimization
    if (simulation) {
      simulation.on('tick', () => {
        link
          .attr('x1', (d: any) => d.source.x)
          .attr('y1', (d: any) => d.source.y)
          .attr('x2', (d: any) => d.target.x)
          .attr('y2', (d: any) => d.target.y);

        node.attr('transform', (d: any) => `translate(${d.x},${d.y})`);
      });
    }

    // Drag functions
    function dragstarted(event: any, d: Node) {
      if (!event.active && simulation) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(event: any, d: Node) {
      d.fx = event.x;
      d.fy = event.y;
    }

    function dragended(event: any, d: Node) {
      if (!event.active && simulation) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }

    // Cleanup function
    return () => {
      if (simulationRef.current) {
        simulationRef.current.stop();
        simulationRef.current = null;
      }
    };
  }, [analysisResult]);

  if (!analysisResult) {
    return (
      <div className="flex items-center justify-center h-96 bg-gray-50 rounded-lg">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Loading character network...</p>
        </div>
      </div>
    );
  }

  // Check if we have valid data
  if (
    !analysisResult.analysis.keyCharacters ||
    analysisResult.analysis.keyCharacters.length === 0
  ) {
    return (
      <div className="flex items-center justify-center h-96 bg-gray-50 rounded-lg">
        <div className="text-center">
          <svg
            className="w-12 h-12 text-gray-400 mx-auto mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <p className="text-gray-500">
            No character data available for visualization
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
        <svg
          className="w-6 h-6 mr-3 text-indigo-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 4m0 13V4m-6 3l6-3"
          />
        </svg>
        Character Network Visualization
      </h3>

      <div className="mb-4 text-sm text-gray-600">
        <p>• Node size represents character importance (1-10 scale)</p>
        <p>
          • Node colors indicate moral category (heroic, villainous, neutral,
          etc.)
        </p>
        <p>
          • Edge colors indicate relationship type (romantic, family,
          friendship, enemy)
        </p>
        <p>
          • Edge thickness indicates relationship strength (strong, moderate,
          weak)
        </p>
        <p>• Drag nodes to explore the network</p>
        <p>• Scroll to zoom in/out, drag to pan</p>
      </div>

      <div className="flex justify-center overflow-hidden relative">
        <svg
          ref={svgRef}
          className="border border-gray-200 rounded-lg shadow-sm"
          style={{ maxWidth: '100%', height: 'auto' }}
          preserveAspectRatio="xMidYMid meet"
        />
        <button
          onClick={() => {
            if (
              svgRef.current &&
              (svgRef.current as any).zoomBehavior &&
              simulationRef.current
            ) {
              const zoomBehavior = (svgRef.current as any).zoomBehavior;
              const svgElement = d3.select(svgRef.current);
              const width =
                svgElement.node()?.getBoundingClientRect().width || 800;
              const height =
                svgElement.node()?.getBoundingClientRect().height || 600;

              // Get the actual node positions from the simulation
              const simulation = simulationRef.current;
              const simulationNodes = simulation.nodes() as Node[];

              if (simulationNodes.length > 0) {
                // Calculate the actual bounds of the nodes
                const padding = 50;
                const nodeRadius = 20; // Base radius for nodes

                const xPositions = simulationNodes.map(n => n.x || 0);
                const yPositions = simulationNodes.map(n => n.y || 0);

                const minX = Math.min(...xPositions) - nodeRadius;
                const maxX = Math.max(...xPositions) + nodeRadius;
                const minY = Math.min(...yPositions) - nodeRadius;
                const maxY = Math.max(...yPositions) + nodeRadius;

                const graphWidth = maxX - minX;
                const graphHeight = maxY - minY;
                const graphCenterX = (minX + maxX) / 2;
                const graphCenterY = (minY + maxY) / 2;

                // Calculate scale to fit the graph
                const scaleX = (width - padding * 2) / graphWidth;
                const scaleY = (height - padding * 2) / graphHeight;
                const scale = Math.min(scaleX, scaleY, 1); // Don't zoom in more than 1x

                // Calculate translation to center the graph
                const translateX = width / 2 - graphCenterX * scale;
                const translateY = height / 2 - graphCenterY * scale;

                svgElement
                  .transition()
                  .duration(750)
                  .call(
                    zoomBehavior.transform,
                    d3.zoomIdentity
                      .translate(translateX, translateY)
                      .scale(scale)
                  );
              }
            }
          }}
          className="absolute top-2 right-2 bg-white hover:bg-gray-50 text-gray-700 px-3 py-1 rounded-md border border-gray-300 shadow-sm text-sm font-medium transition-colors duration-200 flex items-center gap-1"
          title="Fit to view"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
            />
          </svg>
          Fit
        </button>
      </div>

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column - Node Categories */}
        <div>
          <h4 className="text-sm font-semibold text-gray-800 mb-3">
            Node Categories (Character Types)
          </h4>
          <div className="grid grid-cols-1 gap-3 text-sm">
            <div className="flex items-center bg-gray-50 rounded-lg p-3">
              <div className="w-4 h-4 bg-green-500 rounded-full mr-3 border-2 border-white shadow-sm"></div>
              <span className="font-medium text-gray-700">
                Heroic characters
              </span>
            </div>
            <div className="flex items-center bg-gray-50 rounded-lg p-3">
              <div className="w-4 h-4 bg-red-500 rounded-full mr-3 border-2 border-white shadow-sm"></div>
              <span className="font-medium text-gray-700">
                Villainous characters
              </span>
            </div>
            <div className="flex items-center bg-gray-50 rounded-lg p-3">
              <div className="w-4 h-4 bg-gray-500 rounded-full mr-3 border-2 border-white shadow-sm"></div>
              <span className="font-medium text-gray-700">
                Neutral characters
              </span>
            </div>
            <div className="flex items-center bg-gray-50 rounded-lg p-3">
              <div className="w-4 h-4 bg-orange-500 rounded-full mr-3 border-2 border-white shadow-sm"></div>
              <span className="font-medium text-gray-700">
                Deceptive characters
              </span>
            </div>
            <div className="flex items-center bg-gray-50 rounded-lg p-3">
              <div className="w-4 h-4 bg-blue-500 rounded-full mr-3 border-2 border-white shadow-sm"></div>
              <span className="font-medium text-gray-700">
                Supportive characters
              </span>
            </div>
            <div className="flex items-center bg-gray-50 rounded-lg p-3">
              <div className="w-4 h-4 bg-purple-500 rounded-full mr-3 border-2 border-white shadow-sm"></div>
              <span className="font-medium text-gray-700">
                Antagonistic characters
              </span>
            </div>
          </div>
        </div>

        {/* Right Column - Edge Types and Strength */}
        <div>
          <h4 className="text-sm font-semibold text-gray-800 mb-3">
            Edge Types (Relationship Categories)
          </h4>
          <div className="grid grid-cols-1 gap-3 text-sm mb-6">
            <div className="flex items-center bg-gray-50 rounded-lg p-3">
              <div className="w-8 h-1 bg-pink-500 mr-3 rounded-sm"></div>
              <span className="font-medium text-gray-700">
                Romantic relationships
              </span>
            </div>
            <div className="flex items-center bg-gray-50 rounded-lg p-3">
              <div className="w-8 h-1 bg-green-500 mr-3 rounded-sm"></div>
              <span className="font-medium text-gray-700">
                Family relationships
              </span>
            </div>
            <div className="flex items-center bg-gray-50 rounded-lg p-3">
              <div className="w-8 h-1 bg-blue-500 mr-3 rounded-sm"></div>
              <span className="font-medium text-gray-700">
                Friendship relationships
              </span>
            </div>
            <div className="flex items-center bg-gray-50 rounded-lg p-3">
              <div className="w-8 h-1 bg-red-500 mr-3 rounded-sm"></div>
              <span className="font-medium text-gray-700">
                Enemy relationships
              </span>
            </div>
          </div>

          <h4 className="text-sm font-semibold text-gray-800 mb-3">
            Edge Strength (Relationship Intensity)
          </h4>
          <div className="grid grid-cols-1 gap-3 text-sm">
            <div className="flex items-center bg-gray-50 rounded-lg p-3">
              <div className="w-8 h-1 bg-gray-600 mr-3 rounded-sm"></div>
              <span className="font-medium text-gray-700">
                Strong relationships (thick)
              </span>
            </div>
            <div className="flex items-center bg-gray-50 rounded-lg p-3">
              <div className="w-8 h-0.5 bg-gray-500 mr-3 rounded-sm"></div>
              <span className="font-medium text-gray-700">
                Moderate relationships (medium)
              </span>
            </div>
            <div className="flex items-center bg-gray-50 rounded-lg p-3">
              <div className="w-8 h-px bg-gray-400 mr-3 rounded-sm"></div>
              <span className="font-medium text-gray-700">
                Weak relationships (thin)
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
