import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { RestService } from '../rest.service';
import { ActivatedRoute, Router } from '@angular/router';

import * as d3 from 'd3';

interface Node {
  _id: number;
  hijos: number[];
  Gn: number;
}

interface Link {
  source: number;
  target: number;
  value: number;
}

interface Graph {
  nodes: Node[];
  links: Link[];
}

@Component({
  selector: 'app-user-profile',
  templateUrl: './user-profile.component.html',
  styleUrls: ['./user-profile.component.css'],
  encapsulation: ViewEncapsulation.None
})

export class UserProfileComponent implements OnInit {

  grafo:any = [];

  constructor(public rest:RestService, private route: ActivatedRoute, private router: Router) { }

  ngOnInit() {
    /*this.getNodes();*/
    console.log('D3.js version:', d3['version']);

    const svg = d3.select("svg");
    const width = +svg.attr('width');
    const height = +svg.attr('height');

    const color = d3.scaleOrdinal(d3.schemeCategory10);

    const zoom_handler = d3.zoom()
      .on("zoom", zoom_actions);

    zoom_handler(svg as any); 

    const simulation = d3.forceSimulation()
      .force('link', d3.forceLink().id((d:any) => d._id))
      .force('charge', d3.forceManyBody())
      .force('collide', d3.forceCollide((d: any) =>  d._id === "j" ? 110 : 60 ))
      .force('center', d3.forceCenter(width / 2 , height / 2));

    /*.force('collide', d3.forceCollide((d: any) =>  d.id === "j" ? 100 : 50 )) */

    const g = svg.append("g")
      .attr("class", "everything");

    d3.json('https://iagraph-server.herokuapp.com/graph').
      then((data: any) => {
        const nodes: Node[] = [];
        const links: Link[] = [];

        data.nodes.forEach((d) => {
          nodes.push(<Node>d);
        });

        data.links.forEach((d) => {
          links.push(<Link>d);
        });

        const graph: Graph = <Graph>{ nodes, links };

        const link = g.append('g')
          .attr('class', 'links')
          .selectAll('line')
          .data(graph.links)
          .enter()
          .append('line')
          .attr('stroke-width', (d: any) => Math.sqrt(d.value)+1);

        const node = g.append('g')
          .attr('class', 'nodes')
          .selectAll('circle')
          .data(graph.nodes)
          .enter()
          .append('circle')
          .attr('r', (d: any) => 1.5*d.Gn + 10)
          .attr('fill', (d: any) => color(d.Gn));



        /*const lables = node.append("text")
          .text((d) => d.id)
          .attr('x', 6)
          .attr('y', 3);*/

        g.selectAll('circle').call(d3.drag()
          .on('start', dragstarted)
          .on('drag', dragged)
          .on('end', dragended)
        );

        const textElements = g.append('g')
        .selectAll('text')
        .data(graph.nodes)
        .enter().append('text')
          .text(node => node._id)
          .attr('font-size', 20)
          .attr('text-anchor','middle')
          .attr('fill', 'white')
          .attr('dy', 5)

        node.append('title')
          .text((d) => d.hijos.toString());

        simulation
          .nodes(graph.nodes)
          .on('tick', ticked);

        simulation.force<d3.ForceLink<any, any>>('link')
          .links(graph.links);

        function ticked() {
          link
            .attr('x1', function(d: any) { return d.source.x; })
            .attr('y1', function(d: any) { return d.source.y; })
            .attr('x2', function(d: any) { return d.target.x; })
            .attr('y2', function(d: any) { return d.target.y; });

          node
            .attr('cx', function(d: any) { return d.x; })
            .attr('cy', function(d: any) { return d.y; });
          textElements
            .attr('x', function(d: any) { return d.x; })
            .attr('y', function(d: any) { return d.y; });

        }
      })
      .catch((err) => {
        throw new Error('Bad data file! '+err); 
      });

    function zoom_actions(){
      g.attr("transform", d3.event.transform)
    }

    function dragstarted(d) {
      if (!d3.event.active) { simulation.alphaTarget(0.3).restart(); }
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(d) {
      d.fx = d3.event.x;
      d.fy = d3.event.y;
    }

    function dragended(d) {
      if (!d3.event.active) { simulation.alphaTarget(0); }
      d.fx = null;
      d.fy = null;
    }
  }

  getNodes() {
    this.grafo = [];
    this.rest.getNodes().subscribe((data: {}) => {
      console.log(data);
      this.grafo = data;
    });
  }

}
