package contracts

import (
	"bytes"
	"fmt"
	"time"

	"github.com/ava-labs/avalanchego/ids"
	"github.com/ava-labs/avalanchego/utils/cb58"
	"github.com/multisig-labs/panopticon/pkg/contracts/minipool_manager"
	"github.com/multisig-labs/panopticon/pkg/utils"
	// "github.com/multisig-labs/panopticon/pkg/contracts/staking"
)

//go:generate stringer -type=MinipoolStatus
type MinipoolStatus uint8

// Minipools progress through each of these states until they are finished or an error occurs
const (
	Prelaunch    MinipoolStatus = iota // The minipool has NodeOp AVAX and is awaiting assignFunds/launch by Rialto
	Launched                           // Rialto has claimed the funds and will send the validator tx
	Staking                            // The minipool node is currently staking
	Withdrawable                       // The minipool has finished staking period and all funds / rewards have been moved back to c-chain by Rialto
	Finished                           // The minipool node has withdrawn all funds
	Canceled                           // The minipool has been canceled before ever starting validation
	Error                              // An error occured at some point in the process
)

type Minipool struct {
	NodeID                   string
	NodeAddr                 string
	Status                   uint64
	StatusDisplay            string
	Duration                 uint64
	StartTime                string
	EndTime                  string
	DelegationFee            float64
	GgpSlashAmt              float64
	AvaxNodeOpAmt            float64
	AvaxLiquidStakerAmt      float64
	AvaxTotalRewardAmt       float64
	AvaxNodeOpRewardAmt      float64
	AvaxLiquidStakeRewardAmt float64
	ErrorCode                string
	Owner                    string
	MultisigAddr             string
	TxID                     string
	TxIDCB58                 string
}

type Staker struct {
	StakerAddr       string
	GgpStaked        uint64
	AvaxStaked       uint64
	AvaxAssigned     uint64
	MinipoolCount    uint64
	RewardsStartTime uint64
	GgpRewards       uint64
}

// Convert what we get from the generated Go code into a nicer format
func ConvertMinipool(mp minipool_manager.MinipoolManagerMinipool) Minipool {
	nodeID := ids.NodeID(mp.NodeID).String()
	txid, _ := ids.ToID(mp.TxID[:])
	txidHex := fmt.Sprintf("0x%s", txid.Hex())
	txidcb58, _ := cb58.Encode(mp.TxID[:])

	n := bytes.IndexByte(mp.ErrorCode[:], 0)
	errString := string(mp.ErrorCode[:n])

	mpDisplay := Minipool{
		NodeID:                   nodeID,
		NodeAddr:                 mp.NodeID.Hex(),
		Status:                   mp.Status.Uint64(),
		StatusDisplay:            MinipoolStatus(mp.Status.Uint64()).String(),
		Duration:                 mp.Duration.Uint64(),
		StartTime:                time.Unix(int64(mp.StartTime.Uint64()), 0).Format(time.RFC3339),
		EndTime:                  time.Unix(int64(mp.EndTime.Uint64()), 0).Format(time.RFC3339),
		DelegationFee:            utils.AmountToAvax(mp.DelegationFee),
		GgpSlashAmt:              utils.AmountToAvax(mp.GgpSlashAmt),
		AvaxNodeOpAmt:            utils.AmountToAvax(mp.AvaxNodeOpAmt),
		AvaxLiquidStakerAmt:      utils.AmountToAvax(mp.AvaxLiquidStakerAmt),
		AvaxTotalRewardAmt:       utils.AmountToAvax(mp.AvaxTotalRewardAmt),
		AvaxNodeOpRewardAmt:      utils.AmountToAvax(mp.AvaxNodeOpRewardAmt),
		AvaxLiquidStakeRewardAmt: utils.AmountToAvax(mp.AvaxLiquidStakerRewardAmt),
		ErrorCode:                errString,
		Owner:                    mp.Owner.Hex(),
		MultisigAddr:             mp.MultisigAddr.Hex(),
		TxID:                     txidHex,
		TxIDCB58:                 txidcb58,
	}
	return mpDisplay
}

// func ConvertStaker(stkr staking.StakingStaker) results.Staker {

// 	stkr2 := results.Staker{
// 		StakerAddr:               stkr.StakerAddr.Hex(),
// 		GgpStaked:            	  AmountToInt(stkr.GgpStaked),
// 		AvaxStaked:               AmountToInt(stkr.AvaxStaked),
// 		AvaxAssigned:             AmountToInt(stkr.AvaxAssigned),
// 		MinipoolCount:      	  stkr.MinipoolCount.Uint64(),
// 		RewardsStartTime:         stkr.RewardsStartTime.Uint64(),
// 		GgpRewards:       		  AmountToInt(stkr.GgpRewards),
// 	}
// 	return stkr2
// }
