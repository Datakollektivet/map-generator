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

`node map-generator.js <options>`

see `node map-generator.js --help`

### Examples

#### Generate svg file with a compact map of Denmark
`node map-generator.js --packed --quality high --output svg --layers danmark`

#### Generate a low resolution regional map svg in a html container 
`node map-generator.js --quality low --output container --layers regioner`

### Embed map and add style and interactivity
1. Generate map `node map-generator.js --layers municipalities --output container -p`
2. Embed in a html page
3. Style with css styling
```
    /* Set width of parent container for responsive SVG */
    #datakollektivet-i0001 {
        width: 800px;
    }

    /* Set fill and strok color */
    #datakollektivet-i0001 svg {
        fill:transparent;
        stroke: black;
        stroke-width: 0.2;
    }
        
        
```
4. Add interactivity with CSS
```
    /* Set color on hover */
    #datakollektivet-i0001 svg g.kommune:hover {
        fill:yellow;
    }
```

See [client-example.html](client-example.html) for complete code.

### Features

#### Defining map layers
It is possible to generate a map with a single layer and/or multiple layers. Note: the options are provided in Danish to maintain consistency with the map data on [Dataforsyningen.dk](https://dataforsyningen.dk/). Options include:

+ Danmark outline [Default]
+ Regioner
+ Kommuner
+ Sogne

You define the layers by adding a cli argument, e.g. `node map-generator.js --layers danmark`. You can add multiple with comma seperation `--layers danmark regioner`.

#### Define output format
It is possible to generate multiple file outputs. Options include:

+ HTML file with container (i.e. `<div id="<id>"><svg>...</svg></div>`) [Default]
+ SVG file (i.e. `<svg>...</svg>`)
+ Full HTML file (i.e. `<html><body><div id="<id>"><svg>...</svg></div></body></html>`)

You define the output format by adding a cli argument, e.g. `node map-generator.js --output container`. You can add multiple with `--output all` or with comma seperation `--output container html`.

Output files will be save to the output folder.

#### Configure style (or complexity)
It is possible to generate maps that directly reflect the underlyig geojson, but also generate maps that have simpler geometries to make more stylistic and visually simpler maps. Options include:

+ high (naturalistic)
+ mid (default)
+ low (polygons)
+ artsy (very low polygons)
+ pixel (pixelarated)

### TODO

1. Client-example: Add a meaningful data visualization using D3
2. Add voting districts
3. Add individual area layer options




