# Map Generator

Tool for generating base SVG maps of Denmark. It will generate a "raw" SVG with all the dom elements. It is neccesary to add styling and interactivity when embedding the map using D3.js.

The generated SVG is *responsive* O.o

### Installation

```
    git clone https://github.com/Datakollektivet/map-generator.git
    cd map-generator
    npm install
```

### Usage

`node map-generator <options>`

see `node map-generator.js help`

### Embedding maps (example)

1. Generate map `node map-generator layers=regions output=container``
2. Embed in a html page
3. Style with css styling
```
        /* Set width of parent container for responsive SVG */
        #datakollektivet-i0001 {
            width: 800px;
        }


        /* Style elements */
        #datakollektivet-i0001 svg .region {
            fill: transparent;
            stroke: darkslategray;
            stroke-width: 1px;
        }

        #datakollektivet-i0001 svg .region.over {
            fill: darkslategray;
            
        }
```
4. Add interactivity with D3 
```
    d3.select("svg").selectAll("g")
        .on('mouseover', function () {
            d3.select(this).attr("class", "region over")
        })
        .on('mouseout', function () {
            d3.select(this).attr("class", "region")
        });

```

See [client-example.html]()


### Features (will soon include)

#### Defining map layers
It is possible to generate a map with a single layer and/or multiple layers. Options include:

+ Denmark outline [Default]
+ Regions
+ Municipalities
+ Postal code areas *
+ Parishes *
+ Police districts *
+ Election districts * 
+ Jurisdiction districts *

You define the layers by adding a cli argument, e.g. `node map-generator.js layers=denmark`. You can add multiple with `layers=all` or with comma seperation `layers=denmark, regions`.

* Soon

#### Define output format
It is possible to generate multiple file outputs. Options include:

+ HTML file with container (i.e. `<div id="<id>"><svg>...</svg></div>`) [Default]
+ SVG file (i.e. `<svg>...</svg>`)
+ Full HTML file (i.e. `<html><body><div id="<id>"><svg>...</svg></div></body></html>`)

You define the output format by adding a cli argument, e.g. `node map-generator.js output=container`. You can add multiple with `output=all` or with comma seperation `output=container, html`.

#### Configure nested maps
It is possible to either have the individual map layers as isolated SVG groups or embed child geometries in parent geometries (e.g. municipalities within each region group). The latter allow various zooming features where you can render the municipalities within a specific region when needed. Options include:

+ no|false [Default]
+ yes|true

You add nested geometries by adding the cli argument  `node map-generator.js nested=true`.

#### Configure style (or complexity)
It is possible to generate maps that directly reflect the underlyig geojson, but also generate maps that have simpler geometries to make more stylistic and visually simpler maps. Options include:

+ plain [default]
+ simplified
+ ?




### TODO

0. Convert to topojson with properties for better simplification library
1. Add all the map layers
2. Add full cli configuration
4. Add stylistic simplification
5. Add custom container ID (e.g. to fit Datakollektivet production serial)




