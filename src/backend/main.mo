import Map "mo:core/Map";
import Float "mo:core/Float";
import Time "mo:core/Time";
import List "mo:core/List";
import Array "mo:core/Array";
import Int "mo:core/Int";
import Iter "mo:core/Iter";
import Order "mo:core/Order";
import Text "mo:core/Text";
import Runtime "mo:core/Runtime";
import MixinAuthorization "authorization/MixinAuthorization";
import Nat "mo:core/Nat";
import Principal "mo:core/Principal";

import AccessControl "authorization/access-control";


actor {
  module PublicTrade {
    public func compare(trade1 : PublicTrade, trade2 : PublicTrade) : Order.Order {
      Int.compare(trade1.timestamp, trade2.timestamp);
    };
  };

  module PortfolioAsset {
    public func compare(asset1 : PortfolioAsset, asset2 : PortfolioAsset) : Order.Order {
      Text.compare(asset1.symbol, asset2.symbol);
    };
  };

  module Asset {
    public func compare(asset1 : Asset, asset2 : Asset) : Order.Order {
      Text.compare(asset1.symbol, asset2.symbol);
    };
  };

  type Symbol = Text;

  public type Category = {
    #crypto;
    #metal;
    #stock;
    #index;
  };

  public type Asset = {
    name : Text;
    symbol : Symbol;
    price : Float;
    change24h : Float;
    category : Category;
  };

  public type PortfolioEntry = {
    symbol : Symbol;
    quantity : Float;
  };

  public type PortfolioAsset = {
    symbol : Symbol;
    quantity : Float;
    currentPrice : Float;
    totalValue : Float;
  };

  public type TradeType = {
    #buy;
    #sell;
  };

  public type PublicTrade = {
    timestamp : Int;
    symbol : Symbol;
    tradeType : TradeType;
    quantity : Float;
    pricePerUnit : Float;
    total : Float;
  };

  public type User = Principal;

  public type UserProfile = {
    name : Text;
    email : Text;
  };

  public type Portfolio = Map.Map<Symbol, Float>;
  public type Watchlist = Map.Map<Symbol, ()>;
  public type PublicTradeList = List.List<PublicTrade>;

  public type UserBalances = Map.Map<User, Float>;
  public type UserPortfolios = Map.Map<User, Portfolio>;
  public type UserWatchlists = Map.Map<User, Watchlist>;
  public type UserTradeHistories = Map.Map<User, PublicTradeList>;

  // Initialize state
  let userBalances = Map.empty<User, Float>();
  let userPortfolios = Map.empty<User, Portfolio>();
  let userWatchlists = Map.empty<User, Watchlist>();
  let userTradeHistories = Map.empty<User, PublicTradeList>();
  let userProfiles = Map.empty<Principal, UserProfile>();
  let assets = Map.empty<Symbol, Asset>();
  let emptyPortfolio = Map.empty<Symbol, Float>();

  // Create an asset
  func createAsset(
    name : Text,
    symbol : Symbol,
    price : Float,
    change24h : Float,
    category : Category,
  ) : Asset {
    { name; symbol; price; change24h; category };
  };

  // Update assets
  func updateAssets(assetList : [Asset]) {
    for (asset in assetList.values()) {
      assets.add(asset.symbol, asset);
    };
  };

  // Initial assets
  updateAssets([
    // Crypto assets
    createAsset("Bitcoin", "BTC", 40000.00, 2.5, #crypto),
    createAsset("Ethereum", "ETH", 2500.00, 1.8, #crypto),
    createAsset("Solana", "SOL", 120.00, 4.7, #crypto),
    createAsset("BNB", "BNB", 400.00, -2.1, #crypto),
    createAsset("Ripple", "XRP", 0.85, 0.3, #crypto),
    createAsset("Cardano", "ADA", 0.45, 1.2, #crypto),
    createAsset("Polkadot", "DOT", 7.50, -0.8, #crypto),
    createAsset("Avalanche", "AVAX", 35.00, 3.4, #crypto),
    createAsset("Chainlink", "LINK", 14.00, 2.1, #crypto),
    createAsset("Litecoin", "LTC", 95.00, -1.5, #crypto),
    createAsset("Dogecoin", "DOGE", 0.08, 5.2, #crypto),
    createAsset("Uniswap", "UNI", 6.00, 1.9, #crypto),
    createAsset("Polygon", "MATIC", 0.75, -0.4, #crypto),

    // Stock assets
    createAsset("Apple", "AAPL", 150.00, -0.5, #stock),
    createAsset("Tesla", "TSLA", 700.00, 3.1, #stock),
    createAsset("Amazon", "AMZN", 3500.00, -1.2, #stock),
    createAsset("Google", "GOOGL", 2800.00, 0.9, #stock),
    createAsset("Microsoft", "MSFT", 300.00, 1.4, #stock),

    // Metal assets
    createAsset("Gold", "GOLD", 1950.00, 0.4, #metal),
    createAsset("Silver", "SILVER", 24.50, -0.6, #metal),
    createAsset("Platinum", "PLATINUM", 980.00, 0.2, #metal),
    createAsset("Copper", "COPPER", 3.85, -1.1, #metal),

    // Index assets
    createAsset("S&P 500", "SPX", 4500.00, 0.7, #index),
    createAsset("NASDAQ 100", "NDX", 15800.00, 1.1, #index),
    createAsset("Dow Jones", "DJI", 35000.00, 0.3, #index),
    createAsset("FTSE 100", "FTSE", 7400.00, -0.2, #index),
    createAsset("Nikkei 225", "N225", 32000.00, 0.8, #index),
    createAsset("DAX", "DAX", 16000.00, 0.5, #index),
  ]);

  // Authorization
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // User Profile Functions
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user: Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  // Update asset price (simulate)
  func updateAssetPrice(symbol : Symbol) : ?Asset {
    switch (assets.get(symbol)) {
      case (null) { null };
      case (?asset) {
        let newPrice = asset.price + (asset.price * 0.005);
        let newChange = asset.change24h + 0.1;
        let updatedAsset = createAsset(asset.name, asset.symbol, newPrice, newChange, asset.category);
        assets.add(symbol, updatedAsset);
        ?updatedAsset;
      };
    };
  };

  // Update all prices
  func updateAllPrices() {
    for (symbol in assets.keys()) {
      ignore updateAssetPrice(symbol);
    };
  };

  // Get balance - requires user authentication
  public query ({ caller }) func getBalance() : async Float {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view balance");
    };
    switch (userBalances.get(caller)) {
      case (null) { 10000.0 };
      case (?balance) { balance };
    };
  };

  // Get portfolio - requires user authentication
  public query ({ caller }) func getPortfolio() : async [(Symbol, Float)] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view portfolio");
    };
    switch (userPortfolios.get(caller)) {
      case (null) { [] };
      case (?portfolio) { portfolio.toArray() };
    };
  };

  // Get all assets - public, no authentication required
  // Changed to shared function to allow price updates
  public shared ({ caller }) func getAllAssets() : async [Asset] {
    updateAllPrices();
    assets.values().toArray();
  };

  // Get asset by symbol - public, no authentication required
  public query ({ caller }) func getAsset(symbol : Symbol) : async Asset {
    switch (assets.get(symbol)) {
      case (null) { Runtime.trap("Asset not found") };
      case (?asset) { asset };
    };
  };

  // Buy asset - requires user authentication
  public shared ({ caller }) func buy(symbol : Symbol, quantity : Float) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can buy assets");
    };

    if (quantity <= 0.0) { Runtime.trap("Quantity must be positive") };

    let asset = switch (assets.get(symbol)) {
      case (null) { Runtime.trap("Asset not found") };
      case (?asset) { asset };
    };

    if (asset.category == #index) {
      Runtime.trap("Indices cannot be traded directly");
    };

    let balance = switch (userBalances.get(caller)) {
      case (null) {
        userBalances.add(caller, 10000.0);
        10000.0;
      };
      case (?balance) { balance };
    };

    let totalCost = asset.price * quantity;
    if (balance < totalCost) { Runtime.trap("Insufficient balance") };

    userBalances.add(caller, balance - totalCost);

    var portfolio = switch (userPortfolios.get(caller)) {
      case (null) {
        userPortfolios.add(caller, emptyPortfolio);
        emptyPortfolio;
      };
      case (?portfolio) { portfolio };
    };

    let currentQty = switch (portfolio.get(symbol)) {
      case (null) { 0.0 };
      case (?qty) { qty };
    };

    portfolio.add(symbol, currentQty + quantity);

    let trade : PublicTrade = {
      timestamp = Time.now();
      symbol;
      tradeType = #buy;
      quantity;
      pricePerUnit = asset.price;
      total = totalCost;
    };

    var tradeHistory = switch (userTradeHistories.get(caller)) {
      case (null) {
        let newTradeHistory = List.empty<PublicTrade>();
        userTradeHistories.add(caller, newTradeHistory);
        newTradeHistory;
      };
      case (?tradeHistory) { tradeHistory };
    };

    tradeHistory.add(trade);
  };

  // Sell asset - requires user authentication
  public shared ({ caller }) func sell(symbol : Symbol, quantity : Float) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can sell assets");
    };

    if (quantity <= 0.0) { Runtime.trap("Quantity must be positive") };

    let asset = switch (assets.get(symbol)) {
      case (null) { Runtime.trap("Asset not found") };
      case (?asset) { asset };
    };

    if (asset.category == #index) {
      Runtime.trap("Indices cannot be traded directly");
    };

    let portfolio = switch (userPortfolios.get(caller)) {
      case (null) { Runtime.trap("Asset not in portfolio") };
      case (?portfolio) { portfolio };
    };

    let currentQty = switch (portfolio.get(symbol)) {
      case (null) { Runtime.trap("Asset not in portfolio") };
      case (?qty) { qty };
    };

    if (currentQty < quantity) { Runtime.trap("Insufficient quantity to sell") };

    if (currentQty == quantity) {
      portfolio.remove(symbol);
    } else {
      portfolio.add(symbol, currentQty - quantity);
    };

    let saleAmount = asset.price * quantity;
    let balance = switch (userBalances.get(caller)) {
      case (null) {
        userBalances.add(caller, 10000.0);
        10000.0;
      };
      case (?balance) { balance };
    };

    userBalances.add(caller, balance + saleAmount);

    let trade : PublicTrade = {
      timestamp = Time.now();
      symbol;
      tradeType = #sell;
      quantity;
      pricePerUnit = asset.price;
      total = saleAmount;
    };

    var tradeHistory = switch (userTradeHistories.get(caller)) {
      case (null) {
        let newTradeHistory = List.empty<PublicTrade>();
        userTradeHistories.add(caller, newTradeHistory);
        newTradeHistory;
      };
      case (?tradeHistory) { tradeHistory };
    };

    tradeHistory.add(trade);
  };

  // Get watchlist - requires user authentication
  public query ({ caller }) func getWatchlist() : async [Symbol] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view watchlist");
    };
    switch (userWatchlists.get(caller)) {
      case (null) { [] };
      case (?watchlist) { watchlist.keys().toArray() };
    };
  };

  // Add to watchlist - requires user authentication
  public shared ({ caller }) func addToWatchlist(symbol : Symbol) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can add to watchlist");
    };

    if (not assets.containsKey(symbol)) { Runtime.trap("Asset not found") };

    var watchlist = switch (userWatchlists.get(caller)) {
      case (null) {
        userWatchlists.add(caller, Map.empty<Symbol, ()>());
        Map.empty<Symbol, ()>();
      };
      case (?watchlist) { watchlist };
    };

    watchlist.add(symbol, ());
  };

  // Remove from watchlist - requires user authentication
  public shared ({ caller }) func removeFromWatchlist(symbol : Symbol) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can remove from watchlist");
    };

    var watchlist = switch (userWatchlists.get(caller)) {
      case (null) { Runtime.trap("Watchlist is empty") };
      case (?watchlist) { watchlist };
    };

    if (not watchlist.containsKey(symbol)) { Runtime.trap("Symbol not on watchlist") };

    watchlist.remove(symbol);
  };

  // Get user's trades - requires user authentication
  public query ({ caller }) func getTrades() : async [PublicTrade] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view trade history");
    };
    switch (userTradeHistories.get(caller)) {
      case (null) { [] };
      case (?trades) { trades.toArray().sort() };
    };
  };

  // Get user portfolio assets with prices - requires user authentication
  public query ({ caller }) func getPortfolioAssets(sortBy : ?Text) : async [PortfolioAsset] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view portfolio assets");
    };

    let portfolio = switch (userPortfolios.get(caller)) {
      case (null) { emptyPortfolio };
      case (?portfolio) { portfolio };
    };

    let sortByValue = switch (sortBy) {
      case (null) { true };
      case (?sortBy) { sortBy == "value" };
    };

    let assetsArray = portfolio.toArray().map(func((symbol, qty)) { getPortfolioAsset(symbol, qty) });

    if (sortByValue) {
      assetsArray.sort(
        func(a, b) { Float.compare(b.totalValue, a.totalValue) },
      );
    } else {
      assetsArray.sort();
    };
  };

  func getPortfolioAsset(symbol : Symbol, quantity : Float) : PortfolioAsset {
    let asset = switch (assets.get(symbol)) {
      case (null) { Runtime.trap("Asset not found") };
      case (?asset) { asset };
    };

    {
      symbol;
      quantity;
      currentPrice = asset.price;
      totalValue = asset.price * quantity;
    };
  };
};
