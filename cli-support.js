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
        description: 'Layers to include in the map. Options: denmark, regions, municipalities, postalcodes, parishes, constituencies (election area), jurisdictions (legal) {bold and/or} precincts (police) . {bold [default denmark]}.\n{bold Note: Adding to many layers will result in a large generated SVG.}',
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

const sections = [{
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

try {
    options = cliArgs(cliOptions);
} catch (e) {
    console.log(cliUsage(sections));
    process.exit(1)
}

if (options.hasOwnProperty("help")) {
    console.log(cliUsage(sections));
    process.exit(1);
}

module.exports = options