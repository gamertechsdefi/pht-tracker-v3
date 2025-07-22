// lib/db/schema.ts
export interface BurnEvent {
  id: string;
  tokenName: string;
  tokenAddress: string;
  blockNumber: number;
  timestamp: number;
  amount: bigint;
  txHash: string;
  logIndex: number;
  createdAt: string;
}

export interface BurnSummary {
  tokenName: string;
  tokenAddress: string;
  burn5min: number;
  burn15min: number;
  burn30min: number;
  burn1h: number;
  burn3h: number;
  burn6h: number;
  burn12h: number;
  burn24h: number;
  lastUpdated: string;
  lastProcessedBlock: number;
  computationTime: number; // ms taken to compute
}

export interface JobStatus {
  id: string;
  tokenName: string;
  jobType: 'background' | 'ondemand';
  status: 'pending' | 'running' | 'completed' | 'failed';
  startedAt: string;
  completedAt?: string;
  error?: string;
  blocksProcessed?: number;
}