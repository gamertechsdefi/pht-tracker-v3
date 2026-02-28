// import { ethers } from 'ethers';
// import { createClient } from '@supabase/supabase-js';

// // Supabase configuration
// // Ensure we pass strings to createClient so TypeScript is satisfied.
// const SUPABASE_URL: string = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
// const SUPABASE_KEY: string = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';
// const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// // BNB Chain RPC
// const BNB_CHAIN_RPC = 'https://bsc-dataseed.binance.org/';
// const provider = new ethers.JsonRpcProvider(BNB_CHAIN_RPC);

// // Chainlink Price Feed ABI (only the functions we need)
// const PRICE_FEED_ABI = [
//   'function latestRoundData() external view returns (uint80 roundId, int256 answer, uint256 startedAt, uint256 updatedAt, uint80 answeredInRound)',
//   'function getRoundData(uint80 _roundId) external view returns (uint80 roundId, int256 answer, uint256 startedAt, uint256 updatedAt, uint80 answeredInRound)',
//   'function decimals() external view returns (uint8)',
//   'function description() external view returns (string)',
//   'function phaseId() external view returns (uint16)',
//   'function phaseAggregators(uint16 phaseId) external view returns (address)'
// ];

// // Example: BNB/USD price feed on BNB Chain
// const FEED_ADDRESSES: Record<string, string> = {
//   'BNB/USD': '0x0567F2323251f0Aab15c8dFb1967E4e8A7D42aeE',
//   'BTC/USD': '0x264990fbd0A4796A3E3d8E37C4d5F87a3aCa5Ebf',
//   'ETH/USD': '0x9ef1B8c0E4F7dc8bF5719Ea496883DC6401d5b2e'
// };

// /**
//  * Fetch historical price data from a Chainlink feed
//  * @param {string} feedAddress - The Chainlink price feed contract address
//  * @param {number} hoursBack - How many hours of history to fetch
//  * @returns {Array} Array of price data points
//  */
// async function fetchHistoricalPrices(feedAddress: string, hoursBack = 24): Promise<Array<Record<string, any>>> {
//   const contract = new ethers.Contract(feedAddress, PRICE_FEED_ABI, provider);
  
//   try {
//     // Get feed metadata
//     const decimals = await contract.decimals();
//     const description = await contract.description();
//     console.log(`Fetching data for ${description} (${feedAddress})`);
    
//     // Get latest round data
//   const latestData = await contract.latestRoundData();
//   // Convert roundId to number to avoid BigInt literal usage (compat with older TS targets)
//   const latestRoundId: number = Number(latestData.roundId);
//   const latestTimestamp = Number(latestData.updatedAt);
    
//     console.log(`Latest round: ${latestRoundId}, Price: ${ethers.formatUnits(latestData.answer, decimals)}`);
    
//     // Calculate target timestamp (how far back to go)
//     const targetTimestamp = latestTimestamp - (hoursBack * 3600);
    
//     const priceHistory = [];
//   let currentRoundId: number = latestRoundId;
//     let attempts = 0;
//     const maxAttempts = 10000; // Safety limit
    
//     // Iterate backwards through rounds
//     while (attempts < maxAttempts) {
//       try {
//   const roundData = await contract.getRoundData(currentRoundId);
//   const timestamp = Number(roundData.updatedAt);
        
//         // Stop if we've gone back far enough
//         if (timestamp < targetTimestamp) {
//           break;
//         }
        
//         // Only add valid data points
//         if (roundData.answer > 0 && timestamp > 0) {
//           priceHistory.push({
//             round_id: currentRoundId.toString(),
//             price: ethers.formatUnits(roundData.answer, decimals),
//             timestamp: timestamp,
//             date: new Date(timestamp * 1000).toISOString(),
//             feed_address: feedAddress.toLowerCase(),
//             description: description
//           });
          
//           console.log(`Round ${currentRoundId}: ${ethers.formatUnits(roundData.answer, decimals)} at ${new Date(timestamp * 1000).toISOString()}`);
//         }
        
//   // Move to previous round (decrement by 1)
//   currentRoundId = currentRoundId - 1;
//         attempts++;
        
//       } catch (error) {
//   // Round doesn't exist, try previous one
//   currentRoundId = currentRoundId - 1;
//         attempts++;
        
//         if (attempts % 100 === 0) {
//           console.log(`Checked ${attempts} rounds...`);
//         }
//       }
//     }
    
//     console.log(`Fetched ${priceHistory.length} data points`);
//     return priceHistory.reverse(); // Return in chronological order
    
//   } catch (error) {
//     console.error('Error fetching historical prices:', error);
//     throw error;
//   }
// }

// /**
//  * Save price history to Supabase
//  * @param {Array} priceData - Array of price data points
//  */
// async function savePriceHistory(priceData: Array<Record<string, any>>): Promise<any> {
//   try {
//     const { data, error } = await supabase
//       .from('chainlink_prices')
//       .upsert(priceData, { 
//         onConflict: 'feed_address,round_id',
//         ignoreDuplicates: false 
//       });
    
//     if (error) {
//       console.error('Error saving to Supabase:', error);
//       throw error;
//     }
    
//     console.log(`Successfully saved ${priceData.length} records to Supabase`);
//     return data;
//   } catch (error) {
//     console.error('Error in savePriceHistory:', error);
//     throw error;
//   }
// }

// /**
//  * Get price history from Supabase
//  * @param {string} feedAddress - The price feed address
//  * @param {number} hoursBack - How many hours of history to retrieve
//  */
// async function getPriceHistoryFromDB(feedAddress: string, hoursBack = 24): Promise<Array<Record<string, any>>> {
//   const cutoffTime = new Date(Date.now() - hoursBack * 3600 * 1000).toISOString();
  
//   const { data, error } = await supabase
//     .from('chainlink_prices')
//     .select('*')
//     .eq('feed_address', feedAddress.toLowerCase())
//     .gte('date', cutoffTime)
//     .order('timestamp', { ascending: true });
  
//   if (error) {
//     console.error('Error fetching from Supabase:', error);
//     throw error;
//   }
  
//   return data as Array<Record<string, any>>;
// }

// /**
//  * Main function to sync price data
//  */
// async function syncPriceData(pairName: string = 'BNB/USD', hoursBack = 24): Promise<Array<Record<string, any>>> {
//   const feedAddress = FEED_ADDRESSES[pairName];
  
//   if (!feedAddress) {
//     throw new Error(`Unknown pair: ${pairName}`);
//   }
  
//   console.log(`\n=== Syncing ${pairName} price data ===`);
  
//   // Fetch from blockchain
//   const priceHistory = await fetchHistoricalPrices(feedAddress, hoursBack);
  
//   // Save to Supabase
//   if (priceHistory.length > 0) {
//     await savePriceHistory(priceHistory);
//   }
  
//   console.log('Sync complete!\n');
  
//   return priceHistory;
// }

// /**
//  * Get latest prices for charting
//  */
// async function getChartData(pairName: string = 'BNB/USD', hoursBack = 24): Promise<Array<{x:number,y:number,timestamp:number}>> {
//   const feedAddress = FEED_ADDRESSES[pairName];
//   const data = await getPriceHistoryFromDB(feedAddress, hoursBack);
  
//   // Format for charting libraries
//   return data.map(item => ({
//     x: new Date(item.date).getTime(),
//     y: parseFloat(item.price),
//     timestamp: item.timestamp
//   }));
// }

// // Example usage
// async function main() {
//   try {
//     // Sync BNB/USD data for the last 24 hours
//     await syncPriceData('BNB/USD', 24);
    
//     // Get data for chart
//     const chartData = await getChartData('BNB/USD', 24);
//     console.log('Chart data points:', chartData.length);
//     console.log('Sample:', chartData.slice(0, 3));
    
//   } catch (error) {
//     console.error('Error in main:', error);
//   }
// }

// // Run if this is the main module
// if (import.meta.url === `file://${process.argv[1]}`) {
//   main();
// }

// export { 
//   syncPriceData, 
//   getChartData, 
//   getPriceHistoryFromDB,
//   fetchHistoricalPrices,
//   FEED_ADDRESSES 
// };

import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ message: "Hello World" });
}
   