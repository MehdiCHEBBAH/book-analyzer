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
    keyCharacters: string[];
    themes: string[];
    summary: string;
    wordCount: number;
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
    const validCharacters = new Set(characters);

    // Create nodes with optimized data processing
    const nodes: Node[] = characters.map((character, index) => {
      const interactionCount = relationships.filter(
        rel =>
          (rel.character1 === character || rel.character2 === character) &&
          validCharacters.has(rel.character1) &&
          validCharacters.has(rel.character2)
      ).length;

      return {
        id: character,
        name: character,
        interactionCount: Math.max(interactionCount, 1),
        group: index % 6, // More color variety
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
    const container = svgRef.current.parentElement;
    const width = Math.min(800, container?.clientWidth || 800);
    const height = Math.min(600, window.innerHeight * 0.6);

    const svg = d3
      .select(svgRef.current)
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', `0 0 ${width} ${height}`)
      .style('max-width', '100%')
      .style('height', 'auto');

    // Enhanced color palette
    const colors = [
      '#3B82F6',
      '#8B5CF6',
      '#EC4899',
      '#10B981',
      '#F59E0B',
      '#EF4444',
      '#06B6D4',
      '#84CC16',
      '#F97316',
      '#6366F1',
      '#14B8A6',
      '#F43F5E',
    ];
    const color = d3.scaleOrdinal(colors);

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
          d3
            .forceCollide()
            .radius((d: any) => Math.sqrt(d.interactionCount) * 10 + 25)
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
    const link = svg
      .append('g')
      .attr('class', 'links')
      .selectAll('line')
      .data(links)
      .enter()
      .append('line')
      .attr('stroke', (d: Link) => {
        switch (d.strength) {
          case 'strong':
            return '#EF4444';
          case 'moderate':
            return '#F59E0B';
          case 'weak':
            return '#6B7280';
          default:
            return '#6B7280';
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
    const node = svg
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
      .attr('r', (d: Node) => Math.sqrt(d.interactionCount) * 10 + 25)
      .attr('fill', (d: Node) => color(d.group.toString()))
      .attr('stroke', '#ffffff')
      .attr('stroke-width', 3)
      .attr('stroke-opacity', 0.8)
      .style('cursor', 'pointer')
      .style('filter', 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))')
      .on('mouseover', function (event, d: Node) {
        d3.select(this)
          .transition()
          .duration(150)
          .attr('r', Math.sqrt(d.interactionCount) * 10 + 30)
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
          .attr('r', Math.sqrt(d.interactionCount) * 10 + 25)
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
        <p>• Node size represents character interaction frequency</p>
        <p>• Link thickness indicates relationship strength</p>
        <p>• Drag nodes to explore the network</p>
      </div>

      <div className="flex justify-center overflow-hidden">
        <svg
          ref={svgRef}
          className="border border-gray-200 rounded-lg shadow-sm"
          style={{ maxWidth: '100%', height: 'auto' }}
          preserveAspectRatio="xMidYMid meet"
        />
      </div>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
        <div className="flex items-center bg-gray-50 rounded-lg p-3">
          <div className="w-3 h-3 bg-red-500 rounded-full mr-3"></div>
          <span className="font-medium text-gray-700">
            Strong relationships
          </span>
        </div>
        <div className="flex items-center bg-gray-50 rounded-lg p-3">
          <div className="w-3 h-3 bg-yellow-500 rounded-full mr-3"></div>
          <span className="font-medium text-gray-700">
            Moderate relationships
          </span>
        </div>
        <div className="flex items-center bg-gray-50 rounded-lg p-3">
          <div className="w-3 h-3 bg-gray-500 rounded-full mr-3"></div>
          <span className="font-medium text-gray-700">Weak relationships</span>
        </div>
      </div>
    </div>
  );
}
