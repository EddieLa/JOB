/**
 * CallBacks:
 * __________________________________________________________________________________
 * All the callback function should have one parameter:
 * function(result){};
 * And the result parameter will contain an array of objects that look like BarcodeReader.
 * result = [{Format: the barcode type, Value: the value of the barcode}];
 * __________________________________________________________________________________
 *
 * You can use either the set functions or just access the properties directly to set callback or
 * other properties. Just always remember to call Init() before starting to decode something never mess
 * around with the SupportedFormats property.
 *
 */

var EXIF = require('./exif');
var decoderWorkerBlobString = require('./DecoderWorker');

var BarcodeReader = {
  Config: {
    // Set to false if the decoder should look for one barcode and then stop. Increases performance.
    Multiple: true,

    // The formats that the decoder will look for.
    DecodeFormats: ["Code128", "Code93", "Code39", "EAN-13", "2Of5", "Inter2Of5", "Codabar"],

    // ForceUnique just must makes sure that the callback function isn't repeatedly called
    // with the same barcode. Especially in the case of a video stream.
    ForceUnique: true,

    // Set to true if information about the localization should be recieved from the worker.
    LocalizationFeedback: false,

    // Set to true if checking orientation of the image should be skipped.
    // Checking orientation takes a bit of time for larger images, so if
    // you are sure that the image orientation is 1 you should skip it.
    SkipOrientation: false
  },
  SupportedFormats: ["Code128", "Code93", "Code39", "EAN-13", "2Of5", "Inter2Of5", "Codabar"], // Don't touch.
  ScanCanvas: null, // Don't touch the canvas either.
  ScanContext: null,
  SquashCanvas: document.createElement("canvas"),
  ImageCallback: null, // Callback for the decoding of an image.
  StreamCallback: null, // Callback for the decoding of a video.
  LocalizationCallback: null, // Callback for localization.
  ImageErrorCallback: null, // Callback for error on image loading.
  Stream: null, // The actual video.
  DecodeStreamActive: false, // Will be set to false when StopStreamDecode() is called.
  Decoded: [], // Used to enfore the ForceUnique property.
  DecoderWorker: new Worker( URL.createObjectURL(new Blob([decoderWorkerBlobString], {type: "application/javascript"}) ) ),
  OrientationCallback: null,
  // Always call the Init().
  Init: function() {
    BarcodeReader.ScanCanvas = BarcodeReader.FixCanvas(document.createElement("canvas"));
    BarcodeReader.ScanCanvas.width = 640;
    BarcodeReader.ScanCanvas.height = 480;
    BarcodeReader.ScanContext = BarcodeReader.ScanCanvas.getContext("2d");
  },

  // Value should be true or false.
  SetRotationSkip: function(value) {
    BarcodeReader.Config.SkipOrientation = value;
  },
  // Sets the callback function for the image decoding.
  SetImageCallback: function(callBack) {
    BarcodeReader.ImageCallback = callBack;
  },

  // Sets the callback function for the video decoding.
  SetStreamCallback: function(callBack) {
    BarcodeReader.StreamCallback = callBack;
  },

  // Sets callback for localization, the callback function should take one argument.
  // This will be an array with objects with format.
  // {x, y, width, height}
  // This represents a localization rectangle.
  // The rectangle comes from a 320, 240 area i.e the search canvas.
  SetLocalizationCallback: function(callBack) {
    BarcodeReader.LocalizationCallback = callBack;
    BarcodeReader.Config.LocalizationFeedback = true;
  },

  // Sets the callback function when loading a wrong image.
  SetImageErrorCallback: function(callBack) {
    BarcodeReader.ImageErrorCallback = callBack;
  },

  // Set to true if LocalizationCallback is set and you would like to
  // receive the feedback or false if
  SwitchLocalizationFeedback: function(bool) {
    BarcodeReader.Config.LocalizationFeedback = bool;
  },

  // Switches for changing the Multiple property.
  DecodeSingleBarcode: function() {
    BarcodeReader.Config.Multiple = false;
  },
  DecodeMultiple: function() {
    BarcodeReader.Config.Multiple = true;
  },

  // Sets the formats to decode, formats should be an array of a subset of the supported formats.
  SetDecodeFormats: function(formats) {
    BarcodeReader.Config.DecodeFormats = [];
    for (var i = 0; i < formats.length; i++) {
      if (BarcodeReader.SupportedFormats.indexOf(formats[i]) !== -1) {
        BarcodeReader.Config.DecodeFormats.push(formats[i]);
      }
    }
    if (BarcodeReader.Config.DecodeFormats.length === 0) {
      BarcodeReader.Config.DecodeFormats = BarcodeReader.SupportedFormats.slice();
    }
  },

  // Removes a list of formats from the formats to decode.
  SkipFormats: function(formats) {
    for (var i = 0; i < formats.length; i++) {
      var index = BarcodeReader.Config.DecodeFormats.indexOf(formats[i]);
      if (index >= 0) {
        BarcodeReader.Config.DecodeFormats.splice(index, 1);
      }
    }
  },

  // Adds a list of formats to the formats to decode.
  AddFormats: function(formats) {
    for (var i = 0; i < formats.length; i++) {
      if (BarcodeReader.SupportedFormats.indexOf(formats[i]) !== -1) {
        if (BarcodeReader.Config.DecodeFormats.indexOf(formats[i]) === -1) {
          BarcodeReader.Config.DecodeFormats.push(formats[i]);
        }
      }
    }
  },

  // The callback function for image decoding used internally by BarcodeReader.
  BarcodeReaderImageCallback: function(e) {
    if (e.data.success === "localization") {
      if (BarcodeReader.Config.LocalizationFeedback) {
        BarcodeReader.LocalizationCallback(e.data.result);
      }
      return;
    }
    if (e.data.success === "orientationData") {
      BarcodeReader.OrientationCallback(e.data.result);
      return;
    }
    var filteredData = [];
    for (var i = 0; i < e.data.result.length; i++) {
      if (BarcodeReader.Decoded.indexOf(e.data.result[i].Value) === -1 || BarcodeReader.Config.ForceUnique === false) {
        filteredData.push(e.data.result[i]);
        if (BarcodeReader.Config.ForceUnique) BarcodeReader.Decoded.push(e.data.result[i].Value);
      }
    }
    BarcodeReader.ImageCallback(filteredData);
    BarcodeReader.Decoded = [];
  },

  // The callback function for stream decoding used internally by BarcodeReader.
  BarcodeReaderStreamCallback: function(e) {
    if (e.data.success === "localization") {
      if (BarcodeReader.Config.LocalizationFeedback) {
        BarcodeReader.LocalizationCallback(e.data.result);
      }
      return;
    }
    if (e.data.success && BarcodeReader.DecodeStreamActive) {
      var filteredData = [];
      for (var i = 0; i < e.data.result.length; i++) {
        if (BarcodeReader.Decoded.indexOf(e.data.result[i].Value) === -1 || BarcodeReader.ForceUnique === false) {
          filteredData.push(e.data.result[i]);
          if (BarcodeReader.ForceUnique) BarcodeReader.Decoded.push(e.data.result[i].Value);
        }
      }
      if (filteredData.length > 0) {
        BarcodeReader.StreamCallback(filteredData);
      }
    }
    if (BarcodeReader.DecodeStreamActive) {
      BarcodeReader.ScanContext.drawImage(BarcodeReader.Stream, 0, 0, BarcodeReader.ScanCanvas.width, BarcodeReader.ScanCanvas.height);
      BarcodeReader.DecoderWorker.postMessage({
        scan: BarcodeReader.ScanContext.getImageData(0, 0, BarcodeReader.ScanCanvas.width, BarcodeReader.ScanCanvas.height).data,
        scanWidth: BarcodeReader.ScanCanvas.width,
        scanHeight: BarcodeReader.ScanCanvas.height,
        multiple: BarcodeReader.Config.Multiple,
        decodeFormats: BarcodeReader.Config.DecodeFormats,
        cmd: "normal",
        rotation: 1
      });

    }
    if (!BarcodeReader.DecodeStreamActive) {
      BarcodeReader.Decoded = [];
    }
  },

  // The image decoding function, image is a data source for an image or an image element.
  DecodeImage: function(image) {
	var img = new Image();
	img.onerror = BarcodeReader.ImageErrorCallback;

    if (image instanceof Image || image instanceof HTMLImageElement) {
      image.exifdata = false;
      if (image.complete) {
        if (BarcodeReader.Config.SkipOrientation) {
          BarcodeReader.BarcodeReaderDecodeImage(image, 1, "");
        } else {
          EXIF.getData(image, function(exifImage) {
            var orientation = EXIF.getTag(exifImage, "Orientation");
            var sceneType = EXIF.getTag(exifImage, "SceneCaptureType");
            if (typeof orientation !== 'number') orientation = 1;
            BarcodeReader.BarcodeReaderDecodeImage(exifImage, orientation, sceneType);
          });
        }
      } else {
        img.onload = function() {
          if (BarcodeReader.Config.SkipOrientation) {
            BarcodeReader.BarcodeReaderDecodeImage(img, 1, "");
          } else {
            EXIF.getData(this, function(exifImage) {
              var orientation = EXIF.getTag(exifImage, "Orientation");
              var sceneType = EXIF.getTag(exifImage, "SceneCaptureType");
              if (typeof orientation !== 'number') orientation = 1;
              BarcodeReader.BarcodeReaderDecodeImage(exifImage, orientation, sceneType);
            });
          }
        };
        img.src = image.src;
      }
    } else {
      img.onload = function() {
        if (BarcodeReader.Config.SkipOrientation) {
          BarcodeReader.BarcodeReaderDecodeImage(img, 1, "");
        } else {
          EXIF.getData(this, function(exifImage) {
            var orientation = EXIF.getTag(exifImage, "Orientation");
            var sceneType = EXIF.getTag(exifImage, "SceneCaptureType");
            if (typeof orientation !== 'number') orientation = 1;
            BarcodeReader.BarcodeReaderDecodeImage(exifImage, orientation, sceneType);
          });
        }
      };
      img.src = image;
    }
  },

  // Starts the decoding of a stream, the stream is a video not a blob i.e it's an element.
  DecodeStream: function(stream) {
    BarcodeReader.Stream = stream;
    BarcodeReader.DecodeStreamActive = true;
    BarcodeReader.DecoderWorker.onmessage = BarcodeReader.BarcodeReaderStreamCallback;
    BarcodeReader.ScanContext.drawImage(stream, 0, 0, BarcodeReader.ScanCanvas.width, BarcodeReader.ScanCanvas.height);
    BarcodeReader.DecoderWorker.postMessage({
      scan: BarcodeReader.ScanContext.getImageData(0, 0, BarcodeReader.ScanCanvas.width, BarcodeReader.ScanCanvas.height).data,
      scanWidth: BarcodeReader.ScanCanvas.width,
      scanHeight: BarcodeReader.ScanCanvas.height,
      multiple: BarcodeReader.Config.Multiple,
      decodeFormats: BarcodeReader.Config.DecodeFormats,
      cmd: "normal",
      rotation: 1
    });
  },

  // Stops the decoding of a stream.
  StopStreamDecode: function() {
    BarcodeReader.DecodeStreamActive = false;
    BarcodeReader.Decoded = [];
  },

  BarcodeReaderDecodeImage: function(image, orientation, sceneCaptureType) {
    if (orientation === 8 || orientation === 6) {
      if (sceneCaptureType === "Landscape" && image.width > image.height) {
        orientation = 1;
        BarcodeReader.ScanCanvas.width = 640;
        BarcodeReader.ScanCanvas.height = 480;
      } else {
        BarcodeReader.ScanCanvas.width = 480;
        BarcodeReader.ScanCanvas.height = 640;
      }
    } else {
      BarcodeReader.ScanCanvas.width = 640;
      BarcodeReader.ScanCanvas.height = 480;
    }
    BarcodeReader.DecoderWorker.onmessage = BarcodeReader.BarcodeReaderImageCallback;
    BarcodeReader.ScanContext.drawImage(image, 0, 0, BarcodeReader.ScanCanvas.width, BarcodeReader.ScanCanvas.height);
    BarcodeReader.Orientation = orientation;
    BarcodeReader.DecoderWorker.postMessage({
      scan: BarcodeReader.ScanContext.getImageData(0, 0, BarcodeReader.ScanCanvas.width, BarcodeReader.ScanCanvas.height).data,
      scanWidth: BarcodeReader.ScanCanvas.width,
      scanHeight: BarcodeReader.ScanCanvas.height,
      multiple: BarcodeReader.Config.Multiple,
      decodeFormats: BarcodeReader.Config.DecodeFormats,
      cmd: "normal",
      rotation: orientation,
      postOrientation: BarcodeReader.PostOrientation
    });
  },

  DetectVerticalSquash: function(img) {
    var ih = img.naturalHeight;
    var canvas = BarcodeReader.SquashCanvas;
    var alpha;
    var data;
    canvas.width = 1;
    canvas.height = ih;
    var ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);
    try {
      data = ctx.getImageData(0, 0, 1, ih).data;
    } catch (err) {
      console.log("Cannot check verticalSquash: CORS?");
      return 1;
    }
    var sy = 0;
    var ey = ih;
    var py = ih;
    while (py > sy) {
      alpha = data[(py - 1) * 4 + 3];
      if (alpha === 0) {
        ey = py;
      } else {
        sy = py;
      }
      py = (ey + sy) >> 1;
    }
    var ratio = (py / ih);
    return (ratio === 0) ? 1 : ratio;
  },

  FixCanvas: function(canvas) {
    var ctx = canvas.getContext('2d');
    var drawImage = ctx.drawImage;
    ctx.drawImage = function(img, sx, sy, sw, sh, dx, dy, dw, dh) {
      var vertSquashRatio = 1;
      if (!!img && img.nodeName === 'IMG') {
        vertSquashRatio = BarcodeReader.DetectVerticalSquash(img);
        // sw || (sw = img.naturalWidth);
        // sh || (sh = img.naturalHeight);
      }
      if (arguments.length === 9)
        drawImage.call(ctx, img, sx, sy, sw, sh, dx, dy, dw, dh / vertSquashRatio);
      else if (typeof sw !== 'undefined')
        drawImage.call(ctx, img, sx, sy, sw, sh / vertSquashRatio);
      else
        drawImage.call(ctx, img, sx, sy);
    };
    return canvas;
  }
};


if (typeof exports !== 'undefined') {
  if (typeof module !== 'undefined' && module.exports) {
      exports = module.exports = BarcodeReader;
  }
  exports.BarcodeReader = BarcodeReader;
} else {
  root.BarcodeReader = BarcodeReader;
}
