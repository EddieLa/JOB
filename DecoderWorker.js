/* --------------------------------------------------
Javascript Only Barcode_Reader V1.5 by Eddie Larsson <https://github.com/EddieLa/BarcodeReader>

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

function CropTable(x,y,w,h){
	if(w-x<Image.width&&w-x>0) Image.table = Image.table.slice(x,w);
	if(h-y<Image.height&&h-y>0) {
		for(var i=0;i<Image.table.length;i++){
			Image.table[i] = Image.table[i].slice(y,h);
		};
	};
	if(Image.width!==Image.table.length||Image.height!==Image.table[0].length) {
		Image.width = Image.table.length;
		Image.height = Image.table[0].length;
		CreateImageData();
	}
};

function Log(message) {
	postMessage({result: message, success: "log"});
}

function flipTable() {
	for(var i = 0; i < Image.table.length; i++) {
		Image.table[i].reverse();
	}
	Image.table.reverse();
	CreateImageData();
}

function rotateTableRight() {
	var tempTable = [];
	var tempArray=[]
	for(var i=Image.table[0].length-1;i>=0;i--){
		tempArray=[];
		for(var j=0;j<Image.table.length;j++){
			tempArray.push(Image.table[j][i]);
		};
		tempTable.push(tempArray);
	};
	Image.table = tempTable;
	Image.width = Image.table.length;
	Image.height = Image.table[0].length;
	CreateImageData();
}

function rotateTableLeft() {
	var tempTable = [];
	var tempArray=[]
	for(var i=0;i < Image.table[0].length;i++){
		tempArray=[];
		for(var j=Image.table.length-1;j>=0;j--){
			tempArray.push(Image.table[j][i]);
		};
		tempTable.push(tempArray);
	};
	Image.table = tempTable;
	Image.width = Image.table.length;
	Image.height = Image.table[0].length;
	CreateImageData();
}

function RemoveDist(){
	var Distance=0;
	var Count=0;
	var DistanceHolder=[];
	var DeclineValue;
	for(var y=0;y<Image.height;y++){
		Distance=0;
		Count=0;
		for(var x=0;x<Image.width;x++){
			if((Image.table[x][y][0]+Image.table[x][y][1]+Image.table[x][y][2])/3<100){
				do{
					Count++;
					x++
					if(x>=Image.width){
						break;
					}
				}while((Image.table[x][y][0]+Image.table[x][y][1]+Image.table[x][y][2])/3<100)
				if(x<Image.width){
					DeclineValue=(Image.table[x][y][0]+Image.table[x][y][1]+Image.table[x][y][2])/3
					do{
						Distance++;
						x++
						if(x>=Image.width){
							Distance=0;
							break;
						}
					}while((Image.table[x][y][0]+Image.table[x][y][1]+Image.table[x][y][2])/3>DeclineValue)
				}
				if(Distance>Count*4){
					DistanceHolder.push(x);
				}else{
					DistanceHolder.push(0);
				}
				x=Image.width;
			}
		}
	}
	Count=0;
	for(var i=0;i<DistanceHolder.length;i++){
		Count+=DistanceHolder[i];
	}
	Count/=DistanceHolder.length;
	if(Count>20) CropTable(Math.floor(Count),0,Image.width,Image.height);
}

function verticalAreas() {
	dataCopy = new Uint8ClampedArray(Image.data);
	if(LowLight) {
		contrastBinary(dataCopy);
	} else {
		contrast(dataCopy,250);
		binary(dataCopy,100);
	}
	var mainStart = Image.width*4*(Math.round(Image.height/2));
	var cordArray = [];
	var start;
	var counter;
	for(var i = mainStart; i < mainStart+Image.width*4;i+=4) {
		if(dataCopy[i] === 0) {
			start = i;
			break;
		}
	}
	var tempCord;
	var wasWhite = false;
	var tempStart = start;
	for(var i = start; i < mainStart+Image.width*4;i+=4) {
		if(dataCopy[i] === 255) {
			counter++;
			if(wasWhite == false) {
				tempCord = i;
				wasWhite = true;
			}
			if(counter > 30) {
				if(tempStart-mainStart > 40) {
					tempStart -= 40;
				}
				cordArray.push([(tempStart-mainStart)/4,(tempCord-mainStart)/4])
				while(dataCopy[i] === 255 && i < mainStart+Image.width*4) {
					i+=4;
				}
				tempStart = i;
			}
		}else {
			counter = 0;
			wasWhite = false;
		}
	}
	return cordArray;
}

function InterestAreas(step,start){
	dataCopy = new Uint8ClampedArray(Image.data);
	if(LowLight) {
		contrastBinary(dataCopy);
	} else {
		contrast(dataCopy,250);
		binary(dataCopy,100);
	}
	var LoopExit=10;
	var percentage=6.0;
	var cordsY=0;
	var previous=-1;
	do{
		do{
			cordsY=HorizontalArea(dataCopy,cordsY,percentage)
			LoopExit--
		}while((typeof cordsY)==(typeof 5)&&LoopExit);
		if(cordsY[1]-cordsY[0]<25){
			if(percentage>1.0){
				cordsY=cordsY[1];
				percentage-=0.5;
				LoopExit=10;
			}
		}else{
			if(percentage>1.0){
				if(previous!==cordsY[0]){
					previous=cordsY[0];
					if(typeof cordsY !== typeof 5) allAreas.push(cordsY);
					cordsY=cordsY[1];
					percentage-=0.5;
					LoopExit=10;
				}else{
					cordsY=0;
					percentage-=0.5;
					LoopExit=10;
				}
			}else{
				break;
			}
		}
	}while(typeof cordsY === typeof 5)
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

function BlackEdges(threshold){
	var avrg=0;
	var whiteArray=[];
	for(var i=0;i<Image.height;i++){
		whiteArray.push([255,255,255,255]);
	}
	for(var x=0;x<Image.width;x++){
		avrg=0;
		for(var y=0;y<Image.height;y++){
			avrg+=(Image.table[x][y][0]+Image.table[x][y][1]+Image.table[x][y][2])/3
		}
		avrg/=Image.height;
		if(avrg<threshold){
			Image.table[x]=whiteArray.slice();
		}else{
			Image.table[x]=whiteArray.slice();
			Image.table[x+1]=whiteArray.slice()
			break;
		}
	};
	for(var x=Image.width-1;x>=0;x--){
		avrg=0;
		for(var y=0;y<Image.height;y++){
			avrg+=(Image.table[x][y][0]+Image.table[x][y][1]+Image.table[x][y][2])/3
		}
		avrg/=Image.height;
		if(avrg<threshold){
			Image.table[x]=whiteArray.slice();
		}else{
			break;
		}
	};
	CreateImageData();
}

function CreateTable() {
	Image.table = [];
	var tempArray=[]
	for(var i=0;i<Image.width*4;i+=4){
		tempArray=[];
		for(var j=i;j<Image.data.length;j+=Image.width*4){
			tempArray.push([Image.data[j],Image.data[j+1],Image.data[j+2],Image.data[j+3]]);
		};
		Image.table.push(tempArray);
	};
};

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
	var tempArray=[]
	var avrgRed=0;
	var avrgGreen=0;
	var avrgBlue=0;
	for(var i=0;i<Image.height-scale;i+=scale){
		for(var j=0;j<Image.width;j++){
			avrgRed=0;
			avrgGreen=0;
			avrgBlue=0;
			for(var k=i;k<i+scale;k++){
				avrgRed+=Image.table[j][k][0]
				avrgGreen+=Image.table[j][k][1]
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

function ImgProcessing() {
	var dataCopy = new Uint8ClampedArray(Image.data);
	if(LowLight) {
		contrastBinary(dataCopy);
	} else {
		contrast(dataCopy,255);
		binary(dataCopy,110);
	}
	var BlackEdge=TrimBlack(dataCopy)
	CropTable(BlackEdge[0],0,BlackEdge[1],Image.height)
	allAreas=[]
	var coordHolder;
	var tempTable=Image.table.slice();
	InterestAreas();
	if(allAreas.length===0){
		allAreas.push(averageLines());
	}
	if(Image.height-allAreas[allAreas.length-1][1]>30){
		CropTable(0,allAreas[allAreas.length-1][1],Image.width,Image.height)
		Image.width = Image.table.length;
		Image.height = Image.table[0].length;
		CreateImageData();
		InterestAreas()
		Image.table=tempTable.slice();
		Image.width = Image.table.length;
		Image.height = Image.table[0].length;
		CreateImageData();
	};
	var allTables=[];
	Image.table=tempTable.slice();
	Image.width = Image.table.length;
	Image.height = Image.table[0].length;
	for(var i=0;i<allAreas.length;i++){
		coordHolder=allAreas[i];
		if(coordHolder[1] > Image.height) coordHolder[1] = Image.height;
		CropTable(0,coordHolder[0],Image.width,coordHolder[1])
		allTables.push(Image.table.slice());
		Image.table=tempTable.slice();
		Image.width = Image.table.length;
		Image.height = Image.table[0].length;
	}
	var tempLength = allTables.length;
	for(var i = 0; i < tempLength; i++) {
		Image.table = allTables[i];
		Image.width = Image.table.length;
		Image.height = Image.table[0].length;
		CreateImageData();
		var resultVertical = verticalAreas();
		if(resultVertical.length > 1) {
			tempSecondTable = Image.table.slice();
			CropTable(0,0,resultVertical[0][1],Image.height);
			allTables[i] = Image.table.slice();
			for(var j = 1; j < resultVertical.length; j++) {
				Image.table = tempSecondTable.slice();
				Image.width = Image.table.length;
				Image.height = Image.table[0].length;
				CropTable(resultVertical[j][0],0,resultVertical[j][1],Image.height);
				allTables.push(Image.table.slice());
			}
		}
	}
	return allTables;
}

function contrast(data,amount) {
	amount = Math.max(0,Math.min(255,parseFloat(amount)||127));

	var TempArray = [];
	for (var i=0; i<256; i++) {
		var value = Math.tan(amount * Math.PI/180) * (i-127) + 127;
		if (value > 255) {
			value = 255;
		} else if (value < 0) {
			value = 0;
		}
		TempArray[i] = value | 0;
	}

	for (var i=0, len=Image.width*Image.height*4; i<len; i+=4) {
		data[i]   = TempArray[data[i]];
		data[i+1] = TempArray[data[i+1]];
		data[i+2] = TempArray[data[i+2]];
	}
}

function binary(data,threshold) {
	threshold = Math.max(0,Math.min(255,parseFloat(threshold)||127));

	var ave;

	for (var i=0, len=Image.width*Image.height*4; i<len; i+=4) {
		ave = (data[i] + data[i+1] + data[i+2]) / 3;
		if (ave < threshold) {
			data[i] = data[i+1] = data[i+2] = 0;
		} else {
			data[i] = data[i+1] = data[i+2] = 255;
		}
		data[i+3] = 255;
	}
}

function TrimBlack(img){
	var x_coordinates=[]
	var count=0;
	for(var j=0;j<img.length;j+=4){
		for(var i=j;i<img.length;i+=Image.width*4){
			count+=img[i];
		}
		if(count/Image.height>100){
			x_coordinates.push((j/4)%Image.width);
			break;
		}
		count=0;
	}
	count=0;
	for(var j=(Image.width*4-4);j>0;j-=4){
		for(var i=j;i<img.length;i+=Image.width*4){
			count+=img[i];
		}
		if(count/Image.height>100){
			x_coordinates.push((j/4)%Image.width);
			break;
		}
		count=0;
	}

	return x_coordinates;
}

function HorizontalArea(img,begin,area){
	begin = typeof begin !== 'undefined' ? begin : 1;
	begin = begin>0 ? begin : 1;
	var BlackArea=0;
	var start=0;
	var count=0;
	for(var i=(begin*4*Image.width);i<img.length/area;i+=Image.width*4){
		for(var j=0;j<Image.width*4;j+=4){
			count+=img[j+i];
		}
		if(count/Image.width>230){
			start=i;
			break;
		}
		count=0;
	}
	var ending=0;
	count=0;
	if(start){
		for(var i=start;i<img.length;i+=Image.width*4){
			for(var j=0;j<Image.width*4;j+=4){
				if(img[j+i]===0){
					count++;
				}
			}
			if(count>Image.width/5){
				BlackArea=i;
				break;
			}
			count=0;
		}
	}else{
		for(var i=(begin*4*Image.width);i<img.length;i+=Image.width*4){
			for(var j=0;j<Image.width*4;j+=4){
				count+=img[j+i];
			}
			if(count/Image.width>230){
				ending=i;
				break;
			}
			count=0;
		}
	}
	if(start){
		return Math.round(BlackArea/4/Image.width);
	}else{
		return [begin,Math.round(ending/4/Image.width)];
	}
}

function averageLines(){
	var average=0;
	var allAverage=[];
	for(var i=0;i<Image.data.length;i+=Image.width*4){
		average=0;
		for(var j=i;j<(Image.width*4+i);j+=4){
			average+=(Image.data[j]+Image.data[j+1]+Image.data[j+2])/3
		}
		average/=Image.width;
		allAverage.push(average);
	}
	var Ycoords=[]
	average=0;
	var comparison=allAverage[0]
	for(var i=1;i<allAverage.length;i++){
		if(Math.abs(allAverage[i]-comparison)>13){
			Ycoords.push([average,i-1]);
			average=i;
			comparison=allAverage[i];
		}
	}
	average=0;
	var result=[0,Image.height];
	for(var i=0;i<Ycoords.length;i++){
		if((Ycoords[i][1]-Ycoords[i][0])>average){
			average=Ycoords[i][1]-Ycoords[i][0];
			result=Ycoords[i];
		}
	}
	return result;
}

function Main(){
	var tableSelection=ImgProcessing();
	var successfulDecodings = 0;
	for(var z=0;z<tableSelection.length;z++){
		Image.table=tableSelection[z];
		Image.width = Image.table.length;
		Image.height = Image.table[0].length;
		CreateImageData();
		var Selection = averageLines();
		CropTable(0,Selection[0],Image.width,Selection[1]);
		BlackEdges(100);
		RemoveDist();
		var scaled = ScaleHeight(30);
		var variationData;
		var incrmt=0;
		var format = "";
		var eanStatistics = {};
		var eanOrder = [];
		Selection = false;
		do{
			variationData = yStraighten(scaled.subarray(incrmt,incrmt+Image.width*4))
			for(var i = 0; i < FormatPriority.length; i++) {
				if(format != "EAN-13") {
					if(FormatPriority[i] == "Code128") {
						Selection=BinaryString(variationData,0);
						if(Selection.string) {
							format = Selection.format;
							Selection = Selection.string;
						}
					}
					if(FormatPriority[i] == "Code93") {
						Selection=BinaryString(variationData,1);
						if(Selection) format = "Code93";
					}
					if(FormatPriority[i] == "Code39") {
						Selection=BinaryString(variationData,2);
						if(Selection) format = "Code39";
					}
					if(FormatPriority[i] == "2Of5" || FormatPriority[i] == "Inter2Of5") {
						if(FormatPriority[i] == "2Of5") {
							Selection = BinaryString(variationData, 4);
							if(Selection) format = "Standard 2 of 5";
						} else {
							Selection = BinaryString(variationData, 5);
							if(Selection) format = "Interleaved 2 of 5";
						}
					}
				}
				if(FormatPriority[i] == "EAN-13") {
					var tempObj = BinaryString(variationData,3);
					Selection=tempObj.string;
					if(Selection){
						format = "EAN-13";
						if(typeof eanStatistics[Selection] == 'undefined') {
							eanStatistics[Selection] = {count: 1,correction: tempObj.correction};
							eanOrder.push(Selection);
						} else {
							eanStatistics[Selection].count = eanStatistics[Selection].count+1;
							eanStatistics[Selection].correction = eanStatistics[Selection].correction + tempObj.correction;
						}
						if(!Ean13Speed) Selection = false;
					}
				}
				if(Selection) break;
			}
			incrmt+=Image.width*4;
		}while(!Selection&&incrmt<scaled.length)
		if(Selection&&format != "EAN-13") {
			postMessage({result: [format + ": " + Selection], success: true, finished: false});
			successfulDecodings++;
		}
		if(format == "EAN-13" && !Ean13Speed) Selection = false;
		if(!Selection){
			EnlargeTable(4,2);
			incrmt=0;
			scaled = ScaleHeight(20);
			do{
				variationData = yStraighten(scaled.subarray(incrmt,incrmt+Image.width*4))
				for(var i = 0; i < FormatPriority.length; i++) {
					if(format != "EAN-13") {
						if(FormatPriority[i] == "Code128") {
							Selection=BinaryString(variationData,0);
							if(Selection.string) {
								format = Selection.format;
								Selection = Selection.string;
							}
						}
						if(FormatPriority[i] == "Code93") {
							Selection=BinaryString(variationData,1);
							if(Selection) format = "Code93";
						}
						if(FormatPriority[i] == "Code39") {
							Selection=BinaryString(variationData,2);
							if(Selection) format = "Code39";
						}
						if(FormatPriority[i] == "2Of5" || FormatPriority[i] == "Inter2Of5") {
							if(FormatPriority[i] == "2Of5") {
								Selection = BinaryString(variationData, 4);
								if(Selection) format = "Standard 2 of 5";
							} else {
								Selection = BinaryString(variationData, 5);
								if(Selection) format = "Interleaved 2 of 5";
							}
						}
					}
					if(FormatPriority[i] == "EAN-13") {
						var tempObj = BinaryString(variationData,3);
						Selection=tempObj.string;
						if(Selection){
							format = "EAN-13";
							if(typeof eanStatistics[Selection] == 'undefined') {
								eanStatistics[Selection] = {count: 1,correction: tempObj.correction};
								eanOrder.push(Selection);
							} else {
								eanStatistics[Selection].count = eanStatistics[Selection].count+1;
								eanStatistics[Selection].correction = eanStatistics[Selection].correction + tempObj.correction;
							}
							if(!Ean13Speed) Selection = false;
						}
					}
					if(Selection) break;
				}
				incrmt+=Image.width*4;
			}while(!Selection&&incrmt<scaled.length)
			if(Selection && format != "EAN-13") {
				postMessage({result: [format + ": " + Selection], success: true, finished: false});
				successfulDecodings++;
			}
		}
		if(format == "EAN-13") {
			var points = {};
			for(var key in eanStatistics) {
				eanStatistics[key].correction = eanStatistics[key].correction/eanStatistics[key].count;
				var pointTemp = eanStatistics[key].correction;
				if(Ean13Speed) {
					pointTemp -= eanStatistics[key].count*4;
				} else {
					pointTemp -= eanStatistics[key].count;
				}
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
			if(Selection) {
				postMessage({result: [format + ": " + Selection], success: true, finished: false});
				successfulDecodings++;
			}
		}
		if(successfulDecodings >= DecodeNr) break;
	}
	return [];
}

function yStraighten(img){
	var average=0;
	var threshold;
	var newImg = new Uint8ClampedArray(Image.width*150*4);
	for(var i=0;i<newImg.length;i++){
		newImg[i]=255;
	}
	for(var i=0;i<Image.width*4;i+=4){
		threshold=180
		average=(img[i]+img[i+1]+img[i+2])/3;
		average+=(img[i+4]+img[i+5]+img[i+6])/3;
		average/=2;
		for(var j=i;j<newImg.length;j+=Image.width*4){
			if(average<threshold){
				newImg[j]=newImg[j+1]=newImg[j+2]=0;
			}
			threshold--;
		}
	}
	return newImg;
}

function TwoOfFiveStartEnd(values, start) {
	if(values.length < 5 || values.length > 6) return false;
	var max = [[0,0],[0,0]];
	for(var u = 0; u < values.length; u++) {
		if(values[u] > max[0][0]) {
			max[0][0] = values[u];
			var prevpos = max[0][1];
			max[0][1] = u;
			u = prevpos;
		}
		if(values[u] > max[1][0] && u != max[0][1]) {
			max[1][0] = values[u];
			max[1][1] = u;
		}
	}
	var wideAvrg = max[0][0] + max[1][0];
	wideAvrg /= 2;
	if(max[0][0] / wideAvrg > 1.2 || max[0][0] / wideAvrg < 0.8) return false;
	if(max[1][0] / wideAvrg > 1.2 || max[1][0] / wideAvrg < 0.8) return false;
	var narrowAvrg = 0;
	for(var i = 0; i < values.length; i++) {
		if(i == max[0][1] || i == max[1][1]) continue;
		narrowAvrg += values[i];
	}
	narrowAvrg /= values.length - 2;
	for(var i = 0; i < values.length; i++) {
		if(i == max[0][1] || i == max[1][1]) continue;
		if(values[i] / narrowAvrg > 1.4 || values[i] / narrowAvrg < 0.6) return false;
	}
	if(start) {
		return (max[0][1] == 0 || max[0][1] == 2) && (max[1][1] == 0 || max[1][1] == 2);
	}else {
		return (max[0][1] == 0 || max[0][1] == 4) && (max[1][1] == 0 || max[1][1] == 4);
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
			if(values[i]/average < 0.8 || values[i]/average > 1.2) return false;
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

function contrastBinary(data) {
    var min = 127 * 3;
    var max = 128 * 3;
    for (var i = 0, len = Image.width * Image.height * 4; i < len; i += 4) {
        var val = data[i] + data[i + 1] + data[i + 2];
        if (val < min) {
            min = val;
        } else if (val > max) {
            max = val;
        }
    }
    var threshold = (max + min) / 2;
    for (var i = 0, len = Image.width * Image.height * 4; i < len; i += 4) {
        ave = (data[i] + data[i + 1] + data[i + 2]);
        if (ave < threshold) {
            data[i] = data[i + 1] = data[i + 2] = 0;
        } else {
            data[i] = data[i + 1] = data[i + 2] = 255;
        }
        data[i + 3] = 255;
    }
}

function BinaryString(img,type){
	var binaryString=[];
	var binTemp=[];
	var count=0;
	var bars;
	var len;
	var totalBars;
	var skipWhite = false;
	if(type == 0) {
		totalBars = 6;
	}
	if(type == 1) {
		totalBars = 6;
	}
	if(type == 2) {
		totalBars = 9;
	}
	if(type == 3) {
		totalBars = 4;
	}
	if(type == 4) {
		totalBars = 5;
	}
	if(type == 5) {
		totalBars = 10;
	}
	var trigger=false;
	var container=255;
	var firstEan = false;
	var EanCounter = 0;
	var corrections = 0;
	for(var j=0;j<img.length - Image.width*4;j+=Image.width*4){
		var SlicedArray = img.subarray(j,j+Image.width*4)
		len = BarLength(SlicedArray);
		corrections = 0
		if(type == 0 || type == 4) len/=2;
		binaryString=[];
		bars=0;
		binTemp=[]
		binTempInter = []
		trigger=false;
		var switchTotal = false;
		for(var i=0;i<SlicedArray.length;i+=4){
			count=0;
			if(!trigger&&SlicedArray[i]===0){
				trigger=true;
				firstEan = true;
				if(type == 4) {
					container=SlicedArray[i]
					var TwoOfFiveBin = [0,0,0,0,0,0];
					do{
						TwoOfFiveBin[count] = TwoOfFiveBin[count] + 1;
						i+=4;
						if(container != SlicedArray[i]) {
							count++;
							container=SlicedArray[i]
						}
					}while(count < 6 && i < SlicedArray.length)
					if(!TwoOfFiveStartEnd(TwoOfFiveBin, true)) {
						break;
					}
					count = 0;
				}
				if(type == 5) {
					container=SlicedArray[i]
					var interBin = [0,0,0,0];
					do{
						interBin[count] = interBin[count] + 1;
						i+=4;
						if(container != SlicedArray[i]) {
							count++;
							container=SlicedArray[i]
						}
					}while(count < 4 && i < SlicedArray.length)
					if(!CheckInterleaved(interBin, true)) break;
					count = 0;
				}
			}
			if(trigger){
				container=SlicedArray[i]
				do{
					count++;
					i+=4;
					if(type == 5 && count/len > 5) {
						var checkData = []
						for(var q = 0; q < binTemp.length; q++) {
							checkData.push(binTemp[q]);
							if(q >= binTempInter.length) continue;
							checkData.push(binTempInter[q]);
						}
						if(!CheckInterleaved(checkData, false)) {
							binaryString = [];
							break;
						} else {
							break;
						}
					}
					if(i >= SlicedArray.length) break;
				}while(SlicedArray[i]===container)
				if(type == 2 && skipWhite) {
					skipWhite = false;
					continue;
				}
				if(type != 4 || type != 5) count /= len;
				if(type == 5) {
					if(container == 0) {
						binTemp.push(count);
					} else {
						binTempInter.push(count);
					}
				} else {
					binTemp.push(count)
				}
				bars++;
				if(type == 4 && SlicedArray[i] == 255) {
					var tempCounter = 0;
					do{
						tempCounter++;
						i+=4;
						if(tempCounter/len > 3) {
						if(!TwoOfFiveStartEnd(binTemp, false)) {
							binaryString = [];
							break;
						} else {
							break;
						}
					}
					}while(SlicedArray[i] == 255 && i < SlicedArray.length)
				}
				if(type == 4 && i >= SlicedArray.length - 4) {
					do {
						i-=4;
					}while(SlicedArray[i] == 255 && i >= 0)
					container = SlicedArray[i];
					var TwoOfFiveBin = [0,0,0,0,0];
					count = 0;
					do{
						TwoOfFiveBin[count] = TwoOfFiveBin[count] + 1;
						i-=4;
						if(container != SlicedArray[i]) {
							count++;
							container=SlicedArray[i]
						}
					}while(count < 5 && i >= 0)
					if(!TwoOfFiveStartEnd(TwoOfFiveBin, false)) {
						binaryString = [];
						break;
					} else {
						break;
					}
					count = 0;
				}
				if(bars == 3 && type == 3 && firstEan) {
					bars = 0;
					binTemp = [];
					firstEan = false;
				}
				if(bars===totalBars){
					if(type == 3 && EanCounter == 6) {
						EanCounter = 0;
						bars = 0;
						if(switchTotal) {
							totalBars = 4;
						}
						binTemp = [];
						continue;
					}
					if(EanCounter == 5 && !switchTotal) {
						switchTotal = true;
						totalBars = 5;
					}
					binaryString.push(binTemp)
					bars=0;
					binTemp=[]
					if(type == 5) {
						binaryString.push(binTempInter);
						binTempInter = [];
					}
					if(type == 3) EanCounter++;
					if(type == 2) skipWhite = true;
				}
				i-=4;
				if(type == 3 && binaryString.length > 12) break;
			}
		}
		binTemp=Distribution(binaryString,type);
		if(type == 3) {
			binaryString = binTemp.data;
			corrections = binTemp.correction;
		}else {
			binaryString = binTemp;
		}
		if(binaryString.length>4){
			if(type == 0) {
				if(CheckCode128(binaryString)){
					binaryString = DecodeCode128(binaryString);
					break;
				}
			}else if(type == 1) {
				if(CheckCode93(binaryString)) {
					binaryString = DecodeCode93(binaryString);
					break;
				}
			}else if(type == 2) {
				if(CheckCode39(binaryString)) {
					binaryString = DecodeCode39(binaryString);
					break;
				}
			} else if(type == 3) {
				var tempString = DecodeEAN13(binaryString);
				if(tempString) {
					if(tempString.length === 13) {
						binaryString = tempString;
						break;
					}
				}
			} else if(type == 4 || type == 5) {
				var tempString = Decode2Of5(binaryString);
				if(tempString) {
					binaryString = tempString;
					break;
				}
			}
		}
	}
	if(type == 0) {
		if(typeof binaryString.string  === 'string') {
			return binaryString;
		} else {
			return false;
		}
	}
	if(typeof binaryString  === 'string'){
		if(type == 3) {
			return {string: binaryString, correction: corrections};
		} else {
			return binaryString;
		}
	}else{
		return false;
	}
}

function BarLength(img){
	var counter=0;
	for(var j=0;j<img.length;j+=4){
		if(img[j]===0){
			do{
				counter++;
				j+=4;
			}while(img[j]===0)
			break;
		}
	}
	return counter;
}

function Distribution(totalBinArray,type){
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
	}
	for(var k = 0; k < totalBinArray.length; k++) {
		var BinArray = totalBinArray[k];
		var sum=0;
		sum = 0;
		var counter = 0;
		var tempBin=[]
		var narrowArr = [];
		var wideArr = [];
		if(type == 4 || type == 5) {
			var max = [[0,0], [0,0]];
			for(var i = 0; i < BinArray.length; i++) {
				if(!Number.isFinite(BinArray[i])) return [];
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
				wideAvrg = max[0][0] + max[1][0];
				wideAvrg /= 2;
				if(max[0][0] / wideAvrg > 1.2 || max[0][0] / wideAvrg < 0.8) return [];
				if(max[1][0] / wideAvrg > 1.2 || max[1][0] / wideAvrg < 0.8) return [];
				narrowAvrg = 0;
				for(var i = 0; i < BinArray.length; i++) {
					if(i == max[0][1] || i == max[1][1]) continue;
					narrowAvrg += BinArray[i];
				}
				narrowAvrg /= 3;
				for(var i = 0; i < BinArray.length; i++) {
					if(i == max[0][1] || i == max[1][1]) continue;
					if(BinArray[i] / narrowAvrg > 1.2 || BinArray[i] / narrowAvrg < 0.7) return [];
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
			counter++
		}
		if(type === 2) {
			var indexCount = [];
			for(var i = 0; i < 3; i++) {
				var max = 0;
				var prevIndex;
				for(var j = 0; j < BinArray.length; j++) {
					if(indexCount.indexOf(j) != -1) continue;
					if(BinArray[j] > max) {
						prevIndex=j;
						max = BinArray[j];
					}
				}
				wideArr.push(max);
				indexCount.push(prevIndex);
			}
			for(var j = 0; j < BinArray.length; j++) {
				if(indexCount.indexOf(j) === -1) {
					narrowArr.push(BinArray[j]);
				}
			}
			var minAvrg = 0;
			for(var j = 0; j < narrowArr.length; j++) {
				minAvrg += narrowArr[j];
			}
			minAvrg/=narrowArr.length;
			var maxAvrg = 0;
			for(var j = 0; j < wideArr.length; j++) {
				maxAvrg += wideArr[j];
			}
			maxAvrg/=wideArr.length;
			maxLength = maxAvrg/minAvrg;
		}
		counter=0;
		while(counter<totalBars){
			tempBin.push((BinArray[counter]/sum)*total);
			counter++;
		}
		counter=0;
		while(counter<totalBars){
			if(type == 2) {
				tempBin[counter] = Math.abs(1-tempBin[counter]) < Math.abs(maxLength - tempBin[counter]) ? 1 : 2;
			} else {
				tempBin[counter] = tempBin[counter]>maxLength ? maxLength : tempBin[counter];
				tempBin[counter] = tempBin[counter]<1 ? 1 : tempBin[counter];
				tempBin[counter]=Math.round(tempBin[counter]);
			}
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
	var failSafe = checksum != -1;
	var summarizer = Code128Encoding.value.indexOf(string[0].join(""));
	failSafe = summarizer===-1 ? false : failSafe;
	for(var i=1;i<(string.length-2);i++){
		summarizer+=Code128Encoding.value.indexOf(string[i].join(""))*i
		failSafe = Code128Encoding.value.indexOf(string[i].join(""))===-1 ? false : failSafe;
	}
	return (summarizer%103===checksum)&&failSafe;
}

function Decode2Of5(string) {
	var result = "";
	for(var i = 0; i < string.length; i++) {
		if(TwoOfFiveEncoding.indexOf(string[i].join("")) == -1) return false;
		result += TwoOfFiveEncoding.indexOf(string[i].join(""));
	}
	return result;
}

function DecodeEAN13(string) {
	if(string.length != 12) return false;
	var leftSide = string.slice(0,6);
	var trigger = false;
	var rightSide = string.slice(6,string.length);
	for(var i = 0; i < leftSide.length; i++) {
		var string = "";
		for(var j = 0; j < leftSide[i][0]; j++) {
			string += "0";
		}
		for(var j = 0; j < leftSide[i][1]; j++) {
			string += "1";
		}
		for(var j = 0; j < leftSide[i][2]; j++) {
			string += "0";
		}
		for(var j = 0; j < leftSide[i][3]; j++) {
			string += "1";
		}
		leftSide[i] = string;
		if(leftSide[i].length != 7){
			trigger = true;
			break;
		}
	}
	if(trigger) return false;
	for(var i = 0; i < rightSide.length; i++) {
		var string = "";
		for(var j = 0; j < rightSide[i][0]; j++) {
			string += "1";
		}
		for(var j = 0; j < rightSide[i][1]; j++) {
			string += "0";
		}
		for(var j = 0; j < rightSide[i][2]; j++) {
			string += "1";
		}
		for(var j = 0; j < rightSide[i][3]; j++) {
			string += "0";
		}
		rightSide[i] = string;
		if(rightSide[i].length != 7){
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
			special = true;
			specialchar = character;
			continue;
		}
		if(special) {
			if(typeof ExtendedEncoding[specialchar+character] == 'undefined') {
				if(ExtendedExceptions.indexOf(character) != -1) resultString += character;
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
				if(ExtendedExceptions.indexOf(character) != -1) resultString += character;
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
	var set = Code128Encoding[string[0].join("")]
	var symbol;
	var Code128Format = "Code128";
	var resultString="";
	for(var i=1;i<(string.length-2);i++){
		symbol=Code128Encoding[string[i].join("")][set];
		switch(symbol){
			case "FNC1":
				if(i == 1) Code128Format = "GS1-128"
			case "FNC2":
			case "FNC3":
			case "FNC4":
				break;
			case "SHIFT_B":
				i++;
				resultString+=Code128Encoding[string[i].join("")]["B"]
				break;
			case "SHIFT_A":
				i++;
				resultString+=Code128Encoding[string[i].join("")]["A"]
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
}

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
}

ExtendedExceptions = ["A","B","C","D","E","F","G","H","I","J","K","L","M","N","O","P","Q","R","S","T","U","V","W","X","Y","Z","0","1","2","3","4","5","6","7","8","9","-","."];

EAN13Encoding = {
"L": {
"0001101": 0,
"0011001": 1,
"0010011": 2,
"0111101": 3,
"0100011": 4,
"0110001": 5,
"0101111": 6,
"0111011": 7,
"0110111": 8,
"0001011": 9
},
"G": {
"0100111": 0,
"0110011": 1,
"0011011": 2,
"0100001": 3,
"0011101": 4,
"0111001": 5,
"0000101": 6,
"0010001": 7,
"0001001": 8,
"0010111": 9
},
"R": {
"1110010": 0,
"1100110": 1,
"1101100": 2,
"1000010": 3,
"1011100": 4,
"1001110": 5,
"1010000": 6,
"1000100": 7,
"1001000": 8,
"1110100": 9
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
}

self.onmessage = function(e) {
	Image = {
		data: new Uint8ClampedArray(e.data.ImageData),
		width: e.data.Width,
		height: e.data.Height
	}
	FormatPriority = ["Code128","Code93","Code39","EAN-13", "2Of5", "Inter2Of5"];
	Secure2Of5 = true;
	Ean13Speed = true;
	LowLight = false;
	if(typeof e.data.LowLight != 'undefined') LowLight = e.data.LowLight;
	if(typeof e.data.Ean13Speed != 'undefined') Ean13Speed = e.data.Ean13Speed;
	if(typeof e.data.Secure2Of5 != 'undefined') Secure2Of5 = e.data.Secure2Of5;
	DecodeNr = Number.POSITIVE_INFINITY;
	if(typeof e.data.DecodeNr != 'undefined') {
		DecodeNr = e.data.DecodeNr;
	}
	if(typeof e.data.Decode != 'undefined') {
		FormatPriority = e.data.Decode;
	}
	CreateTable();
	switch(e.data.cmd) {
		case "flip":
			flipTable();
			break;
		case "right":
			rotateTableRight();
			break;
		case "left":
			rotateTableLeft();
			break;
		case "normal":
			break;	
	}
	Main();
	postMessage({result: [], success: false, finished: true});
}
