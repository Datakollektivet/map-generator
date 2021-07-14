/*jshint esversion: 6 */
'use strict';

const fs = require("fs");
const topojson = require("topojson");
const D3Node = require("d3-node");
const options = require("./cli-support.js");

/*

The map does not include hieracical relations, e.g. municipalities being appended to specific region group. 
The geographic data and data on administractive boundries contains several overlaps (e.g. postal area spanning municipality, parish not beloing to any municipality etc.).

*/

const quality = {
    high: {
        q: 10000,
        s: 0.00001
    }, //q is grid resolution (point snap). s is point simplification
    mid: {
        q: 8000,
        s: 0.0001
    },
    low: {
        q: 8000,
        s: 0.00097
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

//We set the viewbox width depending on if the map is packed.
//If options.packed is true, we make a rectangle
let viewBoxWidth = options.packed ? 500 : 800;
let viewBoxHeight = 600;


const d3options = {
    selector: '#datakollektivet-i0001',
    container: '<div id="datakollektivet-i0001"><meta charset="utf-8" /></div>'
};

const d3n = new D3Node(d3options); // initializes D3 with container element
const d3 = d3n.d3;

//Setting up map projection 
let projection = d3.geoMercator()
    .scale(5500)
    .translate([0, 0]);

let path = d3.geoPath()
    .projection(projection);

//We always load Denmark, because we need the bounds (although this could be done for every layer).
const regionsTopo = JSON.parse(fs.readFileSync("./topojson/regioner.topojson"));
let denmarkQuantize = topojson.quantize(regionsTopo, quality[options.quality].q);
let denmarkSimplified = topojson.simplify(topojson.presimplify(denmarkQuantize), quality[options.quality].s);
let denmark = topojson.feature(denmarkSimplified, denmarkSimplified.objects.regioner);

let bounds = path.bounds(topojson.feature(regionsTopo, regionsTopo.objects.regioner));

//Translating the projection so the map is positioned correctly
projection
    .translate([viewBoxWidth / 2 - (bounds[0][0] + bounds[1][0]) / 2, viewBoxHeight / 2 - (bounds[0][1] + bounds[1][1]) / 2]);

//Create svg with zero width and height. We do not want width and hight, but use viewbox instead for responsive design
let svg = d3n.createSVG(0, 0);
//Adding the viewbox attribute to make the svg responsive to the parent size 
svg.attr("viewBox", "0 0 " + viewBoxWidth + " " + viewBoxHeight);

if (options.packed) {
    let denmarkWithoutBornholm = topojson.merge(denmarkSimplified, denmarkSimplified.objects.regioner.geometries.filter(function (d, i) {
        if (i == 1 || i == 2 || i == 6 || i == 5) {
            return false;
        } else {
            return true;
        }
    }));
    
    let bornholm = topojson.merge(denmarkSimplified, denmarkSimplified.objects.regioner.geometries.filter(function (d, i) {
        if (i == 1 || i == 2 || i == 6 || i == 5) {
            return true;
        }
    }));

    bounds = path.bounds(denmarkWithoutBornholm);
    let bornholmBounds = path.bounds(bornholm);

    let boundWidth = bornholmBounds[1][0] - bornholmBounds[0][0] + 20;
    let boundHeight = bornholmBounds[1][1] - bornholmBounds[0][1] + 20;

    svg.append("g")
        .attr("class", "dkmap-bornholm-box")
        .attr("transform", "translate(-250, -400)");

    svg.select(".dkmap-bornholm-box")
        .append("rect")
        .attr("stroke", "#bbbbbb")
        .attr("stroke-width", 0.5)
        .attr("fill", "transparent")
        .attr("width", boundWidth)
        .attr("height", boundHeight)
        .attr("x", bornholmBounds[0][0] - 10)
        .attr("y", bornholmBounds[0][1] - 10);
} 

if (options.layers.indexOf("denmark") != -1) {

    if (options.packed){
        svg.append("g")
        .attr("id", "denmark000")
        .append("path")
        .datum(denmarkWithoutBornholm)
        .attr("d", path)
        .attr("class", "denmark")
        .attr("data-navn", "Danmark"); //Name of the path.

        svg.select(".dkmap-bornholm-box")
        .append("g")
        .attr("id", "denmark000bornholm")
        .append("path")
        .datum(bornholm)
        .attr("d", path)
        .attr("class", "bornholm denmark")
        .attr("data-navn", "Danmark"); //Name of the path.
    } else {
        svg.append("g")
        .attr("id", "denmark000")
        .append("path")
        .datum(denmark)
        .attr("d", path)
        .attr("class", "denmark")
        .attr("data-navn", "Danmark");
    }
}

if (options.layers.indexOf("regions") != -1) {

    let regionsQuantize = topojson.quantize(regionsTopo, quality[options.quality].q);
    let regionsSimplified = topojson.simplify(topojson.presimplify(regionsQuantize), quality[options.quality].s);
    let regions = topojson.feature(regionsSimplified, regionsSimplified.objects.regioner);
    
    svg.selectAll("path")
        .data(regions.features)
        .enter()
        .each(function (d) {
            let r = svg.select("g#region" + d.properties.REGIONKODE.substring(1, 4))            
            if (options.packed && d.properties.REGIONKODE === "1084" && isInBornholm(d.geometry) && r.empty()) {
                r = svg.select(".dkmap-bornholm-box")
                    .append("g")
                    .attr("id", "region" + d.properties.REGIONKODE )
                    .attr("class", "region")
                    .attr("data-name", d.properties.REGIONNAVN);
            
            } else if(r.empty()){
                r = svg.append("g")
                    .attr("id", "region"+d.properties.REGIONKODE)
                    .attr("class", "region")
                    .attr("data-name", d.properties.REGIONNAVN)
            }

            r.append("path").attr("d", path(d.geometry))
        });
}

if (options.layers.indexOf("municipalities") != -1) {
    let municipalitiesTopo = JSON.parse(fs.readFileSync("./topojson/kommuner.topojson"));

    let municipalitiesQuantize = topojson.quantize(municipalitiesTopo, quality[options.quality].q);
    let municipalitiesSimplified = topojson.simplify(topojson.presimplify(municipalitiesQuantize), quality[options.quality].s);
    let municipalities = topojson.feature(municipalitiesSimplified, municipalitiesSimplified.objects.kommuner);

    svg.selectAll("path")
        .data(municipalities.features)
        .enter()
        .each(function (d) {
            let m = svg.select("g#municipality" + d.properties.KOMKODE.substring(1, 4))       
            if (options.packed && isInBornholm(d.geometry) && m.empty()) {
                m = svg.select(".dkmap-bornholm-box")
                    .append("g")
                    .attr("id", "municipality"+d.properties.KOMKODE.substring(1, 4))
                    .attr("class", "municipality")
                    .attr("data-name", d.properties.KOMNAVN);
            } else if(m.empty()){
                m = svg.append("g")
                .attr("id", "municipality"+d.properties.KOMKODE.substring(1, 4))
                .attr("class", "municipality")
                .attr("data-name", d.properties.KOMNAVN);
            }

            m.append("path")
            .attr("d", path(d.geometry))
        });
}

if (options.layers.indexOf("postalcodes") != -1) {
    let postalcodesTopo = JSON.parse(fs.readFileSync("./topojson/postnumre.topojson"));

    let postalcodesQuantize = topojson.quantize(postalcodesTopo, quality[options.quality].q);
    let postalcodesSimplified = topojson.simplify(topojson.presimplify(postalcodesQuantize), quality[options.quality].s);
    let postalcodes = topojson.feature(postalcodesSimplified, postalcodesSimplified.objects.postnumre);

    svg.selectAll("path")
        .data(postalcodes.features)
        .enter()
        .each(function (d) {
            let p = svg.select("g#postal"+d.properties.POSTNR_TXT)       
            if (options.packed && isInBornholm(d.geometry) && p.empty()) {
                p = svg.select(".dkmap-bornholm-box")
                    .append("g")
                    .attr("id", "postal"+d.properties.POSTNR_TXT)
                    .attr("class", "postalcode")
                    .attr("data-name", d.properties.POSTBYNAVN);
                   
            } else if(p.empty()) {
                p = svg.append("g")
                    .attr("id", "postal"+d.properties.POSTNR_TXT)
                    .attr("class", "postalcode")
                    .attr("data-name", d.properties.POSTBYNAVN);
            }

            p.append("path").attr("d", path(d.geometry))
        });
}

if (options.layers.indexOf("parishes") != -1) {
    let parishesTopo = JSON.parse(fs.readFileSync("./topojson/sogne.topojson"));

    let parishesQuantize = topojson.quantize(parishesTopo, quality[options.quality].q);
    let parishesSimplified = topojson.simplify(topojson.presimplify(parishesQuantize), quality[options.quality].s);
    let parishes = topojson.feature(parishesSimplified, parishesSimplified.objects.sogne);

    svg.selectAll("path")
        .data(parishes.features)
        .enter()
        .each(function (d) {
            let p = svg.select("g#parish"+d.properties.SOGNEKODE)       
            if (options.packed && isInBornholm(d.geometry) && p.empty()) {
                p = svg.select(".dkmap-bornholm-box")
                    .append("g")
                    .attr("id", "parish"+d.properties.SOGNEKODE)
                    .attr("class", "parish")
                    .attr("data-name", d.properties.SOGNENAVN);
            } else if(p.empty()) {
                p = svg.append("g")
                    .attr("id", "parish"+d.properties.SOGNEKODE)
                    .attr("class", "parish")
                    .attr("data-name", d.properties.SOGNENAVN);
            }

            p.append("path").attr("d", path(d.geometry))
        });
}

if (options.layers.indexOf("constituencies") != -1) {
    let constituenciesTopo = JSON.parse(fs.readFileSync("./topojson/opstillingskredse.topojson"));

    let constituenciesQuantize = topojson.quantize(constituenciesTopo, quality[options.quality].q);
    let constituenciesSimplified = topojson.simplify(topojson.presimplify(constituenciesQuantize), quality[options.quality].s);
    let constituencies = topojson.feature(constituenciesSimplified, constituenciesSimplified.objects.opstillingskredse);

    svg.selectAll("path")
        .data(constituencies.features)
        .enter()
        .each(function (d) {
            let c = svg.select("g#constituency"+d.properties.OPSTILKRNR)  
            if (options.packed && isInBornholm(d.geometry) && c.empty()) {
                c = svg.select(".dkmap-bornholm-box")
                    .append("g")
                    .attr("id", "constituency"+d.properties.OPSTILKRNR)
                    .attr("data-name", d.properties.OPSTILNAVN)
                    .attr("data-id", d.properties.VALGKRNR)
                    .attr("data-districtid", d.properties.STORKRNR)
                    .attr("data-districtname", d.properties.STORKRNAVN)
                    .attr("class", "constituency");
                    
            } else if(c.empty()){
                c = svg.append("g")
                    .attr("id", "constituency"+d.properties.OPSTILKRNR)
                    .attr("data-name", d.properties.OPSTILNAVN)
                    .attr("data-id", d.properties.VALGKRNR)
                    .attr("data-districtid", d.properties.STORKRNR)
                    .attr("data-districtname", d.properties.STORKRNAVN)
                    .attr("class", "constituency");
            }

            c.append("path").attr("d", path(d.geometry))
        });
}


if (options.layers.indexOf("jurisdictions") != -1) {
    let jurisdictionsTopo = JSON.parse(fs.readFileSync("./topojson/retskredse.topojson"));

    let jurisdictionsQuantize = topojson.quantize(jurisdictionsTopo, quality[options.quality].q);
    let jurisdictionsSimplified = topojson.simplify(topojson.presimplify(jurisdictionsQuantize), quality[options.quality].s);
    let jurisdictions = topojson.feature(jurisdictionsSimplified, jurisdictionsSimplified.objects.retskredse);

    svg.selectAll("path")
        .data(jurisdictions.features)
        .enter()
        .each(function (d) {
            let j = svg.select("g#jurisdiction"+d.properties.RETSKRNR)  
            if (options.packed && isInBornholm(d.geometry) && j.empty()) {
                j = svg.select(".dkmap-bornholm-box")
                    .append("g")
                    .attr("id", "jurisdiction"+d.properties.RETSKRNR)
                    .attr("class", "jurisdiction id" + d.properties.RETSKRNR)
                    .attr("data-name", d.properties.RETSKRNAVN);

            } else if(j.empty()){
                j = svg.append("g")
                .attr("id", "jurisdiction"+d.properties.RETSKRNR)
                .attr("class", "jurisdiction id" + d.properties.RETSKRNR)
                .attr("data-name", d.properties.RETSKRNAVN);
            }

            j.append("path").attr("d", path(d.geometry))
        });
}

if (options.layers.indexOf("precincts") != -1) {
    let precinctsTopo = JSON.parse(fs.readFileSync("./topojson/politikredse.topojson"));

    let precinctsQuantize = topojson.quantize(precinctsTopo, quality[options.quality].q);
    let precinctsSimplified = topojson.simplify(topojson.presimplify(precinctsQuantize), quality[options.quality].s);
    let precincts = topojson.feature(precinctsSimplified, precinctsSimplified.objects.politikredse);

    svg.selectAll("path")
        .data(precincts.features)
        .enter()
        .each(function (d) {
            let p = svg.select("g#precinct"+d.properties.POLKR_NR)
            if (options.packed && isInBornholm(d.geometry) && p.empty()) {
                p = svg.select(".dkmap-bornholm-box")
                    .append("g")
                    .attr("id", "precinct"  + d.properties.POLKR_NR)
                    .attr("class", "precinct")
                    .attr("data-name", d.properties.POLKR_NAVN)
                    
            } else if(p.empty()){
                    p = svg .append("g")
                    .attr("id", "precinct"  + d.properties.POLKR_NR)
                    .attr("class", "precinct")
                    .attr("data-name", d.properties.POLKR_NAVN);
                    
            }

            p.append("path").attr("d", path(d.geometry))
        });
}

if (options.layers.indexOf("parish") != -1) {
    let parishTopo = JSON.parse(fs.readFileSync("./topojson/sogne.topojson"));

    let parishQuantize = topojson.quantize(parishTopo, quality[options.quality].q);
    let parishSimplified = topojson.simplify(topojson.presimplify(parishQuantize), quality[options.quality].s);
    let parishes = topojson.feature(parishSimplified, parishSimplified.objects.sogne);

    svg.selectAll("path")
        .data(parishes.features)
        .enter()
        .each(function (d) {
            let p = svg.select("g#parish"+d.properties.SOGNEKODE)
            if (options.packed && isInBornholm(d.geometry) && p.empty()) {
                p = svg.select(".dkmap-bornholm-box")
                    .append("g")
                    .attr("id", "parish"  + d.properties.SOGNEKODE)
                    .attr("class", "parish")
                    .attr("data-name", d.properties.SOGNENAVN)
                    
            } else if(p.empty()){
                    p = svg .append("g")
                    .attr("id", "parish"  + d.properties.SOGNEKODE)
                    .attr("class", "parish")
                    .attr("data-name", d.properties.SOGNENAVN);    
            }

            p.append("path").attr("d", path(d.geometry))
        });
}

if(options.output.indexOf("svg") > -1){
    fs.writeFileSync('map.svg', d3n.svgString());
} else if (options.output.indexOf("html") > -1) {
    fs.writeFileSync('map.html', d3n.html());
} else if (options.output.indexOf("container") > -1) {
    fs.writeFileSync('map_container.html', d3n.chartHTML());
} else {
    fs.writeFileSync('map_container.html', d3n.chartHTML());
}

function isInBornholm(geometry) {
    let gB = path.bounds(geometry);
    let bB = path.bounds(bornholm);

    if (gB[0][0] > bB[0][0] - 5 && gB[1][0] < bB[1][0] + 5 && gB[0][1] > bB[0][1] - 5 && gB[1][1] < bB[1][1] + 5) {
        return true;
    } else {
        return false;
    }
}