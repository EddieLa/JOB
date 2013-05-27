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

function InterestAreas(step,start){
	dataCopy = new Uint8ClampedArray(Image.data);
	contrast(dataCopy,250);
	binary(dataCopy,100)
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
				cordsY=0;
				percentage-=0.2;
				LoopExit=10;
			}
		}else{
			if(percentage>1.0){
				if(previous!==cordsY[0]){
					previous=cordsY[0];
					if(typeof cordsY !== typeof 5) allAreas.push(cordsY);
					cordsY=0;
					percentage-=0.2;
					LoopExit=10;
				}else{
					cordsY=0;
					percentage-=0.2;
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
	contrast(dataCopy,255);
	binary(dataCopy,110);
	var BlackEdge=TrimBlack(dataCopy)
	CropTable(BlackEdge[0],0,BlackEdge[1],Image.height)
	allAreas=[]
	var coordHolder;
	InterestAreas();
	var tempTable=Image.table.slice();
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
	var allTables=[]
	for(var i=0;i<allAreas.length;i++){
		coordHolder=allAreas[i];
		CropTable(0,coordHolder[0],Image.width,coordHolder[1])
		allTables.push(Image.table.slice());
		Image.table=tempTable.slice();
		Image.width = Image.table.length;
		Image.height = Image.table[0].length;
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
};

function Main(){
	var tableSelection=ImgProcessing();
	var allResults=[]
	for(var z=0;z<tableSelection.length;z++){
		Image.table=tableSelection[z];
		Image.width = Image.table.length;
		Image.height = Image.table[0].length;
		CreateImageData();
		var Selection = averageLines()
		CropTable(0,Selection[0],Image.width,Selection[1]);
		BlackEdges(100)
		RemoveDist()
		var incrmt=0;
		var scaled = ScaleHeight(30);
		do{
			Selection=BinaryString(yStraighten(scaled.subarray(incrmt,incrmt+Image.width*4)));
			incrmt+=Image.width*4;
		}while(!Selection&&incrmt<scaled.length)
		if(Selection) allResults.push(Selection);
		if(!Selection){
			EnlargeTable(4,2);
			incrmt=0;
			scaled = ScaleHeight(20);
			do{
				Selection=BinaryString(yStraighten(scaled.subarray(incrmt,incrmt+Image.width*4)));
				incrmt+=Image.width*4;
			}while(!Selection&&incrmt<scaled.length)
			if(Selection) allResults.push(Selection);
		}
	}
	if(allResults.length>0){
		return allResults.join("<br />");
	}else{
		return false;
	}
}

function yStraighten(img){
	var average=0;
	var threshold;
	var newImg = new Uint8ClampedArray(Image.width*150*4);
	for(var i=0;i<newImg.length;i++){
		newImg[i]=255;
	}
	for(var i=0;i<Image.width*4-4;i+=4){
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

function BinaryString(img){
	var binaryString=[];
	var binTemp=[];
	var count=0;
	var sixth=0
	var len;
	var trigger=false;
	var container=255;
	for(var j=0;j<img.length;j+=Image.width*4){
		var SlicedArray = img.subarray(j,j+Image.width*4)
		len = BarLength(SlicedArray)/2;
		binaryString=[];
		sixth=0;
		binTemp=[]
		trigger=false;
		for(var i=0;i<SlicedArray.length;i+=4){
			count=0;
			if(!trigger&&SlicedArray[i]===0){
				trigger=true;
			}
			if(trigger){
				container=SlicedArray[i]
				do{
					count++;
					i+=4;
				}while(SlicedArray[i]===container)
				if(count/=len<10){
					binTemp.push(count)
					sixth++;
				}
				if(sixth===6){
					binTemp=Distribution(binTemp)
					binaryString.push(binTemp)
					sixth=0;
					binTemp=[]
				}
				i-=4;
			}
		}
		if(binaryString.length>5){
			if(CheckBinary(binaryString)){
				binaryString = BinDecode(binaryString);
				break;
			}
		}
	}
	if(typeof binaryString  === 'string'){
		return binaryString;
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

function Distribution(BinArray){
	var sum=0;
	var counter = 0;
	var tempBin=[]
	while(counter<6){
		sum+=BinArray[counter];
		counter++
	}
	counter=0;
	while(counter<6){
		tempBin.push((BinArray[counter]/sum)*11);
		counter++;
	}
	counter=0;
	while(counter<6){
		tempBin[counter] = tempBin[counter]>4 ? 4 : tempBin[counter];
		tempBin[counter] = tempBin[counter]<1 ? 1 : tempBin[counter];
		tempBin[counter]=Math.round(tempBin[counter]);
		counter++;
	}
	return tempBin;
}

function CheckBinary(string){
	var checksum=string[string.length-2].join("");
	checksum = Encoding.value.indexOf(checksum);
	var failSafe = true;
	var summarizer = Encoding.value.indexOf(string[0].join(""));
	failSafe = summarizer===-1 ? false : failSafe;
	for(var i=1;i<(string.length-2);i++){
		summarizer+=Encoding.value.indexOf(string[i].join(""))*i
		failSafe = Encoding.value.indexOf(string[i].join(""))===-1 ? false : failSafe;
	}
	return (summarizer%103===checksum)&&failSafe;
}

function BinDecode(string){
	var set = Encoding[string[0].join("")]
	var symbol;
	var resultString="";
	for(var i=1;i<(string.length-2);i++){
		symbol=Encoding[string[i].join("")][set];
		switch(symbol){
			case "FNC1":
			case "FNC2":
			case "FNC3":
			case "FNC4":
				break;
			case "SHIFT_B":
				i++;
				resultString+=Encoding[string[i].join("")]["B"]
				break;
			case "SHIFT_A":
				i++;
				resultString+=Encoding[string[i].join("")]["A"]
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
	return resultString;
}

Encoding = {
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

self.onmessage = function(e) {
	Image = {
		data: new Uint8ClampedArray(e.data),
		width: 640,
		height: 480
	}
	CreateTable();
	var FinalResult = Main();
	postMessage(FinalResult);
}