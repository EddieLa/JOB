BarcodeReader
=============

A simple Barcodereader for Code128, Code93, Code39 and EAN-13 barcodes in javascript.
Supports multiple barcodes in one image and detects what type of barcodes there are.

It seems that when taking a picture with a smartphone, decreasing the resolution increases the chance
for a successful decoding.

I'm currently working on comments for the code, just in case someone actually tries to understand
my scribbles.

I've added two options for when you post a message to the decode worker, priority and skip.

Priority simply is the order in which the worker checks for a matching barcode and works as follows:

Default order is ["Code128","Code93","Code39","EAN-13"].

DecodeWorker.postMessage({pixels: image-data, cmd: normal/flip/left/right, priority: ["Code39"]});

This will make the order ["Code39","Code128","Code93","EAN-13"].

Skip is which encodings to ignore, useful for speeding up decoding if you're only looking for some types and works as follows:

DecodeWorker.postMessage({pixels: image-data, cmd: normal/flip/left/right, skip: ["Code39","Code128"]});

This will make it decode only EAN-13 and Code93.

<form action="https://www.paypal.com/cgi-bin/webscr" method="post" target="_top">
<input type="hidden" name="cmd" value="_s-xclick">
<input type="hidden" name="hosted_button_id" value="G5G3LGA8QRA6S">
<input type="image" src="https://www.paypalobjects.com/sv_SE/SE/i/btn/btn_donateCC_LG.gif" border="0" name="submit" alt="PayPal – ett tryggt och smidigt sätt att betala på nätet!">
<img alt="" border="0" src="https://www.paypalobjects.com/sv_SE/i/scr/pixel.gif" width="1" height="1">
</form>

