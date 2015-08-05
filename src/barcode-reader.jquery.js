(function ( $ ) {
    $.fn.barcodeReader = function(options) {
      var settings = $.extend({}, $.fn.barcodeReader.defaults, options);

      var $mainEl = $(this);
      var $canvasEl = $('<canvas id="barcode-reader__picture"></canvas>');
      var $inputEl = $('<input id="barcode-reader__picture__input" type="file" accept="image/*;capture=camera" />');
      var $resultEl = $('<p id="barcode-reader__result"></p>');
      var $imgEl = $('<img id="barcode-reader__image" />');

      var mainEl = $mainEl[0];
      var canvasEl = $canvasEl[0];
      var inputEl = $inputEl[0];
      var resultEl = $resultEl[0];
      var imgEl = $imgEl[0];

      var ctx = canvasEl.getContext("2d");

      BarcodeReader.Init();

      BarcodeReader.SetImageCallback(function(result) {
        var tempArray = [];
        var i;

        if (result.length > 0) {
          for (i = 0; i < result.length; i++) {
            tempArray.push(result[i].Format + " : " + result[i].Value);
          }
          $resultEl.append(tempArray.join("<br />"));
        } else {
          if (result.length === 0) {
            $resultEl.html("Decoding failed.");
          }
        }
      });

      BarcodeReader.PostOrientation = true;

      BarcodeReader.OrientationCallback = function(result) {
        var data;

        $canvasEl.css('width', result.width);
        $canvasEl.css('height', result.height);

        data = ctx.getImageData(0, 0, result.width, result.height);

        for (var i = 0; i < data.data.length; i++) {
          data.data[i] = result.data[i];
        }

        ctx.putImageData(data, 0, 0);
      };

      BarcodeReader.SwitchLocalizationFeedback(true);

      BarcodeReader.SetLocalizationCallback(function(result) {
        ctx.beginPath();
        ctx.lineWIdth = "2";
        ctx.strokeStyle = "red";

        for (var i = 0; i < result.length; i++) {
          ctx.rect(result[i].x, result[i].y, result[i].width, result[i].height);
        }
        ctx.stroke();
      });

      if ($inputEl.length !== 0 && $imgEl.length !== 0) {
        $inputEl.on('change', function(event) {
          var files = event.target.files;
          if (files && files.length > 0) {
            file = files[0];
            try {
              var URL = window.URL || window.webkitURL;
              imgEl.onload = function(event) {
                $resultEl.html('');
                BarcodeReader.DecodeImage(imgEl);
                URL.revokeObjectURL(imgEl.src);
              };
              imgEl.src = URL.createObjectURL(file);
            } catch (e) {
              try {
                var fileReader = new FileReader();
                fileReader.onload = function(event) {
                  imgEl.onload = function(event) {
                    $resultEl.html('');
                    console.log("filereader");
                    BarcodeReader.DecodeImage(imgEl);
                  };
                  imgEl.src = event.target.result;
                };
                fileReader.readAsDataURL(file);
              } catch (e) {
                $resultEl.html("Neither createObjectURL or FileReader are supported");
              }
            }
          }
        });
      }

      // create the dom elements needed
      $mainEl.append([ $canvasEl, $inputEl, $resultEl ]);

      return this;
    };

    $.fn.barcodeReader.defaults = {};
}( jQuery ));
