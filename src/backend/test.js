const express = require('express');
const Printer = require('node-printer');

const app = express();
app.use(express.json());

app.post('/api/print', (req, res) => {
  const content = req.body.content;

  const printers = Printer.getPrinters();
  if (printers.length === 0) {
    return res.status(500).json({ error: 'No printers found' });
  }

  const printer = printers[0]; // Select the first printer

  Printer.printDirect({
    data: content,
    printer: printer.name, // Use the printer's name
    type: 'RAW',
    success: function(jobID) {
      console.log(`Print job sent with ID: ${jobID}`);
      res.json({ message: 'Print job sent', jobID });
    },
    error: function(err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to print' });
    },
  });
});

app.listen(4000, () => {
  console.log('Server running on port 4000');
});
