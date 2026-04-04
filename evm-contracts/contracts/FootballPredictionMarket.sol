// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract FootballPredictionMarket is Ownable, ReentrancyGuard {
    enum MarketState { OPEN, RESOLVING, RESOLVED_HOME, RESOLVED_AWAY, RESOLVED_DRAW, CANCELED }
    
    struct Market {
        string id;
        string league;
        string homeTeam;
        string awayTeam;
        uint256 matchTimestamp;
        MarketState state;
        uint256 homePool;
        uint256 awayPool;
        uint256 drawPool;
        uint256 totalPool;
        string genlayerTxHash;
    }

    mapping(string => Market) public markets;
    string[] public allMarketIds;
    
    // marketId => user => prediction (0: HOME, 1: AWAY, 2: DRAW) => amount
    mapping(string => mapping(address => mapping(uint8 => uint256))) public bets;
    // marketId => user => hasClaimed
    mapping(string => mapping(address => bool)) public hasClaimed;
    
    address public relayer;
    
    event MarketCreated(string id, string league, string homeTeam, string awayTeam, uint256 matchTimestamp);
    event BetPlaced(string id, address bettor, uint8 prediction, uint256 amount);
    event ResolutionRequested(string id, string homeTeam, string awayTeam, uint256 matchTimestamp);
    event MarketResolved(string id, uint8 winningOutcome);
    event WinningsClaimed(string id, address bettor, uint256 amount);

    constructor(address _relayer) Ownable(msg.sender) {
        relayer = _relayer;
    }

    function setRelayer(address _relayer) external onlyOwner {
        relayer = _relayer;
    }

    modifier onlyRelayer() {
        require(msg.sender == relayer || msg.sender == owner(), "Not authorized");
        _;
    }

    function createMarket(
        string memory _id,
        string memory _league,
        string memory _homeTeam,
        string memory _awayTeam,
        uint256 _matchTimestamp
    ) external onlyOwner {
        require(bytes(markets[_id].id).length == 0, "Market already exists");
        
        markets[_id] = Market({
            id: _id,
            league: _league,
            homeTeam: _homeTeam,
            awayTeam: _awayTeam,
            matchTimestamp: _matchTimestamp,
            state: MarketState.OPEN,
            homePool: 0,
            awayPool: 0,
            drawPool: 0,
            totalPool: 0,
            genlayerTxHash: ""
        });
        
        allMarketIds.push(_id);
        emit MarketCreated(_id, _league, _homeTeam, _awayTeam, _matchTimestamp);
    }
    
    function placeBet(string memory _id, uint8 _prediction) external payable nonReentrant {
        Market storage market = markets[_id];
        require(bytes(market.id).length != 0, "Market does not exist");
        require(market.state == MarketState.OPEN, "Market is not open");
        require(block.timestamp < market.matchTimestamp, "Match has already started");
        require(msg.value > 0, "Bet amount must be greater than 0");
        require(_prediction <= 2, "Invalid prediction (0=HOME, 1=AWAY, 2=DRAW)");
        
        bets[_id][msg.sender][_prediction] += msg.value;
        market.totalPool += msg.value;
        
        if (_prediction == 0) market.homePool += msg.value;
        else if (_prediction == 1) market.awayPool += msg.value;
        else if (_prediction == 2) market.drawPool += msg.value;
        
        emit BetPlaced(_id, msg.sender, _prediction, msg.value);
    }

    // Called by anybody when the match time is over to signal the bridge to check GenLayer
    function requestResolution(string memory _id) external {
        Market storage market = markets[_id];
        require(bytes(market.id).length != 0, "Market does not exist");
        require(market.state == MarketState.OPEN, "Market is not open");
        require(block.timestamp >= market.matchTimestamp + 90 minutes, "Match is not finished yet");
        
        market.state = MarketState.RESOLVING;
        emit ResolutionRequested(_id, market.homeTeam, market.awayTeam, market.matchTimestamp);
    }

    // Called by the relayer script listening to GenLayer
    function submitResult(string memory _id, uint8 _result, string memory _genlayerTxHash) external onlyRelayer {
        Market storage market = markets[_id];
        require(market.state == MarketState.RESOLVING || market.state == MarketState.OPEN, "Invalid state");
        require(_result <= 3, "Invalid result (0=H, 1=A, 2=D, 3=CANCELED)");
        
        market.genlayerTxHash = _genlayerTxHash;
        
        if (_result == 0) market.state = MarketState.RESOLVED_HOME;
        else if (_result == 1) market.state = MarketState.RESOLVED_AWAY;
        else if (_result == 2) market.state = MarketState.RESOLVED_DRAW;
        else market.state = MarketState.CANCELED;
        
        emit MarketResolved(_id, _result);
    }

    function claimWinnings(string memory _id) external nonReentrant {
        Market storage market = markets[_id];
        require(
            market.state == MarketState.RESOLVED_HOME || 
            market.state == MarketState.RESOLVED_AWAY || 
            market.state == MarketState.RESOLVED_DRAW || 
            market.state == MarketState.CANCELED,
            "Market not resolved"
        );
        require(!hasClaimed[_id][msg.sender], "Already claimed");
        
        uint256 winningAmount = 0;
        
        if (market.state == MarketState.CANCELED || market.totalPool == 0) {
            // Refund all
            winningAmount = bets[_id][msg.sender][0] + bets[_id][msg.sender][1] + bets[_id][msg.sender][2];
        } else {
            uint8 winningPrediction;
            uint256 winningPool;
            
            if (market.state == MarketState.RESOLVED_HOME) {
                winningPrediction = 0;
                winningPool = market.homePool;
            } else if (market.state == MarketState.RESOLVED_AWAY) {
                winningPrediction = 1;
                winningPool = market.awayPool;
            } else {
                winningPrediction = 2;
                winningPool = market.drawPool;
            }
            
            uint256 userBet = bets[_id][msg.sender][winningPrediction];
            require(userBet > 0, "No winning bets");
            
            if (winningPool > 0) {
                // Return original bet + proportional share of the rest of the pool
                winningAmount = (userBet * market.totalPool) / winningPool;
            } else {
                // Edge case: no one bet on the winning outcome, everyone gets refunded
                winningAmount = bets[_id][msg.sender][0] + bets[_id][msg.sender][1] + bets[_id][msg.sender][2];
            }
        }
        
        require(winningAmount > 0, "Nothing to claim");
        
        hasClaimed[_id][msg.sender] = true;
        
        (bool success, ) = msg.sender.call{value: winningAmount}("");
        require(success, "Transfer failed");
        
        emit WinningsClaimed(_id, msg.sender, winningAmount);
    }

    function getMarketCount() external view returns (uint256) {
        return allMarketIds.length;
    }
    
    function getAllMarkets() external view returns (Market[] memory) {
        Market[] memory _markets = new Market[](allMarketIds.length);
        for (uint256 i = 0; i < allMarketIds.length; i++) {
            _markets[i] = markets[allMarketIds[i]];
        }
        return _markets;
    }

    function getBetAmount(string memory _id, address _user, uint8 _prediction) external view returns (uint256) {
        return bets[_id][_user][_prediction];
    }
}
