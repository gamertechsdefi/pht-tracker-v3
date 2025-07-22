// lib/services/burnService.ts
import { ethers } from 'ethers';
import { db } from "@/db/firebase";
import { collection, doc, getDoc, setDoc, query, where, orderBy, limit, getDocs } from "firebase/firestore";
import { BurnEvent, BurnSummary, JobStatus } from '@/db/schema';

const RPC_URL = "https://bsc-mainnet.infura.io/v3/de990c1b30544bb680e45aba81204a4c";
const BURN_ADDRESSES = [
  "0x000000000000000000000000000000000000dEaD",
  "0x0000000000000000000000000000000000000000",
];

const TOKEN_MAP: Record<string, string> = {
  // ... your existing token map
  pht: "0x885c99a787BE6b41cbf964174C771A9f7ec48e04",
  wkc: "0x6Ec90334d89dBdc89E08A133271be3d104128Edb",
  // ... rest of your tokens
};

const ERC20_ABI = [
  "event Transfer(address indexed from, address indexed to, uint256 value)",
  "function decimals() view returns (uint8)",
];

export class BurnService {
  private provider: ethers.JsonRpcProvider;
  
  constructor() {
    this.provider = new ethers.JsonRpcProvider(RPC_URL);
  }

  // Get burn summary with different strategies based on interval
  async getBurnData(tokenName: string): Promise<BurnSummary> {
    const tokenAddress = TOKEN_MAP[tokenName.toLowerCase()];
    if (!tokenAddress) {
      throw new Error(`Token ${tokenName} not found`);
    }

    // Try to get existing summary
    const existing = await this.getBurnSummary(tokenName);
    const now = Date.now();
    
    // Check if we need to update any intervals
    const needsUpdate = this.checkUpdateNeeded(existing, now);
    
    if (needsUpdate.onDemand.length > 0) {
      // Update short intervals on-demand (5min, 15min)
      await this.updateShortIntervals(tokenName, tokenAddress, existing);
    }
    
    if (needsUpdate.background.length > 0) {
      // Schedule background job for longer intervals
      await this.scheduleBackgroundUpdate(tokenName, needsUpdate.background);
    }

    // Return the updated summary
    return await this.getBurnSummary(tokenName) || this.getDefaultSummary(tokenName, tokenAddress);
  }

  // Check which intervals need updating based on TTL
  private checkUpdateNeeded(summary: BurnSummary | null, now: number) {
    const ttl = {
      '5min': 5 * 60 * 1000,      // 5 minutes
      '15min': 15 * 60 * 1000,    // 15 minutes
      '30min': 30 * 60 * 1000,    // 30 minutes
      '1h': 60 * 60 * 1000,       // 1 hour
      '3h': 3 * 60 * 60 * 1000,   // 3 hours
      '6h': 6 * 60 * 60 * 1000,   // 6 hours
      '12h': 12 * 60 * 60 * 1000, // 12 hours
      '24h': 24 * 60 * 60 * 1000, // 24 hours
    };

    if (!summary) {
      return {
        onDemand: ['5min', '15min'],
        background: ['30min', '1h', '3h', '6h', '12h', '24h']
      };
    }

    const lastUpdated = new Date(summary.lastUpdated).getTime();
    const timeSinceUpdate = now - lastUpdated;

    const onDemand = [];
    const background = [];

    // Check each interval
    for (const [interval, maxAge] of Object.entries(ttl)) {
      if (timeSinceUpdate > maxAge) {
        if (interval === '5min' || interval === '15min') {
          onDemand.push(interval);
        } else {
          background.push(interval);
        }
      }
    }

    return { onDemand, background };
  }

  // Update short intervals (5min, 15min) synchronously
  private async updateShortIntervals(tokenName: string, tokenAddress: string, existing: BurnSummary | null) {
    const startTime = Date.now();
    
    try {
      const [latestBlock, decimals] = await Promise.all([
        this.provider.getBlockNumber(),
        this.getTokenDecimals(tokenAddress),
      ]);

      const latestBlockData = await this.provider.getBlock(latestBlock);
      if (!latestBlockData) throw new Error('Failed to fetch latest block');

      const latestTimestamp = latestBlockData.timestamp;
      
      // Calculate blocks for short intervals
      const blocks = {
        '5min': Math.max(latestBlock - Math.floor(5 * 60 / 3), 1),
        '15min': Math.max(latestBlock - Math.floor(15 * 60 / 3), 1),
      };

      // Fetch burn data for short intervals
      const [burn5min, burn15min] = await Promise.all([
        this.fetchBurnAmount(tokenAddress, blocks['5min'], latestBlock),
        this.fetchBurnAmount(tokenAddress, blocks['15min'], latestBlock),
      ]);

      // Update summary with new short interval data
      const summary: BurnSummary = {
        ...existing,
        tokenName,
        tokenAddress,
        burn5min: Number(burn5min) / Number(BigInt(10) ** BigInt(decimals)),
        burn15min: Number(burn15min) / Number(BigInt(10) ** BigInt(decimals)),
        burn30min: existing?.burn30min || 0,
        burn1h: existing?.burn1h || 0,
        burn3h: existing?.burn3h || 0,
        burn6h: existing?.burn6h || 0,
        burn12h: existing?.burn12h || 0,
        burn24h: existing?.burn24h || 0,
        lastUpdated: new Date().toISOString(),
        lastProcessedBlock: latestBlock,
        computationTime: Date.now() - startTime,
      };

      await this.saveBurnSummary(tokenName, summary);
      console.log(`Updated short intervals for ${tokenName} in ${Date.now() - startTime}ms`);
      
    } catch (error) {
      console.error(`Error updating short intervals for ${tokenName}:`, error);
      throw error;
    }
  }

  // Schedule background job for longer intervals
  private async scheduleBackgroundUpdate(tokenName: string, intervals: string[]) {
    const jobId = `${tokenName}-${Date.now()}`;
    const jobStatus: JobStatus = {
      id: jobId,
      tokenName,
      jobType: 'background',
      status: 'pending',
      startedAt: new Date().toISOString(),
    };

    await this.saveJobStatus(jobId, jobStatus);
    
    // In a real implementation, you'd use a job queue like Bull or Agenda
    // For now, we'll use a simple approach with API routes
    console.log(`Scheduled background update for ${tokenName}, intervals: ${intervals.join(', ')}`);
  }

  // Process background job for longer intervals
  async processBackgroundJob(tokenName: string, intervals: string[]) {
    const jobId = `${tokenName}-${Date.now()}`;
    const startTime = Date.now();
    
    try {
      await this.updateJobStatus(jobId, { status: 'running' });
      
      const tokenAddress = TOKEN_MAP[tokenName.toLowerCase()];
      if (!tokenAddress) throw new Error(`Token ${tokenName} not found`);

      const [latestBlock, decimals] = await Promise.all([
        this.provider.getBlockNumber(),
        this.getTokenDecimals(tokenAddress),
      ]);

      const latestBlockData = await this.provider.getBlock(latestBlock);
      if (!latestBlockData) throw new Error('Failed to fetch latest block');

      const latestTimestamp = latestBlockData.timestamp;
      
      // Calculate blocks for each interval
      const blocks: Record<string, number> = {};
      const intervalSeconds = {
        '30min': 30 * 60,
        '1h': 60 * 60,
        '3h': 3 * 60 * 60,
        '6h': 6 * 60 * 60,
        '12h': 12 * 60 * 60,
        '24h': 24 * 60 * 60,
      };

      for (const interval of intervals) {
        const seconds = intervalSeconds[interval as keyof typeof intervalSeconds];
        if (seconds) {
          blocks[interval] = Math.max(latestBlock - Math.floor(seconds / 3), 1);
        }
      }

      // Fetch burn amounts for requested intervals
      const burnPromises = intervals.map(async (interval) => {
        const amount = await this.fetchBurnAmount(tokenAddress, blocks[interval], latestBlock);
        return {
          interval,
          amount: Number(amount) / Number(BigInt(10) ** BigInt(decimals))
        };
      });

      const burnResults = await Promise.all(burnPromises);
      
      // Get existing summary and update it
      const existing = await this.getBurnSummary(tokenName);
      const summary: BurnSummary = {
        ...existing,
        tokenName,
        tokenAddress,
        burn5min: existing?.burn5min || 0,
        burn15min: existing?.burn15min || 0,
        burn30min: existing?.burn30min || 0,
        burn1h: existing?.burn1h || 0,
        burn3h: existing?.burn3h || 0,
        burn6h: existing?.burn6h || 0,
        burn12h: existing?.burn12h || 0,
        burn24h: existing?.burn24h || 0,
        lastUpdated: new Date().toISOString(),
        lastProcessedBlock: latestBlock,
        computationTime: Date.now() - startTime,
      };

      // Update summary with new values
      burnResults.forEach(({ interval, amount }) => {
        switch (interval) {
          case '30min': summary.burn30min = amount; break;
          case '1h': summary.burn1h = amount; break;
          case '3h': summary.burn3h = amount; break;
          case '6h': summary.burn6h = amount; break;
          case '12h': summary.burn12h = amount; break;
          case '24h': summary.burn24h = amount; break;
        }
      });

      await this.saveBurnSummary(tokenName, summary);
      await this.updateJobStatus(jobId, { 
        status: 'completed',
        completedAt: new Date().toISOString(),
        blocksProcessed: latestBlock - Math.min(...Object.values(blocks))
      });

      console.log(`Background job completed for ${tokenName} in ${Date.now() - startTime}ms`);
      
    } catch (error) {
      console.error(`Background job failed for ${tokenName}:`, error);
      await this.updateJobStatus(jobId, { 
        status: 'failed',
        error: (error as Error).message,
        completedAt: new Date().toISOString()
      });
      throw error;
    }
  }

  // Helper methods
  private async fetchBurnAmount(tokenAddress: string, fromBlock: number, toBlock: number): Promise<bigint> {
    const burnAddressesTopics = BURN_ADDRESSES.map((addr) =>
      ethers.zeroPadValue(addr.toLowerCase(), 32)
    );

    const logs = await this.provider.getLogs({
      fromBlock,
      toBlock,
      address: tokenAddress,
      topics: [
        ethers.id("Transfer(address,address,uint256)"),
        null,
        burnAddressesTopics,
      ],
    });

    let total = BigInt(0);
    const contract = new ethers.Contract(tokenAddress, ERC20_ABI, this.provider);
    
    for (const log of logs) {
      try {
        const parsed = contract.interface.parseLog({
          topics: log.topics,
          data: log.data,
        });
        if (parsed && parsed.args) {
          total += BigInt(parsed.args[2]);
        }
      } catch (e) {
        console.error("Log parsing error:", e);
      }
    }
    
    return total;
  }

  private async getTokenDecimals(tokenAddress: string): Promise<number> {
    const contract = new ethers.Contract(tokenAddress, ERC20_ABI, this.provider);
    return await contract.decimals();
  }

  private async getBurnSummary(tokenName: string): Promise<BurnSummary | null> {
    try {
      const docRef = doc(collection(db, 'burnSummaries'), tokenName);
      const docSnap = await getDoc(docRef);
      return docSnap.exists() ? docSnap.data() as BurnSummary : null;
    } catch (error) {
      console.error("Error getting burn summary:", error);
      return null;
    }
  }

  private async saveBurnSummary(tokenName: string, summary: BurnSummary): Promise<void> {
    try {
      await setDoc(doc(collection(db, 'burnSummaries'), tokenName), summary);
    } catch (error) {
      console.error("Error saving burn summary:", error);
      throw error;
    }
  }

  private async saveJobStatus(jobId: string, status: JobStatus): Promise<void> {
    try {
      await setDoc(doc(collection(db, 'jobStatus'), jobId), status);
    } catch (error) {
      console.error("Error saving job status:", error);
    }
  }

  private async updateJobStatus(jobId: string, updates: Partial<JobStatus>): Promise<void> {
    try {
      const docRef = doc(collection(db, 'jobStatus'), jobId);
      const existing = await getDoc(docRef);
      if (existing.exists()) {
        await setDoc(docRef, { ...existing.data(), ...updates });
      }
    } catch (error) {
      console.error("Error updating job status:", error);
    }
  }

  private getDefaultSummary(tokenName: string, tokenAddress: string): BurnSummary {
    return {
      tokenName,
      tokenAddress,
      burn5min: 0,
      burn15min: 0,
      burn30min: 0,
      burn1h: 0,
      burn3h: 0,
      burn6h: 0,
      burn12h: 0,
      burn24h: 0,
      lastUpdated: new Date().toISOString(),
      lastProcessedBlock: 0,
      computationTime: 0,
    };
  }
}