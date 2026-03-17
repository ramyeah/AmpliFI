// lib/budgetTracker.js
//
// Firestore CRUD for the persistent budget tracker.
// Collection: budgetTracker/{uid}/transactions/{txnId}
//
// Each transaction:
//   { id, merchant, date, category, subcategory, amount, month, createdAt }
//
// Month key format: 'YYYY-MM' (e.g. '2025-03')
// Used to filter current month's transactions throughout the app.

import {
  collection, doc, addDoc, getDocs,
  deleteDoc, query, where,
} from 'firebase/firestore';
import { db } from './firebase';

// ─── Subcategory definitions ──────────────────────────────────────────────────
export const SUBCATEGORIES = {
  needs: [
    'Food & Groceries',
    'Transport',
    'Rent & Utilities',
    'Healthcare',
    'Education',
  ],
  wants: [
    'Dining Out & Delivery',
    'Entertainment',
    'Shopping',
    'Travel',
    'Personal Care',
  ],
  savings: [
    'Emergency Fund',
    'Investments',
    'Goal Savings',
  ],
};

export const CATEGORY_META = {
  needs:   { label: 'Needs',   icon: '🏠', color: '#3AAECC', colorLight: '#E0F5FB' },
  wants:   { label: 'Wants',   icon: '🎉', color: '#F5883A', colorLight: '#FFF0E3' },
  savings: { label: 'Savings', icon: '💰', color: '#5BBF8A', colorLight: '#E4F7EE' },
};

// Returns 'YYYY-MM' for any Date object
export const toMonthKey = (date = new Date()) => {
  const d = date instanceof Date ? date : new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

export const currentMonthKey = () => toMonthKey(new Date());

// ─── addTransaction ───────────────────────────────────────────────────────────
/**
 * Add a new transaction for the current user.
 * Returns the created document with its Firestore-generated id.
 */
export const addTransaction = async (uid, { merchant, date, category, subcategory, amount }) => {
  if (!uid) throw new Error('uid required');

  const month = toMonthKey(new Date(date));
  const txnRef = collection(db, 'budgetTracker', uid, 'transactions');

  const docRef = await addDoc(txnRef, {
    merchant:    merchant.trim(),
    date:        date,           // ISO string 'YYYY-MM-DD'
    category,
    subcategory,
    amount:      parseFloat(amount),
    month,
    createdAt:   Date.now(),
  });

  return {
    id: docRef.id,
    merchant: merchant.trim(),
    date, category, subcategory,
    amount: parseFloat(amount),
    month,
    createdAt: Date.now(),
  };
};

// ─── getTransactions ──────────────────────────────────────────────────────────
/**
 * Fetch all transactions for a given month (defaults to current month).
 * Returns array sorted by date descending (newest first).
 */
export const getTransactions = async (uid, monthKey = null) => {
  if (!uid) return [];
  const month = monthKey ?? currentMonthKey();
  const txnRef = collection(db, 'budgetTracker', uid, 'transactions');

  // No orderBy — avoids requiring a composite Firestore index.
  // Sort client-side by createdAt descending instead.
  const q = query(txnRef, where('month', '==', month));
  const snap = await getDocs(q);
  return snap.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
};

// ─── deleteTransaction ────────────────────────────────────────────────────────
export const deleteTransaction = async (uid, txnId) => {
  if (!uid || !txnId) return;
  await deleteDoc(doc(db, 'budgetTracker', uid, 'transactions', txnId));
};

// ─── getMonthlyTotals ─────────────────────────────────────────────────────────
/**
 * Returns spending totals by category for a given month.
 * { needs: number, wants: number, savings: number, total: number }
 */
export const getMonthlyTotals = async (uid, monthKey = null) => {
  const txns = await getTransactions(uid, monthKey);
  const totals = { needs: 0, wants: 0, savings: 0, total: 0 };
  txns.forEach(t => {
    totals[t.category] = (totals[t.category] ?? 0) + t.amount;
    totals.total += t.amount;
  });
  return totals;
};

// ─── getMonthlyTotalsFromList ─────────────────────────────────────────────────
// Synchronous version — use when you already have the transactions list in state.
export const getMonthlyTotalsFromList = (txns) => {
  const totals = { needs: 0, wants: 0, savings: 0, total: 0 };
  txns.forEach(t => {
    totals[t.category] = (totals[t.category] ?? 0) + t.amount;
    totals.total += t.amount;
  });
  return totals;
};