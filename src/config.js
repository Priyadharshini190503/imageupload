import { initializeApp } from "firebase/app";
import {getFirestore} from 'firebase/firestore'
import { getStorage } from "firebase/storage";
const firebaseConfig = {
  apiKey: "AIzaSyC5aKQ6u4-xhw8V-z7q6w_Dfiwjk0p65GU",
  authDomain: "imageupload-43e23.firebaseapp.com",
  databaseURL: "https://imageupload-43e23-default-rtdb.firebaseio.com",
  projectId: "imageupload-43e23",
  storageBucket: "imageupload-43e23.firebasestorage.app",
  messagingSenderId: "523139513390",
  appId: "1:523139513390:web:4287ed92a30b75936373bf",
  measurementId: "G-E6XNL6VTYY"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database=getFirestore(app);
const storage = getStorage(app); // Initialize Firebase Storage

// Export both database and storage
export { database, storage };
