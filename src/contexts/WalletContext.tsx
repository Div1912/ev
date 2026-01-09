import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { WalletState, connectWallet, disconnectWallet, isMetaMaskInstalled } from '@/lib/web3';

interface WalletContextType {
  wallet: WalletState;
  isConnecting: boolean;
  error: string | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  isMetaMaskAvailable: boolean;
}

const initialWalletState: WalletState = {
  address: null,
  isConnected: false,
  chainId: null,
  balance: null,
};

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const WalletProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [wallet, setWallet] = useState<WalletState>(initialWalletState);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isMetaMaskAvailable, setIsMetaMaskAvailable] = useState(false);

  useEffect(() => {
    setIsMetaMaskAvailable(isMetaMaskInstalled());
  }, []);

  const handleAccountsChanged = useCallback((accounts: unknown) => {
    const accountsList = accounts as string[];
    if (accountsList.length === 0) {
      setWallet(disconnectWallet());
    } else if (accountsList[0] !== wallet.address) {
      setWallet((prev) => ({ ...prev, address: accountsList[0] }));
    }
  }, [wallet.address]);

  const handleChainChanged = useCallback((chainId: unknown) => {
    const chainIdStr = chainId as string;
    setWallet((prev) => ({ ...prev, chainId: parseInt(chainIdStr, 16) }));
  }, []);

  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);

      return () => {
        window.ethereum?.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum?.removeListener('chainChanged', handleChainChanged);
      };
    }
  }, [handleAccountsChanged, handleChainChanged]);

  const connect = async () => {
    setIsConnecting(true);
    setError(null);

    try {
      const walletState = await connectWallet();
      setWallet(walletState);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to connect wallet';
      setError(errorMessage);
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnect = () => {
    setWallet(disconnectWallet());
    setError(null);
  };

  return (
    <WalletContext.Provider
      value={{
        wallet,
        isConnecting,
        error,
        connect,
        disconnect,
        isMetaMaskAvailable,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = (): WalletContextType => {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};
