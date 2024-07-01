const express = require('express');
const puppeteer = require('puppeteer');
const app = express();
const port = 3000;

app.use(express.json());

app.post('/api/scrape', async (req, res) => {
  const { razonSocial, legajo } = req.body;
  const username = "AgusPerez";
  const password = "Perez1995";
  const url = `https://www.sanpedro.net.ar/facturas_web/libre_deuda.php?tasa=5&cuenta=${legajo}&CT_NOMBRE=${encodeURIComponent(razonSocial)}&TS_DESCRIP=SEGURIDAD%20E%20HIGIENE`;

  try {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      timeout: 0, // Aumenta el tiempo de espera a ilimitado
    });

    const page = await browser.newPage();
    await page.setDefaultNavigationTimeout(60000); // Aumentar el tiempo de espera de navegación a 60 segundos

    await page.goto(url);

    await page.waitForSelector('#username');
    await page.type('#username', username);
    await page.type('#password', password);
    await page.click('button[type="submit"]');

    await page.waitForSelector('table');

    const datosTabla =  await page.evaluate(() => {
        console.log("antes del tr")
        try {
          const filas = document.querySelectorAll('tbody > tr'); // Selector para todas las filas de la tabla
          const datos = [];
      
          filas.forEach(fila => {
            const tds = fila.querySelectorAll('td'); // Selector para todas las celdas de la fila
            if (tds.length >= 6) { // Asegurarse de que haya al menos 6 celdas por fila
              datos.push({
                periodo: tds[0].textContent.trim(),
                fecha: tds[1].textContent.trim(),
                importe1: parseFloat(tds[2].textContent.trim()),
                importe2: parseFloat(tds[3].textContent.trim()),
                importe3: parseFloat(tds[4].textContent.trim()),
                total: parseFloat(tds[5].textContent.trim()),
              });
            } else {
              console.warn('Fila de tabla incompleta:', fila.outerHTML); // Para depuración, mostrar la fila completa
            }
          });
      
          return datos;
        } catch (error) {
          console.error('Error al extraer datos de la tabla:', error);
          return []; // Retornar un array vacío o manejar el error según sea necesario
        }
      });
            
    await console.log('Datos de la tabla:', datosTabla);
    await res.json(datosTabla);

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error al realizar scraping' });
  } finally {
    await console.log("F")  
  }
});

app.listen(port, () => {
  console.log(`API de scraping con Puppeteer escuchando en http://localhost:${port}`);
});
