const { Client } = require('unb-api');
const unb = new Client(process.env.unb_token);
const { guildId, userId, itemId } = require('./config.js');

// Get user items
async function unbgetUserItems() {
    try {
      const inventoryItem = await client.getInventoryItem(guildId, userId, itemId);
      console.log('Leaderboard:', leaderboard);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    }
  }


module.exports = {unbgetUserItems}