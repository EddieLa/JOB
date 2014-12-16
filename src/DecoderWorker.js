/* --------------------------------------------------
Javascript Only Barcode_Reader (JOB) V1.6 by Eddie Larsson <https://github.com/EddieLa/BarcodeReader>

This software is provided under the MIT license, http://opensource.org/licenses/MIT.
All use of this software must include this
text, including the reference to the creator of the original source code. The
originator accepts no responsibility of any kind pertaining to
use of this software.

Copyright (c) 2013 Eddie Larsson

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.

------------------------ */

function Rotate(data,width,height,rotation) {
	var newData = [];
	switch(rotation) {
		case 90:
			for(var x = 0; x < width*4; x+=4) {
				for(var y = width*4*(height-1); y >= 0; y -= width*4) {
					newData.push(data[x+y]);
					newData.push(data[x+y+1]);
					newData.push(data[x+y+2]);
					newData.push(data[x+y+3]);
				}
			}
			break;
		case -90:
			for(var x = width*4-4; x >= 0; x-=4) {
				for(var y = 0; y < data.length; y += width*4) {
					newData.push(data[x+y]);
					newData.push(data[x+y+1]);
					newData.push(data[x+y+2]);
					newData.push(data[x+y+3]);
				}
			}
			break;
		case 180:
			for(var y = width*4*(height-1); y >= 0; y-=width*4) {
				for(var x = width*4 - 4; x >= 0; x -= 4) {
					newData.push(data[x+y]);
					newData.push(data[x+y+1]);
					newData.push(data[x+y+2]);
					newData.push(data[x+y+3]);
				}
			}
	}
	return new Uint8ClampedArray(newData);
}

function BoxFilter(data, width, radius) {
	var elements = [];
	var sum = [];
	for(var x = 0; x < width; x++) {
		elements.push([]);
		sum.push(0);
		for(var y = 0; y < (radius+1)*width; y+=width) {
			elements[elements.length-1].push(data[x+y]);
			sum[sum.length-1] = sum[sum.length-1] + data[x+y];
		}
	}
	var newData = [];
	for(var y = 0; y < data.length; y += width) {
		for(var x = 0; x < width; x++) {
			var newVal = 0;
			var length = 0;
			for(var i = x; i >= 0; i--) {
				newVal += sum[i];
				length++;
				if(length == radius+1) break;
			}
			var tempLength = 0;
			for(var i = x+1; i < width; i++) {
				newVal += sum[i];
				length++;
				tempLength++;
				if(tempLength == radius) break;
			}
			length *= elements[0].length;
			newVal /= length;
			newData.push(newVal);
		}
		if(y - radius*width >= 0) {
			for(var i = 0; i < elements.length; i++) {
				var val = elements[i].shift();
				sum[i] = sum[i] - val;
			}
		}
		if(y + (radius+1)*width < data.length) {
			for(var i = 0; i < elements.length; i++) {
				var val = data[i+y + (radius+1)*width];
				elements[i].push(val);
				sum[i] = sum[i] + val;
			}
		}
	}
	return newData;
}

function Scale(data,width,height) {
	var newData = [];
	for(var y = 0; y < data.length; y+=width*8) {
		for(var x = 0; x < width*4; x += 8) {
			var r = (data[y+x] + data[y+x+4] + data[y+width*4+x] + data[y+width*4+x+4])/4;
			newData.push(r);
			var g = (data[y+x+1] + data[y+x+4+1] + data[y+width*4+x+1] + data[y+width*4+x+4+1])/4;
			newData.push(g);
			var b = (data[y+x+2] + data[y+x+4+2] + data[y+width*4+x+2] + data[y+width*4+x+4+2])/4;
			newData.push(b);
			newData.push(255);
		}
	}
	return new Uint8ClampedArray(newData);
}

function IntensityGradient(data, width) {
	var newData = [];
	var max = Number.MIN_VALUE;
	var min = Number.MAX_VALUE;
	for(var y = 0; y < data.length; y += width*4) {
		for(var x = 0; x < width*4; x+=4){
			var horizontalDiff = 0;
			var verticalDiff = 0;
			for(var i = 1; i < 2; i++) {
				if(x+ i*4 < width*4) {
					horizontalDiff = horizontalDiff + Math.abs(data[y+x]-data[y+x+i*4]);
				}
				if(y + width*4*i < data.length) {
					verticalDiff += verticalDiff + Math.abs(data[y+x]-data[y+x+width*4*i]);
				}
			}
			var diff = horizontalDiff - verticalDiff;
			max = diff > max ? diff : max;
			min = diff < min ? diff : min;
			newData.push(diff);
		}
	}
	if(min < 0) {
		for(var i = 0; i < newData.length; i++) {
			newData[i] = newData[i] - min;
		}
		min = 0;
	}
	return newData;
}

function greyScale(data) {
	for(var i = 0; i < data.length; i+=4) {
		var max = 0;
		var min = 255;
		max = data[i] > max ? data[i] : max;
		max = data[i+1] > max ? data[i+1] : max;
		max = data[i+2] > max ? data[i+2] : max;
		min = data[i] < min ? data[i] : min;
		min = data[i+1] < min ? data[i+1] : min;
		min = data[i+2] < min ? data[i+2] : min;
		data[i] = data[i+1] = data[i+2] = (max+min)/2;
	}
}

function histogram(data) {
	var hist = [];
	for(var i = 0; i < 256; i++) {
		hist[i] = 0;
	}
	for(var i = 0; i < data.length; i+=4) {
		hist[data[i]] = hist[data[i]] + 1;
	}
	return hist;
}

function otsu(histogram, total) {
    var sum = 0;
    for (var i = 1; i < histogram.length; ++i)
        sum += i * histogram[i];
    var sumB = 0;
    var wB = 0;
    var wF = 0;
    var mB;
    var mF;
    var max = 0.0;
    var between = 0.0;
    var threshold1 = 0.0;
    var threshold2 = 0.0;
    for (var i = 0; i < histogram.length; ++i) {
        wB += histogram[i];
        if (wB == 0)
            continue;
        wF = total - wB;
        if (wF == 0)
            break;
        sumB += i * histogram[i];
        mB = sumB / wB;
        mF = (sum - sumB) / wF;
        between = wB * wF * Math.pow(mB - mF, 2);
        if ( between >= max ) {
            threshold1 = i;
            if ( between > max ) {
                threshold2 = i;
            }
            max = between;            
        }
    }
    return ( threshold1 + threshold2 ) / 2.0;
}

function CreateImageData(){
	Image.data = new Uint8ClampedArray(Image.width*Image.height*4);
	var Converter;
	for(var y=0;y<Image.height;y++){
		for(var x=0;x<Image.width;x++){
			Converter = y*4*Image.width;
			Image.data[Converter+x*4] = Image.table[x][y][0];
			Image.data[Converter+x*4+1] = Image.table[x][y][1];
			Image.data[Converter+x*4+2] = Image.table[x][y][2];
			Image.data[Converter+x*4+3] = Image.table[x][y][3];
		};
	};
};

function CreateScanImageData(){
	ScanImage.data = new Uint8ClampedArray(ScanImage.width*ScanImage.height*4);
	var Converter;
	for(var y=0;y<ScanImage.height;y++){
		for(var x=0;x<ScanImage.width;x++){
			Converter = y*4*ScanImage.width;
			ScanImage.data[Converter+x*4] = ScanImage.table[x][y][0];
			ScanImage.data[Converter+x*4+1] = ScanImage.table[x][y][1];
			ScanImage.data[Converter+x*4+2] = ScanImage.table[x][y][2];
			ScanImage.data[Converter+x*4+3] = ScanImage.table[x][y][3];
		};
	};
};

function CreateTable() {
	Image.table = [];
	var tempArray=[];
	for(var i=0;i<Image.width*4;i+=4){
		tempArray=[];
		for(var j=i;j<Image.data.length;j+=Image.width*4){
			tempArray.push([Image.data[j],Image.data[j+1],Image.data[j+2],Image.data[j+3]]);
		};
		Image.table.push(tempArray);
	};
};

function CreateScanTable() {
	ScanImage.table = [];
	var tempArray=[];
	for(var i=0;i<ScanImage.width*4;i+=4){
		tempArray=[];
		for(var j=i;j<ScanImage.data.length;j+=ScanImage.width*4){
			tempArray.push([ScanImage.data[j],ScanImage.data[j+1],ScanImage.data[j+2],ScanImage.data[j+3]]);
		};
		ScanImage.table.push(tempArray);
	};
}

function EnlargeTable(h,w){
	var TempArray = [];
	for(var x=0;x<Image.width;x++){
		TempArray = [];
		for(var y=0;y<Image.height;y++){
			for(var i=0;i<h;i++){
				TempArray.push(Image.table[x][y]);
			}
		}
		Image.table[x]=TempArray.slice();
	}
	TempArray=Image.table.slice();
	for(var x=0;x<Image.width;x++){
		for(var i=0;i<w;i++){
			Image.table[x*w+i]=TempArray[x].slice();
		}
	}
	Image.width = Image.table.length;
	Image.height = Image.table[0].length;
	CreateImageData();
}
			
function ScaleHeight(scale) {
	var tempArray=[];
	var avrgRed=0;
	var avrgGreen=0;
	var avrgBlue=0;
	for(var i=0;i<Image.height-scale;i+=scale){
		for(var j=0;j<Image.width;j++){
			avrgRed=0;
			avrgGreen=0;
			avrgBlue=0;
			for(var k=i;k<i+scale;k++){
				avrgRed+=Image.table[j][k][0];
				avrgGreen+=Image.table[j][k][1];
				avrgBlue+=Image.table[j][k][2];
			}
			tempArray.push(avrgRed/scale);
			tempArray.push(avrgGreen/scale);
			tempArray.push(avrgBlue/scale);
			tempArray.push(255);
		}
	}
	return new Uint8ClampedArray(tempArray);
}

function Intersects(rectOne, rectTwo) {
	return (rectOne[0][0] <= rectTwo[0][1] &&
          rectTwo[0][0] <= rectOne[0][1] &&
          rectOne[1][0] <= rectTwo[1][1]&&
          rectTwo[1][0] <= rectOne[1][1]);
}

function maxLocalization(max, maxPos,data) {
	var originalMax = max;
	var rects = [];
	do {
		var startX = maxPos%Image.width;
		var startY = (maxPos - startX)/Image.width;
		var minY = 0;
		var maxY = Image.height;
		var minX = 0;
		var maxX = Image.width-1;
		for(var y = startY; y < Image.height-1; y++) {
			if(Image.table[startX][y+1][0] == 0) {
				maxY = y;
				break;
			}
		}
		for(var y = startY; y > 0; y--) {
			if(Image.table[startX][y-1][0] == 0) {
				minY = y;
				break;
			}
		}
		for(var x = startX; x < Image.width-1; x++) {
			if(Image.table[x+1][startY][0] == 0) {
				maxX = x;
				break;
			}
		}
		for(var x = startX; x > 0; x--) {
			if(Image.table[x-1][startY][0] == 0) {
				minX = x;
				break;
			}
		}
		for(var y = minY*Image.width; y <= maxY*Image.width; y+=Image.width) {
			for(var x = minX; x <= maxX; x++) {
				data[y+x] = 0;
			}
		}
		var newRect = [[minX,maxX],[minY,maxY]];
		for(var i = 0; i < rects.length; i++) {
			if(Intersects(newRect,rects[i])) {
				if(rects[i][0][1] - rects[i][0][0] > newRect[0][1]-newRect[0][0]) {
					rects[i][0][0] = rects[i][0][0] < newRect[0][0] ? rects[i][0][0] : newRect[0][0];
					rects[i][0][1] = rects[i][0][1] > newRect[0][1] ? rects[i][0][1] : newRect[0][1];
					newRect = [];
					break;
				} else {
					rects[i][0][0] = rects[i][0][0] < newRect[0][0] ? rects[i][0][0] : newRect[0][0];
					rects[i][0][1] = rects[i][0][1] > newRect[0][1] ? rects[i][0][1] : newRect[0][1];
					rects[i][1][0] = newRect[1][0];
					rects[i][1][1] = newRect[1][1];
					newRect = [];
					break;
				}
			}
		}
		if(newRect.length > 0) {
			rects.push(newRect);
		}
		max = 0;
		maxPos = 0;
		var newMaxPos = 0;
		for(var i = 0; i < data.length; i++) {
			if(data[i] > max) {
				max = data[i];
				maxPos = i;
			}
		}
	}while(max > originalMax*0.70);
	return rects;
}

function ImgProcessing() {
	greyScale(Image.data) ;
	var newData = IntensityGradient(Image.data,Image.width);
	newData = BoxFilter(newData, Image.width,15);
	var min = newData[0];
	for(var i = 1; i < newData.length; i++) {
			min = min > newData[i] ? newData[i] : min;
	}
	var max = 0;
	var maxPos = 0;
	var avrgLight = 0;
	for(var i = 0; i < newData.length; i++) {
		newData[i] = Math.round((newData[i]-min));
		avrgLight += newData[i];
		if(max < newData[i]) {
			max = newData[i];
			maxPos = i;
		}
	}
	avrgLight /= newData.length;
	if(avrgLight < 15) {
		newData = BoxFilter(newData, Image.width,8);
		min = newData[0];
		for(var i = 1; i < newData.length; i++) {
			min = min > newData[i] ? newData[i] : min;
		}
		max = 0;
		maxPos = 0;
		for(var i = 0; i < newData.length; i++) {
			newData[i] = Math.round((newData[i]-min));
			if(max < newData[i]) {
				max = newData[i];
				maxPos = i;
			}
		}
	}
	var hist = [];
	for(var i = 0; i <= max; i++) {
		hist[i] = 0;
	};
	for(var i = 0; i < newData.length; i++) {
		hist[newData[i]] = hist[newData[i]] + 1;
	}
	var thresh = otsu(hist, newData.length);
	for(var i = 0; i < newData.length; i++) {
		if(newData[i] < thresh) {
			Image.data[i*4] = Image.data[i*4+1] = Image.data[i*4+2] = 0;
		} else {
			Image.data[i*4] = Image.data[i*4+1] = Image.data[i*4+2] = 255;
		}
	}
	CreateTable();
	var rects = maxLocalization(max, maxPos,newData);
	var feedBack = [];
	for(var i = 0; i < rects.length; i++) {
		feedBack.push({x: rects[i][0][0], y : rects[i][1][0], width : rects[i][0][1] - rects[i][0][0], height: rects[i][1][1]-rects[i][1][0]});
	}
	if(feedBack.length > 0) postMessage({result: feedBack, success: "localization"});
	allTables = [];
	for(var i = 0; i < rects.length; i++) {
		var newTable = [];
		for(var x = rects[i][0][0]*2; x < rects[i][0][1]*2; x++) {
			var tempArray=[];
			for(var y = rects[i][1][0]*2; y < rects[i][1][1]*2; y++) {
				tempArray.push([ScanImage.table[x][y][0],ScanImage.table[x][y][1],ScanImage.table[x][y][2],255]);
			}
			newTable.push(tempArray);
		}
		if(newTable.length < 1) continue;
		Image.table = newTable;
		Image.width = newTable.length;
		Image.height = newTable[0].length;
		CreateImageData();
		allTables.push({table: newTable, data: new Uint8ClampedArray(Image.data), width: Image.width, height: Image.height});
	}
}
function showImage(data, width, height) {
	postMessage({result: data, width: width, height: height,success: "image"});
}

function Main(){
	ImgProcessing();
	var allResults=[];
	for(var z=0;z<allTables.length;z++){
		Image = allTables[z];
		var scaled = ScaleHeight(30);
		var variationData;
		var incrmt=0;
		var format = "";
		var first = true;
		var eanStatistics = {};
		var eanOrder = [];
		Selection = false;
		do{
			var tempData =scaled.subarray(incrmt,incrmt+Image.width*4);
			var hist = [];
			for(var i = 0; i < 256; i++) {
				hist[i] = 0;
			}
			for(var i = 0; i < tempData.length; i+=4) {
				var val = Math.round((tempData[i]+tempData[i+1]+tempData[i+2])/3);
				hist[val] = hist[val] + 1;
			}
			var thresh = otsu(hist, tempData.length/4);
			var start = thresh < 41 ? 1 : thresh - 40;
			var end = thresh > 254-40 ? 254 : thresh + 40;
			variationData = yStraighten(tempData,start, end);
			Selection=BinaryString(variationData);
			if(Selection.string){
				format = Selection.format;
				var tempObj = Selection;
				Selection = Selection.string;
				if(format == "EAN-13") {
					if(typeof eanStatistics[Selection] == 'undefined') {
						eanStatistics[Selection] = {count: 1,correction: tempObj.correction};
						eanOrder.push(Selection);
					} else {
						eanStatistics[Selection].count = eanStatistics[Selection].count+1;
						eanStatistics[Selection].correction = eanStatistics[Selection].correction + tempObj.correction;
					}
					Selection = false;
				}
			} else {
				Selection = false;
			}
			incrmt+=Image.width*4;
		}while(!Selection&&incrmt<scaled.length);
		if(Selection&&format != "EAN-13") allResults.push({Format : format, Value : Selection});
		if(format == "EAN-13") Selection = false;
		if(!Selection){
			EnlargeTable(4,2);
			incrmt=0;
			scaled = ScaleHeight(20);
			do{
				var tempData =scaled.subarray(incrmt,incrmt+Image.width*4);
				var hist = [];
				for(var i = 0; i < 256; i++) {
					hist[i] = 0;
				}
				for(var i = 0; i < tempData.length; i+=4) {
					var val = Math.round((tempData[i]+tempData[i+1]+tempData[i+2])/3);
					hist[val] = hist[val] + 1;
				}
				var thresh = otsu(hist, tempData.length/4);
				var start = thresh < 40 ? 0 : thresh - 40;
				var end = thresh > 255-40 ? 255 : thresh + 40;
				variationData = yStraighten(tempData,start, end);
				Selection=BinaryString(variationData);
				if(Selection.string){
					format = Selection.format;
					var tempObj = Selection;
					Selection = Selection.string;
					if(format == "EAN-13") {
						if(typeof eanStatistics[Selection] == 'undefined') {
							eanStatistics[Selection] = {count: 1,correction: tempObj.correction};
							eanOrder.push(Selection);
						} else {
							eanStatistics[Selection].count = eanStatistics[Selection].count+1;
							eanStatistics[Selection].correction = eanStatistics[Selection].correction + tempObj.correction;
						}
						Selection = false;
					}
				} else {
					Selection = false;
				}
				incrmt+=Image.width*4;
			}while(!Selection&&incrmt<scaled.length);
			if(format == "EAN-13") {
				var points = {};
				for(var key in eanStatistics) {
					eanStatistics[key].correction = eanStatistics[key].correction/eanStatistics[key].count;
					var pointTemp = eanStatistics[key].correction;
					pointTemp -= eanStatistics[key].count;
					pointTemp += eanOrder.indexOf(key);
					points[key] = pointTemp;
				}
				var minPoints = Number.POSITIVE_INFINITY;
				var tempString = "";
				for(var key in points) {
					if(points[key] < minPoints) {
						minPoints =  points[key];
						tempString = key;
					}
				}
				if(minPoints < 11) {
					Selection = tempString;
				} else {
					Selection = false;
				}
			}
			if(Selection) allResults.push({Format : format, Value : Selection});
		}
		if(allResults.length > 0 && !Multiple) break;
	}
	return allResults;
}

function yStraighten(img,start, end){
	var average=0;
	var threshold;
	var newImg = new Uint8ClampedArray(Image.width*(end-start+1)*4);
	for(var i=0;i<newImg.length;i++){
		newImg[i]=255;
	}
	for(var i=0;i<Image.width*4;i+=4){
		threshold=end;
		average=(img[i]+img[i+1]+img[i+2])/3;
		if(i < Image.width*4 -4) {
			average+=(img[i+4]+img[i+5]+img[i+6])/3;
			average/=2;
		}
		for(var j=i;j<newImg.length;j+=Image.width*4){
			if(average<threshold){
				newImg[j]=newImg[j+1]=newImg[j+2]=0;
			}
			threshold--;
		}
	}
	return newImg;
}

function CheckEan13(values, middle) {
	if(middle) {
		if(values.length != 5) return  false;
	} else {
		if(values.length != 3) return false;
	}
	var avrg = 0;
	for(var i = 0; i < values.length; i++) {
		avrg += values[i];
	}
	avrg /= values.length;
	for(var i = 0; i < values.length; i++) {
		if(values[i] / avrg < 0.5 || values[i] / avrg > 1.5) return false;
	}
	return true;
}

function TwoOfFiveStartEnd(values, start) {
	if(values.length < 5 || values.length > 6) return false;
	var maximum = 0;
	var TwoOfFiveMax = [0,0];
	for(var u = 0; u < values.length; u++) {
		if(values[u] > maximum) {
			maximum = values[u];
			TwoOfFiveMax[0] = u;
		}
	}
	maximum = 0;
	for(var u = 0; u < values.length; u++) {
		if(u == TwoOfFiveMax[0]) continue;
		if(values[u] > maximum) {
			maximum = values[u];
			TwoOfFiveMax[1] = u;
		}
	}
	if(start) {
		return TwoOfFiveMax[0] + TwoOfFiveMax[1] == 2;
	}else {
		return TwoOfFiveMax[0] + TwoOfFiveMax[1] == 2;
	}
}

function CheckInterleaved(values, start) {
	var average = 0;
	for(var i = 0; i < values.length; i++) {
		average += values[i];
	}
	average /= 4;
	if(start) {
		if(values.length != 4) return false;
		for(var i = 0; i < values.length; i++) {
			if(values[i]/average < 0.5 || values[i]/average > 1.5) return false;
		}
		return true;
	} else {
		if(values.length != 3) return false;
		var max = 0;
		var pos;
		for(var i = 0; i < values.length; i++) {
			if(values[i] > max) {
				max = values[i];
				pos = i;
			}
		}
		if(pos != 0) return false;
		if(values[0]/average < 1.5 || values[0]/average > 2.5) return false;
		for(var i = 1; i < values.length; i++) {
			if(values[i]/average < 0.5 || values[i]/average > 1.5) return false;
		}
		return true;
	}
}

function BinaryConfiguration(binaryString, type) {
	var result=[];
	var binTemp = [];
	var count=0;
	var bars;
	var len;
	var totalBars;
	if(type == "Code128" || type == "Code93") {
		totalBars = 6;
		len = binaryString[0];
		if(type == "Code128") len /= 2;
		for(var i = 0; i < binaryString.length; i++) {
			if(binaryString[i] > len*6) {
				binaryString.splice(i, binaryString.length);
				break;
			}
		}
		do{
			if(binaryString.length == 7 && type == "Code128") {
				result.push(binaryString.splice(0,binaryString.length));
			} else {
				result.push(binaryString.splice(0,totalBars));
			}
			if(type == "Code93" && binaryString.length < 6) binaryString.splice(0,totalBars);
		}while(binaryString.length > 0);
	}
	if(type == "Code39") {
		totalBars = 9;
		len = binaryString[0];
		for(var i = 0; i < binaryString.length; i++) {
			if(binaryString[i] > len*5) {
				binaryString.splice(i, binaryString.length);
				break;
			}
		}
		do{
			result.push(binaryString.splice(0,totalBars));
			binaryString.splice(0,1);
		}while(binaryString.length > 0);
	}
	if(type == "EAN-13") {
		totalBars = 4;
		len = binaryString[0];
		var secureCount = 0;
		for(var i = 0; i < binaryString.length; i++) {
			if(binaryString[i] > len*6) {
				binaryString.splice(i, binaryString.length);
				break;
			}
		}
		if(CheckEan13(binaryString.splice(0,3),false)) secureCount++;
		var count = 0;
		do{
			result.push(binaryString.splice(0,totalBars));
			count++;
			if(count == 6) if(CheckEan13(binaryString.splice(0,5),true)) secureCount++;
		}while(result.length < 12 && binaryString.length > 0);
		if(CheckEan13(binaryString.splice(0,3),false)) secureCount++;
		if(secureCount < 2) return [];
	}
	if(type == "2Of5") {
		totalBars = 5;
		len = binaryString[0]/2;
		for(var i = 0; i < binaryString.length; i++) {
			if(binaryString[i] > len*5) {
				binaryString.splice(i, binaryString.length);
				break;
			}
		}
		var temp = binaryString.splice(0, 6);
		result.push(temp);
		do{
			binTemp = [];
			for(var i = 0; i < totalBars; i++) {
				binTemp.push(binaryString.splice(0,1)[0]);
				binaryString.splice(0,1)[0];
			}
			result.push(binTemp);
			if(binaryString.length == 5) result.push(binaryString.splice(0, 5));
		}while(binaryString.length > 0);
	}
	if(type == "Inter2Of5") {
		totalBars =5;
		len = binaryString[0];
		for(var i = 0; i < binaryString.length; i++) {
			if(binaryString[i] > len*5) {
				binaryString.splice(i, binaryString.length);
				break;
			}
		}
		result.push(binaryString.splice(0, 4));
		var binTempWhite = [];
		do{
			binTemp = [];
			binTempWhite = [];
			for(var i = 0; i < totalBars; i++) {
				binTemp.push(binaryString.splice(0,1)[0]);
				binTempWhite.push(binaryString.splice(0,1)[0]);
			}
			result.push(binTemp);
			result.push(binTempWhite);
			if(binaryString.length == 3) result.push(binaryString.splice(0, 3));
		}while(binaryString.length > 0);
	}
	if(type == "Codabar") {
		totalBars = 7;
		len = binaryString[0];
		for(var i = 0; i < binaryString.length; i++) {
			if(binaryString[i] > len*5) {
				binaryString.splice(i, binaryString.length);
				break;
			}
		}
		do{
			result.push(binaryString.splice(0,totalBars));
			binaryString.splice(0,1);
		}while(binaryString.length > 0);
	}
	return result;
}

function BinaryString(img,type){
	var binaryString=[];
	var binTemp=[];
	var container=255;
	var count = 0;
	var format;
	for(var j=0;j<img.length - Image.width*4;j+=Image.width*4){
		var SlicedArray = img.subarray(j,j+Image.width*4);
		binaryString=[];
		var i = 0;
		while(SlicedArray[i] == 255){
			i+=4;
		}
		while(i < SlicedArray.length) {
			count = 0;
			container = SlicedArray[i];
			while(SlicedArray[i] == container && i < SlicedArray.length) {
				count++;
				i+=4;
			}
			binaryString.push(count);
		}
		if(binaryString.length > 2 && binaryString[0] <= binaryString[1]/10) {
			binaryString.splice(0,2);
		}
		var binaryHolder = binaryString.slice();
		var success = false;
		for(var i = 0; i < FormatPriority.length; i++) {
			binaryString = binaryHolder.slice();
			var first;
			var second;
			binaryString = BinaryConfiguration(binaryString, FormatPriority[i]);
			if(FormatPriority[i] == "2Of5" || FormatPriority[i] == "Inter2Of5") {
				first = binaryString.splice(0,1)[0];
				second = binaryString.splice(binaryString.length-1,1)[0];
			}
			binTemp=Distribution(binaryString,FormatPriority[i]);
			if(FormatPriority[i] == "EAN-13") {
				binaryString = binTemp.data;
				corrections = binTemp.correction;
			}else {
				binaryString = binTemp;
			}
			if(typeof binaryString == 'undefined') continue;
			if(binaryString.length>4 || (FormatPriority[i] == "Code39" && binaryString.length>2)){
				if(FormatPriority[i] == "Code128") {
					if(CheckCode128(binaryString)){
						binaryString = DecodeCode128(binaryString);
						success = true;
					}
				}else if(FormatPriority[i] == "Code93") {
					if(CheckCode93(binaryString)) {
						binaryString = DecodeCode93(binaryString);
						success = true;
					}
				}else if(FormatPriority[i] == "Code39") {
					if(CheckCode39(binaryString)) {
						binaryString = DecodeCode39(binaryString);
						success = true;
					}
				} else if(FormatPriority[i] == "EAN-13") {
					var tempString = DecodeEAN13(binaryString);
					if(tempString) {
						if(tempString.length === 13) {
							binaryString = tempString;
							success = true;
						}
					}
				} else if(FormatPriority[i] == "2Of5" || FormatPriority[i] == "Inter2Of5") {
					if(FormatPriority[i] == "2Of5") {
						if(typeof first != 'undefined') if(!TwoOfFiveStartEnd(first,true)) continue;
						if(typeof second != 'undefined') if(!TwoOfFiveStartEnd(second,false)) continue;
					}
					if(FormatPriority[i] == "Inter2Of5") {
						if(typeof first != 'undefined') if(!CheckInterleaved(first,true)) continue;
						if(typeof second != 'undefined')if(!CheckInterleaved(second,false)) continue;
					}
					var tempString = Decode2Of5(binaryString);
					if(tempString) {
						binaryString = tempString;
						success = true;
					}
				} else if(FormatPriority[i] == "Codabar") {
					var tempString = DecodeCodaBar(binaryString);
					if(tempString) {
						binaryString = tempString;
						success = true;
					}
				}
			}
			if(success) {
				format = FormatPriority[i];
				if(format == "Inter2Of5") format = "Interleaved 2 of 5";
				if(format == "2Of5") format = "Standard 2 of 5";
				break;
			}
		}
		if(success) break;
	}
	if(format == "Code128") {
		if(typeof binaryString.string  === 'string') {
			return binaryString;
		} else {
			return {string: false};
		}
	}
	if(typeof binaryString  === 'string'){
		if(format == "EAN-13") {
			return {string: binaryString, format: format, correction: corrections};
		} else {
			return {string: binaryString, format: format};
		}
	}else{
		return {string: false};
	}
}

function Distribution(totalBinArray,type){
	var type = availableFormats.indexOf(type);
	var testData = 0;
	var result = [];
	var totalBars;
	var total;
	var maxLength;
	if(type === 0) {
		total = 11;
		totalBars = 6;
		maxLength = 4;
	}else if(type === 1) {
		total = 9;
		totalBars = 6;
		maxLength = 4;
	}else if(type === 2) {
		total = 12;
		totalBars = 9;
	}else if(type === 3) {
		total = 7;
		totalBars = 4;
		maxLength = 4;
	} else if(type == 6){
		totalBars = 7;
	}
	for(var k = 0; k < totalBinArray.length; k++) {
		var BinArray = totalBinArray[k];
		var sum=0;
		sum = 0;
		var counter = 0;
		var tempBin=[];
		var narrowArr = [];
		var wideArr = [];
		if(type == 6) {
			var upperTolerance = 1.5;
			var lowerTolerance = 1/2;
			if(BinArray.length != 7) return [];
			if(k == 0 || k == totalBinArray.length - 1) {
				var whiteMax = [[0,0],[0,0]];
				var blackMax = [0,0];
				for(var i = 0; i < BinArray.length; i++) {
					if(i%2 == 0) {
						if(BinArray[i] > blackMax[0]) {
							blackMax[0] = BinArray[i];
							blackMax[1] = i;
						}
					} else {
						if(BinArray[i] > whiteMax[0][0]) {
							whiteMax[0][0] = BinArray[i];
							var prevPos = whiteMax[0][1];
							whiteMax[0][1] = i;
							i = prevPos - 1;
							continue;
						}
						if(BinArray[i] > whiteMax[1][0] && i != whiteMax[0][1]) {
							whiteMax[1][0] = BinArray[i];
							whiteMax[1][1] = i;
						}
					}
				}
				if(SecureCodabar) {
					var wideAvrg = whiteMax[0][0] + whiteMax[1][0] + blackMax[0];
					wideAvrg /= 3;
					var wideValues = [whiteMax[0][0], whiteMax[1][0], blackMax[0]];
					for(var i = 0; i < wideValues.length; i++) {
						if(wideValues[i] / wideAvrg > upperTolerance || wideValues[i] / wideAvrg < lowerTolerance) return [];
					}
					var narrowAvrg = 0;
					for(var i = 0; i < BinArray.length; i++) {
						if(i == blackMax[1] || i == whiteMax[0][1] || i == whiteMax[1][1]) continue;
						narrowAvrg += BinArray[i];
					}
					narrowAvrg /= 4;
					for(var i = 0; i < BinArray.length; i++) {
						if(i == blackMax[1] || i == whiteMax[0][1] || i == whiteMax[1][1]) continue;
						if(BinArray[i] / narrowAvrg > upperTolerance || BinArray[i] / narrowAvrg < lowerTolerance) return [];
					}
				}
				for(var i = 0; i < BinArray.length; i++) {
					if(i == blackMax[1] || i == whiteMax[0][1] || i == whiteMax[1][1]) {
						tempBin.push(1);
					} else {
						tempBin.push(0);
					}
				}
			} else {
				var blackMax = [0,0];
				var whiteMax = [0,0];
				for(var i = 0; i < BinArray.length; i++) {
					if(i%2 == 0) {
						if(BinArray[i] > blackMax[0]) {
							blackMax[0] = BinArray[i];
							blackMax[1] = i;
						}
					} else {
						if(BinArray[i] > whiteMax[0]) {
							whiteMax[0] = BinArray[i];
							whiteMax[1] = i;
						}
					}
				}
				if(blackMax[0]/whiteMax[0] > 1.55) {
					var tempArray = blackMax;
					blackMax = [tempArray, [0,0], [0,0]];
					for(var i = 0; i < BinArray.length; i++) {
						if(i%2 == 0) {
							if(BinArray[i] > blackMax[1][0] && i != blackMax[0][1]) {
								blackMax[1][0] = BinArray[i];
								var prevPos = blackMax[1][1];
								blackMax[1][1] = i;
								i = prevPos - 1;
								continue;
							}
							if(BinArray[i] > blackMax[2][0] && i != blackMax[0][1] && i != blackMax[1][1])  {
								blackMax[2][0] = BinArray[i];
								blackMax[2][1] = i;
							}
						}
					}
					if(SecureCodabar) {
						var wideAvrg = blackMax[0][0] + blackMax[1][0] + blackMax[2][0];
						wideAvrg /= 3;
						for(var i = 0; i < blackMax.length; i++) {
							if(blackMax[i][0] / wideAvrg > upperTolerance || blackMax[i][0] / wideAvrg < lowerTolerance) return [];
						}
						var narrowAvrg = 0;
						for(var i = 0; i < BinArray.length; i++) {
							if(i == blackMax[0][1] || i == blackMax[1][1] ||i == blackMax[2][1]) continue;
							narrowAvrg += BinArray[i];
						}
						narrowAvrg /= 4;
						for(var i = 0; i < BinArray.length; i++) {
							if(i == blackMax[0][1] || i == blackMax[1][1] ||i == blackMax[2][1]) continue;
							if(BinArray[i] / narrowAvrg > upperTolerance || BinArray[i] / narrowAvrg < lowerTolerance) return [];
						}
					}
					for(var i = 0; i < BinArray.length; i++) {
						if(i == blackMax[0][1] || i == blackMax[1][1] ||i == blackMax[2][1]) {
							tempBin.push(1);
						} else {
							tempBin.push(0);
						}
					}
				} else {
					if(SecureCodabar) {
						var wideAvrg = blackMax[0] + whiteMax[0];
						wideAvrg /= 2;
						if(blackMax[0] / wideAvrg > 1.5 || blackMax[0] / wideAvrg < 0.5) return [];
						if(whiteMax[0] / wideAvrg > 1.5 || whiteMax[0] / wideAvrg < 0.5) return [];
						var narrowAvrg = 0;
						for(var i = 0; i < BinArray.length; i++) {
							if(i == blackMax[1] || i == whiteMax[1]) continue;
							narrowAvrg += BinArray[i];
						}
						narrowAvrg /= 5;
						for(var i = 0; i < BinArray.length; i++) {
							if(i == blackMax[1] || i == whiteMax[1]) continue;
							if(BinArray[i] / narrowAvrg > upperTolerance || BinArray[i] / narrowAvrg < lowerTolerance) return [];
						}
					}
					for(var i = 0; i < BinArray.length; i++) {
						if(i == blackMax[1] || i == whiteMax[1]) {
							tempBin.push(1);
						} else {
							tempBin.push(0);
						}
					}
				}
			}
			result.push(tempBin);
			continue;
		}
		if(type == 4 || type == 5) {
			var max = [[0,0], [0,0]];
			for(var i = 0; i < BinArray.length; i++) {
				if(!isFinite(BinArray[i])) return [];
				if(BinArray[i] > max[0][0]) {
					max[0][0] = BinArray[i];
					var prevPos = max[0][1];
					max[0][1] = i;
					i = prevPos - 1;
				}
				if(BinArray[i] > max[1][0] && i != max[0][1]) {
					max[1][0] = BinArray[i];
					max[1][1] = i;
				}
			}
			if(Secure2Of5) {
				var wideAvrg = max[0][0] + max[1][0];
				wideAvrg /= 2;
				if(max[0][0] / wideAvrg > 1.3 || max[0][0] / wideAvrg < 0.7) return [];
				if(max[1][0] / wideAvrg > 1.3 || max[1][0] / wideAvrg < 0.7) return [];
				var narrowAvrg = 0;
				for(var i = 0; i < BinArray.length; i++) {
					if(i == max[0][1] || i == max[1][1]) continue;
					narrowAvrg += BinArray[i];
				}
				narrowAvrg /= 3;
				for(var i = 0; i < BinArray.length; i++) {
					if(i == max[0][1] || i == max[1][1]) continue;
					if(BinArray[i] / narrowAvrg > 1.3 || BinArray[i] / narrowAvrg < 0.7) return [];
				}
			}
			for(var i = 0; i < BinArray.length; i++) {
				if(i == max[0][1] || i == max[1][1]) {
					tempBin.push(1);
					continue;
				}
				tempBin.push(0);
			}
			result.push(tempBin);
			continue;
		}
		while(counter<totalBars){
			sum+=BinArray[counter];
			counter++;
		}
		if(type === 2) {
			var indexCount = [];
			var blackMax = [[0,0],[0,0]];
			var whiteMax = [0,0];
			for(var j = 0; j < BinArray.length; j++) {
				if(j%2 == 0) {
					if(BinArray[j] > blackMax[0][0]) {
						blackMax[0][0] = BinArray[j];
						var prevPos = blackMax[0][1];
						blackMax[0][1] = j;
						j = prevPos;
					}
					if(BinArray[j] > blackMax[1][0] && j != blackMax[0][1]) {
						blackMax[1][0] = BinArray[j];
						blackMax[1][1] = j;
					}
				} else {
					if(BinArray[j] > whiteMax[0]) {
						whiteMax[0] = BinArray[j];
						whiteMax[1] = j;
					}
				}
			}
			if(whiteMax[0]/blackMax[0][0] > 1.5 && whiteMax[0]/blackMax[1][0] > 1.5) {
				blackMax = [[0,0],[0,0]];
				for(var j = 0; j < BinArray.length; j++) {
					if(j%2 != 0) {
						if(BinArray[j] > blackMax[0][0] && j != whiteMax[1]) {
							blackMax[0][0] = BinArray[j];
							var prevPos = blackMax[0][1];
							blackMax[0][1] = j;
							j = prevPos;
						}
						if(BinArray[j] > blackMax[1][0] && j != blackMax[0][1] && j != whiteMax[1]) {
							blackMax[1][0] = BinArray[j];
							blackMax[1][1] = j;
						}
					}
				}
			}
			var wideAvrg = blackMax[0][0] + blackMax[1][0] + whiteMax[0];
			wideAvrg /= 3;
			if(blackMax[0][0] / wideAvrg > 1.6 || blackMax[0][0] / wideAvrg < 0.4) return [];
			if(blackMax[1][0] / wideAvrg > 1.6 || blackMax[1][0] / wideAvrg < 0.4) return [];
			if(whiteMax[0] / wideAvrg > 1.6 || whiteMax[0] / wideAvrg < 0.4) return [];
			var narrowAvrg = 0;
			for(var i = 0; i < BinArray.length; i++) {
				if(i == blackMax[0][1] || i == blackMax[1][1] || i == whiteMax[1]) continue;
					narrowAvrg += BinArray[i];
			}
			narrowAvrg /= 6;
			for(var i = 0; i < BinArray.length; i++) {
				if(i == blackMax[0][1] || i == blackMax[1][1] || i == whiteMax[1]) continue;
				if(BinArray[i] / narrowAvrg > 1.6 || BinArray[i] / narrowAvrg < 0.4) return [];
			}
			for(var j = 0; j < BinArray.length; j++) {
				if(j == blackMax[0][1] || j == blackMax[1][1] || j == whiteMax[1]) {
					tempBin.push(2);
				} else {
					tempBin.push(1);
				}
			}
			result.push(tempBin);
			continue;
		}
		if(type == 3) {
			var max = [[0,0],[0,0],[0,0]];
			for(var j = 0; j < BinArray.length; j++) {
				if(BinArray[j] > max[0][0]) {
					max[0][0] = BinArray[j];
					var prevPos = max[0][1];
					max[0][1] = j;
					j = prevPos;
				}
				if(BinArray[j] > max[1][0] && j != max[0][1]) {
					max[1][0] = BinArray[j];
					var prevPos = max[1][1];
					max[1][1] = j;
					j = prevPos;
				}
				if(BinArray[j] > max[2][0] && j != max[0][1] && j != max[1][1]) {
					max[2][0] = BinArray[j];
					max[2][1] = j;
				}
			}
			if(max[0][0] / max[1][0] >= 3) {
				var narrowAvrg = 0;
				for(var j = 0; j < BinArray.length; j++) {
					if(j == max[0][1]) continue;
					narrowAvrg += BinArray[j];
				}
				narrowAvrg /= 3;
				for(var j = 0; j < BinArray.length; j++) {
					if(j == max[0][1]) continue;
					if(BinArray[j] / narrowAvrg < 0.02 || BinArray[j] / narrowAvrg > 3) return {data: [],correction:0};
				}
				if(max[0][0] / narrowAvrg < 2.2 || max[0][0] / narrowAvrg > 6) return {data: [],correction:0};
				for(var j = 0; j < BinArray.length; j++) {
					if(j == max[0][1]) {
						tempBin.push(4);
					} else {
						tempBin.push(1);
					}
				}
				result.push(tempBin);
			} else if(max[0][0] / max[2][0] > 2) {
				var wideAvrg = max[0][0] + max[1][0];
				wideAvrg /= 5;
				if(max[0][0] / (wideAvrg*3) < 0.02 || max[0][0] / (wideAvrg*3) > 3) return {data: [],correction:0};
				if(max[1][0] / (wideAvrg*2) < 0.02 || max[1][0] / (wideAvrg*2) > 3) return {data: [],correction:0};
				var narrowAvrg = 0;
				for(var j = 0; j < BinArray.length; j++) {
					if(j == max[0][1] || j == max[1][1]) continue;
					narrowAvrg += BinArray[j];
				}
				narrowAvrg /= 2;
				for(var j = 0; j < BinArray.length; j++) {
					if(j == max[0][1] || j == max[1][1]) continue;
					if(BinArray[j] / narrowAvrg < 0.02 || BinArray[j] / narrowAvrg > 3) return {data: [],correction:0};
				}
				for(var j = 0; j < BinArray.length; j++) {
					if(j == max[0][1]) {
						tempBin.push(3);
					} else if(j == max[1][1]) {
						tempBin.push(2);
					} else {
						tempBin.push(1);
					}
				}
				result.push(tempBin);
			} else {
				if(max[0][1]%2 == max[1][1]%2 && max[0][1]%2 == max[2][1]%2) {
					var modMem = max[0][1]%2;
					max[2] = [0,0];
					for(var j = 0; j < BinArray.length; j++) {
						if(j%2 == modMem) continue;
						if(BinArray[j] > max[2][0]) {
							max[2][0] = BinArray[j];
							max[2][1] = j;
						}
					}
				}
				var wideAvrg = max[0][0] + max[1][0] + max[2][0];
				wideAvrg /= 3;
				for(var j = 0; j < max.length; j++) {
					if(max[j][0] / wideAvrg < 0.02 || max[j][0] / wideAvrg > 3) return {data: [],correction:0};
				}
				var narrow = 0;
				for(var j = 0; j < BinArray.length; j++) {
						if(j == max[0][1] || j == max[1][1] || j == max[2][1]) continue;
						narrow = BinArray[j];
				}
				if(wideAvrg / narrow < 0.02 || wideAvrg / narrow > 3) return {data: [],correction:0};
				for(var j = 0; j < BinArray.length; j++) {
						if(j == max[0][1] || j == max[1][1] || j == max[2][1]) {
							tempBin.push(2);
						} else {
							tempBin.push(1);
						}
				}
				result.push(tempBin);
			}
			for(var j = 0; j < tempBin.length; j++) {
				testData += Math.abs(tempBin[j]-(BinArray[j]/sum)*total);
			};
			continue;
		}
		counter=0;
		while(counter<totalBars){
			tempBin.push((BinArray[counter]/sum)*total);
			counter++;
		}
		counter=0;
		while(counter<totalBars){
				tempBin[counter] = tempBin[counter]>maxLength ? maxLength : tempBin[counter];
				tempBin[counter] = tempBin[counter]<1 ? 1 : tempBin[counter];
				tempBin[counter]=Math.round(tempBin[counter]);
			counter++;
		}
		if(type == 3) {
			var checking = 0;
			for(var i = 0; i < tempBin.length; i++) {
				checking += tempBin[i];
			}
			if(checking > 7) {
				var max = 0;
				var hitIndex = 0;
				for(var i = 0; i < tempBin.length; i++) {
					if(tempBin[i]>max) {
						max = tempBin[i];
						hitIndex = i;
					}
				}
				tempBin[hitIndex] = max - (checking - 7);
			}
		}
		if(type == 3) {
			for(var i = 0; i < tempBin.length; i++) {
				testData += Math.abs(tempBin[i]-(BinArray[i]/sum)*total);
			};
		}
		result.push(tempBin);
	}
	if(type == 3) {
		return {data: result,correction:testData};
	} else {
		return result;
	}
}

function CheckCode128(string){
	var checksum=string[string.length-2].join("");
	checksum = Code128Encoding.value.indexOf(checksum);
	if(checksum == -1) return false;
	var summarizer = Code128Encoding.value.indexOf(string[0].join(""));
	if(summarizer == -1) return false;
	var startChar = Code128Encoding[string[0].join("")];
	if(typeof startChar == 'undefined') return false;
	if(startChar != "A" && startChar != "B" && startChar != "C") return false;
	for(var i=1;i<(string.length-2);i++){
		summarizer+=Code128Encoding.value.indexOf(string[i].join(""))*i;
		if(Code128Encoding.value.indexOf(string[i].join(""))===-1) return false;
	}
	return (summarizer%103===checksum);
}

function Decode2Of5(string) {
	var result = "";
	for(var i = 0; i < string.length; i++) {
		if(TwoOfFiveEncoding.indexOf(string[i].join("")) == -1) return false;
		result += TwoOfFiveEncoding.indexOf(string[i].join(""));
	}
	return result;
}

function DecodeCodaBar(string) {
	var result = "";
	var start = string[0].join("");
	var end = string[string.length-1].join("");
	if(!(CodaBarEncoding[start] == "A" || CodaBarEncoding[start] == "B" || CodaBarEncoding[start] == "C" || CodaBarEncoding[start] == "D")) return false;
	if(!(CodaBarEncoding[end] == "A" || CodaBarEncoding[end] == "B" || CodaBarEncoding[end] == "C" || CodaBarEncoding[end] == "D")) return false;
	for(var i = 1; i < string.length - 1; i++) {
		if(typeof CodaBarEncoding[string[i].join("")] == 'undefined') return false;
		result += CodaBarEncoding[string[i].join("")];
	}
	return result;
}
function DecodeEAN13(string) {
	if(string.length != 12) return false;
	var leftSide = string.slice(0,6);
	var trigger = false;
	var rightSide = string.slice(6,string.length);
	for(var i = 0; i < leftSide.length; i++) {
		leftSide[i] = leftSide[i].join("");
		if(leftSide[i].length != 4){
			trigger = true;
			break;
		}
	}
	if(trigger) return false;
	for(var i = 0; i < rightSide.length; i++) {
		rightSide[i] = rightSide[i].join("");
		if(rightSide[i].length != 4){
			trigger = true;
			break;
		}
	}
	if(trigger) return false;
	var decodeFormat = [];
	for(var i = 0; i < leftSide.length; i++) {
		if(typeof EAN13Encoding["L"][leftSide[i]] != 'undefined') {
			decodeFormat.push("L");
		} else if(typeof EAN13Encoding["G"][leftSide[i]] != 'undefined') {
			decodeFormat.push("G");
		}else {
			trigger = true;
			break;
		}
	}
	if(trigger) return false;
	var resultArray = [];
	if(typeof EAN13Encoding.formats[decodeFormat.join("")] == 'undefined') return false;
	resultArray.push(EAN13Encoding.formats[decodeFormat.join("")]);
	for(var i = 0; i < leftSide.length; i++) {
		if(typeof EAN13Encoding[decodeFormat[i]][leftSide[i]] == 'undefined') {
			trigger = true;
			break;
		}
		resultArray.push(EAN13Encoding[decodeFormat[i]][leftSide[i]]);
	}
	if(trigger) return false;
	for(var i = 0; i < rightSide.length; i++) {
		if(typeof EAN13Encoding["R"][rightSide[i]] == 'undefined') {
			trigger = true;
			break;
		}
		resultArray.push(EAN13Encoding["R"][rightSide[i]]);
	}
	if(trigger) return false;
	var weight = 3;
	var sum = 0;
	for(var i = resultArray.length-2; i >= 0; i--) {
		sum += resultArray[i]*weight;
		if(weight == 3) {
			weight = 1;
		} else {
			weight = 3;
		}
	}
	sum = (10 - sum%10)%10;
	if(resultArray[resultArray.length-1] == sum) {
		return resultArray.join("");
	}else {
		return false;
	}
}
function CheckCode93(string) {
	var checkOne = string[string.length-3].join("");
	var checkTwo = string[string.length-2].join("");
	var failSafe = true;
	if(typeof Code93Encoding[checkOne] == 'undefined') return false;
	if(typeof Code93Encoding[checkTwo]  == 'undefined') return false;
	var checkSum = Code93Encoding[checkOne].value;
	var weight = 1;
	var sum = 0;
	for(var i = string.length-4; i > 0; i--) {
		failSafe = typeof Code93Encoding[string[i].join("")] === 'undefined' ? false : failSafe;
		if(!failSafe)break;
		sum += Code93Encoding[string[i].join("")].value*weight;
		weight++;
		if(weight > 20) weight = 1;
	}
	var firstCheck = sum%47;
	var firstBool = firstCheck === checkSum;
	if(!firstBool) return false;
	if(!failSafe) return false;
	sum = firstCheck;
	weight = 2;
	checkSum = Code93Encoding[checkTwo].value;
	for(var i = string.length-4; i > 0; i--) {
		failSafe = typeof Code93Encoding[string[i].join("")] === 'undefined' ? false : failSafe;
		if(!failSafe)break;
		sum += Code93Encoding[string[i].join("")].value*weight;
		weight++;
		if(weight > 15) weight = 1;
	}
	var secondCheck = sum%47;
	var secondBool = secondCheck === checkSum;
	return secondBool&&firstBool;
}

function CheckCode39(string) {
	var trigger = true;
	if(typeof Code39Encoding[string[0].join("")] == 'undefined') return false;
	if(Code39Encoding[string[0].join("")].character != "*") return false;
	if(typeof Code39Encoding[string[string.length-1].join("")] == 'undefined') return false;
	if(Code39Encoding[string[string.length-1].join("")].character != "*") return false;
	for(var i = 1; i < string.length-1; i++) {
		if(typeof Code39Encoding[string[i].join("")] == 'undefined') {
			trigger = false;
			break;
		}
	}
	return trigger;
}

function DecodeCode39(string) {
	var resultString = "";
	var special = false;
	var character = "";
	var specialchar = "";
	for(var i = 1; i < string.length-1;i++) {
		character = Code39Encoding[string[i].join("")].character;
		if(character == "$" || character == "/" || character == "+" || character == "%") {
			// if next character exists => this a special character
			if(i+1 < string.length-1){
				special = true;
				specialchar = character;
				continue;
			}
		}
		if(special) {
			if(typeof ExtendedEncoding[specialchar+character] == 'undefined') {
			} else {
				resultString += ExtendedEncoding[specialchar+character];
			}
			special = false;
			continue;
		}
		resultString += character;
	}
	return resultString;
}

function DecodeCode93(string) {
	var resultString="";
	var special = false;
	var character = "";
	var specialchar = "";
	for(var i = 1; i < string.length-3; i++) {
		character = Code93Encoding[string[i].join("")].character;
		if(character == "($)" || character == "(/)" || character == "(+)" ||character == "(%)") {
			special = true;
			specialchar = character[1];
			continue;
		}
		if(special) {
			if(typeof ExtendedEncoding[specialchar+character] == 'undefined') {
			} else {
				resultString += ExtendedEncoding[specialchar+character];
			}
			special = false;
			continue;
		}
		resultString += character;
	}
	return resultString;
}

function DecodeCode128(string){
	var set = Code128Encoding[string[0].join("")];
	var symbol;
	var Code128Format = "Code128";
	var resultString="";
	for(var i=1;i<(string.length-2);i++){
		symbol=Code128Encoding[string[i].join("")][set];
		switch(symbol){
			case "FNC1":
				if(i == 1) Code128Format = "GS1-128";
			case "FNC2":
			case "FNC3":
			case "FNC4":
				break;
			case "SHIFT_B":
				i++;
				resultString+=Code128Encoding[string[i].join("")]["B"];
				break;
			case "SHIFT_A":
				i++;
				resultString+=Code128Encoding[string[i].join("")]["A"];
				break;
			case "Code_A":
				set="A";
				break;
			case "Code_B":
				set="B";
				break;
			case "Code_C":
				set="C";
				break;
			default:
				resultString+=symbol;
		}
	}
	return {string: resultString, format: Code128Format};
}
TwoOfFiveEncoding = ["00110","10001","01001","11000","00101","10100","01100","00011","10010","01010"];
Code128Encoding = {
	"212222":{A : " ", B : " ", C : "00"},
	"222122":{A : "!", B : "!", C : "01"},
	"222221":{A : '"', B : '"', C : "02"},
	"121223":{A : "#", B : "#", C : "03"},
	"121322":{A : "$", B : "$", C : "04"},
	"131222":{A : "%", B : "%", C : "05"},
	"122213":{A : "&", B : "&", C : "06"},
	"122312":{A : "'", B : "'", C : "07"},
	"132212":{A : "(", B : "(", C : "08"},
	"221213":{A : ")", B : ")", C : "09"},
	"221312":{A : "*", B : "*", C : "10"},
	"231212":{A : "+", B : "+", C : "11"},
	"112232":{A : ",", B : ",", C : "12"},
	"122132":{A : "-", B : "-", C : "13"},
	"122231":{A : ".", B : ".", C : "14"},
	"113222":{A : "/", B : "/", C : "15"},
	"123122":{A : "0", B : "0", C : "16"},
	"123221":{A : "1", B : "1", C : "17"},
	"223211":{A : "2", B : "2", C : "18"},
	"221132":{A : "3", B : "3", C : "19"},
	"221231":{A : "4", B : "4", C : "20"},
	"213212":{A : "5", B : "5", C : "21"},
	"223112":{A : "6", B : "6", C : "22"},
	"312131":{A : "7", B : "7", C : "23"},
	"311222":{A : "8", B : "8", C : "24"},
	"321122":{A : "9", B : "9", C : "25"},
	"321221":{A : ":", B : ":", C : "26"},
	"312212":{A : ";", B : ";", C : "27"},
	"322112":{A : "<", B : "<", C : "28"},
	"322211":{A : "=", B : "=", C : "29"},
	"212123":{A : ">", B : ">", C : "30"},
	"212321":{A : "?", B : "?", C : "31"},
	"232121":{A : "@", B : "@", C : "32"},
	"111323":{A : "A", B : "A", C : "33"},
	"131123":{A : "B", B : "B", C : "34"},
	"131321":{A : "C", B : "C", C : "35"},
	"112313":{A : "D", B : "D", C : "36"},
	"132113":{A : "E", B : "E", C : "37"},
	"132311":{A : "F", B : "F", C : "38"},
	"211313":{A : "G", B : "G", C : "39"},
	"231113":{A : "H", B : "H", C : "40"},
	"231311":{A : "I", B : "I", C : "41"},
	"112133":{A : "J", B : "J", C : "42"},
	"112331":{A : "K", B : "K", C : "43"},
	"132131":{A : "L", B : "L", C : "44"},
	"113123":{A : "M", B : "M", C : "45"},
	"113321":{A : "N", B : "N", C : "46"},
	"133121":{A : "O", B : "O", C : "47"},
	"313121":{A : "P", B : "P", C : "48"},
	"211331":{A : "Q", B : "Q", C : "49"},
	"231131":{A : "R", B : "R", C : "50"},
	"213113":{A : "S", B : "S", C : "51"},
	"213311":{A : "T", B : "T", C : "52"},
	"213131":{A : "U", B : "U", C : "53"},
	"311123":{A : "V", B : "V", C : "54"},
	"311321":{A : "W", B : "W", C : "55"},
	"331121":{A : "X", B : "X", C : "56"},
	"312113":{A : "Y", B : "Y", C : "57"},
	"312311":{A : "Z", B : "Z", C : "58"},
	"332111":{A : "[", B : "[", C : "59"},
	"314111":{A : "\\", B : "\\", C : "60"},
	"221411":{A : "]", B : "]", C : "61"},
	"431111":{A : "^", B : "^", C : "62"},
	"111224":{A : "_", B : "_", C : "63"},
	"111422":{A : "NUL", B : "`", C : "64"},
	"121124":{A : "SOH", B : "a", C : "65"},
	"121421":{A : "STX", B : "b", C : "66"},
	"141122":{A : "ETX", B : "c", C : "67"},
	"141221":{A : "EOT", B : "d", C : "68"},
	"112214":{A : "ENQ", B : "e", C : "69"},
	"112412":{A : "ACK", B : "f", C : "70"},
	"122114":{A : "BEL", B : "g", C : "71"},
	"122411":{A : "BS", B : "h", C : "72"},
	"142112":{A : "HT", B : "i", C : "73"},
	"142211":{A : "LF", B : "j", C : "74"},
	"241211":{A : "VT", B : "k", C : "75"},
	"221114":{A : "FF", B : "l", C : "76"},
	"413111":{A : "CR", B : "m", C : "77"},
	"241112":{A : "SO", B : "n", C : "78"},
	"134111":{A : "SI", B : "o", C : "79"},
	"111242":{A : "DLE", B : "p", C : "80"},
	"121142":{A : "DC1", B : "q", C : "81"},
	"121241":{A : "DC2", B : "r", C : "82"},
	"114212":{A : "DC3", B : "s", C : "83"},
	"124112":{A : "DC4", B : "t", C : "84"},
	"124211":{A : "NAK", B : "u", C : "85"},
	"411212":{A : "SYN", B : "v", C : "86"},
	"421112":{A : "ETB", B : "w", C : "87"},
	"421211":{A : "CAN", B : "x", C : "88"},
	"212141":{A : "EM", B : "y", C : "89"},
	"214121":{A : "SUB", B : "z", C : "90"},
	"412121":{A : "ESC", B : "{", C : "91"},
	"111143":{A : "FS", B : "|", C : "92"},
	"111341":{A : "GS", B : "}", C : "93"},
	"131141":{A : "RS", B : "~", C : "94"},
	"114113":{A : "US", B : "DEL", C : "95"},
	"114311":{A : "FNC3", B : "FNC3", C : "96"},
	"411113":{A : "FNC2", B : "FNC2", C : "97"},
	"411311":{A : "SHIFT_B", B : "SHIFT_A", C : "98"},
	"113141":{A : "Code_C", B : "Code_C", C : "99"},
	"114131":{A : "Code_B", B : "FNC4", C : "Code_B"},
	"311141":{A : "FNC4", B : "Code_A", C : "Code_A"},
	"411131":{A : "FNC1", B : "FNC1", C : "FNC1"},
	"211412": "A",
	"211214": "B",
	"211232": "C",
	"233111":{A : "STOP", B : "STOP", C : "STOP"},
	value: [
		"212222",
		"222122",
		"222221",
		"121223",
		"121322",
		"131222",
		"122213",
		"122312",
		"132212",
		"221213",
		"221312",
		"231212",
		"112232",
		"122132",
		"122231",
		"113222",
		"123122",
		"123221",
		"223211",
		"221132",
		"221231",
		"213212",
		"223112",
		"312131",
		"311222",
		"321122",
		"321221",
		"312212",
		"322112",
		"322211",
		"212123",
		"212321",
		"232121",
		"111323",
		"131123",
		"131321",
		"112313",
		"132113",
		"132311",
		"211313",
		"231113",
		"231311",
		"112133",
		"112331",
		"132131",
		"113123",
		"113321",
		"133121",
		"313121",
		"211331",
		"231131",
		"213113",
		"213311",
		"213131",
		"311123",
		"311321",
		"331121",
		"312113",
		"312311",
		"332111",
		"314111",
		"221411",
		"431111",
		"111224",
		"111422",
		"121124",
		"121421",
		"141122",
		"141221",
		"112214",
		"112412",
		"122114",
		"122411",
		"142112",
		"142211",
		"241211",
		"221114",
		"413111",
		"241112",
		"134111",
		"111242",
		"121142",
		"121241",
		"114212",
		"124112",
		"124211",
		"411212",
		"421112",
		"421211",
		"212141",
		"214121",
		"412121",
		"111143",
		"111341",
		"131141",
		"114113",
		"114311",
		"411113",
		"411311",
		"113141",
		"114131",
		"311141",
		"411131",
		"211412",
		"211214",
		"211232",
		"233111"]
};

Code93Encoding = {
"131112":{value:0,character:"0"},
"111213":{value:1,character:"1"},
"111312":{value:2,character:"2"},
"111411":{value:3,character:"3"},
"121113":{value:4,character:"4"},
"121212":{value:5,character:"5"},
"121311":{value:6,character:"6"},
"111114":{value:7,character:"7"},
"131211":{value:8,character:"8"},
"141111":{value:9,character:"9"},
"211113":{value:10,character:"A"},
"211212":{value:11,character:"B"},
"211311":{value:12,character:"C"},
"221112":{value:13,character:"D"},
"221211":{value:14,character:"E"},
"231111":{value:15,character:"F"},
"112113":{value:16,character:"G"},
"112212":{value:17,character:"H"},
"112311":{value:18,character:"I"},
"122112":{value:19,character:"J"},
"132111":{value:20,character:"K"},
"111123":{value:21,character:"L"},
"111222":{value:22,character:"M"},
"111321":{value:23,character:"N"},
"121122":{value:24,character:"O"},
"131121":{value:25,character:"P"},
"212112":{value:26,character:"Q"},
"212211":{value:27,character:"R"},
"211122":{value:28,character:"S"},
"211221":{value:29,character:"T"},
"221121":{value:30,character:"U"},
"222111":{value:31,character:"V"},
"112122":{value:32,character:"W"},
"112221":{value:33,character:"X"},
"122121":{value:34,character:"Y"},
"123111":{value:35,character:"Z"},
"121131":{value:36,character:"-"},
"311112":{value:37,character:"."},
"311211":{value:38,character:" "},
"321111":{value:39,character:"$"},
"112131":{value:40,character:"/"},
"113121":{value:41,character:"+"},
"211131":{value:42,character:"%"},
"121221":{value:43,character:"($)"},
"312111":{value:44,character:"(%)"},
"311121":{value:45,character:"(/)"},
"122211":{value:46,character:"(+)"},
"111141":{value:-1,character:"*"}
};
Code39Encoding = {
"111221211":{value:0,character:"0"},
"211211112":{value:1,character:"1"},
"112211112":{value:2,character:"2"},
"212211111":{value:3,character:"3"},
"111221112":{value:4,character:"4"},
"211221111":{value:5,character:"5"},
"112221111":{value:6,character:"6"},
"111211212":{value:7,character:"7"},
"211211211":{value:8,character:"8"},
"112211211":{value:9,character:"9"},
"211112112":{value:10,character:"A"},
"112112112":{value:11,character:"B"},
"212112111":{value:12,character:"C"},
"111122112":{value:13,character:"D"},
"211122111":{value:14,character:"E"},
"112122111":{value:15,character:"F"},
"111112212":{value:16,character:"G"},
"211112211":{value:17,character:"H"},
"112112211":{value:18,character:"I"},
"111122211":{value:19,character:"J"},
"211111122":{value:20,character:"K"},
"112111122":{value:21,character:"L"},
"212111121":{value:22,character:"M"},
"111121122":{value:23,character:"N"},
"211121121":{value:24,character:"O"},
"112121121":{value:25,character:"P"},
"111111222":{value:26,character:"Q"},
"211111221":{value:27,character:"R"},
"112111221":{value:28,character:"S"},
"111121221":{value:29,character:"T"},
"221111112":{value:30,character:"U"},
"122111112":{value:31,character:"V"},
"222111111":{value:32,character:"W"},
"121121112":{value:33,character:"X"},
"221121111":{value:34,character:"Y"},
"122121111":{value:35,character:"Z"},
"121111212":{value:36,character:"-"},
"221111211":{value:37,character:"."},
"122111211":{value:38,character:" "},
"121212111":{value:39,character:"$"},
"121211121":{value:40,character:"/"},
"121112121":{value:41,character:"+"},
"111212121":{value:42,character:"%"},
"121121211":{value:-1,character:"*"}
};

ExtendedEncoding = {
"/A": '!',
"/B": '"',
"/C": '#',
"/D": '$',
"/E": '%',
"/F": '&',
"/G": "'",
"/H": '(',
"/I": ')',
"/J": '*',
"/K": '+',
"/L": ',',
"/O": '/',
"/Z": ':',
"%F": ';',
"%G": '<',
"%H": '=',
"%I": '>',
"%J": '?',
"%K": '[',
"%L": "\\",
"%M": ']',
"%N": '^',
"%O": '_',
"+A": 'a',
"+B": 'b',
"+C": 'c',
"+D": 'd',
"+E": 'e',
"+F": 'f',
"+G": 'g',
"+H": 'h',
"+I": 'i',
"+J": 'j',
"+K": 'k',
"+L": 'l',
"+M": 'm',
"+N": 'n',
"+O": 'o',
"+P": 'p',
"+Q": 'q',
"+R": 'r',
"+S": 's',
"+T": 't',
"+U": 'u',
"+V": 'v',
"+W": 'w',
"+X": 'x',
"+Y": 'y',
"+Z": 'z',
"%P": "{",
"%Q": '|',
"%R": '|',
"%S": '~',
};

CodaBarEncoding = {
"0000011": "0", 
"0000110": "1", 
"0001001": "2", 
"1100000": "3", 
"0010010": "4", 
"1000010": "5", 
"0100001": "6", 
"0100100": "7", 
"0110000": "8", 
"1001000": "9", 
"0001100": "-", 
"0011000": "$", 
"1000101": ":", 
"1010001": "/", 
"1010100": ".", 
"0011111": "+", 
"0011010": "A", 
"0001011": "B", 
"0101001": "C", 
"0001110": "D"
} ;

EAN13Encoding = {
"L": {
"3211": 0,
"2221": 1,
"2122": 2,
"1411": 3,
"1132": 4,
"1231": 5,
"1114": 6,
"1312": 7,
"1213": 8,
"3112": 9
},
"G": {
"1123": 0,
"1222": 1,
"2212": 2,
"1141": 3,
"2311": 4,
"1321": 5,
"4111": 6,
"2131": 7,
"3121": 8,
"2113": 9
},
"R": {
"3211": 0,
"2221": 1,
"2122": 2,
"1411": 3,
"1132": 4,
"1231": 5,
"1114": 6,
"1312": 7,
"1213": 8,
"3112": 9
},
formats: {
"LLLLLL": 0,
"LLGLGG": 1,
"LLGGLG": 2,
"LLGGGL": 3,
"LGLLGG": 4,
"LGGLLG": 5,
"LGGGLL": 6,
"LGLGLG": 7,
"LGLGGL": 8,
"LGGLGL": 9
}
};

self.onmessage = function(e) {
	ScanImage = {
		data: new Uint8ClampedArray(e.data.scan),
		width: e.data.scanWidth,
		height: e.data.scanHeight
	};
	switch(e.data.rotation) {
		case 8:
			ScanImage.data = Rotate(ScanImage.data,ScanImage.width,ScanImage.height,-90);
			var width = e.data.scanWidth;
			ScanImage.width = ScanImage.height;
			ScanImage.height = width;
			break;
		case 6:
			ScanImage.data = Rotate(ScanImage.data,ScanImage.width,ScanImage.height,90);
			var width = e.data.scanWidth;
			ScanImage.width = ScanImage.height;
			ScanImage.height = width;
			break;
		case 3:
			ScanImage.data = Rotate(ScanImage.data,ScanImage.width,ScanImage.height,180);	
	}
	Image = {
		data: Scale(ScanImage.data,ScanImage.width,ScanImage.height),
		width: ScanImage.width/2,
		height: ScanImage.height/2
	};
	if(e.data.postOrientation) {
		postMessage({result: Image, success: "orientationData"});
	}
	availableFormats = ["Code128","Code93","Code39","EAN-13", "2Of5", "Inter2Of5", "Codabar"];
	FormatPriority = [];
	var decodeFormats = ["Code128","Code93","Code39","EAN-13", "2Of5", "Inter2Of5", "Codabar"];
	SecureCodabar = true;
	Secure2Of5 = true;
	Multiple = true;
	if(typeof e.data.multiple != 'undefined') {
		Multiple = e.data.multiple;
	}
	if(typeof e.data.decodeFormats != 'undefined') {
		decodeFormats = e.data.decodeFormats;
	}
	for(var i = 0; i < decodeFormats.length; i++) {
		FormatPriority.push(decodeFormats[i]);
	}
	CreateTable();
	CreateScanTable();
	var FinalResult = Main();
	if(FinalResult.length > 0) {
		postMessage({result: FinalResult, success: true});
	} else {
		postMessage({result: FinalResult, success: false});
	}
};
