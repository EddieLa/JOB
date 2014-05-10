BarcodeReader
=============

A simple Barcodereader for Code128, Code93, Code39 and EAN-13 barcodes in javascript.
Supports multiple barcodes in one image and detects what type of barcodes there are.

It seems that when taking a picture with a smartphone, decreasing the resolution increases the chance
for a successful decoding.

Stopped working on comments for the moment.
instead i'm working on developing more settings to customise the decoding process, general performance and including more barcode formats.

I've added two options for when you post a message to the decode worker, priority and skip.

Priority simply is the order in which the worker checks for a matching barcode and works as follows:

Default order is ["Code128","Code93","Code39","EAN-13"].

DecodeWorker.postMessage({pixels: image-data, cmd: normal/flip/left/right, priority: ["Code39"]});

This will make the order ["Code39","Code128","Code93","EAN-13"].

Skip is which encodings to ignore, useful for speeding up decoding if you're only looking for some types and works as follows:

DecodeWorker.postMessage({pixels: image-data, cmd: normal/flip/left/right, skip: ["Code39","Code128"]});

This will make it decode only EAN-13 and Code93.

If you like and/or use this project for commercial purposes consider donating to support my work.  

<a href="https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=G5G3LGA8QRA6S"><img src="https://www.paypal.com/en_US/i/btn/btn_donateCC_LG.gif" alt="PayPal - The safer, easier way to pay online!" /></a>
