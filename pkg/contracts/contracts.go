package contracts

import (
	"fmt"

	"github.com/multisig-labs/panopticon/pkg/contracts/minipool_manager"
	"github.com/multisig-labs/panopticon/pkg/contracts/storage"
	"github.com/multisig-labs/panopticon/pkg/utils"

	"github.com/ava-labs/coreth/ethclient"
	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/crypto"
	"github.com/labstack/gommon/log"
)

type Contracts struct {
	Url                string
	StorageAddr        string
	Storage            *storage.Storage
	MinipoolManager    *minipool_manager.MinipoolManager
	MinipoolManagerRaw *minipool_manager.MinipoolManagerRaw
	loaded             bool
}

// Return a struct with instantiated contracts from the addresses stored in Storage contract
func NewContracts(url string, storageAddr string) (*Contracts, error) {
	if storageAddr == "0x0000000000000000000000000000000000000000" {
		log.Fatal("zero storage contract address")
	}
	client, err := ethclient.Dial(fmt.Sprintf("%s/ext/bc/C/rpc", url))
	if err != nil {
		log.Fatalf("ethclient.Dial error: %v", err)
	}

	s, err := storage.NewStorage(common.HexToAddress(storageAddr), client)
	if err != nil {
		log.Fatalf("storage.NewStorage error: %v", err)
	}

	mmAddr := getContractAddress(s, "MinipoolManager")
	mm, err := minipool_manager.NewMinipoolManager(mmAddr, client)
	if err != nil {
		log.Fatalf("minipool_manager.NewMinipoolManager error: %v", err)
	}

	mmr := &minipool_manager.MinipoolManagerRaw{Contract: mm}

	return &Contracts{
		Url:                url,
		StorageAddr:        storageAddr,
		Storage:            s,
		MinipoolManager:    mm,
		MinipoolManagerRaw: mmr,
		loaded:             true,
	}, nil
}

// Convenience to get a minipool from a string Node-123...
func (c *Contracts) FetchMinipool(nodeID string) (*Minipool, error) {
	nodeAddr, err := utils.NodeIDToAddress(nodeID)
	if err != nil {
		return nil, err
	}

	idx, err := c.MinipoolManager.GetIndexOf(nil, nodeAddr)
	if err != nil {
		return nil, fmt.Errorf("GetIndexOf %w", err)
	}

	mp, err := c.MinipoolManager.GetMinipool(nil, idx)
	if err != nil {
		return nil, fmt.Errorf("GetMinipool %w", err)
	}

	face := ConvertMinipool(mp)
	return &face, nil
}

func getContractAddress(s *storage.Storage, name string) common.Address {
	fullName := []byte(fmt.Sprintf("contract.address%s", name))
	var key [32]byte
	copy(key[:], crypto.Keccak256(fullName))
	addr, err := s.GetAddress(nil, key)
	if err != nil {
		log.Fatalf("s.GetAddress for %s error: %v", name, err)
	}
	if addr == common.HexToAddress("0x0000000000000000000000000000000000000000") {
		log.Fatalf("zero contract address for %s", name)
	}
	return addr
}
