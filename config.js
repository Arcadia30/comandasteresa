// Configuración de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyDzJ8Q2zQ4Q4Q4Q4Q4Q4Q4Q4Q4Q4Q4Q4Q4",
  authDomain: "comanda-21d7d.firebaseapp.com",
  databaseURL: "https://comanda-21d7d-default-rtdb.firebaseio.com",
  projectId: "comanda-21d7d",
  storageBucket: "comanda-21d7d.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdefghijklmnopqrstuv"
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();