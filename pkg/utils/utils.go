package utils

import (
	"fmt"
	"math/big"
	"regexp"

	"github.com/ava-labs/avalanchego/ids"
	"github.com/davecgh/go-spew/spew"
	"github.com/ethereum/go-ethereum/common"
)

const (
	SimpleDateFormat    = "Jan 2"
	SimpleTimeFormat    = "15:04 MST"
	MinimumTimeFormat12 = "3:04 PM"
	MinimumTimeFormat24 = "15:04"
	TimestampFormat     = "2006-01-02T15:04:05-0700"
)

const (
	x2cRateInt64 int64 = 1_000_000_000
)

var (
	// x2cRate is the conversion rate between the smallest denomination on the X-Chain
	// 1 nAVAX and the smallest denomination on the C-Chain 1 wei. Where 1 nAVAX = 1 gWei.
	// This is only required for AVAX because the denomination of 1 AVAX is 9 decimal
	// places on the X and P chains, but is 18 decimal places within the EVM.
	x2cRate = big.NewInt(x2cRateInt64)
)

// DoesNotInclude takes a slice of strings and a target string and returns
// TRUE if the slice does not include the target, FALSE if it does
func DoesNotInclude(strs []string, val string) bool {
	return !Includes(strs, val)
}

// FindMatch takes a regex pattern and a string of data and returns back all the matches
// in that string
func FindMatch(pattern string, data string) [][]string {
	r := regexp.MustCompile(pattern)
	return r.FindAllStringSubmatch(data, -1)
}

// Includes takes a slice of strings and a target string and returns
// TRUE if the slice includes the target, FALSE if it does not
func Includes(strs []string, val string) bool {
	for _, str := range strs {
		if val == str {
			return true
		}
	}
	return false
}

func Dump(obj interface{}) {
	spew.Dump(obj)
}

// func Fetch(url string, params string) (string, error) {
// 	client := resty.New()
// 	// client.SetTLSClientConfig(&tls.Config{InsecureSkipVerify: true})
// 	client.SetTimeout(30 * time.Second)

// 	var resp *resty.Response
// 	var err error

// 	if params == "" {
// 		resp, err = client.R().
// 			EnableTrace().
// 			SetHeader("Content-Type", "application/json").
// 			SetHeader("Accept", "application/json").
// 			Get(url)
// 	} else {
// 		resp, err = client.R().
// 			EnableTrace().
// 			SetHeader("Content-Type", "application/json").
// 			SetHeader("Accept", "application/json").
// 			SetBody(params).
// 			Post(url)
// 	}

// 	return resp.String(), err
// }

// Given nodeID in either 0x123 or NodeID-123 format, return the [20]byte address format
func NodeIDToAddress(nodeID string) (common.Address, error) {
	var nodeShortID ids.NodeID
	var err error

	if HasPrefix(nodeID, "NodeID-") {
		nodeShortID, err = ids.NodeIDFromString(nodeID)
		if err != nil {
			return common.Address{}, fmt.Errorf("error decoding nodeID %s: %w", nodeID, err)
		}
		return common.BytesToAddress(nodeShortID[:]), nil
	}

	if HasPrefix(nodeID, "0x") {
		b := common.FromHex(nodeID)
		return common.BytesToAddress(b), nil
	}

	return common.Address{}, fmt.Errorf("invalid nodeID format %s: %w", nodeID, err)
}

// Given nodeID in either 0x123 or NodeID-123 format, return the [20]byte ids.NodeID format
func NodeIDToNodeID(nodeID string) (ids.NodeID, error) {
	var nodeShortID ids.NodeID
	var err error

	if HasPrefix(nodeID, "NodeID-") {
		nodeShortID, err = ids.NodeIDFromString(nodeID)
		if err != nil {
			return ids.NodeID{}, fmt.Errorf("error decoding nodeID %s: %w", nodeID, err)
		}
		return nodeShortID, nil
	}

	if HasPrefix(nodeID, "0x") {
		b := common.FromHex(nodeID)
		b20 := common.BytesToAddress(b)
		return ids.NodeID(b20), nil
	}

	return ids.NodeID{}, fmt.Errorf("invalid nodeID format %s: %w", nodeID, err)
}

// Given TxID in either 0x123 or CB58 format, return the [32]byte ids.ID format
func TxIDStrToTxID(txIDStr string) (ids.ID, error) {
	if HasPrefix(txIDStr, "0x") {
		b := common.FromHex(txIDStr)
		var b32 [32]byte
		copy(b32[0:31], b)
		return ids.ID(b32), nil
	} else {
		return ids.FromString(txIDStr)
	}
}

// Given nodeID in [20]bytes address format, return the [20]byte ids.NodeID format
func AddressToNodeID(nodeID common.Address) ids.NodeID {
	return ids.NodeID(nodeID)
}

// HasPrefix tests whether the string s begins with prefix.
func HasPrefix(s, prefix string) bool {
	return len(s) >= len(prefix) && s[0:len(prefix)] == prefix
}

// Given a token amount in EVM big.Int 1e18 format, return a token amount in uint64 1e9 format
func AmountToInt(amount *big.Int) uint64 {
	amountBig := amount
	amountBig.Div(amountBig, x2cRate)
	if !amountBig.IsUint64() {
		panic("amountToInt overflow")
	}
	return amountBig.Uint64()
}

// Given a token amount in EVM big.Int 1e18 format, return a token amount in float64 1 AVAX format
func AmountToAvax(amount *big.Int) float64 {
	avax := AmountToInt(amount)
	return float64(avax) / 1e9
}

// Given a token amount in X/P uint64 1e9 format, return a token amount in EVM big.Int 1e18 format
func AmountToBig(amount uint64) *big.Int {
	amountBig := new(big.Int).SetUint64(amount)
	amountBig.Mul(amountBig, x2cRate)
	return amountBig
}

// // Convert what we get from the generated Go code into a nicer format
// func ConvertMinipool(mp minipool_manager.MinipoolManagerMinipool) results.Minipool {
// 	nodeID := ids.NodeID(mp.NodeID).String()
// 	txid, _ := ids.ToID(mp.TxID[:])
// 	txidHex := fmt.Sprintf("0x%s", txid.Hex())
// 	txidcb58, _ := cb58.Encode(mp.TxID[:])

// 	mp2 := results.Minipool{
// 		NodeID:                   nodeID,
// 		NodeAddr:                 mp.NodeID.Hex(),
// 		Status:                   mp.Status.Uint64(),
// 		Duration:                 mp.Duration.Uint64(),
// 		StartTime:                mp.StartTime.Uint64(),
// 		EndTime:                  mp.EndTime.Uint64(),
// 		DelegationFee:            AmountToInt(mp.DelegationFee),
// 		GgpSlashAmt:              AmountToInt(mp.GgpSlashAmt),
// 		AvaxNodeOpAmt:            AmountToInt(mp.AvaxNodeOpAmt),
// 		AvaxLiquidStakerAmt:      AmountToInt(mp.AvaxLiquidStakerAmt),
// 		AvaxTotalRewardAmt:       AmountToInt(mp.AvaxTotalRewardAmt),
// 		AvaxNodeOpRewardAmt:      AmountToInt(mp.AvaxNodeOpRewardAmt),
// 		AvaxLiquidStakeRewardAmt: AmountToInt(mp.AvaxLiquidStakerRewardAmt),
// 		ErrorCode:                string(mp.ErrorCode[:]),
// 		Owner:                    mp.Owner.Hex(),
// 		MultisigAddr:             mp.MultisigAddr.Hex(),
// 		TxID:                     txidHex,
// 		TxIDCB58:                 txidcb58,
// 	}
// 	return mp2
// }
