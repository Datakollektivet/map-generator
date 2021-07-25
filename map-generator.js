/*jshint esversion: 6 */
'use strict';

/*
    Source maps on Dataforsyningen
    https://api.dataforsyningen.dk/DAGI_250MULTIGEOM_GMLSFP_DAF?service=WFS&request=GetCapabilities&token=

    Script for generating geojson from shapefiles 
    ogr2ogr -f GeoJSON -t_srs crs:84  ../geojson/sogne.geojson sogne.shp

    Script for generating topojson from geojson 
    geo2topo -o ../topojson/sogne.topojson ../geojson/sogne.geojson

    Why do we need topojson? Because we want to be able to dynamically simplify stuff on the geometries 
    ... and then generate geojson for D3

*/

const fs = require("fs");
const topojson = require("topojson");
const D3Node = require("d3-node");
const options = require("./cli-support.js");

//TODO: Update README.md
//TODO: Individual areas - this is 
//TODO: Voting districts as a layer option

const quality = {
    high: {
        q: 20000,
        s: 0.000001
    }, //q is grid resolution (point snap). s is point simplification
    mid: {
        q: 10000,
        s: 0.00001
    },
    low: {
        q: 7000,
        s: 0.00095
    },
    artsy: {
        q: 1000,
        s: 0.007
    },
    pixel: {
        q: 200,
        s: 0.0001
    }
};

const hierarchy = ["danmark", "regioner", "kommuner", "sogne"]

//We set the viewbox width depending on if the map is packed.
//If options.packed is true, we make a rectangle
let viewBoxWidth = options.packed ? 500 : 700;
let viewBoxHeight = 600;

const d3options = {
    selector: '#datakollektivet-i0001', //Change this somewhere to allow us to have project based maps
    container: '<div id="datakollektivet-i0001"><meta charset="utf-8" /></div>' //need to remove style after development
};

const d3n = new D3Node(d3options); // initializes D3 with container element
const d3 = d3n.d3;

//We always load Denmark, because we need the bounds (although this could be done for every layer).
const regionsTopo = JSON.parse(fs.readFileSync("./data/topojson/regioner.topojson"));
let denmarkQuantize = topojson.quantize(regionsTopo, quality[options.quality].q);
let denmarkSimplified = topojson.simplify(topojson.presimplify(denmarkQuantize), quality[options.quality].s);
let denmark = topojson.feature(denmarkSimplified, denmarkSimplified.objects.regioner);

//We need the geography of Bornholm to be able to filter!
let bornholm = topojson.merge(denmarkSimplified, denmarkSimplified.objects.regioner.geometries.filter(function (d, i) {
    return d.properties.navn === "Bornholm"
}));

//We need denmark without bornholm
let denmarkWithoutBornholm = topojson.merge(denmarkSimplified, denmarkSimplified.objects.regioner.geometries.filter(function (d, i) {
    return d.properties.navn !== "Bornholm"
}));

let fitter = options.packed ? denmarkWithoutBornholm : denmark

//Setting up map projection 
let projection = d3.geoMercator().fitSize([viewBoxWidth,viewBoxHeight], fitter)
  
let path = d3.geoPath()
    .projection(projection);

let bounds = path.bounds(topojson.feature(regionsTopo, regionsTopo.objects.regioner))

//Create svg with zero width and height. We do not want width and hight, but use viewbox instead for responsive design
let svg = d3n.createSVG(0, 0);
//Adding the viewbox attribute to make the svg responsive to the parent size 
svg.attr("viewBox", "0 0 " + viewBoxWidth + " " + viewBoxHeight);

//Setting up two regions for different georgraphies, because we need to be able to move the island of Bornholm for a more compact map.
let dk_main = svg.append("g").attr("id", "dk_main").attr("class", "denmark")
let dk_bornholm = svg.append("g").attr("id", "dk_bornholm").attr("class", "denmark")

//we want to sort layers so that we can add each to the previous layer
options.layers.sort(function (a, b) {
    return hierarchy.indexOf(a) - hierarchy.indexOf(b);
});

//We need the outline to be "doubled" to make sure that the stroke-width is equal to borders
if(options.layers.indexOf("danmark") == -1){
    options.layers.unshift("danmark")
}

// We know the layers are sorted. Hence, we can check if the prior layer exist
for (var i = 0, n = options.layers.length; i < n; i++) {
    let layer = options.layers[i]
    //Regardless, we know that in any configuration, this layer is the first
    if (layer === "danmark") {

        dk_main.append("path")
            .datum(denmarkWithoutBornholm)
            .attr("d", path)

        dk_bornholm.append("path")
            .datum(bornholm)
            .attr("d", path)
    }

    if (layer === "regioner") {

        let regionsQuantize = topojson.quantize(regionsTopo, quality[options.quality].q);
        let regionsSimplified = topojson.simplify(topojson.presimplify(regionsQuantize), quality[options.quality].s);
        let regions = topojson.feature(regionsSimplified, regionsSimplified.objects.regioner);

        svg.selectAll("g.region")
            .data(regions.features)
            .enter()
            .each(function (d) {
                let g = d.properties.navn === "Bornholm" ? dk_bornholm : dk_main

                g.append("g")
                    .attr("data-name", d.properties.navn)
                    .attr("class", "region rid" + d.properties.regionskod)
                    .append("path")
                    .attr("d", path(d.geometry))
            })
    }

    if (layer === "kommuner") {

        let municipalitiesTopo = JSON.parse(fs.readFileSync("./data/topojson/kommuner.topojson"));

        let municipalitiesQuantize = topojson.quantize(municipalitiesTopo, quality[options.quality].q);
        let municipalitiesSimplified = topojson.simplify(topojson.presimplify(municipalitiesQuantize), quality[options.quality].s);
        let municipalities = topojson.feature(municipalitiesSimplified, municipalitiesSimplified.objects.kommuner);

        svg.selectAll("g.kommune")
            .data(municipalities.features)
            .enter()
            .each(function (d) {

                let kid = d.properties.kommunekod
                let rid = d.properties.regionskod

                let map_group = (kid === 400 || kid === 411) ? dk_bornholm : dk_main

                let g = map_group.select("g.rid" + rid).empty() ? map_group : map_group.select("g.rid" + rid)
                g = map_group.select("g.kid" + kid).empty() ? g : map_group.select("g.kid" + kid)

                if (g.attr("class").indexOf("kommune") == -1) {
                    g = g.append("g")
                        .attr("class", "kommune kid" + kid)
                        .attr("data-name", d.properties.navn);
                }

                g.append("path").attr("d", path(d.geometry))
            })
    }

    if (layer === "sogne") {

        let parishesTopo = JSON.parse(fs.readFileSync("./data/topojson/sogne.topojson"));

        let parishesQuantize = topojson.quantize(parishesTopo, quality[options.quality].q);
        let parishesSimplified = topojson.simplify(topojson.presimplify(parishesQuantize), quality[options.quality].s);
        let parishes = topojson.feature(parishesSimplified, parishesSimplified.objects.sogne);

        svg.selectAll("g.sogne")
            .data(parishes.features)
            .enter()
            .each(function (d) {

                let rid = d.properties.regionskod
                let kid = d.properties.kommunekod
                let sid = d.properties.sognekode

                let map_group = (kid === 400 || kid === 411) ? dk_bornholm : dk_main
                let g = map_group.select("g.rid" + rid).empty() ? map_group : map_group.select("g.rid" + rid)
                g = map_group.select("g.kid" + kid).empty() ? g : map_group.select("g.kid" + kid)
                g = map_group.select("g.sid" + sid).empty() ? g : map_group.select("g.sid" + sid)

                if (g.attr("class").indexOf("sogn") == -1) {
                    g = g.append("g")
                        .attr("class", "sogn sid" + sid)
                        .attr("data-name", d.properties.navn);
                }
                g.append("path").attr("d", path(d.geometry))
            })
    }
}

//If we want a packed map - we move dk_bornholm and wrap it in a container
if (options.packed) {
    let bornholmBounds = path.bounds(bornholm);

    let boundWidth = bornholmBounds[1][0] - bornholmBounds[0][0] + 20;
    let boundHeight = bornholmBounds[1][1] - bornholmBounds[0][1] + 20;

    dk_bornholm
        .append("rect")
        .attr("stroke", "#bbbbbb")
        .attr("stroke-width", 0.5)
        .attr("fill", "transparent")
        .attr("width", boundWidth)
        .attr("height", boundHeight)
        .attr("x", bornholmBounds[0][0] - 10)
        .attr("y", bornholmBounds[0][1] - 10);

    dk_bornholm.attr("transform", "translate(-280, -430)");
}

if (options.format.indexOf("svg") > -1) {
    fs.writeFileSync('output/' + options.output + '.svg', d3n.svgString());
} else if (options.format.indexOf("html") > -1) {
    fs.writeFileSync('output/' + options.output + '.html', d3n.html());
} else if (options.format.indexOf("container") > -1) {
    fs.writeFileSync('output/' + options.output + '.container.html', d3n.chartHTML());
} else if (options.format.indexOf("all") > -1) {
    fs.writeFileSync('output/' + options.output + '.svg', d3n.svgString());
    fs.writeFileSync('output/' + options.output + '.html', d3n.html());
    fs.writeFileSync('output/' + options.output + '.container.html', d3n.chartHTML());
} else {
    fs.writeFileSync('output/' + options.output + '.html', d3n.html());
}