/* 
[概要]
このファイル (CartContext.tsx) は、ECサイトのカート情報をグローバルに管理するための React コンテキストです。
ユーザーが「カートに追加」した商品情報を保持し、カートページや各コンポーネントからアクセスできるようにします。

[技術スタック]
- React Context API: グローバル状態管理を行うための仕組み
- TypeScript: 型安全に状態や関数を管理するため
*/

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// カート内の商品型定義
type CartItem = {
    id: string;       // 商品ID (文字列)
    name: string;     // 商品名
    price: number;    // 商品価格
    quantity: number; // 商品の数量 (数値)
    imageUrl?: string; // 商品画像のURL（オプション）
};

// カートコンテキストで扱うデータ型
type CartContextType = {
    items: CartItem[]; // カート内のアイテム配列
    addToCart: (item: CartItem) => void; // 商品をカートに追加する関数
    removeFromCart: (id: string) => void; // 商品をカートから削除する関数
    clearCart: () => void; // カートを空にする関数
    isLoading: boolean; // ローカルストレージからの読み込み中かどうか
};

// デフォルト値 (実際には使用されないので空でOK)
const CartContext = createContext<CartContextType | undefined>(undefined);

// ローカルストレージのキー
const CART_STORAGE_KEY = 'ec-cart-items';
const CART_TIMESTAMP_KEY = 'ec-cart-timestamp';
// カートの有効期限（24時間）
const CART_EXPIRY_HOURS = 24;

// カートプロバイダーコンポーネント
export const CartProvider = ({ children }: { children: ReactNode }) => {
    // カート内のアイテムを管理する状態
    const [items, setItems] = useState<CartItem[]>([]);
    // ローディング状態
    const [isLoading, setIsLoading] = useState(true);

    // 初期化時にローカルストレージからデータを読み込む
    useEffect(() => {
        const loadCartData = () => {
            const savedItems = localStorage.getItem(CART_STORAGE_KEY);
            const timestamp = localStorage.getItem(CART_TIMESTAMP_KEY);
            
            if (timestamp) {
                const savedTime = new Date(timestamp).getTime();
                const currentTime = new Date().getTime();
                const hoursPassed = (currentTime - savedTime) / (1000 * 60 * 60);
                
                if (hoursPassed > CART_EXPIRY_HOURS) {
                    localStorage.removeItem(CART_STORAGE_KEY);
                    localStorage.removeItem(CART_TIMESTAMP_KEY);
                    setItems([]);
                    setIsLoading(false);
                    return;
                }
            }
            
            if (savedItems) {
                setItems(JSON.parse(savedItems));
            }
            setIsLoading(false);
        };

        loadCartData();
    }, []);

    // 状態が変更されたときにローカルストレージに保存
    useEffect(() => {
        if (!isLoading && items.length > 0) {
            localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
            localStorage.setItem(CART_TIMESTAMP_KEY, new Date().toISOString());
        }
    }, [items, isLoading]);

    // 商品をカートに追加する関数
    const addToCart = (item: CartItem) => {
        setItems((prevItems) => {
            const existingItem = prevItems.find((i) => i.id === item.id);
            if (existingItem) {
                return prevItems.map((i) =>
                    i.id === item.id ? { ...i, quantity: i.quantity + item.quantity } : i
                );
            }
            return [...prevItems, item];
        });
    };

    // 商品をカートから削除する関数
    const removeFromCart = (id: string) => {
        setItems((prevItems) => {
            const newItems = prevItems.filter((item) => item.id !== id);
            if (newItems.length === 0) {
                clearCart();
            }
            return newItems;
        });
    };

    // カートを空にする関数
    const clearCart = () => {
        setItems([]);
        localStorage.removeItem(CART_STORAGE_KEY);
        localStorage.removeItem(CART_TIMESTAMP_KEY);
    };

    // Context に状態と関数を提供
    return (
        <CartContext.Provider value={{ items, addToCart, removeFromCart, clearCart, isLoading }}>
            {children}
        </CartContext.Provider>
    );
};

// カートコンテキストを利用するためのカスタムフック
export const useCart = (): CartContextType => {
    const context = useContext(CartContext);
    if (!context) {
        throw new Error("useCart must be used within a CartProvider");
    }
    return context;
};