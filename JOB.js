/**
 * CallBacks:
 * __________________________________________________________________________________
 * All the callback function should have one parameter like JOB:
 * function(result){};
 * And the result parameter will contain an array of objects that look like JOB.
 * result = [{Format: the barcode type, Value: the value of the barcode}];
 * __________________________________________________________________________________
 * 
 * You can use either the set functions or just access the properties directly to set callback or 
 * other properties. Just always remember to call Init() before starting to decode something never mess
 * around with the SupportedFormats property.
 * 
 */
JOB = {
	Config : {
		// Set to false if the decoder should look for one barcode and then stop. Increases performance.
		Multiple : true,
		
		// The formats that the decoder will look for.
		DecodeFormats : ["Code128","Code93","Code39","EAN-13", "2Of5", "Inter2Of5", "Codabar"],
		
		// ForceUnique just must makes sure that the callback function isn't repeatedly called
		// with the same barcode. Especially in the case of a video stream.
		ForceUnique: true
	},
	SupportedFormats : ["Code128","Code93","Code39","EAN-13", "2Of5", "Inter2Of5", "Codabar"],// Don't touch.
	SearchCanvas : null, // Don't the canvas either.
	SearchContext : null,
	ScanCanvas : null,
	ScanContext : null,
	ImageCallback : null, // Callback for the decoding of an image.
	StreamCallback : null, // Callback for the decoding of a video.
	Stream : null, // The actual video.
	DecodeStreamActive : false, // Will be set to false when StopStreamDecode() is called.
	Decoded : [], // Used to enfore the ForceUnique property.
	DecoderWorker : new Worker("DecoderWorker.js"),
	
	// Always call the Init().
	Init : function() {
		JOB.SearchCanvas = document.createElement("canvas");
		JOB.SearchCanvas.width = 320;
		JOB.SearchCanvas.height = 240;
		JOB.SearchContext = JOB.SearchCanvas.getContext("2d");
		JOB.ScanCanvas = document.createElement("canvas");
		JOB.ScanCanvas.width = 640;
		JOB.ScanCanvas.height = 480;
		JOB.ScanContext = JOB.ScanCanvas.getContext("2d");
	},
	
	// Sets the callback function for the image decoding.
	SetImageCallback : function(callBack) {
		JOB.ImageCallback = callBack;
	},
	
	// Sets the callback function for the video decoding.
	SetStreamCallback : function(callBack) {
		JOB.StreamCallback = callBack;
	},
	
	// Switches for changing the Multiple property.
	DecodeSingleBarcode : function() {
		JOB.Config.Multiple = false;
	},
	DecodeMultiple : function() {
		JOB.Config.Multiple = true;
	},
	
	// Sets the formats to decode, formats should be an array of a subset of the supported formats.
	SetDecodeFormats : function(formats) {
		JOB.Config.DecodeFormats = [];
		for(var i = 0; i < formats.length; i++) {
			if(JOB.SupportedFormats.indexOf(formats[i]) != -1) {
				JOB.Config.DecodeFormats.push(formats[i]);
			}
		}
		if(JOB.Config.DecodeFormats.length == 0) {
			JOB.Config.DecodeFormats = JOB.SupportedFormats.slice();
		}
	},
	
	// Removes a list of formats from the formats to decode.
	SkipFormats : function(formats) {
		for(var i = 0; i < formats.length; i++) {
			var index = JOB.Config.DecodeFormats.indexOf(formats[i]);
			if(index >= 0) {
				JOB.Config.DecodeFormats.splice(index,1);
			}
		}
	},
	
	// Adds a list of formats to the formats to decode.
	AddFormats : function(formats) {
		for(var i = 0; i < formats.length; i++) {
			if(JOB.SupportedFormats.indexOf(formats[i]) != -1) {
				if(JOB.Config.DecodeFormats.indexOf(formats[i]) == -1) {
					JOB.Config.DecodeFormats.push(formats[i]);
				}
			}
		}
	},
	
	// The callback function for image decoding used internally by JOB.
	JOBImageCallback : function(e) {
		var filteredData = [];
		for(var i = 0; i < e.data.result.length; i++) {
			if(JOB.Decoded.indexOf(e.data.result[i].Value) == -1 || JOB.Config.ForceUnique == false) {
				filteredData.push(e.data.result[i]);
				if(JOB.Config.ForceUnique) JOB.Decoded.push(e.data.result[i].Value);
			}
		}
		JOB.ImageCallback(filteredData);
		JOB.Decoded = [];
	},
	
	// The callback function for stream decoding used internally by JOB.
	JOBStreamCallback : function(e) {
		if(e.data.success && JOB.DecodeStreamActive) {
			var filteredData = [];
			for(var i = 0; i < e.data.result; i++) {
				if(JOB.Decoded.indexOf(e.data.result[i].Value) == -1 || JOB.ForceUnique == false) {
					filteredData.push(e.data.result[i]);
					if(JOB.ForceUnique) JOB.Decoded.push(e.data.result[i].Value);
				}
			}
			if(filteredData.length > 0) {
				JOB.StreamCallback(filteredData);
			}
		}
		if(JOB.DecodeStreamActive) {
			JOB.ScanContext.drawImage(JOB.Stream,0,0,JOB.ScanCanvas.width,JOB.ScanCanvas.height);
			JOB.SearchContext.drawImage(JOB.ScanCanvas,0,0,JOB.SearchCanvas.width, JOB.SearchCanvas.height);
			JOB.DecoderWorker.postMessage({
				scan : JOB.ScanContext.getImageData(0,0,JOB.ScanCanvas.width,JOB.ScanCanvas.height).data,
				scanWidth : JOB.ScanCanvas.width,
				scanHeight : JOB.ScanCanvas.height,
				search : JOB.SearchContext.getImageData(0,0,JOB.SearchCanvas.width,JOB.SearchCanvas.height).data,
				searchWidth : JOB.SearchCanvas.width,
				searchHeight : JOB.SearchCanvas.height,
				multiple : JOB.Config.Multiple,
				decodeFormats : JOB.Config.DecodeFormats,
				cmd : "normal"
			});
		
		}
		if(!JOB.DecodeStreamActive) {
			JOB.Decoded = [];
		}
	},
	
	// The image decoding function, image is of course an image.
	DecodeImage : function(image) {
		JOB.DecoderWorker.onmessage = JOB.JOBImageCallback;
		JOB.ScanContext.drawImage(image,0,0,JOB.ScanCanvas.width,JOB.ScanCanvas.height);
		JOB.SearchContext.drawImage(image,0,0,JOB.SearchCanvas.width, JOB.SearchCanvas.height);
		JOB.DecoderWorker.postMessage({
			scan : JOB.ScanContext.getImageData(0,0,JOB.ScanCanvas.width,JOB.ScanCanvas.height).data,
			scanWidth : JOB.ScanCanvas.width,
			scanHeight : JOB.ScanCanvas.height,
			search : JOB.SearchContext.getImageData(0,0,JOB.SearchCanvas.width,JOB.SearchCanvas.height).data,
			searchWidth : JOB.SearchCanvas.width,
			searchHeight : JOB.SearchCanvas.height,
			multiple : JOB.Config.Multiple,
			decodeFormats : JOB.Config.DecodeFormats,
			cmd : "normal"
		});
	},
	
	// Starts the decoding of a stream, the stream is a video not a blob i.e it's an element.
	DecodeStream : function(stream) {
		JOB.Stream = stream;
		JOB.DecodeStreamActive = true;
		JOB.DecoderWorker.onmessage = JOB.JOBStreamCallback;
		JOB.ScanContext.drawImage(JOB.Stream,0,0,JOB.ScanCanvas.width,JOB.ScanCanvas.height);
		JOB.SearchContext.drawImage(JOB.ScanCanvas,0,0,JOB.SearchCanvas.width, JOB.SearchCanvas.height);
		JOB.DecoderWorker.postMessage({
			scan : JOB.ScanContext.getImageData(0,0,JOB.ScanCanvas.width,JOB.ScanCanvas.height).data,
			scanWidth : JOB.ScanCanvas.width,
			scanHeight : JOB.ScanCanvas.height,
			search : JOB.SearchContext.getImageData(0,0,JOB.SearchCanvas.width,JOB.SearchCanvas.height).data,
			searchWidth : JOB.SearchCanvas.width,
			searchHeight : JOB.SearchCanvas.height,
			multiple : JOB.Config.Multiple,
			decodeFormats : JOB.Config.DecodeFormats,
			cmd : "normal"
		});
		
	},
	
	// Stops the decoding of a stream.
	StopStreamDecode : function() {
		JOB.DecodeStreamActive = false;
		JOB.Decoded = [];
	}
};
