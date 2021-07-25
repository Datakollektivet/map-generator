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


+ SVG file (i.e. `<svg>...</svg>`)
+ Full HTML file (i.e. `<html><body><div id="<id>"><svg>...</svg></div></body></html>`)
+ HTML file with container (i.e. `<div id="<id>"><svg>...</svg></div>`) [Default]

You define the output format by adding a cli argument, e.g. `node map-generator.js --format container`. You can add multiple with `--format all` or with space seperation `--format container html`.

Output files will be save to the output folder.

#### Configure style (or complexity)
It is possible to generate maps that directly reflect the underlyig geojson, but also generate maps that have simpler geometries to make more stylistic and visually simpler maps. Options include:

+ high (naturalistic)
+ mid (default)
+ low (polygons)
+ artsy (very low polygons)
+ pixel (pixelarated)

#### Output file names
With the `--output` option it is possible to add a distinct filename. This is useful if we need to generate mulitiple maps. 

### Note on source data
The map is generated from data from the Danish open data platform [Dataforsyningen.dk](https://dataforsyningen.dk/). Each element share common codes (with few variations) with the ids on e.g. the [Danish Statistical service](https://dst.dk). The mapes are generated the following way:

1. The maps are fetched using the [DAGI_250 WFS]( https://api.dataforsyningen.dk/DAGI_250MULTIGEOM_GMLSFP_DAF?service=WFS&request=GetCapabilities&token=) service with a 1:250000 resolution.'Note you need an API key. This is free but requires an account.
2. It is imported into QGIS using the [WFS 2.0 Client plugin](https://github.com/qgisinspiretools/qgis-wfs20-client-plugin).
3. The maps are then exported as shapefiles from QGIS. For the region data, Bornholm has been seperated from its parent region (Hovedstaden) using QGIS. For the parish data, they include regional and municpal ids using QGIS intersect tool. 
4. (Because we were unable to export working GeoJSON files using QGIS we) Generate GeoJSON files using [ogr2ogr](https://gdal.org/programs/ogr2ogr.html): `ogr2ogr -f GeoJSON -t_srs crs:84  ../geojson/sogne.geojson sogne.shp`
5. (Because we need the topojson version to do some dynamic filtering we) Generate TopoJSON files using [topojson](https://github.com/topojson/topojson): `geo2topo -o ../topojson/sogne.topojson ../geojson/sogne.geojson` 

#### History
1. The initial version was based on [Neografen's Geo- and Topo JSON files available on github](https://github.com/Neogeografen/dagi).
2. The second version was based on [Neografen's Geo- and Topo JSON files available on github](https://github.com/Neogeografen/dagi) and administrative data from [Danmarks Adressers Web API](https://dawadocs.dataforsyningen.dk/)
3. The current version is based on map data from [Dataforsyningen.dk](https://dataforsyningen.dk/).


### TODO
1. Client-example: Add a meaningful data visualization using D3
2. Add voting districts
3. Add individual area layer options



