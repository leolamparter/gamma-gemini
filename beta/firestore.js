import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, where, setDoc, getDoc, deleteField } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Firebase config (replace with your actual credentials)
const firebaseConfig = {
    apiKey: "AIzaSyClsnse44vK0tAFnQJckA5BuFlvh0bpGTo",
    authDomain: "financeforwardmain.firebaseapp.com",
    projectId: "financeforwardmain",
    storageBucket: "financeforwardmain.firebasestorage.app",
    messagingSenderId: "231522398265",
    appId: "1:231522398265:web:9147a7e9f4ffa218b55de8"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// DB Functions (Only using Firestore SDK functions)
let DB = {
    'u': {
        /**
         * Creates a new user document and returns its ID.
         * @param {string} hash - The unique hash identifier for the user.
         * @returns {Promise<string>} The document ID of the newly created user.
         */
        'create': async (hash) => {
            const docRef = await addDoc(collection(db, "users"), { hash });
            return docRef.id;
        },

        /**
         * Retrieves a user document by hash.
         * @param {string} hash - The unique hash identifier for the user.
         * @returns {Promise<Object|null>} The user data or null if not found.
         */
        'get': async (hash) => {
            const q = query(collection(db, "users"), where("hash", "==", hash));
            const querySnapshot = await getDocs(q);
            if (querySnapshot.empty) {
                return null;
            }
            return querySnapshot.docs[0].data();
        },

        /**
         * Updates a user document with the given updates.
         * @param {string} hash - The unique hash identifier for the user.
         * @param {Object} updates - The updates to apply to the user document.
         * @returns {Promise<boolean>} True if the update was successful, false otherwise.
         */
        'update': async (hash, updates) => {
            const q = query(collection(db, "users"), where("hash", "==", hash));
            const querySnapshot = await getDocs(q);
            if (!querySnapshot.empty) {
                const docRef = querySnapshot.docs[0].ref;
                await updateDoc(docRef, updates);
                return true;
            }
            return false;
        },

        /**
         * Checks if a user with the given hash exists.
         * @param {string} hash - The unique hash identifier for the user.
         * @returns {Promise<boolean>} True if the user exists, false otherwise.
         */
        'exists': async (hash) => {
            const q = query(collection(db, "users"), where("hash", "==", hash));
            const querySnapshot = await getDocs(q);
            return !querySnapshot.empty;
        },

        /**
         * Deletes a user document by hash.
         * @param {string} hash - The unique hash identifier for the user.
         * @returns {Promise<null>} Null if the deletion was successful or no user was found.
         */
        'delete': async (hash) => {
            const q = query(collection(db, "users"), where("hash", "==", hash));
            const querySnapshot = await getDocs(q);
            if (!querySnapshot.empty) {
                await deleteDoc(querySnapshot.docs[0].ref);
                return null;
            }
            return null;
        }
    },
    'uCompute': {
        /**
         * Adds or updates a field in a subcollection document.
         * @param {string} hash - The unique hash identifier for the user.
         * @param {string} collectionName - The name of the subcollection.
         * @param {string} documentName - The name of the document.
         * @param {string} field - The field to add or update.
         * @param {any} value - The value to set for the field.
         * @returns {Promise<boolean>} True if the operation was successful, false otherwise.
         */
        'add': async (hash, collectionName, documentName, field, value) => {
            try {
                // Step 1: Query the 'users' collection to find the document with the matching 'hash' field
                const usersRef = collection(db, "users");
                const userQuery = query(usersRef, where("hash", "==", hash));
                const userSnap = await getDocs(userQuery);
        
                if (userSnap.empty) {
                    console.error("User not found with hash:", hash);
                    return false; // No user found
                }
        
                // Step 2: Get the actual user document reference (assuming hash is unique, so taking the first match)
                const userDocRef = userSnap.docs[0].ref;
        
                // Step 3: Reference the subcollection and document inside the found user document
                const subCollectionRef = collection(userDocRef, collectionName);
                const documentRef = doc(subCollectionRef, documentName);
        
                // Step 4: Set the field inside the document (merge to prevent overwriting)
                await setDoc(documentRef, { [field]: value }, { merge: true });
        
                return true; // Successfully added/updated
            } catch (error) {
                console.error("Error adding field:", error);
                return false; // Error occurred
            }
        },

        /**
         * Retrieves a specific field from a subcollection document.
         * @param {string} hash - The unique hash identifier for the user.
         * @param {string} collectionName - The name of the subcollection.
         * @param {string} documentName - The name of the document.
         * @param {string} field - The field to retrieve.
         * @returns {Promise<any|null>} The value of the field or null if not found.
         */
        'get': async (hash, collectionName, documentName, field) => {
            try {
                // Step 1: Query the 'users' collection to find the document with the matching 'hash' field
                const usersRef = collection(db, "users");
                const userQuery = query(usersRef, where("hash", "==", hash));
                const userSnap = await getDocs(userQuery);
        
                if (userSnap.empty) {
                    console.error("User not found with hash:", hash);
                    return null; // User not found
                }
        
                // Step 2: Get the actual user document reference
                const userDocRef = userSnap.docs[0].ref;
        
                // Step 3: Reference the subcollection and document
                const subCollectionRef = collection(userDocRef, collectionName);
                const documentRef = doc(subCollectionRef, documentName);
                
                // Step 4: Get the document
                const docSnap = await getDoc(documentRef);
        
                if (!docSnap.exists()) {
                    console.error("Document not found:", documentName);
                    return null; // Document doesn't exist
                }
        
                // Step 5: Return the specific field (or null if not found)
                return docSnap.data()[field] ?? null;
            } catch (error) {
                console.error("Error getting field:", error);
                return null; // Error occurred
            }
        },

        /**
         * Sums all numeric fields in a subcollection document.
         * @param {string} hash - The unique hash identifier for the user.
         * @param {string} collectionName - The name of the subcollection.
         * @param {string} documentName - The name of the document.
         * @returns {Promise<number|null>} The sum of all numeric fields or null on error.
         */
        'sum': async (hash, collectionName, documentName) => {
            try {
                // Step 1: Query the 'users' collection to find the document with the matching 'hash' field
                const usersRef = collection(db, "users");
                const userQuery = query(usersRef, where("hash", "==", hash));
                const userSnap = await getDocs(userQuery);
        
                if (userSnap.empty) {
                    console.error("User not found with hash:", hash);
                    return null; // User not found
                }
        
                // Step 2: Get the actual user document reference
                const userDocRef = userSnap.docs[0].ref;
        
                // Step 3: Reference the subcollection and document inside the user
                const subCollectionRef = collection(userDocRef, collectionName);
                const documentRef = doc(subCollectionRef, documentName);
        
                // Step 4: Get the document
                const docSnap = await getDoc(documentRef);
        
                if (!docSnap.exists()) {
                    console.info("Document not found:", documentName);
                    return 0; // Document doesn't exist
                }
        
                // Step 5: Sum all numeric values in the document
                const data = docSnap.data();
                let total = 0;
        
                for (let key in data) {
                    if (typeof data[key] === "number") {
                        total += data[key];
                    }
                }
        
                return total;
            } catch (error) {
                console.error("Error calculating sum:", error);
                return null; // Error occurred
            }
        },

        /**
         * Retrieves all fields from a subcollection document.
         * @param {string} hash - The unique hash identifier for the user.
         * @param {string} collectionName - The name of the subcollection.
         * @param {string} documentName - The name of the document.
         * @returns {Promise<Object>} The document data as a JSON object.
         */
        'all': async (hash, collectionName, documentName) => {
            try {
                // Step 1: Query the 'users' collection to find the document with the matching 'hash' field
                const usersRef = collection(db, "users");
                const userQuery = query(usersRef, where("hash", "==", hash));
                const userSnap = await getDocs(userQuery);
        
                if (userSnap.empty) {
                    console.error("User not found with hash:", hash);
                    return {}; // User not found, return empty object
                }
        
                // Step 2: Get the actual user document reference
                const userDocRef = userSnap.docs[0].ref;
        
                // Step 3: Reference the subcollection and document inside the user
                const subCollectionRef = collection(userDocRef, collectionName);
                const documentRef = doc(subCollectionRef, documentName);
        
                // Step 4: Get the document
                const docSnap = await getDoc(documentRef);
        
                if (!docSnap.exists()) {
                    return {}; // Document doesn't exist, return empty object
                }
        
                // Step 5: Return the entire document data as a JSON object
                return docSnap.data();
            } catch (error) {
                console.error("Error retrieving document data:", error);
                return {}; // Return empty object on error
            }
        },

        /**
         * Deletes a specific field from a document in a subcollection.
         * @param {string} hash - The unique hash identifier for the user.
         * @param {string} collectionName - The name of the subcollection.
         * @param {string} documentName - The name of the document.
         * @param {string} fieldName - The name of the field to delete.
         * @returns {Promise<boolean>} True if the field was successfully deleted, false otherwise.
         */
        'deleteF': async (hash, collectionName, documentName, fieldName) => {
            try {
                if (typeof fieldName !== "string") {
                    console.error("Field name must be a string!");
                    return false;
                }
        
                // Step 1: Find user by hash
                const usersRef = collection(db, "users");
                const userQuery = query(usersRef, where("hash", "==", hash));
                const userSnap = await getDocs(userQuery);
        
                if (userSnap.empty) {
                    console.error("User not found with hash:", hash);
                    return false; // User not found
                }
        
                // Step 2: Get user document reference
                const userDocRef = userSnap.docs[0].ref;
        
                // Step 3: Reference the subcollection and document
                const subCollectionRef = collection(userDocRef, collectionName);
                const documentRef = doc(subCollectionRef, documentName);
        
                // Step 4: Remove the field from the document
                await updateDoc(documentRef, {
                    [String(fieldName)]: deleteField()
                });
        
                return true; // Successfully deleted
            } catch (error) {
                console.error("Error deleting field:", error);
                return false;
            }
        }
    },

    'uDoc': {
        /**
         * Retrieves all documents from a subcollection.
         * @param {string} hash - The unique hash identifier for the user.
         * @param {string} collectionName - The name of the subcollection.
         * @returns {Promise<Object[]>} An array of documents as JSON objects.
         */
        'allDocs': async (hash, collectionName) => {
            try {
                // Step 1: Query the 'users' collection to find the document with the matching 'hash' field
                const usersRef = collection(db, "users");
                const userQuery = query(usersRef, where("hash", "==", hash));
                const userSnap = await getDocs(userQuery);

                if (userSnap.empty) {
                    console.error("User not found with hash:", hash);
                    return []; // User not found, return empty array
                }

                // Step 2: Get the actual user document reference
                const userDocRef = userSnap.docs[0].ref;

                // Step 3: Reference the subcollection
                const subCollectionRef = collection(userDocRef, collectionName);

                // Step 4: Get all documents in the subcollection
                const subCollectionSnap = await getDocs(subCollectionRef);

                // Step 5: Map the documents to JSON objects
                return subCollectionSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            } catch (error) {
                console.error("Error retrieving all documents:", error);
                return []; // Return empty array on error
            }
        },

        /**
         * Creates a new document in a subcollection with specified fields.
         * @param {string} hash - The unique hash identifier for the user.
         * @param {string} collectionName - The name of the subcollection.
         * @param {string} name - The name of the new document.
         * @param {Object} fields - A JSON object mapping field names to field values.
         * @returns {Promise<boolean>} True if the document was successfully created, false otherwise.
         */
        'newDoc': async (hash, collectionName, name, fields) => {
            try {
            // Step 1: Query the 'users' collection to find the document with the matching 'hash' field
            const usersRef = collection(db, "users");
            const userQuery = query(usersRef, where("hash", "==", hash));
            const userSnap = await getDocs(userQuery);

            if (userSnap.empty) {
                console.error("User not found with hash:", hash);
                return false; // User not found
            }

            // Step 2: Get the actual user document reference
            const userDocRef = userSnap.docs[0].ref;

            // Step 3: Reference the subcollection and create a new document
            const subCollectionRef = collection(userDocRef, collectionName);
            const documentRef = doc(subCollectionRef, name);

            // Step 4: Set the document with the provided fields
            await setDoc(documentRef, fields);

            return true; // Successfully created
            } catch (error) {
            console.error("Error creating new document:", error);
            return false; // Error occurred
            }
        },

        /**
         * Deletes a document from a subcollection.
         * @param {string} hash - The unique hash identifier for the user.
         * @param {string} collectionName - The name of the subcollection.
         * @param {string} name - The name of the document to delete.
         * @returns {Promise<boolean>} True if the document was successfully deleted, false otherwise.
         */
        'deleteDoc': async (hash, collectionName, name) => {
            try {
                // Step 1: Query the 'users' collection to find the document with the matching 'hash' field
                const usersRef = collection(db, "users");
                const userQuery = query(usersRef, where("hash", "==", hash));
                const userSnap = await getDocs(userQuery);

                if (userSnap.empty) {
                    console.error("User not found with hash:", hash);
                    return false; // User not found
                }

                // Step 2: Get the actual user document reference
                const userDocRef = userSnap.docs[0].ref;

                // Step 3: Reference the subcollection and document
                const subCollectionRef = collection(userDocRef, collectionName);
                const documentRef = doc(subCollectionRef, name);

                // Step 4: Delete the document
                await deleteDoc(documentRef);

                return true; // Successfully deleted
            } catch (error) {
                console.error("Error deleting document:", error);
                return false; // Error occurred
            }
        }
    },

    /**
     * Runs a custom Firestore query.
     * @param {Query} query - The Firestore query to execute.
     * @returns {Promise<QuerySnapshot>} The query results.
     */
    'runQ': (query) => {
        return getDocs(query);
    }
};

let version = "BETA 1.2 FIRE";
let versionNOTES = "We've migrated to a new database and fixed a few bugs. This will be the last version update before Finance Forward GAMMA";

// Export the DB functions for use in the global scope
window.DB = DB;
window.version = version;
window.versionNOTES = versionNOTES;
export { DB, version, versionNOTES };