# AlphaChain Network

Hyperledger Fabric 2.5 network configuration.

## Topology

- **Organizations**: AlphaOrg (MSP: AlphaOrgMSP), CustomsOrg (MSP: CustomsOrgMSP)
- **Orderer**: orderer.alphachain.com (Raft)
- **Channel**: alphachannel
- **Peers**: peer0.alpha.alphachain.com, peer0.customs.alphachain.com

## Usage

```bash
cd scripts
./start-network.sh    # Generate crypto, create channel, join peers
./deploy-chaincode.sh # Package, install, approve, commit chaincode
./stop-network.sh     # Tear down the network
```
