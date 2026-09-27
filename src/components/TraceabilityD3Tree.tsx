import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Maximize2, 
  Minimize2, 
  Layers, 
  ArrowUpRight, 
  ArrowDownRight, 
  Info,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Boxes,
  Truck,
  Factory,
  Sparkles
} from 'lucide-react';
import { DossierLotTracabilite, LotComposantConsomme } from '../types';
import { ComponentTraceIndexItem } from '../data/traceabilityData';

export interface D3TraceNode {
  id: string;
  name: string;
  category: 
    | 'root-finished' 
    | 'root-component' 
    | 'operation-bulk' 
    | 'operation-packaging' 
    | 'raw-material' 
    | 'packaging' 
    | 'of-production' 
    | 'finished-product' 
    | 'shipping-group' 
    | 'client';
  code?: string;
  lotNumber?: string;
  supplier?: string;
  quantity?: string;
  deviation?: string;
  status?: 'Conforme' | 'Alerte' | 'EnQuarantaine' | 'Libere' | 'EnCours';
  details?: string;
  children?: D3TraceNode[];
  _children?: D3TraceNode[]; // Used for collapse/expand
}

interface TraceabilityD3TreeProps {
  mode: 'descending' | 'ascending';
  finishedLot?: DossierLotTracabilite;
  componentTrace?: ComponentTraceIndexItem;
  onSelectComponent?: (compLot: string) => void;
  onSelectFinishedLot?: (finishedLot: string) => void;
}

export const TraceabilityD3Tree: React.FC<TraceabilityD3TreeProps> = ({
  mode,
  finishedLot,
  componentTrace,
  onSelectComponent,
  onSelectFinishedLot
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Selected node for details card popup
  const [selectedNodeData, setSelectedNodeData] = useState<D3TraceNode | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(1);

  // Convert finished lot or component trace into a hierarchical D3 tree structure
  const rawHierarchyData = useMemo<D3TraceNode>(() => {
    if (mode === 'descending' && finishedLot) {
      // Split components into raw materials and packaging
      const rawMaterials = finishedLot.composantsConsommes.filter(c => c.typeComposant === 'MatierePremiere');
      const packagingItems = finishedLot.composantsConsommes.filter(c => c.typeComposant === 'Emballage');

      const bulkNode: D3TraceNode = {
        id: `bulk-${finishedLot.id}`,
        name: 'Formulation & Mélange Vrac',
        category: 'operation-bulk',
        lotNumber: finishedLot.cuveFormulationNom || 'Cuve Formulation',
        details: 'Mélange certifié BPF',
        status: 'Conforme',
        children: rawMaterials.map(c => ({
          id: `raw-${c.numeroLotFournisseurOuInterne}`,
          name: c.composantDesignation,
          code: c.composantCode,
          category: 'raw-material',
          lotNumber: c.numeroLotFournisseurOuInterne,
          supplier: c.fournisseurNom,
          quantity: `${c.quantiteConsommee} ${c.unite}`,
          deviation: c.ecartPourcent >= 0 ? `+${c.ecartPourcent}%` : `${c.ecartPourcent}%`,
          status: c.statutConformiteMatiere,
          details: `BL: ${c.numeroBL} • Certif: ${c.certificatFournisseurRef || 'Validé'}`
        }))
      };

      const packagingNode: D3TraceNode = {
        id: `pack-${finishedLot.id}`,
        name: 'Conditionnement & Emballage',
        category: 'operation-packaging',
        lotNumber: finishedLot.ligneFabricationNom || 'Ligne Conditionnement',
        details: 'Ensachage, sertissage & étiquetage',
        status: 'Conforme',
        children: packagingItems.map(c => ({
          id: `pkg-${c.numeroLotFournisseurOuInterne}`,
          name: c.composantDesignation,
          code: c.composantCode,
          category: 'packaging',
          lotNumber: c.numeroLotFournisseurOuInterne,
          supplier: c.fournisseurNom,
          quantity: `${c.quantiteConsommee} ${c.unite}`,
          deviation: c.ecartPourcent >= 0 ? `+${c.ecartPourcent}%` : `${c.ecartPourcent}%`,
          status: c.statutConformiteMatiere,
          details: `BL: ${c.numeroBL} • Certif: ${c.certificatFournisseurRef || 'Conforme'}`
        }))
      };

      const children: D3TraceNode[] = [bulkNode, packagingNode];

      // Add Expeditions/Clients branch if any
      if (finishedLot.expeditionsClients && finishedLot.expeditionsClients.length > 0) {
        const shippingNode: D3TraceNode = {
          id: `ship-${finishedLot.id}`,
          name: 'Expéditions & Distribution',
          category: 'shipping-group',
          quantity: `${finishedLot.expeditionsClients.reduce((acc, e) => acc + e.quantiteExpediee, 0)} ${finishedLot.uniteMesure}`,
          details: 'Livraisons établissements hospitaliers & distributeurs',
          status: 'Conforme',
          children: finishedLot.expeditionsClients.map(e => ({
            id: `client-${e.commandeId}`,
            name: e.clientNom,
            category: 'client',
            code: e.numeroCommande,
            lotNumber: e.bonLivraisonRef,
            quantity: `${e.quantiteExpediee} ${finishedLot.uniteMesure}`,
            status: e.statutExpedition === 'Livre' ? 'Conforme' : 'EnCours',
            details: `Expédié le ${new Date(e.dateExpedition).toLocaleDateString('fr-FR')}`
          }))
        };
        children.push(shippingNode);
      }

      return {
        id: `root-${finishedLot.id}`,
        name: finishedLot.articleDesignation,
        code: finishedLot.articleCode,
        category: 'root-finished',
        lotNumber: finishedLot.numeroLot,
        quantity: `${finishedLot.volumeProduit} ${finishedLot.uniteMesure}`,
        status: finishedLot.statutLot === 'Libere' ? 'Libere' : finishedLot.statutLot === 'EnQuarantaine' ? 'EnQuarantaine' : 'EnCours',
        details: `OF: ${finishedLot.numeroOF || 'N/A'} • Opérateur: ${finishedLot.operateur}`,
        children
      };
    } else if (mode === 'ascending' && componentTrace) {
      // Ascending mode: Component -> Manufacturing Orders -> Finished Products -> Clients
      return {
        id: `root-comp-${componentTrace.numeroLotMatiere}`,
        name: componentTrace.articleDesignation,
        code: componentTrace.articleCode,
        category: 'root-component',
        lotNumber: componentTrace.numeroLotMatiere,
        supplier: componentTrace.fournisseurNom,
        status: componentTrace.statutMatiere,
        details: `BL Réception: ${componentTrace.numeroBL} • Certif: ${componentTrace.certificatFournisseurRef || 'Conforme'}`,
        children: componentTrace.lotsProduitsFinisImpactes.map(fini => ({
          id: `fini-${fini.dossierId}`,
          name: fini.articleDesignation,
          category: 'finished-product',
          lotNumber: fini.numeroLotFini,
          code: fini.numeroOF,
          quantity: `${fini.quantiteConsommee} ${fini.unite} dosés (Volume: ${fini.volumeTotalProduit} U)`,
          status: fini.statutLotFini === 'Libere' ? 'Libere' : fini.statutLotFini === 'EnQuarantaine' ? 'EnQuarantaine' : 'EnCours',
          details: `Fabriqué le ${new Date(fini.dateFabrication).toLocaleDateString('fr-FR')}`,
          children: fini.expeditions.map((exp, idx) => ({
            id: `exp-${fini.dossierId}-${idx}`,
            name: exp.clientNom,
            category: 'client',
            code: exp.numeroCommande,
            quantity: `${exp.quantiteExpediee} U`,
            status: 'Conforme',
            details: `Date exp.: ${new Date(exp.dateExpedition).toLocaleDateString('fr-FR')}`
          }))
        }))
      };
    }

    // Fallback default node
    return {
      id: 'default',
      name: 'Aucun lot sélectionné',
      category: 'root-finished',
      lotNumber: 'N/A'
    };
  }, [mode, finishedLot, componentTrace]);

  // Main D3 Rendering effect
  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    const svgElement = d3.select(svgRef.current);
    svgElement.selectAll('*').remove(); // Clear previous drawings

    const width = containerRef.current.clientWidth || 980;
    const height = Math.max(520, containerRef.current.clientHeight || 520);

    // Create main SVG group with D3 zoom
    const zoomGroup = svgElement.append('g').attr('class', 'main-tree-container');

    const zoomBehavior = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.35, 2.5])
      .on('zoom', (event) => {
        zoomGroup.attr('transform', event.transform);
        setZoomLevel(Math.round(event.transform.k * 100) / 100);
      });

    svgElement.call(zoomBehavior);

    // Initial center position
    const initialTransform = d3.zoomIdentity.translate(80, height / 2.5).scale(0.85);
    svgElement.call(zoomBehavior.transform, initialTransform);

    // Setup hierarchy
    const root = d3.hierarchy<D3TraceNode>(rawHierarchyData);

    // Dimensions of node cards
    const cardWidth = 210;
    const cardHeight = 68;

    // Define tree layout: dx is vertical separation between sibling nodes, dy is horizontal level separation
    const dx = 88;
    const dy = 280;
    const treeLayout = d3.tree<D3TraceNode>().nodeSize([dx, dy]);

    let i = 0;

    // Update function to support interactive expand/collapse with smooth transitions
    function update(source: d3.HierarchyNode<D3TraceNode>) {
      const duration = 350;

      // Compute tree positions
      treeLayout(root);

      const nodes = root.descendants();
      const links = root.links();

      // Normalize for fixed-depth horizontal projection (x is vertical, y is horizontal)
      nodes.forEach(d => {
        d.y = d.depth * dy;
      });

      // ----------------------------------------------------
      // LINKS SELECTION & ANIMATION
      // ----------------------------------------------------
      const link = zoomGroup.selectAll<SVGPathElement, d3.HierarchyLink<D3TraceNode>>('path.link')
        .data(links, d => (d.target as any).id || ((d.target as any).id = ++i));

      // Link generator with horizontal cubic bezier curve
      const diagonal = d3.linkHorizontal<d3.HierarchyPointLink<D3TraceNode>, d3.HierarchyPointNode<D3TraceNode>>()
        .x(d => d.y)
        .y(d => d.x);

      // Enter any new links at the parent's previous position
      const linkEnter = link.enter().insert('path', 'g')
        .attr('class', 'link')
        .attr('fill', 'none')
        .attr('stroke', (d) => {
          if (d.target.data.status === 'EnQuarantaine') return '#f43f5e';
          if (d.target.data.category === 'client') return '#38bdf8';
          if (d.target.data.category === 'raw-material') return '#818cf8';
          if (d.target.data.category === 'packaging') return '#c084fc';
          return '#475569';
        })
        .attr('stroke-width', (d) => d.target.data.status === 'EnQuarantaine' ? 2.5 : 1.8)
        .attr('stroke-dasharray', (d) => d.target.data.status === 'EnQuarantaine' ? '4,4' : 'none')
        .attr('stroke-opacity', 0.7)
        .attr('d', () => {
          const o = { x: (source as any).x0 ?? source.x, y: (source as any).y0 ?? source.y };
          return diagonal({ source: o, target: o } as any);
        });

      // Transition links to their new position
      link.merge(linkEnter).transition().duration(duration)
        .attr('d', diagonal as any);

      // Transition exiting links to parent's new position
      link.exit().transition().duration(duration)
        .attr('d', () => {
          const o = { x: source.x, y: source.y };
          return diagonal({ source: o, target: o } as any);
        })
        .remove();

      // ----------------------------------------------------
      // NODES SELECTION & ANIMATION
      // ----------------------------------------------------
      const node = zoomGroup.selectAll<SVGGElement, d3.HierarchyNode<D3TraceNode>>('g.node')
        .data(nodes, d => (d as any).id || ((d as any).id = ++i));

      // Enter any new nodes at the parent's previous position
      const nodeEnter = node.enter().append('g')
        .attr('class', 'node')
        .attr('transform', () => `translate(${(source as any).y0 ?? source.y},${(source as any).x0 ?? source.x})`)
        .attr('cursor', 'pointer')
        .on('click', (event, d) => {
          event.stopPropagation();
          setSelectedNodeData(d.data);

          // If node has children or collapsed children, toggle collapse
          if (d.children) {
            d.data._children = d.data.children;
            (d as any)._children = d.children;
            d.children = undefined;
          } else if ((d as any)._children) {
            d.children = (d as any)._children;
            (d as any)._children = undefined;
          }
          update(d);
        });

      // Node card container rectangle
      nodeEnter.append('rect')
        .attr('width', cardWidth)
        .attr('height', cardHeight)
        .attr('x', -cardWidth / 2)
        .attr('y', -cardHeight / 2)
        .attr('rx', 10)
        .attr('ry', 10)
        .attr('fill', d => getNodeBackgroundColor(d.data))
        .attr('stroke', d => getNodeBorderColor(d.data))
        .attr('stroke-width', d => d.data.status === 'EnQuarantaine' ? 2.5 : 1.5)
        .attr('filter', 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.45))');

      // Left accent color strip indicating category
      nodeEnter.append('rect')
        .attr('width', 5)
        .attr('height', cardHeight - 8)
        .attr('x', -cardWidth / 2 + 3)
        .attr('y', -cardHeight / 2 + 4)
        .attr('rx', 3)
        .attr('ry', 3)
        .attr('fill', d => getNodeAccentColor(d.data));

      // Category Label (uppercase kicker)
      nodeEnter.append('text')
        .attr('x', -cardWidth / 2 + 16)
        .attr('y', -cardHeight / 2 + 16)
        .attr('fill', d => getNodeAccentColor(d.data))
        .attr('font-size', '9px')
        .attr('font-weight', '700')
        .attr('font-family', 'ui-monospace, monospace')
        .text(d => getNodeKicker(d.data));

      // Main Node Name / Lot Number (Bold)
      nodeEnter.append('text')
        .attr('x', -cardWidth / 2 + 16)
        .attr('y', -cardHeight / 2 + 32)
        .attr('fill', '#ffffff')
        .attr('font-size', '11px')
        .attr('font-weight', '700')
        .text(d => truncateText(d.data.lotNumber || d.data.name, 22));

      // Node Subtitle / Designation
      nodeEnter.append('text')
        .attr('x', -cardWidth / 2 + 16)
        .attr('y', -cardHeight / 2 + 46)
        .attr('fill', '#94a3b8')
        .attr('font-size', '9.5px')
        .text(d => truncateText(d.data.name !== d.data.lotNumber ? d.data.name : (d.data.supplier || d.data.details || ''), 26));

      // Bottom metric badge (Quantity or Supplier)
      nodeEnter.append('text')
        .attr('x', -cardWidth / 2 + 16)
        .attr('y', -cardHeight / 2 + 59)
        .attr('fill', d => d.data.status === 'EnQuarantaine' ? '#fda4af' : '#38bdf8')
        .attr('font-size', '9px')
        .attr('font-family', 'ui-monospace, monospace')
        .attr('font-weight', '600')
        .text(d => d.data.quantity ? `Qté: ${d.data.quantity}` : (d.data.supplier ? truncateText(d.data.supplier, 22) : ''));

      // Status indicator circle on top-right
      nodeEnter.append('circle')
        .attr('cx', cardWidth / 2 - 14)
        .attr('cy', -cardHeight / 2 + 14)
        .attr('r', 4.5)
        .attr('fill', d => {
          if (d.data.status === 'EnQuarantaine') return '#f43f5e';
          if (d.data.status === 'Alerte') return '#fbbf24';
          return '#10b981';
        });

      // Expand/Collapse Toggle Pill on Right Edge if node has children
      const toggleBadge = nodeEnter.filter(d => Boolean(d.children || (d as any)._children || d.data.children));
      toggleBadge.append('circle')
        .attr('class', 'toggle-btn')
        .attr('cx', cardWidth / 2)
        .attr('cy', 0)
        .attr('r', 8)
        .attr('fill', '#1e293b')
        .attr('stroke', '#64748b')
        .attr('stroke-width', 1.5);

      toggleBadge.append('text')
        .attr('class', 'toggle-text')
        .attr('x', cardWidth / 2)
        .attr('y', 3.5)
        .attr('text-anchor', 'middle')
        .attr('fill', '#e2e8f0')
        .attr('font-size', '11px')
        .attr('font-weight', 'bold')
        .text(d => (d.children ? '−' : '+'));

      // Transition nodes to their new position
      const nodeUpdate = node.merge(nodeEnter).transition().duration(duration)
        .attr('transform', d => `translate(${d.y},${d.x})`);

      // Update toggle icon
      nodeUpdate.select('text.toggle-text')
        .text(d => (d.children ? '−' : '+'));

      // Transition exiting nodes to parent's new position
      const nodeExit = node.exit().transition().duration(duration)
        .attr('transform', () => `translate(${source.y},${source.x})`)
        .remove();

      nodeExit.select('rect').attr('fill-opacity', 0);
      nodeExit.select('text').attr('fill-opacity', 0);

      // Stash current positions for smooth transitions on next click
      nodes.forEach(d => {
        (d as any).x0 = d.x;
        (d as any).y0 = d.y;
      });
    }

    // Set initial positions
    (root as any).x0 = height / 2;
    (root as any).y0 = 0;

    // First render
    update(root);

    // Initial selected node is root
    setSelectedNodeData(rawHierarchyData);

  }, [rawHierarchyData, mode]);

  // Color & badge helpers
  function getNodeBackgroundColor(node: D3TraceNode): string {
    if (node.status === 'EnQuarantaine') return '#1f1315';
    if (node.category === 'root-finished') return '#0f172a';
    if (node.category === 'root-component') return '#1e1b4b';
    if (node.category === 'operation-bulk') return '#131c31';
    if (node.category === 'operation-packaging') return '#18142c';
    if (node.category === 'shipping-group') return '#0c1a2e';
    if (node.category === 'client') return '#0a192f';
    return '#090d16';
  }

  function getNodeBorderColor(node: D3TraceNode): string {
    if (node.status === 'EnQuarantaine') return '#f43f5e';
    if (node.category === 'root-finished') return '#6366f1';
    if (node.category === 'root-component') return '#a855f7';
    if (node.category === 'operation-bulk') return '#4f46e5';
    if (node.category === 'operation-packaging') return '#9333ea';
    if (node.category === 'raw-material') return '#3b82f6';
    if (node.category === 'packaging') return '#ec4899';
    if (node.category === 'client') return '#0ea5e9';
    return '#334155';
  }

  function getNodeAccentColor(node: D3TraceNode): string {
    if (node.status === 'EnQuarantaine') return '#f43f5e';
    if (node.category === 'root-finished') return '#818cf8';
    if (node.category === 'root-component') return '#c084fc';
    if (node.category === 'raw-material') return '#60a5fa';
    if (node.category === 'packaging') return '#f472b6';
    if (node.category === 'operation-bulk') return '#818cf8';
    if (node.category === 'operation-packaging') return '#c084fc';
    if (node.category === 'client') return '#38bdf8';
    return '#94a3b8';
  }

  function getNodeKicker(node: D3TraceNode): string {
    switch (node.category) {
      case 'root-finished':
        return 'LOT PRODUIT FINI';
      case 'root-component':
        return 'LOT MATIÈRE PREMIÈRE';
      case 'operation-bulk':
        return 'OPÉRATION MÉLANGE';
      case 'operation-packaging':
        return 'OPÉRATION EMBALLAGE';
      case 'raw-material':
        return 'MATIÈRE PREMIÈRE';
      case 'packaging':
        return 'COMPOSANT EMBALLAGE';
      case 'shipping-group':
        return 'CANAL EXPÉDITION';
      case 'client':
        return 'CLIENT DESTINATAIRE';
      case 'finished-product':
        return 'LOT FINI IMPACTÉ';
      default:
        return 'NOEUD DE TRACE';
    }
  }

  function truncateText(text: string, maxLen: number): string {
    if (!text) return '';
    return text.length > maxLen ? text.slice(0, maxLen - 1) + '…' : text;
  }

  // Zoom controls via button
  const handleZoom = (factor: number) => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    svg.transition().duration(250).call(
      d3.zoom<SVGSVGElement, unknown>().scaleBy as any,
      factor
    );
  };

  const handleResetZoom = () => {
    if (!svgRef.current || !containerRef.current) return;
    const svg = d3.select(svgRef.current);
    const height = Math.max(520, containerRef.current.clientHeight || 520);
    const initialTransform = d3.zoomIdentity.translate(80, height / 2.5).scale(0.85);
    svg.transition().duration(400).call(
      d3.zoom<SVGSVGElement, unknown>().transform as any,
      initialTransform
    );
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm flex flex-col">
      
      {/* TOOLBAR HEADER */}
      <div className="p-4 bg-slate-950 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
        
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Boxes className="w-4 h-4" />
          </div>
          <div>
            <div className="font-bold text-white flex items-center space-x-2">
              <span>Arbre Dynamique D3.js • {mode === 'descending' ? 'Généalogie Descendante' : 'Arborescence Ascendante'}</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-950 text-indigo-300 border border-indigo-800 font-mono">
                Interactif (Pan & Zoom)
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Cliquez sur les nœuds pour plier/déplier l'arborescence. Glissez pour explorer l'arbre.
            </p>
          </div>
        </div>

        {/* Zoom Controls & Legend */}
        <div className="flex items-center space-x-2">
          
          {/* Zoom Level Indicator */}
          <span className="font-mono text-[11px] text-slate-400 px-2 py-1 rounded bg-slate-900 border border-slate-800">
            {Math.round(zoomLevel * 100)}%
          </span>

          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5">
            <button
              onClick={() => handleZoom(1.2)}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
              title="Zoom avant (+)"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => handleZoom(0.8)}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
              title="Zoom arrière (-)"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleResetZoom}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
              title="Recentrer la vue"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>

      </div>

      {/* D3 SVG VIEWPORT CONTAINER */}
      <div 
        ref={containerRef}
        className="relative w-full h-[520px] bg-gradient-to-b from-slate-950 via-slate-900/60 to-slate-950 select-none overflow-hidden"
      >
        <svg
          ref={svgRef}
          className="w-full h-full cursor-grab active:cursor-grabbing"
        />

        {/* Legend Overlay at bottom-left */}
        <div className="absolute bottom-3 left-3 bg-slate-950/85 backdrop-blur-md border border-slate-800/80 rounded-xl p-2.5 text-[10px] space-y-1.5 shadow-xl max-w-xs pointer-events-none">
          <div className="font-bold text-slate-300 font-mono uppercase tracking-wider text-[9px]">Légende Généalogique</div>
          <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-slate-400">
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded bg-indigo-500"></span>
              <span>Produit Fini</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded bg-sky-500"></span>
              <span>Matière Première</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded bg-pink-500"></span>
              <span>Emballage</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded bg-cyan-400"></span>
              <span>Client Livré</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
              <span>Conforme</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse"></span>
              <span>Quarantaine</span>
            </div>
          </div>
        </div>

        {/* Selected Node Details Drawer on Top-Right */}
        {selectedNodeData && (
          <div className="absolute top-3 right-3 bg-slate-950/90 backdrop-blur-md border border-slate-800 rounded-xl p-4 shadow-2xl max-w-xs text-xs space-y-2.5 animate-in fade-in">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[9px] font-mono uppercase text-indigo-400 block font-bold">
                  {getNodeKicker(selectedNodeData)}
                </span>
                <span className="font-mono font-bold text-sm text-white">
                  {selectedNodeData.lotNumber || selectedNodeData.name}
                </span>
              </div>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                selectedNodeData.status === 'EnQuarantaine' 
                  ? 'bg-rose-950 text-rose-300 border border-rose-800' 
                  : selectedNodeData.status === 'Alerte'
                    ? 'bg-amber-950 text-amber-300 border border-amber-800'
                    : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
              }`}>
                {selectedNodeData.status || 'Conforme'}
              </span>
            </div>

            <div className="space-y-1 text-[11px] text-slate-300 border-t border-slate-800/80 pt-2">
              <div className="text-slate-400">{selectedNodeData.name}</div>
              {selectedNodeData.code && (
                <div className="font-mono text-slate-400">Réf / OF : <strong className="text-white">{selectedNodeData.code}</strong></div>
              )}
              {selectedNodeData.supplier && (
                <div>Fournisseur : <strong className="text-white">{selectedNodeData.supplier}</strong></div>
              )}
              {selectedNodeData.quantity && (
                <div className="font-mono">Dosage / Quantité : <strong className="text-emerald-400">{selectedNodeData.quantity}</strong></div>
              )}
              {selectedNodeData.deviation && (
                <div className="font-mono">Écart Bilan Matière : <strong className="text-amber-400">{selectedNodeData.deviation}</strong></div>
              )}
              {selectedNodeData.details && (
                <div className="text-slate-400 text-[10px] italic">{selectedNodeData.details}</div>
              )}
            </div>

            {/* Quick Navigation Action based on node type */}
            {selectedNodeData.category === 'raw-material' && selectedNodeData.lotNumber && onSelectComponent && (
              <button
                onClick={() => onSelectComponent(selectedNodeData.lotNumber!)}
                className="w-full mt-2 py-1.5 px-2.5 rounded-lg text-[11px] font-bold bg-purple-600 hover:bg-purple-500 text-white flex items-center justify-center space-x-1.5 transition-colors shadow-sm"
              >
                <ArrowUpRight className="w-3.5 h-3.5" />
                <span>Traçabilité Ascendante de ce lot</span>
              </button>
            )}

            {selectedNodeData.category === 'finished-product' && selectedNodeData.lotNumber && onSelectFinishedLot && (
              <button
                onClick={() => onSelectFinishedLot(selectedNodeData.lotNumber!)}
                className="w-full mt-2 py-1.5 px-2.5 rounded-lg text-[11px] font-bold bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center space-x-1.5 transition-colors shadow-sm"
              >
                <ArrowDownRight className="w-3.5 h-3.5" />
                <span>Ouvrir Fiche de ce Lot Fini</span>
              </button>
            )}
          </div>
        )}

      </div>

    </div>
  );
};
