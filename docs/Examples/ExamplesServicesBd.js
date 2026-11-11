import {
    collection,
    deleteDoc,
    doc,
    getDoc, getDocs,
    orderBy,
    query,
    setDoc,
    updateDoc
} from "firebase/firestore";

    const COLLECTION = 'Favoritos';

    export const addFavorite = async (meal) => {
        const ref = doc(db, COLLECTION, meal.idMeal);
        await setDoc(ref,{
            idMeal: meal.idMeal,
            name: meal.name,
            category: meal.category,
            thumbnail: meal.thumbnail,
            note: meal.note,
            createAt: Date.now(),        
        });
    }

    export const getFavorite = async (idMeal) => {
        const snap = await getDoc(doc(db, COLLECTION, idMeal));
        return snap.exists() ? {id: snap.id, ...snap.data()} : null;
    }

    export const getFavorites = async () => {
        const q = query(collection(db, COLLECTION), orderBy('createAt', 'desc'));
        const snapshot = await getDocs(q);
        return snapshot.docs.map((d) => ({id: snap.id, ...snap.data()}));
    }

    export const updateNote = async (idMeal, note) => {
        await updateDoc(doc(db, COLLECTION, idMeal), {note});
    }

    export const removeFavorite = async (idMeal) => {
        await deleteDoc(doc(db, COLLECTION, idMeal));
    }