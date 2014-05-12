BarcodeReader
=============

A Barcodereader for Code128, Code93, Code39, Standard/Industrial 2 of 5,
Interleaved 2 of 5 and EAN-13 barcodes in javascript.
Supports multiple barcodes in one image and detects what type of barcodes there are.

It seems that when taking a picture with a smartphone, decreasing the resolution increases the chance
for a successful decoding.

***
If you like and/or use this project for commercial purposes consider donating to support my work.  
<a href="https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=G5G3LGA8QRA6S"><img src="https://www.paypal.com/en_US/i/btn/btn_donateCC_LG.gif" alt="PayPal - The safer, easier way to pay online!" /></a>
***

Stopped working on comments for the moment.
instead i'm working on developing more settings to customise the decoding process, general performance and including more barcode formats.

Version 1.5 is up with some changes to the available setting, two new supported formats, better performance for Ean13 in many cases.

The new default way of posting a message to the worker is as follows:

DecodeWorker.postMessage({ImageData: data, Width: c.width, Height: c.height, cmd: "normal"});

The optional commands are:

Secure2Of5: Set to true by default, setting this to false will result in a much higher risk for false positives but might be good some isolated cases.

Ean13Speed: Set to true by default, setting this to false will make Ean13 decoding slower but a little safer from faulty readings.

LowLight: Set to false by default, setting this true makes the worker use a different function for contrast/binary as suggested by drbsoftware this might be better for low light pictures.

DecodeNr: Set to positive infinity by default, this is the maximum number of barcodes to decode. If the number of barcodes
in the image is known, setting this to that number will increase perfomance in many cases.

Decode: Set to ["Code128","Code93","Code39","EAN-13", "2Of5", "Inter2Of5"] by default, setting this to ["EAN-13"] will make the worker only decode Ean-13, this will increase performance in many cases. Very useful if you know what types of barcodes you're looking for.

Here is a couple of examples of optional settings:

To only decode Code93, Code39 and Ean13:
DecodeWorker.postMessage({ImageData: data, Width: c.width, Height: c.height, cmd: "normal", Decode: ["Code93","Code39","EAN-13"]});

To set the number of barcodes in image to 2 and use low light function:
DecodeWorker.postMessage({ImageData: data, Width: c.width, Height: c.height, cmd: "normal": DecodeNr: 2, LowLight: true});
