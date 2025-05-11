const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const COMANDA_FILE = 'comandas.txt';

// Guardar comanda
app.post('/save-comanda', (req, res) => {
  const comandaData = req.body;
  
  fs.readFile(COMANDA_FILE, 'utf8', (err, data) => {
    let comandas = [];
    if (!err && data) {
      comandas = JSON.parse(data);
    }
    
    comandas.push(comandaData);
    
    fs.writeFile(COMANDA_FILE, JSON.stringify(comandas), (err) => {
      if (err) return res.status(500).send('Error al guardar');
      res.send('Comanda guardada');
    });
  });
});

// Obtener comandas
app.get('/get-comandas', (req, res) => {
  fs.readFile(COMANDA_FILE, 'utf8', (err, data) => {
    if (err) return res.status(500).send('Error al leer comandas');
    res.json(data ? JSON.parse(data) : []);
  });
});

// Eliminar comanda
app.post('/delete-comanda', (req, res) => {
  const comandaId = req.body.id;
  
  fs.readFile(COMANDA_FILE, 'utf8', (err, data) => {
    if (err) return res.status(500).send('Error al leer comandas');
    
    let comandas = data ? JSON.parse(data) : [];
    comandas = comandas.filter(c => c.id !== comandaId);
    
    fs.writeFile(COMANDA_FILE, JSON.stringify(comandas), (err) => {
      if (err) return res.status(500).send('Error al guardar');
      res.send('Comanda eliminada');
    });
  });
});

app.listen(3000, () => {
  console.log('Servidor corriendo en http://localhost:127.0.0.1:5500/');
});