(function ( $ ) {
  $.fn.barcodeReader = function(options) {
    console.log(options);

    var settings = $.extend({}, $.fn.barcodeReader.defaults, options);
    var debug = settings.debug;

    var $userVideoCanvasEl = $(settings.videoCanvasTo);
    var $userCanvasEl = $(settings.canvasTo);
    var $userInputEl = $(settings.inputTo);
    var $userResultEl = $(settings.outputTo);
    var $userImgEl = $(settings.imageTo);

    var $mainEl = $(this);
    var $videoCanvasEl = ($userVideoCanvasEl.length > 0) ? $userVideoCanvasEl : $('<canvas id="barcode-reader__video" width="320" height="240"></canvas>');
    var $canvasEl = ($userCanvasEl.length > 0) ? $userCanvasEl : $('<canvas id="barcode-reader__picture"></canvas>');
    var $inputEl = ($userInputEl.length > 0) ? $userInputEl : $('<input id="barcode-reader__picture__input" type="file" accept="image/*;capture=camera" />');
    var $resultEl = ($userResultEl.length > 0) ? $userResultEl : $('<p id="barcode-reader__result"></p>');
    var $imgEl = ($userImgEl.length > 0) ? $userImgEl : $('<img id="barcode-reader__image" />');

    var mainEl = $mainEl[0];
    var videoCanvasEl = $videoCanvasEl[0];
    var canvasEl = $canvasEl[0];
    var inputEl = $inputEl[0];
    var resultEl = $resultEl[0];
    var imgEl = $imgEl[0];

    var localized = [];
    var isStreaming = false;

    var ctx = videoCanvasEl.getContext("2d");

    var video = document.createElement("video");

    var localStream;

    // set video dimensions
    video.width = 640;
    video.height = 360;

    if(!settings.video){
      ctx = canvasEl.getContext("2d");
    }

    BarcodeReader.Init();

    navigator.getUserMedia = checkVideoCapability();

    BarcodeReader.SwitchLocalizationFeedback(true);

    if(settings.video){
      BarcodeReader.SetLocalizationCallback(function(result) {
        localized = result;
      });

      BarcodeReader.StreamCallback = function(result) {
        if (result.length > 0) {
          var tempArray = [];
          for (var i = 0; i < result.length; i++) {
            tempArray.push(result[i].Format + " : " + result[i].Value);
          }
          $resultEl.append(tempArray.join("<br />"));

          BarcodeReader.StopStreamDecode();

          $(document).trigger("barcodeReader:decoded", [ result[0] ]);
        }
      };

      // create the dom elements needed
      $mainEl.append([ $videoCanvasEl, $resultEl ]);
    }
    else{
      BarcodeReader.SetImageCallback(function(result) {
        var tempArray = [];
        var i;

        if (result.length > 0) {
          result.forEach(function(resultItem, index){
            tempArray.push(resultItem.Format + " : " + resultItem.Value);
          });
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
    }

    this.startVideo = function startVideo(){
      localized = []; // reset the array

      if (navigator.getUserMedia) {
        navigator.getUserMedia({
            "video": true,
            "audio": false
          },
          function(localMediaStream) {
            video.src = window.URL.createObjectURL(localMediaStream);
            video.play();
            ctx.translate($videoCanvasEl.outerWidth(), 0);
            ctx.scale(-1, 1);
            draw();
            isStreaming = true;
            localStream = localMediaStream;

            // start the streaming
            BarcodeReader.DecodeStream(video);
          },
          function(err) {
            if(debug){
              console.log("The following error occured: " + err);
            }
          }
        );
      } else {
        if(debug){
          console.log("getUserMedia not supported");
        }
      }
    };

    this.stopVideo = function stopVideo(){
      BarcodeReader.StopStreamDecode();

      localStream.stop();
      isStreaming = false;
    };

    // drawing function for video capture
    function draw() {
      try {
        ctx.drawImage(video, 0, 0, videoCanvasEl.width, videoCanvasEl.height);
        if (localized.length > 0) {
          ctx.beginPath();
          ctx.lineWIdth = "2";
          ctx.strokeStyle = "red";
          for (var i = 0; i < localized.length; i++) {
            ctx.rect(localized[i].x, localized[i].y, localized[i].width, localized[i].height);
          }
          ctx.stroke();
        }
        setTimeout(draw, 20);
      } catch (e) {
        if (e.name == "NS_ERROR_NOT_AVAILABLE") {
          setTimeout(draw, 20);
        } else {
          throw e;
        }
      }
    }

    return this;
  };

  function checkVideoCapability(){
    return navigator.getUserMedia ||
      navigator.webkitGetUserMedia ||
      navigator.mozGetUserMedia ||
      navigator.msGetUserMedia;
  }
}( jQuery ));

$.fn.barcodeReader.defaults = {
  'debug': false,
  'video': true,
  'videoCanvasTo': '',
  'canvasTo': '',
  'outputTo': '',
  'imageTo': '',
  'inputFrom': ''
};
