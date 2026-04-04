"use client";

import { useState, useEffect } from "react";
import { User, LogOut, AlertCircle, ExternalLink } from "lucide-react";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import { usePlayerPoints } from "@/lib/hooks/useFootballBets";
import { success, error, userRejected } from "@/lib/utils/toast";
import { AddressDisplay } from "./AddressDisplay";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
const GENLAYER_CHAIN_ID = 84532; // To keep existing config constants 

const METAMASK_INSTALL_URL = "https://metamask.io/download/";

export function AccountPanel() {
  const { address, isConnected, chainId } = useAccount();
  const { connect, connectors, error: connectError, isPending: isConnecting } = useConnect();
  const { disconnect } = useDisconnect();

  const isOnCorrectNetwork = chainId === parseInt(process.env.NEXT_PUBLIC_GENLAYER_CHAIN_ID || "4460");
  const isMetaMaskInstalled = typeof window !== "undefined" && !!window.ethereum;

  const { data: points = 0 } = usePlayerPoints(address as string);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleDisconnect = () => {
    disconnect();
    setIsModalOpen(false);
  };

  const handleSwitchAccount = () => {
    // Wagmi automatically syncs with MetaMask account picker
    // Usually triggering an eth_requestAccounts or wallet_requestPermissions is possible,
    // but the cleanest way is just to tell users to switch in extension.
    alert("Please switch your account directly in the MetaMask extension.");
  };

  // SSR mismatch prevention
  if (!mounted) return null;

  // Not connected state
  if (!isConnected) {
    return (
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <Button variant="gradient" disabled={isConnecting} onClick={() => setIsModalOpen(true)}>
          <User className="w-4 h-4 mr-2" />
          Connect Wallet
        </Button>
        <DialogContent className="brand-card border-2">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">
              Connect to dApp
            </DialogTitle>
            <DialogDescription>
              Connect your MetaMask wallet to start betting on EVM
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            {!isMetaMaskInstalled ? (
              <>
                <Alert variant="default" className="bg-accent/10 border-accent/20">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>MetaMask Not Detected</AlertTitle>
                  <AlertDescription>
                    Please install MetaMask to continue. MetaMask is a crypto
                    wallet that allows you to interact with blockchain applications.
                  </AlertDescription>
                </Alert>

                <Button
                  onClick={() => window.open(METAMASK_INSTALL_URL, "_blank")}
                  variant="gradient"
                  className="w-full h-14 text-lg"
                >
                  <ExternalLink className="w-5 h-5 mr-2" />
                  Install MetaMask
                </Button>
              </>
            ) : (
              <>
                {connectors.map((connector) => (
                  <Button
                    key={connector.uid}
                    onClick={() => connect({ connector })}
                    variant="gradient"
                    className="w-full h-14 text-lg mb-2"
                    disabled={isConnecting}
                  >
                    <User className="w-5 h-5 mr-2" />
                    {isConnecting ? "Connecting..." : `Connect ${connector.name}`}
                  </Button>
                ))}

                {connectError && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Connection Error</AlertTitle>
                    <AlertDescription>{connectError.message}</AlertDescription>
                  </Alert>
                )}
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Connected state
  return (
    <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
      <div className="flex items-center gap-4">
        <div className="brand-card px-4 py-2 flex items-center gap-3">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-accent" />
            <AddressDisplay address={address || ""} maxLength={12} />
          </div>
        </div>

        <Button variant="outline" size="sm" onClick={() => setIsModalOpen(true)}>
          <User className="w-4 h-4" />
        </Button>
      </div>

      <DialogContent className="brand-card border-2">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            Wallet Details
          </DialogTitle>
          <DialogDescription>
            Your connected EVM wallet information
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <div className="brand-card p-4 space-y-2">
            <p className="text-sm text-muted-foreground">Your Address</p>
            <code className="text-sm font-mono break-all">{address}</code>
          </div>

          <div className="brand-card p-4 space-y-2">
            <p className="text-sm text-muted-foreground">Network Status</p>
            <div className="flex items-center gap-2">
              <div
                className={`w-2 h-2 rounded-full ${
                  isOnCorrectNetwork
                    ? "bg-green-500"
                    : "bg-yellow-500 animate-pulse"
                }`}
              />
              <span className="text-sm">
                {isOnCorrectNetwork
                  ? "Connected to Expected Network"
                  : "Wrong Network"}
              </span>
            </div>
          </div>

          {!isOnCorrectNetwork && (
            <Alert variant="default" className="bg-yellow-500/10 border-yellow-500/20">
              <AlertCircle className="h-4 w-4 text-yellow-500" />
              <AlertTitle>Network Warning</AlertTitle>
              <AlertDescription>
                You&apos;re not on the Base Sepolia network. Please switch networks in
                MetaMask.
              </AlertDescription>
            </Alert>
          )}

          <div className="mt-6 pt-4 border-t border-white/10 space-y-3">
            <Button
              onClick={handleSwitchAccount}
              variant="outline"
              className="w-full"
            >
              <User className="w-4 h-4 mr-2" />
              Switch Account
            </Button>

            <Button
              onClick={handleDisconnect}
              className="w-full text-destructive hover:text-destructive"
              variant="outline"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Disconnect Wallet
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
