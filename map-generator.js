/*jshint esversion: 6 */
'use strict';

const fs = require("fs");
const D3Node = require("d3-node");

const options = {
    selector: '#datakollektivet-i0001',
    container: '<div id="datakollektivet-i0001"><meta charset="utf-8" /></div>'
};

const d3n = new D3Node(options); // initializes D3 with container element
const d3 = d3n.d3;

if(process.argv.indexOf("help") > 0){
    let out = fs.readFileSync("./helper.txt").toString()
    console.log(out)
    process.exit(1)
}



//Different GeoJSON maps
//Note, we use geojson (over topojson) for the additional information (e.g. name, ids, etc.)
const denmark = JSON.parse(fs.readFileSync("./geojson/danmark.geojson"));
const regions = JSON.parse(fs.readFileSync("./geojson/regioner.geojson"));
const municipalities = JSON.parse(fs.readFileSync("./geojson/kommuner.geojson"));
const postal = JSON.parse(fs.readFileSync("./geojson/postnumre.geojson"));
const parishes = JSON.parse(fs.readFileSync("./geojson/sogne.geojson"));
const police = JSON.parse(fs.readFileSync("./geojson/politikredse.geojson"));
const jurisdiction = JSON.parse(fs.readFileSync("./geojson/retskredse.geojson"));
const constituencies = JSON.parse(fs.readFileSync("./geojson/opstillingskreds.geojson"));

let projection = d3.geoMercator()
    .scale(5800)
    .translate([0, 0]);

let path = d3.geoPath()
    .projection(projection);

//Calculate bounds of Denmark
let bounds = path.bounds(denmark);

projection
    .translate([800 / 2 - (bounds[0][0] + bounds[1][0]) / 2, 600 / 2 - (bounds[0][1] + bounds[1][1]) / 2]);

//Create svg with zero width and height. We do not want width and hight, but use viewbox instead for responsive design
let svg = d3n.createSVG(0, 0);
//Adding the viewbox attribute to make the svg responsive to the parent size 
svg.attr("viewBox", "0 0 " + 800 + " " + 600);

svg.append("g")
    .attr("class", "datakollektivet-dkmap-danmark") //Class allow styling later
    .append("path")
    .datum(denmark)
    .attr("d", path)
    .attr("data-dstid", "000") //The id used in the Danish statistical data
    .attr("data-name", "Danmark");//Name of the path.


let regionGrp = svg.append("g").attr("class", "datakollektivet-dkmap-regioner");
regionGrp.selectAll("g")
    .data(regions.features)
    .enter()
    .each(function (d) {
        let g = regionGrp.select(".r_" + d.properties.REGIONKODE);

        if (g.empty()) {
            g = regionGrp.append("g")
                .attr("class", "r_" + d.properties.REGIONKODE)
                .attr("data-dstid", d.properties.REGIONKODE.substring(1, 4))
                .attr("data-name", d.properties.REGIONNAVN);
        }
        g.append("path").attr("d", path(d.geometry));
    });

regionGrp.selectAll("g").each(function(){
    d3.select(this).attr("class", "region");
});

let municipalityGrp = svg.append("g").attr("class", "datakollektivet-dkmap-kommuner");
municipalityGrp.selectAll("g")
    .data(municipalities.features)
    .enter()
    .each(function (d) {
        let g = municipalityGrp.select(".k_" + d.properties.KOMKODE.substring(1,4));

        if (g.empty()) {
            g = municipalityGrp.append("g")
                .attr("class", "k_" + d.properties.KOMKODE.substring(1,4))
                .attr("data-dstid", d.properties.KOMKODE.substring(1,4))
                .attr("data-name", d.properties.KOMNAVN);
        }
        g.append("path").attr("d", path(d.geometry));
    });

municipalityGrp.selectAll("g").each(function(){
    d3.select(this).attr("class", "kommune");
});

fs.writeFileSync('map.html', d3n.html());
fs.writeFileSync('map_container.html', d3n.chartHTML());
fs.writeFileSync('map.svg', d3n.svgString());
