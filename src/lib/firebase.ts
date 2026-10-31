import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: 'AIzaSyB1QbZLaB7WbYlFwYaaA9Q7sbwisbuCBhA',
  authDomain: 'safari-196fc.firebaseapp.com',
  projectId: 'safari-196fc',
  storageBucket: 'safari-196fc.firebasestorage.app',
  messagingSenderId: '826971177135',
  appId: '1:826971177135:web:e5d158aeff1d6124f3d45a',
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
