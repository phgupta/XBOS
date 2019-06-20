
let imageArray = []  // global variable to hold stack of images for animation 
let count = 0;          // global var
let index = 0;          //global temp index

function addToArray(newImage) {
	if (count < 10) {
		newImage.id = "doppler_"+count;
		newImage.style.display = "none";
		imageArray.push(newImage);
		count = count+1;
		if (count >= 10) {
			console.log("Got 10 doppler images");
		}
	}
}


function tryToGetImage(dateObj) {
	let dateStr = dateObj.getUTCFullYear();
	dateStr += String(dateObj.getUTCMonth() + 1).padStart(2, '0'); //January is 0!
	dateStr += String(dateObj.getUTCDate()).padStart(2, '0');

	let timeStr = String(dateObj.getUTCHours()).padStart(2,'0')
	timeStr += String(dateObj.getUTCMinutes()).padStart(2,'0');

	let filename = "DAX_"+dateStr+"_"+timeStr+"_N0R.gif";
    let newImage = new Image();
    
	newImage.onload = function () {
		// console.log("got image "+filename);
		addToArray(newImage);
	}
	newImage.onerror = function() {
		// console.log("failed to load "+filename);
	}
    newImage.src = "http://radar.weather.gov/ridge/RadarImg/N0R/DAX/"+filename;
   
}

function getTenImages() {
	let dateObj = new Date();  // defaults to current date and time
	// if we try 150 images, and get one out of every 10, we should get enough
	for (let i = 0; i < 150; i++) {
		newImage = tryToGetImage(dateObj);
		dateObj.setMinutes( dateObj.getMinutes()-1 ); // back in time one minute
	}

}

function displayImages() {

    if(index >= imageArray.length)
        index = 0;

    let image = new Image();
    image.src = imageArray[index].src;
    
    image.onload = function() {

        image.style.display = "inline";
    
    }

    image.onerror = function() {}
    
    document.getElementById("doppler-dax").src = image.src;
    index = index + 1;

  //  console.log(image.src);
}

getTenImages(); //Retrieved 10 doppler images

setInterval(function(){displayImages()}, 150); //Calls timed animations for radar














// let imageArray = []  // global variable to hold stack of images for animation 
// let count = 0;       // global var
// let dopplerCount = 0;
// getTenImages();
// animateDoppler ();

// var url = `http://api.openweathermap.org/data/2.5/forecast/hourly?q=Oakland,CA,US&units=imperial&APPID=78b2b473ac33f10c8b07fb26657b5bc5`
// makeCorsRequest(url);

// function dopplerCountFunction () {
// 	dopplerCount+=1;
// 	if (dopplerCount == 10) dopplerCount = 0
// 	return dopplerCount;
// }

// function animateDoppler () {
// 	setInterval( function() {
//         document.getElementById("doppler-dax").src = imageArray[dopplerCountFunction()].src;
//         //console.log(document.getElementById("doppler-dax").src);
// 	}, 180);
// }

// function addToArray(newImage) {
// 	if (count < 10) {
// 		newImage.id = "doppler_"+count;
// 		newImage.style.display = "none";
// 		imageArray.push(newImage);
// 		count = count+1;
// 		if (count >= 10) {
// 			console.log("Got 10 doppler images");
// 		}
// 	}
// }

// function tryToGetImage(dateObj) {
// 	let dateStr = dateObj.getUTCFullYear();
// 	dateStr += String(dateObj.getUTCMonth() + 1).padStart(2, '0'); //January is 0!
// 	dateStr += String(dateObj.getUTCDate()).padStart(2, '0');

// 	let timeStr = String(dateObj.getUTCHours()).padStart(2,'0')
// 	timeStr += String(dateObj.getUTCMinutes()).padStart(2,'0');

// 	let filename = "DAX_"+dateStr+"_"+timeStr+"_N0R.gif";
// 	let newImage = new Image();
// 	newImage.onload = function () {
// 		// console.log("got image "+filename);
// 		addToArray(newImage);
// 	}
// 	newImage.onerror = function() {
// 		// console.log("failed to load "+filename);
// 	}
// 	newImage.src = "http://radar.weather.gov/ridge/RadarImg/N0R/DAX/"+filename;
// }


// function getTenImages() {
// 	let dateObj = new Date();  // defaults to current date and time
// 	// if we try 150 images, and get one out of every 10, we should get enough
// 	for (let i = 0; i < 150; i++) {
//         newImage = tryToGetImage(dateObj);
  
// 		dateObj.setMinutes( dateObj.getMinutes()-1 ); // back in time one minute
// 	}

// }