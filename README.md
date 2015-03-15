JOB
=============

JOB (Javascript Only BarcodeReader) is a barcodereader for Code128, Code93, Code39, Standard/Industrial 2 of 5,
Interleaved 2 of 5 and EAN-13 barcodes in javascript.
Supports multiple barcodes in one image and detects what type of barcodes there are.

It seems that the issue with smartphones might have been one of exif orientation tags so there's a fix in JOB now and also a fix for some kind of downsampling issue for ios.

***
If you like and/or use this project for commercial purposes consider donating to support my work.  
<a href="https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=G5G3LGA8QRA6S"><img src="https://www.paypal.com/en_US/i/btn/btn_donateCC_LG.gif" alt="PayPal - The safer, easier way to pay online!" /></a>
***

Version 1.6 is up with a completely reworked localization process and also added a JOB object to facilitate more ease of use. Just reference JOB.js, always execute a call to JOB.Init() in the beginning and then for decoding of images set callback function using JOB.SetImageCallback(callback) and then call JOB.DecodeImage(img). Also added functionality in JOB to decode a video stream for use with getUserMedia, which was the original idea. Hopefully this localization will be a significant improvement and I will in the (hopefully) near future do a rework of the decoding algorithm to make it a bit faster and more accurate.
HEllO