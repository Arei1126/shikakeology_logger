`use strict`
//const PageNo = 55;
var PageNo = 1;
var GrainMag = 0;

const soi = new Uint8Array([0xff, 0xd8]);
const app0 = new Uint8Array([0xff,0xe0,0x00,0x10,0x4a,0x46,0x49,0x46,0x00,0x01,0x01,0x01,0x01,0x2c,0x01,0x2c,0x00,0x00]);
const dqt0 = new Uint8Array([0xff,0xdb,0x00,0x43,0x00]);
const dqt1 = new Uint8Array([0xff,0xdb,0x00,0x43,0x01]);
const sof = new Uint8Array([0xff,0xc0,0x00,0x11,0x08,0x00,0xf0,0x01,0xe0,0x03,0x01,0x32,0x00,0x02,0x11,0x01,0x03,0x11,0x01]);
const dht = new Uint8Array([
0xff,0xc4,0x00,0x1f,0x00,
0x00,0x01,0x05,0x01,0x01,0x01,0x01,0x01,0x01,0x00,0x00,0x00,0x00,0x00,0x00,0x00,
0x00,0x01,0x02,0x03,0x04,0x05,0x06,0x07,0x08,0x09,0x0a,0x0b,

0xff,0xc4,0x00,0xb5,0x10,
0x00,0x02,0x01,0x03,0x03,0x02,0x04,0x03,0x05,0x05,0x04,0x04,0x00,0x00,0x01,0x7d,
0x01,0x02,0x03,0x00,0x04,0x11,0x05,0x12,0x21,0x31,0x41,0x06,0x13,0x51,0x61,0x07,
0x22,0x71,0x14,0x32,0x81,0x91,0xa1,0x08,0x23,0x42,0xb1,0xc1,0x15,0x52,0xd1,0xf0,
0x24,0x33,0x62,0x72,0x82,0x09,0x0a,0x16,0x17,0x18,0x19,0x1a,0x25,0x26,0x27,0x28,
0x29,0x2a,0x34,0x35,0x36,0x37,0x38,0x39,0x3a,0x43,0x44,0x45,0x46,0x47,0x48,0x49,
0x4a,0x53,0x54,0x55,0x56,0x57,0x58,0x59,0x5a,0x63,0x64,0x65,0x66,0x67,0x68,0x69,
0x6a,0x73,0x74,0x75,0x76,0x77,0x78,0x79,0x7a,0x83,0x84,0x85,0x86,0x87,0x88,0x89,
0x8a,0x92,0x93,0x94,0x95,0x96,0x97,0x98,0x99,0x9a,0xa2,0xa3,0xa4,0xa5,0xa6,0xa7,
0xa8,0xa9,0xaa,0xb2,0xb3,0xb4,0xb5,0xb6,0xb7,0xb8,0xb9,0xba,0xc2,0xc3,0xc4,0xc5,
0xc6,0xc7,0xc8,0xc9,0xca,0xd2,0xd3,0xd4,0xd5,0xd6,0xd7,0xd8,0xd9,0xda,0xe1,0xe2,
0xe3,0xe4,0xe5,0xe6,0xe7,0xe8,0xe9,0xea,0xf1,0xf2,0xf3,0xf4,0xf5,0xf6,0xf7,0xf8,
0xf9,0xfa,

0xff,0xc4,0x00,0x1f,0x01,
0x00,0x03,0x01,0x01,0x01,0x01,0x01,0x01,0x01,0x01,0x01,0x00,0x00,0x00,0x00,0x00,
0x00,0x01,0x02,0x03,0x04,0x05,0x06,0x07,0x08,0x09,0x0a,0x0b,

0xff,0xc4,0x00,0xb5,0x11,
0x00,0x02,0x01,0x02,0x04,0x04,0x03,0x04,0x07,0x05,0x04,0x04,0x00,0x01,0x02,0x77,
0x00,0x01,0x02,0x03,0x11,0x04,0x05,0x21,0x31,0x06,0x12,0x41,0x51,0x07,0x61,0x71,
0x13,0x22,0x32,0x81,0x08,0x14,0x42,0x91,0xa1,0xb1,0xc1,0x09,0x23,0x33,0x52,0xf0,
0x15,0x62,0x72,0xd1,0x0a,0x16,0x24,0x34,0xe1,0x25,0xf1,0x17,0x18,0x19,0x1a,0x26,
0x27,0x28,0x29,0x2a,0x35,0x36,0x37,0x38,0x39,0x3a,0x43,0x44,0x45,0x46,0x47,0x48,
0x49,0x4a,0x53,0x54,0x55,0x56,0x57,0x58,0x59,0x5a,0x63,0x64,0x65,0x66,0x67,0x68,
0x69,0x6a,0x73,0x74,0x75,0x76,0x77,0x78,0x79,0x7a,0x82,0x83,0x84,0x85,0x86,0x87,
0x88,0x89,0x8a,0x92,0x93,0x94,0x95,0x96,0x97,0x98,0x99,0x9a,0xa2,0xa3,0xa4,0xa5,
0xa6,0xa7,0xa8,0xa9,0xaa,0xb2,0xb3,0xb4,0xb5,0xb6,0xb7,0xb8,0xb9,0xba,0xc2,0xc3,
0xc4,0xc5,0xc6,0xc7,0xc8,0xc9,0xca,0xd2,0xd3,0xd4,0xd5,0xd6,0xd7,0xd8,0xd9,0xda,
0xe2,0xe3,0xe4,0xe5,0xe6,0xe7,0xe8,0xe9,0xea,0xf2,0xf3,0xf4,0xf5,0xf6,0xf7,0xf8,
0xf9,0xfa]);
const sos_y = new Uint8Array([0xff,0xda,0x00,0x08,0x01,0x01,0x00,0x00,0x3f,0x00]);
const sos_u = new Uint8Array([0xff,0xda,0x00,0x08,0x01,0x02,0x11,0x00,0x3f,0x00]);
const sos_v = new Uint8Array([0xff,0xda,0x00,0x08,0x01,0x03,0x11,0x00,0x3f,0x00]);
const eoi = new Uint8Array([0xff, 0xd9]);

const Signal = document.createElement("div");
const ev_EnableRead = new CustomEvent("EnableRead");
const ev_DisableRead = new CustomEvent("DisablePread");
var EnableRead = true;
const ev_StartRecJpeg = new CustomEvent("StartRec", {detail:{type: "jpeg",},});
const ev_EndRecJpeg = new CustomEvent("EndRec", {detail:{type: "jpeg",},});
const ev_StartRecThum = new CustomEvent("StartRec", {detail:{type: "thum",},});
const ev_EndRecThum = new CustomEvent("EndRec", {detail:{type: "thum",},});

const ev_FoundNumber = new CustomEvent("FoundNumer"); 

var Recording = false;

var ImgBuffer = null
var FoundStart = false;
var ImgBufferSize = null;
var BufferPtr = 0; 
var Thumnail = false;

var NumberOfImages = 1;
var FindingNumer = false;

function twoDigitDecToDec(upper, lower){
	const fourth = Math.floor(upper/16) + 1;
	const third = (upper%16) + 1;
	const second = Math.floor(lower/16) + 1;
	const first = (lower%16) + 1;
	return (fourth*(16^3)) + (third*(16^2)) + (second*(16^1)) + first
}

function hexArrayToDecimal(hexArray) {
  // 16進数の文字列を作成
  const hexString = hexArray.map(num => num.toString(16).padStart(2, '0')).join('');

  // 16進数の文字列を10進数に変換
  const decimal = parseInt(hexString, 16);

  return decimal;
}

window.addEventListener("load", async ()=>{
	const no = document.querySelector("#no");
	no.addEventListener("input", (e)=>{
		const no = e.target.value;

	//	if(no <= NumberOfImages){
		if(no <= 100){
		PageNo = no;
		}
		else{
			PageNo = 1;
		}
	});
	
	const agrain = document.querySelector("#grain");
	agrain.addEventListener("input", (e)=>{
		const grain = e.target.value;
		GrainMag = grain;
	});
	

		const encoder = new TextEncoder();
		const decoder = new TextDecoder();
		window.addEventListener("click", main);
	const b = document.querySelector("#howmany");
	const getf = document.querySelector("#getf");
	const ack = document.querySelector("#ack");
	const blksize = document.querySelector("#blksize");
	const baudRate = document.querySelector("#baudRate");
	const read = document.querySelector("#read");
	const gett = document.querySelector("#gett");


	async function main() {
		Signal.addEventListener("FoundNumer", ()=>{
			const num = NumberOfImages;
			console.log(`Number of Image: ${num}`);
			FindingNumer = false;
			no.value = num;
		});

		Signal.addEventListener("EnableRead", async()=>{
			await contRead();
		});

		Signal.addEventListener("disableRead", async ()=>{
		});


		Signal.addEventListener("StartRec", async (e)=>{
			Recording = true;
			ImgBuffer = null
			FoundStart = false;
			ImgBufferSize = null;
			BufferPtr = 0; 
			if(e.detail.type == "thum"){
				Thumnail = true;
			}else{
				Thumnail = false;
			}

		});
		Signal.addEventListener("EndRec", async (e)=>{
			if(e.detail.type == "jpeg"){
				Recording = false;
				const img = ImgBuffer.slice(0, ImgBufferSize - 7);
				const jpeg = new Uint8Array(img.length + 505);
				const length_y = hexArrayToDecimal([img[2], img[3]]);
				const length_u = hexArrayToDecimal([img[4], img[5]]);
				const length_v = hexArrayToDecimal([img[6], img[7]]);
				console.log(length_y);
				console.log(length_u);
				console.log(length_v);
				jpeg.set(soi,0x0);
				jpeg.set(app0,0x2);
				jpeg.set(dqt0,0x14);
				///
				jpeg.set(img.slice(0x8,0x48),0x19);
				jpeg.set(dqt1,0x19 + 0x40);
				jpeg.set(img.slice(0x48, 0x48+0x40),0x19 + 0x40 + 0x5);
				jpeg.set(sof,0x19 + 0x40 + 0x5 + 0x40);
				jpeg.set(dht, 0x19 + 0x40 + 0x5 + 0x40 +sof.length);
				jpeg.set(sos_y,0x19 + 0x40 + 0x5 + 0x40 +sof.length +dht.length);
				jpeg.set(img.slice(0x88,0x88+length_y),0x19 + 0x40 + 0x5 + 0x40 +sof.length +dht.length+sos_y.length);
				jpeg.set(sos_u,0x19 + 0x40 + 0x5 + 0x40 +sof.length +dht.length+sos_y.length+length_y)
				jpeg.set(img.slice(0x88+length_y, 0x88+length_y+length_u),0x19 + 0x40 + 0x5 + 0x40 +sof.length +dht.length+sos_y.length+length_y+sos_u.length);
				jpeg.set(sos_v,0x19 + 0x40 + 0x5 + 0x40 +sof.length +dht.length+sos_y.length+length_y+sos_u.length+length_u);
				jpeg.set(img.slice(0x88+length_y+length_u,0x88+length_y+length_u+length_v),0x19 + 0x40 + 0x5 + 0x40 +sof.length +dht.length+sos_y.length+length_y+sos_u.length+length_u+sos_v.length);
				jpeg.set(eoi, 0x19 + 0x40 + 0x5 + 0x40 +sof.length +dht.length+sos_y.length+length_y+sos_u.length+length_u+sos_v.length + length_v);

				const blob = new Blob([jpeg],{type: "application/octet-stream"});
				const url = URL.createObjectURL(blob);
				const a = document.createElement('img');
				a.src = url;
				a.title = 'qv.jpg'; // ダウンロード時のファイル名
				document.body.appendChild(a);

				const cimg = document.createElement("img");
				cimg.src = imgprocess(url);
				document.body.appendChild(cimg);

				function imgprocess(url){
					const canvas = document.createElement("canvas");
					const canvas2 = document.createElement("canvas");
					document.body.appendChild(canvas);
					document.body.appendChild(canvas2);
					const ctx = canvas.getContext("2d");
					const ctx2 = canvas2.getContext("2d");
					const src = document.createElement("img");
					src.src = url;
					function addgrain (ctx){
						const img = ctx.getImageData(0,0,480,360);
						const size = img.data.length/4;
						const magnitude = GrainMag;
						for(let i = 0; i < size; i++){
							const amount = (0.5-Math.random())*magnitude;
							img.data[4*i] = img.data[4*i] + amount;
							img.data[4*i+1] = img.data[4*i+1] + amount;
							img.data[4*i+2] = img.data[4*i+2] + amount;
							img.data[4*i+3] = 255;
						}
						ctx.putImageData(img,0,0);
					}

					src.onload = () =>{
						//document.body.appendChild(src)
						canvas.width = 480;
						canvas.height = 360;
						ctx.imageSmoothingEnabled = false;
						//ctx.imageSmoothingQuality = "high";
						ctx.filter = "grayscale()"
						ctx.drawImage(src, 0,0,480,360);
						addgrain(ctx);
						ctx.filter = "blur(10px)"

						canvas2.width = 480;
						canvas2.height = 360;
						ctx2.imageSmoothingEnabled = false;
						ctx2.drawImage(src, 0,0,480,360);
1
					}

						return canvas.toDataURL();
				}



				/*
				const cvurl = await  processimg(a);
				const cvimg = document.createElement("img");
				cvimg.src = cvurl;
				document.body.appendChild(cvimg);

				async function processimg(element){
					const mat = await cv.imread(element);
					//const dst = new cv.Mat();
					cv.cvtColor(mat,mat, cv.COLOR_RGB2GRAY);

					const can = ocument.createElement("canvas");
					cv.imshow(can, mat);
					mat.delete();
					return can.toDataURL();
					}
					*/
				

			}
			else{
				//const thum = new Uint8Array(2808);
				const y = new Uint8Array(1872);
				const u = new Uint8Array(468);
				const v = new Uint8Array(468);
				y.set(ImgBuffer.slice(0,1872));
				u.set(ImgBuffer.slice(1872, 2340));
				v.set(ImgBuffer.slice(2340,2808));

				function expandImageArray(imageData, xsize, ysize) {
					// 新しい配列のサイズを計算
					const newXsize = xsize * 2;
					const newYsize = ysize * 2;
					const newLength = newXsize * newYsize;

					// 新しい配列を初期化
					const newImageData = new Uint8Array(newLength);

					// 4倍のサイズに拡大
					for (let y = 0; y < ysize; y++) {
						for (let x = 0; x < xsize; x++) {
							const oldIndex = y * xsize + x;
							const newValue = imageData[oldIndex];

							// 4つの新しい画素に値をコピー
							newImageData[y * newXsize * 2 + x * 2] = newValue;
							newImageData[y * newXsize * 2 + x * 2 + 1] = newValue;
							newImageData[(y*2 + 1) * newXsize  + x * 2] = newValue;
							newImageData[(y*2 + 1) * newXsize  + x * 2 + 1] = newValue;
						}
					}

					return newImageData;
				}

				function fourtimes(img, xsize, ysize){
					const buf = new Uint8Array(img.length*4);
					for(let y = 0; y < ysize; y++){
						for(let x = 0; x < xsize; x++){
							buf[2*y + 2*x] = img[x+xsize*y];
							buf[2*y + 2*x + 1] = img[x+xsize*y];
							buf[2*(y+1) + 2*x] = img[x+xsize*y];
							buf[2*(y+1) + 2*x + 1] = img[x+xsize*y];

						}
					}
					return buf;
				}

			function thum2PNM(y,u,v){
				const offset = 13
				const buf = new Uint8Array((1872*3)+ offset);
				buf.set(encoder.encode("P6 52 36 255 "));
				const u2 = new Int8Array(expandImageArray(u, 26, 18).buffer);
				const v2 = new Int8Array(expandImageArray(v, 26, 18).buffer);
				for(let i = 0; i < y.length; i++){
					buf[offset + 3*i] = y[i] + 1.402*v2[i];
					buf[offset + 3*i+1] = y[i]  - 0.344136*u2[i] - 0.714136*v2[i];
					buf[offset + 3*i+2] = y[i] + 1.772*u2[i];
				}
				return buf;
			}

			function thumY2PNM(y){
				const buf = new Uint8Array(1872+13);
				buf.set(encoder.encode("P5 52 36 255 "));
					buf.set(y,13);
					return buf;
				}

				const gray = thumY2PNM(y);
				const blobgray = new Blob([gray],{type:"application/octet-stream"});
				const urlgray = URL.createObjectURL(blobgray);
				const agray = document.createElement("a");
				agray.href = urlgray;
				agray.download = "qvThumGray.pgm";
				agray.innerText = "thumnail"
				document.body.appendChild(agray);


				const color = thum2PNM(y, u, v);
				const blobclor = new Blob([color],{type:"application/octet-stream"});
				const urlcolor = URL.createObjectURL(blobclor);
				const acolor = document.createElement("a");
				acolor.href = urlcolor;
				acolor.download = "qvThum.ppm";
				acolor.innerText = "thumnail-color"
				document.body.appendChild(acolor);

				const thumcanvas = document.createElement("canvas");
				document.body.appendChild(thumcanvas);
				const ctx = thumcanvas.getContext("2d");
				thumcanvas.width = 52;
				thumcanvas.height = 36;
				const offset = 13;
				const size = 1872;
				const imagedata = ctx.createImageData(52,36);
				for(let i=0; i < size; i++){
					imagedata.data[4*i] = color[offset + 3*i];
					imagedata.data[4*i+1] = color[offset + 3*i + 1];
					imagedata.data[4*i+2] = color[offset + 3*i + 2];
					imagedata.data[4*i+3] = 255;
				}
				ctx.putImageData(imagedata,0,0);
				

				/*
				const bmp = new Uint8Array(1872 + 14+40)
				bmp.set([0x42, 0x4D,  0x86,0x07,0x00,0x00, 0x00,0x00 ,0x00,0x00 ,0x30,0x00,0x00,0x00 ],0);
				bmp.set([0x28,0x00,0x00,0x00, 0x34,0x00,0x00,0x00, 0x24,0x00,0x00,0x00, 0x01,0x00, 0x08,0x00, 0x00,0x00,0x00,0x00, 0x00,0x00,0x00,0x00, 0x00,0x00,0x00,0x00, 0x00,0x00,0x00,0x00, 0x00,0x00,0x00,0x00, 0x00,0x00,0x00,0x00 ],14);
				bmp.set(gray.slice(13),54);
				const bmpblob = new Blob([bmp],{type:"image/bmp"});
				const urlblob = URL.createObjectURL(bmpblob);
				const imgbmp = document.createElement("a");
				imgbmp.href = urlblob;
				imgbmp.download = "qv.bmp";
				imgbmp.innerText = "bmp";
				document.body.appendChild(imgbmp);
				*/

				
				/*
				const bmp = new Uint8Array(5616 + 14+40)
				bmp.set([0x42, 0x4D,  0x2F,0x16,0x00,0x00, 0x00,0x00 ,0x00,0x00 ,0x30,0x00,0x00,0x00 ],0);
				bmp.set([0x28,0x00,0x00,0x00, 0x34,0x00,0x00,0x00, 0x24,0x00,0x00,0x00, 0x01,0x00, 0x20,0x00, 0x00,0x00,0x00,0x00, 0x00,0x00,0x00,0x00, 0x00,0x00,0x00,0x00, 0x00,0x00,0x00,0x00, 0x00,0x00,0x00,0x00, 0x00,0x00,0x00,0x00 ],14);
				bmp.set(color.slice(13),54);
				const bmpblob = new Blob([bmp],{type:"image/bmp"});
				const urlblob = URL.createObjectURL(bmpblob);
				const imgbmp = document.createElement("a");
				imgbmp.href = urlblob;
				imgbmp.download = "qv.bmp";
				imgbmp.innerText = "bmp";
				document.body.appendChild(imgbmp);
				*/

			}
		});
		window.removeEventListener("click", main);
		const port = await navigator.serial.requestPort();
		await port.open({baudRate: 9600, dataits: 8,flowCotrol: "none", parity: "none",stopBits: 1});
		



		
		b.addEventListener("click", howmany);
		getf.addEventListener("click", getFirstImg);
		gett.addEventListener("click", getFirstThum);
		ack.addEventListener("click", Ack);
		blksize.addEventListener("click", chgblksize);
		baudRate.addEventListener("click", await chgbaudrate);
		read.addEventListener("click", readData);


	
		async function chgbaudrate() {
			const writer = port.writable.getWriter();
			// 61 a8 25KB
			const cmd = new Uint8Array([0x05, 0x43, 0x42, 0x03,0x06]);
			await writer.write(cmd);
			
			await writer.releaseLock();

			await port.close()
			await port.open({baudRate: 115200, dataits: 8,flowCotrol: "none", parity: "none",stopBits: 1});

			Signal.dispatchEvent(ev_EnableRead);
		}

		const asciidump = document.createElement("p");
		document.body.appendChild(asciidump);
		
		async function chgblksize() {
			const writer = port.writable.getWriter();
			// 61 a8 25KB
			const cmd = new Uint8Array([0x05, 0x50, 0x50, 0x61,0xA8,0x06]);
			await writer.write(cmd);
			writer.releaseLock();
		}
		


		async function Ack() {
			const writer = port.writable.getWriter();
			const ACK = new Uint8Array([0x06]);
			await writer.write(ACK);
			writer.releaseLock();
		}

		async function getFirstThum() {
			// getwriterの時点でロックされる。
			const writer = port.writable.getWriter();
			const cmd_getf = new Uint8Array([0x05,0x44,0x41,PageNo,0x06,0x05, 0x44, 0x4C, 0x06,0x05,0x4D,0x4B,0x06,0x12]);
			//for yuv const cmd_getf = new Uint8Array([0x05,0x44,0x41,0x01,0x06,0x05, 0x44, 0x4C, 0x06,0x05,0x4D,0x4C,0x06,0x12]);
			await writer.write(cmd_getf);
			writer.releaseLock();
			Signal.dispatchEvent(ev_StartRecThum);
		}



		async function getFirstImg() {
			// getwriterの時点でロックされる。
			const writer = port.writable.getWriter();
			const cmd_getf = new Uint8Array([0x05,0x44,0x41,PageNo,0x06,0x05, 0x44, 0x4C, 0x06,0x05,0x4D,0x47,0x06,0x12]);
			//for yuv const cmd_getf = new Uint8Array([0x05,0x44,0x41,0x01,0x06,0x05, 0x44, 0x4C, 0x06,0x05,0x4D,0x4C,0x06,0x12]);
			await writer.write(cmd_getf);
			writer.releaseLock();
			Signal.dispatchEvent(ev_StartRecJpeg);
		}

		async function howmany() {
			// getwriterの時点でロックされる。
			const writer = port.writable.getWriter();
			const cmd_howmany = new Uint8Array([0x05,0x4D,0x50,0x06]);
			await writer.write(cmd_howmany);
			writer.releaseLock();
			FindingNumer = true;
		}
		async function readInto(reader, buffer) {
			let offset = 0;
			while (offset < buffer.byteLength) {
				const { value, done } = await reader.read(
					new Uint8Array(buffer, offset)
				);
				if (done) {
					break;
				}
				console.info(value)
				buffer = value.buffer;
				offset += value.byteLength;
			}
			return buffer;
		}

		async function readData() {
			const reader = port.readable.getReader({ mode: "byob" });
			let buffer = new ArrayBuffer(1);
			// Read the first 512 bytes.
			buffer = await readInto(reader, buffer);
			reader.releaseLock();
			console.info(buffer);
		}



		async function contRead(){
			while (port.readable) {
				const reader = port.readable.getReader();
				try {
					while (true) {
						const { value, done } = await reader.read();
						if (done) {
							// |reader| has been canceled.
							break;
						}

						if(!FoundStart){
							// Do something with |value|…
							const ascii = decoder.decode(value);
							console.log(value);
							console.log(ascii);

						}
						if(Recording){
							if(!FoundStart){
								for(let i = 0; i < value.length; i++){
									if(value[i] == 0x02){
										const upper = value[i+1];
										const lower = value[i+2];
										//ImgBufferSize = twoDigitDecToDec(upper, lower);
										ImgBufferSize = hexArrayToDecimal([upper,lower]) + 7;
										FoundStart = true;
										ImgBuffer = new Uint8Array(ImgBufferSize);
										const remain = value.subarray(i+3);
										ImgBuffer.set(remain,BufferPtr);
										BufferPtr += remain.length;
										console.warn("found");
										console.warn(ImgBufferSize);

										break;
									}

									}
							}else{
								ImgBuffer.set(value, BufferPtr);
								BufferPtr += value.length;
								await Ack()
								if(BufferPtr >= ImgBufferSize){
									console.log(BufferPtr)
									if(Thumnail){
										Signal.dispatchEvent(ev_EndRecThum);
									}else{
										Signal.dispatchEvent(ev_EndRecJpeg);

									}
									await Ack();
							}
							}

				
						}
						if(FindingNumer){
							for(let i = 0; i < value.length; i++){
								if(value[i] == 0x62){
									const num = value[i+1];
									NumberOfImages = num;
									Signal.dispatchEvent(ev_FoundNumber);
									break;
								}
							}

						}
					}
				} catch (error) {
					// Handle |error|…
				} finally {
					reader.releaseLock();
				}
			}
		}
		/*
		await chgbaudrate();
		await chgblksize();
		*/
	}


	
});
