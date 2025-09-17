import { getJSON, setJSON, Keys } from "./storage";
import type { Wholesaler, WhItem, WhOrder, WhOrderLine } from "../types/wholesaler";

const genId = () => Date.now().toString(36) + Math.random().toString(36).slice(2,8);
const nowIso = () => new Date().toISOString();

/** WHOLESALERS **/
export async function listWholesalers(): Promise<Wholesaler[]> {
  const list = await getJSON<Wholesaler[]>(Keys.wholesalers, []);
  return list.sort((a,b) => {
    const pa = a.preferred ? 0 : 1;
    const pb = b.preferred ? 0 : 1;
    if (pa !== pb) return pa - pb;
    return (a.name||"").localeCompare(b.name||"");
  });
}
export async function getWholesaler(id: string) {
  const list = await getJSON<Wholesaler[]>(Keys.wholesalers, []);
  return list.find(w => w.id === id);
}
export async function upsertWholesaler(input: Partial<Wholesaler> & { name: string; id?: string }): Promise<Wholesaler> {
  const list = await getJSON<Wholesaler[]>(Keys.wholesalers, []);
  let rec: Wholesaler;
  if (input.id) {
    const i = list.findIndex(w => w.id === input.id);
    if (i >= 0) {
      rec = { ...list[i], ...input, updatedAt: nowIso() } as Wholesaler;
      list[i] = rec;
    } else {
      rec = { id: input.id, name: input.name, contactName: input.contactName, phone: input.phone, email: input.email, address: input.address, preferred: !!input.preferred, rating: input.rating as any, notes: input.notes, createdAt: nowIso(), updatedAt: nowIso() };
      list.push(rec);
    }
  } else {
    rec = { id: genId(), name: input.name, contactName: input.contactName, phone: input.phone, email: input.email, address: input.address, preferred: !!input.preferred, rating: input.rating as any, notes: input.notes, createdAt: nowIso(), updatedAt: nowIso() };
    list.push(rec);
  }
  await setJSON(Keys.wholesalers, list);
  return rec;
}
export async function deleteWholesaler(id: string) {
  const list = await getJSON<Wholesaler[]>(Keys.wholesalers, []);
  await setJSON(Keys.wholesalers, list.filter(w => w.id !== id));
  const items = await getJSON<WhItem[]>(Keys.whCatalog, []);
  await setJSON(Keys.whCatalog, items.filter(it => it.wholesalerId !== id));
  const orders = await getJSON<WhOrder[]>(Keys.whOrders, []);
  await setJSON(Keys.whOrders, orders.filter(o => o.wholesalerId !== id));
}

/** CATALOG **/
export async function listItemsForWholesaler(wholesalerId: string): Promise<WhItem[]> {
  const items = await getJSON<WhItem[]>(Keys.whCatalog, []);
  return items.filter(it => it.wholesalerId === wholesalerId)
              .sort((a,b) => (a.name||"").localeCompare(b.name||""));
}
export async function getItem(wholesalerId: string, itemId: string) {
  const items = await getJSON<WhItem[]>(Keys.whCatalog, []);
  return items.find(it => it.wholesalerId === wholesalerId && it.id === itemId);
}
export async function upsertItem(input: Omit<WhItem,"id"> & { id?: string }): Promise<WhItem> {
  const items = await getJSON<WhItem[]>(Keys.whCatalog, []);
  let rec: WhItem;
  if (input.id) {
    const i = items.findIndex(it => it.id === input.id && it.wholesalerId === input.wholesalerId);
    if (i >= 0) {
      rec = { ...items[i], ...input, lastUpdated: nowIso() };
      items[i] = rec;
    } else {
      rec = { ...input, id: input.id, lastUpdated: nowIso() } as WhItem;
      items.push(rec);
    }
  } else {
    rec = { ...input, id: genId(), lastUpdated: nowIso() } as WhItem;
    items.push(rec);
  }
  await setJSON(Keys.whCatalog, items);
  return rec;
}
export async function deleteItem(wholesalerId: string, itemId: string) {
  const items = await getJSON<WhItem[]>(Keys.whCatalog, []);
  await setJSON(Keys.whCatalog, items.filter(it => !(it.wholesalerId === wholesalerId && it.id === itemId)));
}

/** ORDERS **/
export async function listOrdersForWholesaler(wholesalerId: string): Promise<WhOrder[]> {
  const orders = await getJSON<WhOrder[]>(Keys.whOrders, []);
  return orders.filter(o => o.wholesalerId === wholesalerId)
               .sort((a,b) => (b.createdAt).localeCompare(a.createdAt));
}
export async function addOrder(wholesalerId: string, lines: WhOrderLine[], note?: string): Promise<WhOrder> {
  const orders = await getJSON<WhOrder[]>(Keys.whOrders, []);
  const total = lines.reduce((sum, l) => sum + (l.unitPrice ?? 0) * l.qty, 0);
  const rec: WhOrder = { id: genId(), wholesalerId, createdAt: nowIso(), lines, total, note };
  orders.push(rec);
  await setJSON(Keys.whOrders, orders);
  return rec;
}
