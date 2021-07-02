set -ex
. .env

npx graph deploy liamzebedee/sugardao-$NETWORK --ipfs $IPFS_URL --node $GRAPH_NODE_URL --access-token $THEGRAPH_TOKEN subgraph.js