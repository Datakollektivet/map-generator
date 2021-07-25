const cliArgs = require('command-line-args');
const cliUsage = require('command-line-usage');

/**
 * cliOptions are the acceted commandline arguments
 */

const cliOptions = [
    {   name: 'output',
        alias: 'o',
        type: String,
        typeLabel: '{underline string}',
        description: 'The name of the output file. {bold Default is map.html}',
        defaultValue: "map"
    },
    {
        name: 'packed',
        alias: 'p',
        type: Boolean,
        typeLabel: '{underline boolean}',
        description: 'Boolean determining if map will be "packed" with Bornholm in the upper right corner. {bold [default false]}.',
        defaultValue: false
    },
    {
        name: 'layers',
        alias: 'l',
        type: String,
        multiple: true,
        typeLabel: '{underline string}',
        description: 'Layers to include in the map. Note: keys are given in Danish. Options: danmark, regioner, kommuner, sogne, storkredse, opstillingskredse {bold and/or} afstemningsområde. {bold [default danmark]}.\n{bold Note: Adding to many layers will result in a large SVG.}',
        defaultValue: "danmark"
    },
    {
        name: 'format',
        alias: 'f',
        type: String,
        multiple: true,
        typeLabel: '{underline string}',
        description: 'Generated output format. Options: svg, html {bold and/or} container. {bold [default html]}',
        defaultValue: "html"
    },
    {
        name: 'quality',
        alias: 'q',
        type: String,
        typeLabel: '{underline string}',
        description: 'The map quality (resolution). This will determine the complexity of the generated geometries. Options: high, mid, low, artsy, pixel {bold [default mid]}',
        defaultValue: "mid"
    },
    {
        name: 'help',
        alias: 'h',
        description: 'Print this usage guide.\n\n{bold Note: Will print tool-tip (--help) in case of an invalid argument(s).}',
        type: String
    }
];

/**
 * sections describe the tool for the help option
 */

let sections = [{
    header: 'Map Generator',
    content: 'Generates responsive SVG maps of Denmark using D3-node.js.'
},
{
    header: 'Main options',
    optionList: cliOptions,
    group: '_none'
}
];

let options;
let validLayers = ['danmark', 'regioner', 'kommuner', 'sogne', 'afstemningsområde', 'opstillingskredse', 'storkredse']
let validFormat = ['svg', 'html', 'container', 'all']

try {
    options = cliArgs(cliOptions);

    if(!options.hasOwnProperty("help")){
        let layerComma = options.layers.some(r=> r.indexOf(",") != -1)
        
        if(layerComma){
            throw new Error('There is an error in the "layers" key provided. Multiple layers should be seperated with spaces and not a comman(,)')
        }

        let formatComma = options.format.some(r=> r.indexOf(",") != -1)
        
        if(formatComma){
            throw new Error('There is an error in the "format" key provided. Multiple formats should be seperated with spaces and not a comman(,)')
        }

        let validateLayers = options.layers.some(r=> validLayers.indexOf(r) != -1)
        
        if(!validateLayers){
            throw new Error('There is an error in the "layers" key provided. Valid options are: danmark, regioner, kommuner, sogne, storkredse, opstillingskredse {bold and/or} afstemningsområde. Default is: danmark')
        }

        let validateFormat = options.format.some(r=> validFormat.indexOf(r) != -1)

        if(!validateFormat){
            throw new Error('There is an error in the "format" key provided. Valid options are: svg, html and/or container. Default is: html')
        }
    }

} catch (e) {
    sections.unshift({
        header: 'Error',
        content: e.message
    })
    console.log(cliUsage(sections));
    process.exit(0)
}

if (options.hasOwnProperty("help")) {
    console.log(cliUsage(sections));
    process.exit(0);
}

module.exports = options