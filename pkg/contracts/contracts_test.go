package contracts

import (
	"math/big"
	"testing"

	"github.com/stretchr/testify/require"
)

var (
	baseURL     = "https://anr.fly.dev"
	storageAddr = "0x5aa01B3b5877255cE50cc55e8986a7a5fe29C70e"
)

func TestFactory(t *testing.T) {
	f, err := NewContracts(baseURL, storageAddr)
	require.NoError(t, err)

	t.Logf("%+v", f)

	mps, err := f.MinipoolManager.GetMinipools(nil, 0, big.NewInt(0), big.NewInt(0))
	require.NoError(t, err)

	t.Logf("%+v", mps)
	t.Fatal()
}
