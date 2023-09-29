// INITIALIZATION
//[-] {Project}.
const ip = "127.0.0.1";
const port = "3000";
let socket = io(ip + ":" + port, {transports: ["websocket"]});

//[-] {File manager}.
let selectedFile;
let fReader;
let names;
let previousContent = $('#UploadArea').html();

// Buttons's callbacks.
$('#addFileButton').on('click', () => {
	$('#addFilePanel').css("display", "flex");
});
$('#addFilePanel__close').on('click', () => {
	$('#addFilePanel').css("display", "none");
});
refresh();

// FUNCTIONS
//[-] {File manager}.
function fileChosen(e) {
	selectedFile= e.target.files[0];
	$('#NameBox').val(selectedFile.name);
}

function startUpload(){
	if ($('#FileBox').val() != "") {
		fReader = new FileReader();
		names = $('#NameBox').val();
		let Content = "<span id='NameArea'>Uploading " + selectedFile.name + " as " + names + "</span>";
		Content += '<div id="ProgressContainer"><div id="ProgressBar"></div></div><span id="percent">0%</span>';
		Content += "<span id='Uploaded'> - <span id='MB'>0</span>/" + Math.round(selectedFile.size / 1e6) + "MB</span>";
		$('#UploadArea').html(Content);
		fReader.onload = function(e){
			socket.emit('Upload', {Name: names, Data: e.target.result});
		}
		socket.emit('Start', {Name: names, Size: selectedFile.size});
	}
	else
	{
		alert("Please Select A File");
	}
}

function updateBar(percent) {
	$('#ProgressBar').css("width", percent + '%');
	$('#percent').text((Math.round(percent*100)/100) + '%');
	let mBDone = Math.round(((percent/100) * selectedFile.size) / 1e6);
	$('#MB').html(mBDone);
}

function refresh() { 
	$('#UploadArea').html(previousContent);
  if (window.File && window.FileReader) { //These are the relevant HTML5 objects that we are going to use 
		$('#UploadButton').on('click', startUpload);  
		$('#FileBox').on('change', fileChosen);
	} else {
		$('#UploadArea').text("Your Browser Doesn't Support The File API Please Update Your Browser");
	}
}


// SOCKET IO HANDLER
//[-] {File manager}.
socket.on("dirFiles", (pList) => {
	$("#rocket__content").empty();
	pList.forEach((filename) => {
		let newFile = $(`
		<div class="dashboardElement">
			<div class="dashboardElement__imageContainer">
				<i class="fas fa-file"></i>
			</div>
			<div class="dashboardElement__filename">
				<span data-tooltype="${filename}">${filename}</span>
			</div>
			<div class="dashboardElement__actions">
				<button onclick="socket.emit('downloadFile', '${filename}')"><i class="fas fa-file-download"></i></button>
				<button onclick="socket.emit('deleteFile', '${filename}');"><i class="fas fa-trash"></i></button>
				<button><i class="fas fa-folder-open"></i></button>
			</div>
		</div>`);
		$("#rocket__content").append(newFile);
	})
});

socket.on("downloadFile", (pFileName) => {
	window.open(`${window.location.origin}/dl/${pFileName}`, '_blank').focus();
});

socket.on('MoreData', (data) => {
    updateBar(data['Percent']);
    let place = data['Place'] * 5e5; //The Next Blocks Starting Position
    let newFile; //The Variable that will hold the new Block of Data
    if(selectedFile.slice) {
      newFile = selectedFile.slice(place, place + Math.min(5e5, (selectedFile.size-place)));
    } else {
      newFile = selectedFile.mozSlice(place, place + Math.min(5e5, (selectedFile.size-place)));
    }
    fReader.readAsBinaryString(newFile);
});
  
socket.on('Done', () =>{ 
	let Content = "La vidéo a été téléchargée avec succès !!";
	Content += "<button type='button' name='Télécharger' value='' id='Restart' class='Button'>Télécharger un autre</ bouton>";
	$('#UploadArea').html(Content); 
	$('#Restart').on('click', refresh); 
});

//[-] {Client account}.
socket.on("action", (pData) => {
	if (pData.actionType == "redirect") {
		window.location.href = pData.href;
	} else if (pData.actionType == "storeSessionVariable") {
		window.localStorage.setItem(pData.key, pData.value);
		console.log("stored")
	}
})