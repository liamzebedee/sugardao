


const { ethers } = require('ethers')


/*
Expected data:

    const context = {
        abis: [
            {
                "name": "Curatem",
                "file": "../curatem-contracts/abis/CuratemV1.json"
            }
        ],
        network: 'mainnet'
    }

    const contracts = [
        {
            name: 'SugarFeed',
            address: '0x',
            abi: '',
            startBlock: '',
            entities: ['SugarFeed'],
            eventHandlers: [
                {
                    "event": // "Update(uint,uint)", load from ethers
                    // "handler": "handleNewCommunity"
                }
            ]
        }
    ]

*/

const generateManifest = ({ context, contracts }) => {
    const contractFilters = {
        dataSource: contract => contract.address,
        template: contract => !contract.address,
    }

    const renderContract = (source) => {
        const { name, address, abi, startBlock, entities } = source
        const isTemplate = !address

        return {
            "kind": "ethereum/contract",
            name,
            network: context.network,
            source: isTemplate
                ? { abi, }
                : {
                    address, abi, startBlock
                },
            mapping: {
                "kind": "ethereum/events",
                "apiVersion": "0.0.4",
                "language": "wasm/assemblyscript",
                "entities": entities,
                abis: context.abis,
                eventHandlers: source.eventHandlers.map(eventHandler => {
                    // {
                    //     "event": "NewCommunity(address)",
                    //     "handler": "handleNewCommunity"
                    // }
                    const handler = eventHandler.handler || `handle${eventHandler.event.split('(')[0]}`
                    return {
                        event: eventHandler.event,
                        handler
                    }
                }),
                file: "./src/mappings.ts"
            },
        }
    }

    return {
        specVersion: "0.0.2",
        "description": "Curatem for Ethereum",
        "repository": "https://github.com/graphprotocol/example-subgraph",
        "schema": {
            "file": "./schema.graphql"
        },
        dataSources: contracts.filter(contractFilters.dataSource).map(renderContract),
        templates: contracts.filter(contractFilters.template).map(renderContract)
    }
}




const glob = require('glob')


function load(data) {
    const { network } = data
    const deployments = require(`../deployments/${network}.json`)

    const contracts = data.contracts.map((contract) => {
        const { name, entities } = contract

        const deployment = deployments.contracts[name]
        if(!deployment) throw new Error("Deployment not found for "+name)

        let abi = contract.abi
        let abiPath

        if (!abi) {
            // Automatically guess the ABI.
            const matches = glob.sync(`../abi/**/${name}.json`)
            if(!matches.length) throw new Error("No ABI found for contract: "+name)
            if(matches.length > 1) throw new Error("More than one ABI found for contract: "+name)
            abiPath = matches[0]
            abi = require(abiPath)
        }

        const iface = new ethers.utils.Interface(abi)
        // console.log(iface)

        const eventHandlers = contract.eventHandlers.map(eventHandler => {
            if(eventHandler.event.includes('(')) {
                // not a partial event definition.
                return eventHandler
            }
            
            // partial lookup using ethers
            // const eventFragment = iface.getEvent(eventHandler.event)
            const eventFragment = iface.events[eventHandler.event]

            if (!eventFragment) throw new Error("event not found - "+eventHandler.event)

            const event = eventFragment.signature
            // console.log(event)

            return {
                ...eventHandler,
                event,
            }
        })
        

        const { address } = deployment
        const startBlock = deployment.deployTransaction.blockNumber        

        return {
            name,
            address,
            startBlock,
            entities,
            eventHandlers,
            abi: name,
            abiPath
        }
    })

    // {
    //     abis: [
    //         {
    //             "name": "Curatem",
    //             "file": "../curatem-contracts/abis/CuratemV1.json"
    //         }
    //     ],
    //     network: 'mainnet'
    // }

    return {
        contracts
    }

    // {
    //     name: 'SugarFeed',
    //         address: '0x',
    //             abi: '',
    //                 startBlock: '',
    //                     entities: ['SugarFeed'],
    //                         eventHandlers: [
    //                             {
    //                                 "event": // "Update(uint,uint)", load from ethers
    //                 // "handler": "handleNewCommunity"
    //             }
    //                         ]
    // }
    // ]
}

function formatContractAbi(contract) {
    return {
        // abi: contract.abi,
        name: contract.name,
        file: contract.abiPath
    }
} 

const yaml = require('js-yaml');
const fs = require('fs');

function generate({ network, contracts }) {
    const { contracts: contractBlobs } = load({
        network,
        contracts: [
            {
                name: "SugarFeed",
                eventHandlers: [
                    { event: "Update" }
                ],
                entities: ["SugarFeed", "SugarFeedUpdate"]
            }
        ]
    })

    const context = {
        abis: contractBlobs.map(formatContractAbi),
        network: 'mainnet'
    }

    // const contracts = [
    //     {
    //         name: 'SugarFeed',
    //         address: '0x',
    //         abi: '',
    //         startBlock: '',
    //         entities: ['SugarFeed'],
    //         eventHandlers: [
    //             {
    //                 "event": // "Update(uint,uint)", load from ethers
    //                 // "handler": "handleNewCommunity"
    //             }
    //         ]
    //     }
    // ]

    const manifest = generateManifest({ contracts: contractBlobs, context })
    // console.log(
    //     JSON.stringify(manifest, null, 1))

    fs.writeFileSync(
        'subgraph.yaml',
        yaml.dump(manifest)
    )
}




async function main() {
    // 
    // Configuration.
    // 
    const network = process.env.NETWORK

    generate({
        network,
        contracts: [
            {
                name: "SugarFeed",
                eventHandlers: [
                    { event: "Update" }
                ],
                entities: ["SugarFeed", "SugarFeedUpdate"]
            }
        ]
    })
}




module.exports = main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });

    
        
        // {
        //     "kind": "ethereum/contract",
        //     "name": "Curatem",
        //     "network": {
        //         "[object Object]": null
        //     },
        //     "source": {
        //         "address": "{{Curatem.address}}",
        //         "abi": "Curatem",
        //         "startBlock": {
        //             "[object Object]": null
        //         }
        //     },
        //     "mapping": {
        //         "kind": "ethereum/events",
        //         "apiVersion": "0.0.4",
        //         "language": "wasm/assemblyscript",
        //         "entities": [
        //             "Community",
        //             "Market"
        //         ],
        //         "abis": [
        //             {
        //                 "name": "Curatem",
        //                 "file": "../curatem-contracts/abis/CuratemV1.json"
        //             },
        //             {
        //                 "name": "CuratemCommunity",
        //                 "file": "../curatem-contracts/abis/CuratemCommunity.json"
        //             },
        //             {
        //                 "name": "SpamPredictionMarket",
        //                 "file": "../curatem-contracts/abis/SpamPredictionMarket.json"
        //             },
        //             {
        //                 "name": "ERC20",
        //                 "file": "../curatem-contracts/abis/ERC20.json"
        //             }
        //         ],
        //         "eventHandlers": [
        //             {
        //                 "event": "NewCommunity(address)",
        //                 "handler": "handleNewCommunity"
        //             }
        //         ],
        //         "file": "./src/curatem.ts"
        //     }
        // }
//     ],
//         "templates": [
//             {
//                 "kind": "ethereum/contract",
//                 "name": "CuratemCommunity",
//                 "network": {
//                     "[object Object]": null
//                 },
//                 "source": {
//                     "abi": "CuratemCommunity"
//                 },
//                 "mapping": {
//                     "kind": "ethereum/events",
//                     "apiVersion": "0.0.4",
//                     "language": "wasm/assemblyscript",
//                     "entities": [
//                         "Community",
//                         "Market"
//                     ],
//                     "abis": [
//                         {
//                             "name": "CuratemCommunity",
//                             "file": "../curatem-contracts/abis/CuratemCommunity.json"
//                         },
//                         {
//                             "name": "SpamPredictionMarket",
//                             "file": "../curatem-contracts/abis/SpamPredictionMarket.json"
//                         }
//                     ],
//                     "eventHandlers": [
//                         {
//                             "event": "NewSpamPredictionMarket(indexed bytes32,indexed bytes32,indexed address)",
//                             "handler": "handleNewSpamPM"
//                         }
//                     ],
//                     "file": "./src/community.ts"
//                 }
//             },
//             {
//                 "kind": "ethereum/contract",
//                 "name": "SpamPredictionMarket",
//                 "network": {
//                     "[object Object]": null
//                 },
//                 "source": {
//                     "abi": "SpamPredictionMarket"
//                 },
//                 "mapping": {
//                     "kind": "ethereum/events",
//                     "apiVersion": "0.0.4",
//                     "language": "wasm/assemblyscript",
//                     "entities": [
//                         "Community",
//                         "Market"
//                     ],
//                     "abis": [
//                         {
//                             "name": "SpamPredictionMarket",
//                             "file": "../curatem-contracts/abis/SpamPredictionMarket.json"
//                         }
//                     ],
//                     "eventHandlers": [
//                         {
//                             "event": "Initialized()",
//                             "handler": "handleInitialized"
//                         },
//                         {
//                             "event": "SharesBought(indexed address,uint256)",
//                             "handler": "handleSharesBought"
//                         },
//                         {
//                             "event": "SharesSold(indexed address,uint256)",
//                             "handler": "handleSharesSold"
//                         },
//                         {
//                             "event": "Finalized()",
//                             "handler": "handleFinalized"
//                         },
//                         {
//                             "event": "SharesRedeemed(indexed address,uint256)",
//                             "handler": "handleSharesRedeemed"
//                         }
//                     ],
//                     "file": "./src/spam_prediction_market.ts"
//                 }
//             }
//         ]
// }