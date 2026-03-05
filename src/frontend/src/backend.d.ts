import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export type Symbol = string;
export interface PortfolioAsset {
    currentPrice: number;
    totalValue: number;
    quantity: number;
    symbol: Symbol;
}
export interface Asset {
    change24h: number;
    name: string;
    category: Category;
    price: number;
    symbol: Symbol;
}
export interface PublicTrade {
    total: number;
    tradeType: TradeType;
    pricePerUnit: number;
    timestamp: bigint;
    quantity: number;
    symbol: Symbol;
}
export interface UserProfile {
    name: string;
    email: string;
}
export enum Category {
    metal = "metal",
    stock = "stock",
    crypto = "crypto",
    index = "index"
}
export enum TradeType {
    buy = "buy",
    sell = "sell"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addToWatchlist(symbol: Symbol): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    buy(symbol: Symbol, quantity: number): Promise<void>;
    getAllAssets(): Promise<Array<Asset>>;
    getAsset(symbol: Symbol): Promise<Asset>;
    getBalance(): Promise<number>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getPortfolio(): Promise<Array<[Symbol, number]>>;
    getPortfolioAssets(sortBy: string | null): Promise<Array<PortfolioAsset>>;
    getTrades(): Promise<Array<PublicTrade>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    getWatchlist(): Promise<Array<Symbol>>;
    isCallerAdmin(): Promise<boolean>;
    removeFromWatchlist(symbol: Symbol): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    sell(symbol: Symbol, quantity: number): Promise<void>;
}
