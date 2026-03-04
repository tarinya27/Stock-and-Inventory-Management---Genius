import { collection, doc, getDocs, setDoc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Category } from '../types';

export const getAllCategories = async (): Promise<Category[]> => {
  const snapshot = await getDocs(collection(db, 'categories'));
  const list = snapshot.docs.map(d => ({ categoryCode: d.id, ...d.data() } as Category));
  return list.sort((a, b) => a.categoryCode.localeCompare(b.categoryCode));
};

export const getNextCategoryCode = async (): Promise<string> => {
  const categories = await getAllCategories();
  const codes = categories.map(c => c.categoryCode);
  let num = 1;
  for (const code of codes) {
    const match = code.match(/^CAT(\d+)$/i);
    if (match) num = Math.max(num, parseInt(match[1], 10) + 1);
  }
  return 'CAT' + String(num).padStart(4, '0');
};

export const createCategory = async (name: string): Promise<Category> => {
  const categoryCode = await getNextCategoryCode();
  const category: Category = { categoryCode, name };
  await setDoc(doc(db, 'categories', categoryCode), {
    ...category,
    createdAt: serverTimestamp()
  });
  return category;
};

export const updateCategory = async (categoryCode: string, name: string): Promise<void> => {
  await updateDoc(doc(db, 'categories', categoryCode), { name });
};

export const deleteCategory = async (categoryCode: string): Promise<void> => {
  await deleteDoc(doc(db, 'categories', categoryCode));
};
