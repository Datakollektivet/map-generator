const cliArgs = require('command-line-args');
const cliUsage = require('command-line-usage');

/**
 * cliOptions are the acceted commandline arguments
 */

const cliOptions = [
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
        description: 'Layers to include in the map. Options: denmark, regions, police, jurisdictions, constituencies (election area), municipalities, postal, {bold and/or} parishes. {bold [default denmark]}.\n{bold Note: Adding to many layers will result in a large generated SVG.}',
        defaultValue: "denmark"
    },
    {
        name: 'output',
        alias: 'o',
        type: String,
        multiple: true,
        typeLabel: '{underline string}',
        description: 'Generated output file format. Options: svg, html {bold or} container. {bold [default container]}',
        defaultValue: "container"
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
    content: 'Generates responsive SVG maps using D3-node.js.'
},
{
    header: 'Main options',
    optionList: cliOptions,
    group: '_none'
}
];

let options;
let validLayers = ['denmark', 'regions', 'police', 'jurisdictions', 'constituencies', 'municipalities', 'postal', 'parishes']
let validOutput = ['svg', 'html', 'container']

try {
    options = cliArgs(cliOptions);

    if(!options.hasOwnProperty("help")){
        let validateLayers = options.layers.some(r=> validLayers.indexOf(r) >= 0)
        if(!validateLayers){
            throw new Error('There is an error in the "layers" key provided. Valid options are: denmark, regions, police, jurisdictions, constituencies, municipalities, postal and/or parishes. Default is: denmark')
        }

        let validateOutput = options.output.some(r=> validOutput.indexOf(r) >= 0)

        if(!validateOutput){
            throw new Error('There is an error in the "output" key provided. Valid options are: svg, html and/or container. Default is: container')
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