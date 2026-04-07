'use strict';

const { Contract } = require('fabric-contract-api');

// Composite key prefixes
const BALANCE_PREFIX = 'balance';
const ALLOWANCE_PREFIX = 'allowance';

class ACTContract extends Contract {
  constructor() {
    super('org.alphachain.token');
  }

  /**
   * Initialize — Set token metadata. Called once on first deployment.
   */
  async Initialize(ctx, name, symbol, decimals) {
    const mspId = ctx.clientIdentity.getMSPID();
    // Only AlphaOrg admin can initialize
    this._requireMSP(ctx, 'AlphaOrgMSP');

    await ctx.stub.putState('tokenName', Buffer.from(name));
    await ctx.stub.putState('tokenSymbol', Buffer.from(symbol));
    await ctx.stub.putState('tokenDecimals', Buffer.from(decimals));
    await ctx.stub.putState('totalSupply', Buffer.from('0'));

    // Store the minter (admin who can mint new tokens)
    const minter = ctx.clientIdentity.getID();
    await ctx.stub.putState('minter', Buffer.from(minter));

    return JSON.stringify({ name, symbol, decimals, minter });
  }

  /**
   * Mint — Create new ACT tokens and assign to a recipient.
   * Only the designated minter can call this.
   */
  async Mint(ctx, recipient, amount) {
    this._requireMinter(ctx);

    const amountInt = parseInt(amount, 10);
    if (amountInt <= 0) {
      throw new Error('Mint amount must be positive');
    }

    // Update recipient balance
    const currentBalance = await this._getBalance(ctx, recipient);
    const newBalance = currentBalance + amountInt;
    await this._setBalance(ctx, recipient, newBalance);

    // Update total supply
    const supply = await this._getTotalSupply(ctx);
    await ctx.stub.putState('totalSupply', Buffer.from((supply + amountInt).toString()));

    ctx.stub.setEvent('Transfer', Buffer.from(JSON.stringify({
      from: '0x0',
      to: recipient,
      amount: amountInt,
    })));

    return JSON.stringify({ recipient, amount: amountInt, newBalance, totalSupply: supply + amountInt });
  }

  /**
   * Transfer — Move tokens from the caller to a recipient.
   */
  async Transfer(ctx, recipient, amount) {
    const sender = ctx.clientIdentity.getID();
    const amountInt = parseInt(amount, 10);

    if (amountInt <= 0) {
      throw new Error('Transfer amount must be positive');
    }

    if (sender === recipient) {
      throw new Error('Cannot transfer to self');
    }

    const senderBalance = await this._getBalance(ctx, sender);
    if (senderBalance < amountInt) {
      throw new Error(`Insufficient balance. Have: ${senderBalance}, need: ${amountInt}`);
    }

    // Debit sender, credit recipient
    await this._setBalance(ctx, sender, senderBalance - amountInt);
    const recipientBalance = await this._getBalance(ctx, recipient);
    await this._setBalance(ctx, recipient, recipientBalance + amountInt);

    ctx.stub.setEvent('Transfer', Buffer.from(JSON.stringify({
      from: sender,
      to: recipient,
      amount: amountInt,
    })));

    return JSON.stringify({
      from: sender,
      to: recipient,
      amount: amountInt,
    });
  }

  /**
   * BalanceOf — Query the ACT balance of an account.
   */
  async BalanceOf(ctx, account) {
    const balance = await this._getBalance(ctx, account);
    return JSON.stringify({ account, balance });
  }

  /**
   * TotalSupply — Query the total ACT supply.
   */
  async TotalSupply(ctx) {
    const supply = await this._getTotalSupply(ctx);
    return JSON.stringify({ totalSupply: supply });
  }

  /**
   * TokenName — Get the token name.
   */
  async TokenName(ctx) {
    const name = await ctx.stub.getState('tokenName');
    return name ? name.toString() : '';
  }

  /**
   * TokenSymbol — Get the token symbol.
   */
  async TokenSymbol(ctx) {
    const symbol = await ctx.stub.getState('tokenSymbol');
    return symbol ? symbol.toString() : '';
  }

  // --- Internal helpers ---

  async _getBalance(ctx, account) {
    const key = ctx.stub.createCompositeKey(BALANCE_PREFIX, [account]);
    const data = await ctx.stub.getState(key);
    if (!data || data.length === 0) return 0;
    return parseInt(data.toString(), 10);
  }

  async _setBalance(ctx, account, balance) {
    const key = ctx.stub.createCompositeKey(BALANCE_PREFIX, [account]);
    await ctx.stub.putState(key, Buffer.from(balance.toString()));
  }

  async _getTotalSupply(ctx) {
    const data = await ctx.stub.getState('totalSupply');
    if (!data || data.length === 0) return 0;
    return parseInt(data.toString(), 10);
  }

  async _requireMinter(ctx) {
    const minter = await ctx.stub.getState('minter');
    if (!minter || minter.length === 0) {
      throw new Error('Token not initialized. Call Initialize first.');
    }
    const caller = ctx.clientIdentity.getID();
    if (caller !== minter.toString()) {
      throw new Error('Only the minter can perform this action');
    }
  }

  _requireMSP(ctx, requiredMSP) {
    const mspId = ctx.clientIdentity.getMSPID();
    if (mspId !== requiredMSP) {
      throw new Error(`Access denied. Required MSP: ${requiredMSP}, got: ${mspId}`);
    }
  }
}

module.exports = ACTContract;
