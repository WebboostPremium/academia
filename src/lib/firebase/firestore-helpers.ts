import { collection, doc, type CollectionReference, type DocumentReference } from "firebase/firestore";
import { getClientDb } from "@/lib/firebase/client";

export function fsCollection(path: string): CollectionReference {
  return collection(getClientDb(), path);
}

export function fsDoc(path: string, id: string): DocumentReference {
  return doc(getClientDb(), path, id);
}
