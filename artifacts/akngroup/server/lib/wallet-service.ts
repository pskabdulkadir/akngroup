import mongoose from 'mongoose';
import { UserModel } from './models'; // Use User model as Wallet
import { WalletTransaction } from './WalletTransaction';
import { WalletTxType } from '../../shared/mlm-types';
import { LoggerService, LogContext } from './logger';

export async function creditWallet(
  userId: string,
  amount: number,
  type: WalletTxType,
  description?: string,
  reference?: string,
  existingSession?: mongoose.ClientSession
) {
  const session = existingSession || await mongoose.startSession();

  try {
    if (!existingSession) {
      session.startTransaction();
    }

    LoggerService.info('Initiating wallet credit', { 
      context: LogContext.TRANSACTION, 
      userId, 
      amount, 
      type, 
      reference 
    });

    // Cüzdanı bul veya oluştur (Atomic işlem içinde)
    const updatedUser = await UserModel.findOneAndUpdate(
      { id: userId },
      { 
        $inc: { 
          "wallet.balance": amount,
          "wallet.totalEarnings": amount > 0 ? amount : 0
        } 
      },
      { session, new: true }
    );

    if (!updatedUser) {
      throw new Error(`User not found for wallet credit: ${userId}`);
    }

    // İşlem kaydını oluştur
    const tx = new WalletTransaction({
      userId,
      amount,
      type,
      description,
      reference,
      status: 'completed',
      timestamp: new Date()
    });
    await tx.save({ session });

    if (!existingSession) {
      await session.commitTransaction();
    }

    LoggerService.logTransaction(tx._id.toString(), userId, amount, type, {
      description,
      reference,
      balanceAfter: updatedUser.wallet.balance
    });

    return { success: true, balance: updatedUser.wallet.balance };

  } catch (err) {
    if (!existingSession) {
      await session.abortTransaction();
    }
    
    LoggerService.logError(err as Error, LogContext.TRANSACTION, {
      userId,
      amount,
      type,
      reference
    });
    
    throw err;
  } finally {
    if (!existingSession) {
      session.endSession();
    }
  }
}
