/**
 * uses session storage to too indicate to the user whether or not intelligent control is on or off
 * 
 */
$(document).ready(function() {
    var intelligenceText = sessionStorage.getItem('text');
    var intelligenceColor = sessionStorage.getItem('color');
    if(intelligenceText == 'on') {
        console.log('inside on')
        document.getElementById("check").checked = true;
        document.getElementById("intelligence-control-on-off").innerText = "Intelligent Control On"
        document.getElementById("intelligent-control").style.backgroundColor = "green"
    } 
    if(intelligenceText == 'off'){
        console.log('inside')
        document.getElementById("check").checked = false;
        document.getElementById("intelligence-control-on-off").innerText = "Intelligent Control Off"
        document.getElementById("intelligent-control").style.backgroundColor = "red"
    }
    $("input").change(function(){
        if($(this).is(":checked")){
            console.log("Is checked");
            sessionStorage.setItem('text','on');
            sessionStorage.setItem('color','on');
            document.getElementById("intelligence-control-on-off").innerText = "Intelligent Control On"
            document.getElementById("intelligent-control").style.backgroundColor = "green"
        }
        else{
            console.log("Is Not Checked");
            sessionStorage.setItem('text','off');
            sessionStorage.setItem('color','off');
            document.getElementById("intelligence-control-on-off").innerText = "Intelligent Control Off"
            document.getElementById("intelligent-control").style.backgroundColor = "red"
        }
    })
})